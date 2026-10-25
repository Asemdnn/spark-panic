// Spark Panic 2.2 - Persistence & Upgrade Armory Save Engine

import { ARMORY_CONFIG, GUARDIAN_RANKS, TROPHIES, CHASSIS_CONFIG } from '../config.js';

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
      selectedChassis: 'striker',
      unlockedChassis: { striker: true },
      endlessHighScore: 0,
      endlessBestWave: 0,
      endlessMaxWave: 0,
      isMuted: false,
      isBgmEnabled: true
    };

    if (typeof localStorage === 'undefined') return defaults;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      const endlessBestWave = parsed.endlessBestWave || parsed.endlessMaxWave || 0;
      return {
        ...defaults,
        ...parsed,
        upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) },
        planetStars: { ...(parsed.planetStars || {}) },
        planetHighScores: { ...(parsed.planetHighScores || {}) },
        trophies: { ...(parsed.trophies || {}) },
        unlockedChassis: { striker: true, ...(parsed.unlockedChassis || {}) },
        selectedChassis: parsed.selectedChassis || defaults.selectedChassis,
        endlessBestWave,
        endlessMaxWave: endlessBestWave,
        isBgmEnabled: parsed.isBgmEnabled !== undefined ? parsed.isBgmEnabled : defaults.isBgmEnabled
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

  isBgmEnabled() {
    return this.data.isBgmEnabled !== false;
  }

  setBgmEnabled(enabled) {
    this.data.isBgmEnabled = !!enabled;
    this.save();
  }

  getData() {
    return this.data;
  }

  isChassisUnlocked(id) {
    if (id === 'striker') return true;
    if (this.data.unlockedChassis && this.data.unlockedChassis[id]) return true;
    const totalStars = this.getTotalStars();
    if (id === 'tesla' && totalStars >= 15) return true;
    if (id === 'railgun' && totalStars >= 30) return true;
    return false;
  }

  unlockChassis(id) {
    const cfg = CHASSIS_CONFIG[id];
    if (!cfg) return false;
    if (this.isChassisUnlocked(id)) {
      this.data.selectedChassis = id;
      this.save();
      return true;
    }
    if (!this.spendShards(cfg.cost)) return false;
    if (!this.data.unlockedChassis) this.data.unlockedChassis = { striker: true };
    this.data.unlockedChassis[id] = true;
    this.data.selectedChassis = id;
    this.save();
    return true;
  }

  selectChassis(id) {
    if (!this.isChassisUnlocked(id)) return false;
    this.data.selectedChassis = id;
    this.save();
    return true;
  }

  getSelectedChassis() {
    return this.data.selectedChassis || 'striker';
  }

  recordEndlessScore(score, wave) {
    let isNewScore = false;
    let isNewWave = false;
    if (score > (this.data.endlessHighScore || 0)) {
      this.data.endlessHighScore = score;
      isNewScore = true;
    }
    const prevBestWave = this.data.endlessBestWave || this.data.endlessMaxWave || 0;
    if (wave > prevBestWave) {
      this.data.endlessBestWave = wave;
      this.data.endlessMaxWave = wave;
      isNewWave = true;
    }
    this.save();
    return isNewScore || isNewWave;
  }

  exportSaveCode() {
    try {
      const jsonStr = JSON.stringify(this.data);
      if (typeof window !== 'undefined' && typeof btoa === 'function') {
        return 'SP2_' + btoa(unescape(encodeURIComponent(jsonStr)));
      }
      return 'SP2_' + Buffer.from(jsonStr).toString('base64');
    } catch (e) {
      console.warn('Save export error:', e);
      return '';
    }
  }

  importSaveCode(codeStr) {
    if (!codeStr || typeof codeStr !== 'string') return false;
    let clean = codeStr.trim();
    if (clean.startsWith('SP2_')) {
      clean = clean.slice(4);
    }
    try {
      let jsonStr;
      if (typeof window !== 'undefined' && typeof atob === 'function') {
        jsonStr = decodeURIComponent(escape(atob(clean)));
      } else {
        jsonStr = Buffer.from(clean, 'base64').toString('utf8');
      }
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;

      const endlessBestWave = Math.max(
        this.data.endlessBestWave || 0,
        parsed.endlessBestWave || parsed.endlessMaxWave || 0
      );

      this.data = {
        ...this.data,
        shards: typeof parsed.shards === 'number' ? parsed.shards : this.data.shards,
        unlockedPlanet: typeof parsed.unlockedPlanet === 'number' ? parsed.unlockedPlanet : this.data.unlockedPlanet,
        planetStars: { ...(this.data.planetStars || {}), ...(parsed.planetStars || {}) },
        planetHighScores: { ...(this.data.planetHighScores || {}), ...(parsed.planetHighScores || {}) },
        upgrades: { ...(this.data.upgrades || {}), ...(parsed.upgrades || {}) },
        trophies: { ...(this.data.trophies || {}), ...(parsed.trophies || {}) },
        unlockedChassis: { striker: true, ...(this.data.unlockedChassis || {}), ...(parsed.unlockedChassis || {}) },
        selectedChassis: parsed.selectedChassis || this.data.selectedChassis || 'striker',
        endlessHighScore: Math.max(this.data.endlessHighScore || 0, parsed.endlessHighScore || 0),
        endlessBestWave,
        endlessMaxWave: endlessBestWave,
        isMuted: parsed.isMuted !== undefined ? parsed.isMuted : this.data.isMuted,
        isBgmEnabled: parsed.isBgmEnabled !== undefined ? parsed.isBgmEnabled : this.data.isBgmEnabled
      };
      this.save();
      return true;
    } catch (e) {
      console.debug('Save import parse error:', e);
      return false;
    }
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
      selectedChassis: 'striker',
      unlockedChassis: { striker: true },
      endlessHighScore: 0,
      endlessBestWave: 0,
      endlessMaxWave: 0,
      isMuted: false,
      isBgmEnabled: true
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
