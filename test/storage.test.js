// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/engine/storage.js';
import { ARMORY_CONFIG, GUARDIAN_RANKS, TROPHIES } from '../src/config.js';

describe('Storage Manager & Persistence (v2.0)', () => {
  beforeEach(() => {
    storage.resetAll();
  });

  it('should initialize with starting bonus shards and default state', () => {
    expect(storage.getUnlockedPlanet()).toBe(1);
    expect(storage.getUnlockedLevel()).toBe(1);
    expect(storage.getTotalStars()).toBe(0);
    expect(storage.getPlanetStars(1)).toBe(0);
    expect(storage.getData().shards).toBe(120);
    expect(storage.isSoundMuted()).toBe(false);
  });

  it('should handle shard addition and spending correctly', () => {
    storage.addShards(100);
    expect(storage.getData().shards).toBe(220);

    const spent = storage.spendShards(50);
    expect(spent).toBe(true);
    expect(storage.getData().shards).toBe(170);

    const overspend = storage.spendShards(500);
    expect(overspend).toBe(false);
    expect(storage.getData().shards).toBe(170);
  });

  it('should calculate upgrade costs based on baseCost and costFactor', () => {
    const techId = 'turretDmg';
    const cfg = ARMORY_CONFIG[techId];
    expect(storage.getUpgradeCost(techId)).toBe(cfg.baseCost);

    // Upgrade level 1
    const ok = storage.upgradeTech(techId);
    expect(ok).toBe(true);
    expect(storage.getData().upgrades[techId]).toBe(1);

    const expectedCostLvl1 = Math.round(cfg.baseCost * Math.pow(cfg.costFactor, 1));
    expect(storage.getUpgradeCost(techId)).toBe(expectedCostLvl1);
  });

  it('should support 100% refund for all tech upgrades without loss', () => {
    storage.addShards(1000);
    const startShards = storage.getData().shards;

    // Buy several upgrades
    storage.upgradeTech('turretDmg');
    storage.upgradeTech('novaRadius');
    storage.upgradeTech('shieldGrid');

    const shardsAfterPurchases = storage.getData().shards;
    expect(shardsAfterPurchases).toBeLessThan(startShards);

    // Refund
    const refunded = storage.refundAllTech();
    expect(refunded).toBe(startShards - shardsAfterPurchases);
    expect(storage.getData().shards).toBe(startShards);
    expect(storage.getData().upgrades.turretDmg).toBe(0);
    expect(storage.getData().upgrades.novaRadius).toBe(0);
    expect(storage.getData().upgrades.shieldGrid).toBe(0);
  });

  it('should record planet victory, award star shards, and unlock next planet', () => {
    const startShards = storage.getData().shards;
    storage.recordPlanetClear(1, 15000, 3);

    expect(storage.getPlanetStars(1)).toBe(3);
    expect(storage.getUnlockedPlanet()).toBe(2);
    expect(storage.getData().planetHighScores[1]).toBe(15000);
    // 3 stars * 45 = +135 shards
    expect(storage.getData().shards).toBe(startShards + 135);
  });

  it('should not downgrade stars if replayed with lower score/stars', () => {
    storage.recordPlanetClear(1, 20000, 3);
    storage.recordPlanetClear(1, 10000, 1);

    expect(storage.getPlanetStars(1)).toBe(3);
    expect(storage.getData().planetHighScores[1]).toBe(20000);
  });

  it('should record endless high scores and max waves correctly', () => {
    const isNew1 = storage.recordEndlessScore(5000, 3);
    expect(isNew1).toBe(true);
    expect(storage.getData().endlessHighScore).toBe(5000);
    expect(storage.getData().endlessMaxWave).toBe(3);

    const isNew2 = storage.recordEndlessScore(3000, 2);
    expect(isNew2).toBe(false);
    expect(storage.getData().endlessHighScore).toBe(5000);
  });

  it('should unlock trophies and reward star shards', () => {
    const startShards = storage.getData().shards;
    const trophy = storage.unlockTrophy('FIRST_DEFENSE');

    expect(trophy).toBeDefined();
    expect(trophy.id).toBe('FIRST_DEFENSE');
    expect(storage.getData().trophies['FIRST_DEFENSE']).toBe(true);
    expect(storage.getData().shards).toBe(startShards + trophy.reward);

    // Unlocking same trophy again should return false and not re-award shards
    const reUnlock = storage.unlockTrophy('FIRST_DEFENSE');
    expect(reUnlock).toBe(false);
  });

  it('should compute Guardian Rank dynamically based on total earned stars', () => {
    expect(storage.getGuardianRank().title).toBe('CADET GUARDIAN');

    // Simulate earning 10 stars (>= 8 -> SYSTEM SENTINEL)
    storage.data.planetStars = { 1: 3, 2: 3, 3: 3, 4: 1 };
    expect(storage.getGuardianRank().title).toBe('SYSTEM SENTINEL');

    // Simulate earning 20 stars (>= 18 -> NEBULA WARDEN)
    storage.data.planetStars = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 2 };
    expect(storage.getGuardianRank().title).toBe('NEBULA WARDEN');

    // Simulate 58 stars (>= 55 -> SUPREME COSMIC GUARDIAN)
    for (let i = 1; i <= 20; i++) storage.data.planetStars[i] = 3;
    expect(storage.getGuardianRank().title).toBe('SUPREME COSMIC GUARDIAN');
  });

  it('should toggle sound mute state', () => {
    expect(storage.isSoundMuted()).toBe(false);
    storage.setSoundMuted(true);
    expect(storage.isSoundMuted()).toBe(true);
    storage.setSoundMuted(false);
    expect(storage.isSoundMuted()).toBe(false);
  });
});
