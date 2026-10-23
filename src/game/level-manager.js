// Spark Panic - Level & Endless Progression Manager

import { LEVELS, SPARK_TYPES } from '../config.js';
import { Orb } from './orb.js';

export class LevelManager {
  constructor(arenaWidth = 720, arenaHeight = 1280) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    this.currentLevel = 1;
    this.mode = 'CAMPAIGN'; // 'CAMPAIGN' | 'ENDLESS'

    // Campaign stats
    this.target = 0;
    this.totalSparks = 0;
    this.poppedSparks = 0;
    this.tapsAllowed = 1;
    this.tapsRemaining = 1;

    // Endless stats
    this.endlessWave = 1;
    this.bonusTapThreshold = 12; // every 12 combo = +1 tap
    this.lastBonusTapAtCombo = 0;
  }

  loadLevel(levelIndex) {
    this.mode = 'CAMPAIGN';
    this.currentLevel = Math.max(1, Math.min(LEVELS.length, levelIndex));
    const config = LEVELS[this.currentLevel - 1];

    this.totalSparks = config.totalSparks;
    this.target = config.target;
    this.tapsAllowed = config.taps;
    this.tapsRemaining = config.taps;
    this.poppedSparks = 0;

    return this.spawnCampaignOrbs(config);
  }

  spawnCampaignOrbs(config) {
    const orbs = [];
    const typesConfig = config.types || { [SPARK_TYPES.NORMAL]: config.totalSparks };

    const topPad = 140;
    const bottomPad = 80;
    const horizPad = 40;

    for (const [type, count] of Object.entries(typesConfig)) {
      for (let i = 0; i < count; i++) {
        const x = horizPad + Math.random() * (this.arenaWidth - horizPad * 2);
        const y = topPad + Math.random() * (this.arenaHeight - topPad - bottomPad);
        orbs.push(new Orb(x, y, type, this.arenaWidth, this.arenaHeight));
      }
    }
    return orbs;
  }

  startEndless() {
    this.mode = 'ENDLESS';
    this.endlessWave = 1;
    this.tapsRemaining = 2; // Start with 2 taps in endless mode
    this.tapsAllowed = 2;
    this.poppedSparks = 0;
    this.lastBonusTapAtCombo = 0;
    this.target = 10;
    this.totalSparks = 25;

    return this.spawnEndlessWave(1);
  }

  spawnEndlessWave(wave) {
    const orbs = [];
    const count = Math.min(65, 20 + wave * 3);
    this.totalSparks = count;

    const topPad = 140;
    const bottomPad = 80;
    const horizPad = 40;

    for (let i = 0; i < count; i++) {
      let type = SPARK_TYPES.NORMAL;
      const roll = Math.random();

      if (wave >= 2 && roll < 0.2) type = SPARK_TYPES.MEGA;
      else if (wave >= 3 && roll < 0.35) type = SPARK_TYPES.SPLITTER;
      else if (wave >= 4 && roll < 0.45) type = SPARK_TYPES.FREEZE;
      else if (wave >= 5 && roll < 0.55) type = SPARK_TYPES.REPULSOR;

      const x = horizPad + Math.random() * (this.arenaWidth - horizPad * 2);
      const y = topPad + Math.random() * (this.arenaHeight - topPad - bottomPad);
      orbs.push(new Orb(x, y, type, this.arenaWidth, this.arenaHeight));
    }

    return orbs;
  }

  calculateStars(popped, target, total) {
    if (popped < target) return 0;
    if (popped >= total * 0.95) return 3;
    const twoStarThreshold = target + Math.ceil((total - target) * 0.45);
    if (popped >= twoStarThreshold) return 2;
    return 1;
  }

  recordPop() {
    this.poppedSparks++;
  }

  useTap() {
    if (this.tapsRemaining > 0) {
      this.tapsRemaining--;
      return true;
    }
    return false;
  }

  checkEndlessBonusTap(combo) {
    if (this.mode !== 'ENDLESS') return false;
    const eligibleTaps = Math.floor(combo / this.bonusTapThreshold);
    if (eligibleTaps > this.lastBonusTapAtCombo) {
      this.lastBonusTapAtCombo = eligibleTaps;
      this.tapsRemaining++;
      return true;
    }
    return false;
  }

  isRoundOver(activeExplosionsCount) {
    // If there are still active explosions detonating, round is not over
    if (activeExplosionsCount > 0) return false;
    // Round is over if player has no taps remaining
    return this.tapsRemaining <= 0;
  }
}
