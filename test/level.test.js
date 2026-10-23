import { describe, it, expect } from 'vitest';
import { LEVELS, SPARK_TYPES } from '../src/config.js';
import { LevelManager } from '../src/game/level-manager.js';

describe('Level Progression & Balance', () => {
  it('should define 20 valid levels with reasonable targets and taps', () => {
    expect(LEVELS.length).toBe(20);

    LEVELS.forEach((lvl, idx) => {
      expect(lvl.level).toBe(idx + 1);
      expect(lvl.totalSparks).toBeGreaterThan(0);
      expect(lvl.target).toBeGreaterThan(0);
      expect(lvl.target).toBeLessThanOrEqual(lvl.totalSparks);
      expect(lvl.taps).toBeGreaterThanOrEqual(1);
      expect(lvl.taps).toBeLessThanOrEqual(3);
    });
  });

  it('should correctly calculate star ratings', () => {
    const mgr = new LevelManager(720, 1280);

    // Level with 20 total, 10 target
    expect(mgr.calculateStars(8, 10, 20)).toBe(0); // Failed
    expect(mgr.calculateStars(10, 10, 20)).toBe(1); // Met target exactly
    expect(mgr.calculateStars(16, 10, 20)).toBe(2); // Met 2-star threshold
    expect(mgr.calculateStars(19, 10, 20)).toBe(3); // 95%+
    expect(mgr.calculateStars(20, 10, 20)).toBe(3); // 100% full clear
  });

  it('should initialize and load campaign level properly', () => {
    const mgr = new LevelManager(720, 1280);
    const orbs = mgr.loadLevel(1);

    expect(mgr.currentLevel).toBe(1);
    expect(mgr.target).toBe(LEVELS[0].target);
    expect(mgr.totalSparks).toBe(LEVELS[0].totalSparks);
    expect(mgr.tapsRemaining).toBe(LEVELS[0].taps);
    expect(orbs.length).toBe(LEVELS[0].totalSparks);
  });

  it('should manage tap deductions and round over condition', () => {
    const mgr = new LevelManager(720, 1280);
    mgr.loadLevel(1); // 1 tap

    expect(mgr.tapsRemaining).toBe(1);
    expect(mgr.useTap()).toBe(true);
    expect(mgr.tapsRemaining).toBe(0);
    expect(mgr.useTap()).toBe(false);

    // If explosions are still active, round is NOT over
    expect(mgr.isRoundOver(2)).toBe(false);
    // If no explosions and no taps, round IS over
    expect(mgr.isRoundOver(0)).toBe(true);
  });

  it('should correctly award bonus taps in Endless Mode at combo thresholds', () => {
    const mgr = new LevelManager(720, 1280);
    mgr.startEndless();

    expect(mgr.mode).toBe('ENDLESS');
    const initialTaps = mgr.tapsRemaining;

    // Combo under 12 should not award bonus tap
    expect(mgr.checkEndlessBonusTap(8)).toBe(false);
    expect(mgr.tapsRemaining).toBe(initialTaps);

    // Combo reaches 12 -> +1 tap
    expect(mgr.checkEndlessBonusTap(12)).toBe(true);
    expect(mgr.tapsRemaining).toBe(initialTaps + 1);

    // Same combo tier should not double award
    expect(mgr.checkEndlessBonusTap(15)).toBe(false);

    // Next tier 24 -> +1 tap
    expect(mgr.checkEndlessBonusTap(25)).toBe(true);
    expect(mgr.tapsRemaining).toBe(initialTaps + 2);
  });
});
