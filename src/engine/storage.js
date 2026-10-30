// Spark Panic 2.5 - Persistence & Upgrade Armory Save Engine

import { ARMORY_CONFIG, GUARDIAN_RANKS, TROPHIES, CHASSIS_CONFIG, TURRET_SKINS, WINGMAN_CONFIG, ASCENSION_CONFIG, TITAN_PROTOCOL_CONFIG, COSMIC_RELICS, DEFAULT_SETTINGS } from '../config.js';

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
      isBgmEnabled: true,
      tutorialCompleted: false,
      dailyBest: {},
      dailyClaimed: {},
      bestBossRushTime: null,
      bossRushCleared: false,
      selectedWingmanDoctrine: 'aegis',
      wingmanUnlocked: false,
      selectedTurretSkin: 'sentinel',
      ascensionTier: 0,
      equippedRelics: [],
      unlockedRelics: {},
      settings: { ...DEFAULT_SETTINGS }
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
        isBgmEnabled: parsed.isBgmEnabled !== undefined ? parsed.isBgmEnabled : defaults.isBgmEnabled,
        tutorialCompleted: !!parsed.tutorialCompleted,
        dailyBest: { ...(parsed.dailyBest || {}) },
        dailyClaimed: { ...(parsed.dailyClaimed || {}) },
        bestBossRushTime: parsed.bestBossRushTime !== undefined ? parsed.bestBossRushTime : defaults.bestBossRushTime,
        bossRushCleared: !!parsed.bossRushCleared,
        selectedWingmanDoctrine: parsed.selectedWingmanDoctrine || defaults.selectedWingmanDoctrine,
        wingmanUnlocked: !!parsed.wingmanUnlocked,
        selectedTurretSkin: parsed.selectedTurretSkin || defaults.selectedTurretSkin,
        ascensionTier: typeof parsed.ascensionTier === 'number' ? parsed.ascensionTier : defaults.ascensionTier,
        equippedRelics: Array.isArray(parsed.equippedRelics) ? parsed.equippedRelics.slice(0, 3) : defaults.equippedRelics,
        unlockedRelics: { ...(parsed.unlockedRelics || {}) },
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) }
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

  isTutorialCompleted() {
    return !!this.data.tutorialCompleted;
  }

  completeTutorial() {
    if (this.data.tutorialCompleted) return false;
    this.data.tutorialCompleted = true;
    this.addShards(50);
    this.save();
    return true;
  }

  getDailyBest(dateKey) {
    return (this.data.dailyBest && this.data.dailyBest[dateKey]) || 0;
  }

  isDailyClaimed(dateKey) {
    return !!(this.data.dailyClaimed && this.data.dailyClaimed[dateKey]);
  }

  recordDailyScore(dateKey, score) {
    if (!this.data.dailyBest) this.data.dailyBest = {};
    if (!this.data.dailyClaimed) this.data.dailyClaimed = {};

    const prevBest = this.data.dailyBest[dateKey] || 0;
    const isNewHigh = score > prevBest;
    if (isNewHigh) {
      this.data.dailyBest[dateKey] = score;
    }

    let isFirstClearToday = false;
    if (!this.data.dailyClaimed[dateKey]) {
      this.data.dailyClaimed[dateKey] = true;
      this.addShards(150);
      isFirstClearToday = true;
    }

    this.save();
    return {
      isNewHigh,
      isFirstClearToday,
      bonusAwarded: isFirstClearToday ? 150 : 0,
      bestScore: this.data.dailyBest[dateKey]
    };
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
        isBgmEnabled: parsed.isBgmEnabled !== undefined ? parsed.isBgmEnabled : this.data.isBgmEnabled,
        tutorialCompleted: parsed.tutorialCompleted !== undefined ? !!parsed.tutorialCompleted : !!this.data.tutorialCompleted,
        dailyBest: { ...(this.data.dailyBest || {}), ...(parsed.dailyBest || {}) },
        dailyClaimed: { ...(this.data.dailyClaimed || {}), ...(parsed.dailyClaimed || {}) },
        bestBossRushTime: parsed.bestBossRushTime !== undefined ? parsed.bestBossRushTime : this.data.bestBossRushTime,
        bossRushCleared: parsed.bossRushCleared !== undefined ? !!parsed.bossRushCleared : this.data.bossRushCleared,
        selectedWingmanDoctrine: parsed.selectedWingmanDoctrine || this.data.selectedWingmanDoctrine || 'aegis',
        wingmanUnlocked: parsed.wingmanUnlocked !== undefined ? !!parsed.wingmanUnlocked : this.data.wingmanUnlocked,
        selectedTurretSkin: parsed.selectedTurretSkin || this.data.selectedTurretSkin || 'sentinel',
        ascensionTier: typeof parsed.ascensionTier === 'number' ? parsed.ascensionTier : (this.data.ascensionTier || 0),
        equippedRelics: Array.isArray(parsed.equippedRelics) ? parsed.equippedRelics.slice(0, 3) : (this.data.equippedRelics || []),
        unlockedRelics: { ...(this.data.unlockedRelics || {}), ...(parsed.unlockedRelics || {}) },
        settings: { ...DEFAULT_SETTINGS, ...(this.data.settings || {}), ...(parsed.settings || {}) }
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
      isBgmEnabled: true,
      tutorialCompleted: false,
      dailyBest: {},
      dailyClaimed: {},
      bestBossRushTime: null,
      bossRushCleared: false,
      selectedWingmanDoctrine: 'aegis',
      wingmanUnlocked: false,
      selectedTurretSkin: 'sentinel',
      ascensionTier: 0,
      equippedRelics: [],
      unlockedRelics: {},
      settings: { ...DEFAULT_SETTINGS }
    };
    this.save();
  }

  // Ancient Cosmic Relics System (v2.5)
  isRelicUnlocked(id) {
    if (!COSMIC_RELICS[id]) return false;
    if (this.data.unlockedRelics && this.data.unlockedRelics[id]) return true;
    const r = COSMIC_RELICS[id];
    const totalStars = this.getTotalStars();
    if (r.reqStars && totalStars >= r.reqStars) return true;
    if (r.reqSector) {
      const highestUnlocked = this.data.unlockedPlanet || 1;
      const targetPlanet = r.reqSector * 5;
      if (highestUnlocked > targetPlanet) return true;
    }
    return false;
  }

  unlockRelic(id, forceFree = false) {
    if (!COSMIC_RELICS[id]) return false;
    if (this.isRelicUnlocked(id)) return true;
    const cost = COSMIC_RELICS[id].costShards || 0;
    if (forceFree || this.data.shards >= cost) {
      if (!forceFree && cost > 0) {
        this.data.shards -= cost;
      }
      if (!this.data.unlockedRelics) this.data.unlockedRelics = {};
      this.data.unlockedRelics[id] = true;
      this.save();
      return true;
    }
    return false;
  }

  unlockRandomRelic() {
    const unowned = Object.keys(COSMIC_RELICS).filter(id => !this.isRelicUnlocked(id));
    if (unowned.length === 0) return { unlocked: false, allUnlocked: true };
    const chosen = unowned[Math.floor(Math.random() * unowned.length)];
    if (!this.data.unlockedRelics) this.data.unlockedRelics = {};
    this.data.unlockedRelics[chosen] = true;
    this.save();
    return { unlocked: true, relic: COSMIC_RELICS[chosen] };
  }

  isRelicEquipped(id) {
    return Array.isArray(this.data.equippedRelics) && this.data.equippedRelics.includes(id);
  }

  equipRelic(id) {
    if (!this.isRelicUnlocked(id)) return false;
    if (!Array.isArray(this.data.equippedRelics)) this.data.equippedRelics = [];
    if (this.data.equippedRelics.includes(id)) return true;
    if (this.data.equippedRelics.length >= 3) {
      return false; // slots full
    }
    this.data.equippedRelics.push(id);
    this.save();
    return true;
  }

  unequipRelic(id) {
    if (!Array.isArray(this.data.equippedRelics)) return false;
    const idx = this.data.equippedRelics.indexOf(id);
    if (idx !== -1) {
      this.data.equippedRelics.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  getEquippedRelics() {
    return (this.data.equippedRelics || []).map(id => COSMIC_RELICS[id]).filter(Boolean);
  }

  // Tactical Settings (v2.5)
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...(this.data.settings || {}) };
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.getSettings(), ...newSettings };
    this.save();
    return this.data.settings;
  }

  // Wingman System
  isWingmanUnlocked() {
    return !!this.data.wingmanUnlocked || (this.data.upgrades && (this.data.upgrades.satellites || 0) >= WINGMAN_CONFIG.unlockSatelliteReq);
  }

  unlockWingman() {
    if (this.isWingmanUnlocked()) return true;
    if (this.data.shards >= WINGMAN_CONFIG.unlockCostShards) {
      this.data.shards -= WINGMAN_CONFIG.unlockCostShards;
      this.data.wingmanUnlocked = true;
      this.save();
      return true;
    }
    return false;
  }

  selectWingmanDoctrine(doctrineId) {
    if (WINGMAN_CONFIG.doctrines[doctrineId]) {
      this.data.selectedWingmanDoctrine = doctrineId;
      this.save();
      return true;
    }
    return false;
  }

  getSelectedWingmanDoctrine() {
    return this.data.selectedWingmanDoctrine || 'aegis';
  }

  // Turret Hull Skins
  isTurretSkinUnlocked(skinId) {
    const skin = TURRET_SKINS[skinId];
    if (!skin) return false;
    if (skin.reqStars === 0) return true;
    const totalStars = this.getTotalStars();
    const ascension = this.data.ascensionTier || 0;
    if (skin.reqAscension && ascension >= skin.reqAscension) return true;
    return totalStars >= skin.reqStars || ascension > 0;
  }

  selectTurretSkin(skinId) {
    if (this.isTurretSkinUnlocked(skinId)) {
      this.data.selectedTurretSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }

  getSelectedTurretSkin() {
    return this.data.selectedTurretSkin || 'sentinel';
  }

  // Hyperdrive Ascension (Prestige System)
  canAscend() {
    const totalStars = this.getTotalStars();
    const currentTier = this.data.ascensionTier || 0;
    const isReady = totalStars >= ASCENSION_CONFIG.reqStars || (this.data.unlockedPlanet || 1) >= ASCENSION_CONFIG.reqPlanet;
    return isReady && currentTier < ASCENSION_CONFIG.maxTier;
  }

  ascend() {
    if (!this.canAscend()) return { success: false, newTier: this.data.ascensionTier || 0 };
    this.data.ascensionTier = (this.data.ascensionTier || 0) + 1;
    this.data.planetStars = {};
    this.data.unlockedPlanet = 1;
    this.save();
    return { success: true, newTier: this.data.ascensionTier };
  }

  getAscensionMultipliers() {
    const tier = this.data.ascensionTier || 0;
    return {
      tier,
      shardMultiplier: 1 + (tier * ASCENSION_CONFIG.shardGainBonusPerTier),
      scoreMultiplier: 1 + (tier * ASCENSION_CONFIG.scoreMultBonusPerTier),
      enemyHpMultiplier: 1 + (tier * ASCENSION_CONFIG.enemyHpScalingPerTier),
      enemySpeedMultiplier: 1 + (tier * ASCENSION_CONFIG.enemySpeedScalingPerTier)
    };
  }

  // Titan Protocol Boss Rush
  recordBossRushVictory(timeSeconds) {
    const isFirstClear = !this.data.bossRushCleared;
    this.data.bossRushCleared = true;
    const isNewRecord = this.data.bestBossRushTime === null || timeSeconds < this.data.bestBossRushTime;
    if (isNewRecord) {
      this.data.bestBossRushTime = Math.round(timeSeconds * 10) / 10;
    }
    const bonusShards = isFirstClear ? TITAN_PROTOCOL_CONFIG.rewards.firstClearShards : TITAN_PROTOCOL_CONFIG.rewards.repeatClearShards;
    this.addShards(bonusShards);
    this.data.trophies[TITAN_PROTOCOL_CONFIG.rewards.trophyId] = true;
    this.save();
    return {
      isFirstClear,
      isNewRecord,
      bonusShards,
      bestTime: this.data.bestBossRushTime
    };
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
