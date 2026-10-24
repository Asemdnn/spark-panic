// Spark Panic 2.0 - Persistence & Upgrade Armory Save Engine

import { ARMORY_CONFIG, GUARDIAN_RANKS, TROPHIES } from '../config.js';

const STORAGE_KEY = 'spark_panic_v2_save';

export class SaveSystem {
  constructor() {
    this.data = this.load();
  }

  load() {
    const defaults = {
      shards: 120, // Starting bonus shards
      unlockedPlanet: 1,
      planetStars: {},
      planetHighScores: {},
      upgrades: {
        turretDmg: 0,
        novaRadius: 0,
        novaCharges: 0,
        shieldGrid: 0,
        satellites: 0,
        tacticalCd: 0
      },
      trophies: {},
      endlessHighScore: 0,
      isMuted: false
    };

    if (typeof localStorage === 'undefined') return defaults;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
        planetStars: { ...(parsed.planetStars || {}) },
        planetHighScores: { ...(parsed.planetHighScores || {}) },
        trophies: { ...(parsed.trophies || {}) }
      };
    } catch (e) {
      console.warn('Failed to parse saved game data, using defaults', e);
      return defaults;
    }
  }

  save() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }

  addShards(amount) {
    this.data.shards = Math.max(0, (this.data.shards || 0) + amount);
    this.save();
    return this.data.shards;
  }

  spendShards(amount) {
    if (this.data.shards < amount) return false;
    this.data.shards -= amount;
    this.save();
    return true;
  }

  getUpgradeCost(techId) {
    const cfg = ARMORY_CONFIG[techId];
    if (!cfg) return 999999;
    const currentLvl = this.data.upgrades[techId] || 0;
    if (currentLvl >= cfg.maxLevel) return 0; // Maxed
    return Math.round(cfg.baseCost * Math.pow(cfg.costFactor, currentLvl));
  }

  upgradeTech(techId) {
    const cfg = ARMORY_CONFIG[techId];
    if (!cfg) return false;
    const currentLvl = this.data.upgrades[techId] || 0;
    if (currentLvl >= cfg.maxLevel) return false;

    const cost = this.getUpgradeCost(techId);
    if (!this.spendShards(cost)) return false;

    this.data.upgrades[techId] = currentLvl + 1;
    this.save();
    return true;
  }

  refundAllTech() {
    let totalSpent = 0;
    for (const [techId, level] of Object.entries(this.data.upgrades)) {
      const cfg = ARMORY_CONFIG[techId];
      if (!cfg) continue;
      for (let lvl = 0; lvl < level; lvl++) {
        totalSpent += Math.round(cfg.baseCost * Math.pow(cfg.costFactor, lvl));
      }
      this.data.upgrades[techId] = 0;
    }

    this.data.shards += totalSpent;
    this.save();
    return totalSpent;
  }

  recordPlanetClear(planetId, score, stars) {
    const prevStars = this.data.planetStars[planetId] || 0;
    if (stars > prevStars) {
      this.data.planetStars[planetId] = stars;
      // Award +45 Shards for each new star earned
      const starDiff = stars - prevStars;
      this.addShards(starDiff * 45);
    }

    const prevScore = this.data.planetHighScores[planetId] || 0;
    if (score > prevScore) {
      this.data.planetHighScores[planetId] = score;
    }

    // Unlock next planet
    const nextPlanet = planetId + 1;
    if (nextPlanet <= 20 && nextPlanet > (this.data.unlockedPlanet || 1)) {
      this.data.unlockedPlanet = nextPlanet;
    }

    this.save();
  }

  unlockTrophy(trophyId) {
    if (this.data.trophies[trophyId]) return false; // Already unlocked

    const trophy = TROPHIES.find(t => t.id === trophyId);
    this.data.trophies[trophyId] = true;
    if (trophy) {
      this.addShards(trophy.reward || 100);
    }
    this.save();
    return trophy;
  }

  getTotalStars() {
    let sum = 0;
    for (const count of Object.values(this.data.planetStars)) {
      sum += count;
    }
    return sum;
  }

  getUnlockedLevel() {
    return this.data.unlockedPlanet || 1;
  }

  getUnlockedPlanet() {
    return this.data.unlockedPlanet || 1;
  }

  getLevelStars(planetId) {
    return this.data.planetStars[planetId] || 0;
  }

  getPlanetStars(planetId) {
    return this.data.planetStars[planetId] || 0;
  }

  isSoundMuted() {
    return !!this.data.isMuted;
  }

  setSoundMuted(muted) {
    this.data.isMuted = !!muted;
    this.save();
  }

  getData() {
    return this.data;
  }

  recordEndlessScore(score, wave) {
    let isNew = false;
    if (score > (this.data.endlessHighScore || 0)) {
      this.data.endlessHighScore = score;
      isNew = true;
    }
    if (wave > (this.data.endlessMaxWave || 0)) {
      this.data.endlessMaxWave = wave;
    }
    this.save();
    return isNew;
  }

  resetAll() {
    this.data = {
      shards: 120,
      unlockedPlanet: 1,
      planetStars: {},
      planetHighScores: {},
      upgrades: {
        turretDmg: 0,
        novaRadius: 0,
        novaCharges: 0,
        shieldGrid: 0,
        satellites: 0,
        tacticalCd: 0
      },
      trophies: {},
      endlessHighScore: 0,
      endlessMaxWave: 0,
      isMuted: false
    };
    this.save();
  }

  getGuardianRank() {
    const totalStars = this.getTotalStars();
    for (let i = GUARDIAN_RANKS.length - 1; i >= 0; i--) {
      if (totalStars >= GUARDIAN_RANKS[i].minStars) {
        return GUARDIAN_RANKS[i];
      }
    }
    return GUARDIAN_RANKS[0];
  }
}

export const saveSystem = new SaveSystem();
export const storage = saveSystem;
