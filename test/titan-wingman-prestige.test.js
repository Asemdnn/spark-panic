// Unit Tests for v2.4: Titan Protocol, Wingman AI & Prestige System

import { describe, it, expect } from 'vitest';
import {
  TITAN_PROTOCOL_CONFIG,
  WINGMAN_CONFIG,
  TURRET_SKINS,
  ASCENSION_CONFIG
} from '../src/config.js';
import { SaveSystem } from '../src/engine/storage.js';
import { WingmanFighter, PlasmaProximityMine } from '../src/game/wingman.js';

describe('v2.4 Titan Protocol & Boss Rush Gauntlet', () => {
  it('should define a 4-wave back-to-back boss gauntlet with required flagships', () => {
    expect(TITAN_PROTOCOL_CONFIG.totalWaves).toBe(4);
    expect(TITAN_PROTOCOL_CONFIG.waves.length).toBe(4);

    const bosses = TITAN_PROTOCOL_CONFIG.waves.map(w => w.bossName);
    expect(bosses).toEqual([
      'Dreadnought Vexor',
      'Mothership Kaelen',
      'Void Harbinger',
      'The Apex Leviathan'
    ]);

    // Check boss HPs scale upward
    const hps = TITAN_PROTOCOL_CONFIG.waves.map(w => w.bossHp);
    for (let i = 1; i < hps.length; i++) {
      expect(hps[i]).toBeGreaterThan(hps[i - 1]);
    }
  });

  it('should configure 4-second orbital pit-stop repair phase with +35% shield and +15% core', () => {
    const pit = TITAN_PROTOCOL_CONFIG.pitStop;
    expect(pit.duration).toBe(4.0);
    expect(pit.shieldRestorePct).toBe(0.35);
    expect(pit.coreRestorePct).toBe(0.15);
    expect(pit.novaChargesBonus).toBe(2);
    expect(pit.bannerText).toContain('+35% SHIELD');
  });

  it('should configure first-clear and repeat rewards and 7th trophy link', () => {
    const rewards = TITAN_PROTOCOL_CONFIG.rewards;
    expect(rewards.firstClearShards).toBe(300);
    expect(rewards.repeatClearShards).toBe(100);
    expect(rewards.trophyId).toBe('TITAN_CONQUEROR');
  });

  it('should record boss rush clear times, award trophy and bonus shards', () => {
    const save = new SaveSystem();
    save.resetAll();

    // First clear: 82.5 seconds
    const res1 = save.recordBossRushVictory(82.5);
    expect(res1.isFirstClear).toBe(true);
    expect(res1.isNewRecord).toBe(true);
    expect(res1.bonusShards).toBe(300);
    expect(save.data.bossRushCleared).toBe(true);
    expect(save.data.bestBossRushTime).toBe(82.5);
    expect(save.data.trophies.TITAN_CONQUEROR).toBe(true);

    // Repeat clear: 75.0 seconds (faster)
    const res2 = save.recordBossRushVictory(75.0);
    expect(res2.isFirstClear).toBe(false);
    expect(res2.isNewRecord).toBe(true);
    expect(res2.bonusShards).toBe(100);
    expect(save.data.bestBossRushTime).toBe(75.0);

    // Slower clear: 90.0 seconds (not a record)
    const res3 = save.recordBossRushVictory(90.0);
    expect(res3.isNewRecord).toBe(false);
    expect(save.data.bestBossRushTime).toBe(75.0);
  });
});

describe('v2.4 Autonomous AI Wingman Fighter (WING-01) & Doctrines', () => {
  it('should define 3 tactical wingman doctrines with distinct traits', () => {
    const doctrines = WINGMAN_CONFIG.doctrines;
    expect(doctrines.aegis).toBeDefined();
    expect(doctrines.vanguard).toBeDefined();
    expect(doctrines.harvester).toBeDefined();

    expect(doctrines.aegis.speed).toBe(190);
    expect(doctrines.vanguard.damage).toBe(38);
    expect(doctrines.harvester.bulletColor).toBe('#00e676');
  });

  it('should handle wingman unlock conditions: satellites >= 2 or 200 shards', () => {
    const save = new SaveSystem();
    save.resetAll();

    // Initially locked
    expect(save.isWingmanUnlocked()).toBe(false);

    // Can afford with shards
    save.data.shards = 250;
    const unlocked = save.unlockWingman();
    expect(unlocked).toBe(true);
    expect(save.data.shards).toBe(50);
    expect(save.isWingmanUnlocked()).toBe(true);

    // Test unlock via satellites upgrade
    const save2 = new SaveSystem();
    save2.resetAll();
    expect(save2.isWingmanUnlocked()).toBe(false);
    save2.data.upgrades.satellites = 2;
    expect(save2.isWingmanUnlocked()).toBe(true);
  });

  it('should allow selecting and persisting wingman doctrines', () => {
    const save = new SaveSystem();
    save.resetAll();

    expect(save.getSelectedWingmanDoctrine()).toBe('aegis');
    save.selectWingmanDoctrine('vanguard');
    expect(save.getSelectedWingmanDoctrine()).toBe('vanguard');
    save.selectWingmanDoctrine('harvester');
    expect(save.getSelectedWingmanDoctrine()).toBe('harvester');
  });

  it('should instantiate WingmanFighter and handle doctrine switching', () => {
    const mockEngine = {
      planet: { x: 400, y: 300, planetRadius: 50, shieldRadius: 100 },
      aliens: [],
      alienTorpedoes: [],
      projectiles: {
        torpedoes: [],
        addPlasmaBolt: () => {}
      },
      particles: {
        addFloater: () => {},
        spawnNovaRing: () => {},
        spawnDebris: () => {}
      },
      damageSources: { turret: 0, nova: 0, wingman: 0 }
    };

    const wingman = new WingmanFighter(mockEngine);
    expect(wingman.callsign).toBe('WING-01');
    expect(wingman.doctrine).toBe('aegis');

    wingman.setDoctrine('vanguard');
    expect(wingman.doctrine).toBe('vanguard');

    wingman.setDoctrine('harvester');
    expect(wingman.doctrine).toBe('harvester');
  });

  it('should detonate plasma proximity mines and damage targets within radius', () => {
    const mine = new PlasmaProximityMine(95, 95);
    expect(mine.alive).toBe(true);
    mine.armTimer = 0; // armed

    const aliens = [{ x: 100, y: 100, radius: 16, alive: true, hp: 50 }];
    let detonatedDmg = 0;
    let detonatedRadius = 0;

    mine.update(0.1, aliens, (x, y, r, dmg) => {
      detonatedRadius = r;
      detonatedDmg = dmg;
      aliens[0].hp -= dmg;
    });

    expect(mine.alive).toBe(false);
    expect(detonatedRadius).toBe(70);
    expect(detonatedDmg).toBe(48);
    expect(aliens[0].hp).toBe(2);
  });
});

describe('v2.4 Galactic Prestige (Hyperdrive Ascension) & Turret Skins', () => {
  it('should define 4 turret hull skins with proper unlock thresholds', () => {
    expect(TURRET_SKINS.sentinel.reqStars).toBe(0);
    expect(TURRET_SKINS.sovereign.reqStars).toBe(20);
    expect(TURRET_SKINS.valkyrie.reqStars).toBe(40);
    expect(TURRET_SKINS.prismatic.reqStars).toBe(60);
    expect(TURRET_SKINS.prismatic.reqAscension).toBe(1);
  });

  it('should verify turret skin unlocking according to stars and ascension tier', () => {
    const save = new SaveSystem();
    save.resetAll();

    expect(save.isTurretSkinUnlocked('sentinel')).toBe(true);
    expect(save.isTurretSkinUnlocked('sovereign')).toBe(false);
    expect(save.isTurretSkinUnlocked('valkyrie')).toBe(false);
    expect(save.isTurretSkinUnlocked('prismatic')).toBe(false);

    // Give 27 stars
    for (let p = 1; p <= 9; p++) save.data.planetStars[p] = 3;
    expect(save.getTotalStars()).toBe(27);
    expect(save.isTurretSkinUnlocked('sovereign')).toBe(true);
    expect(save.isTurretSkinUnlocked('valkyrie')).toBe(false);

    // Give Ascension Tier 1
    save.data.ascensionTier = 1;
    expect(save.isTurretSkinUnlocked('prismatic')).toBe(true);
  });

  it('should calculate Ascension multipliers correctly per tier', () => {
    const save = new SaveSystem();
    save.resetAll();

    // Tier 0
    let mults = save.getAscensionMultipliers();
    expect(mults.tier).toBe(0);
    expect(mults.shardMultiplier).toBe(1.0);
    expect(mults.scoreMultiplier).toBe(1.0);
    expect(mults.enemyHpMultiplier).toBe(1.0);
    expect(mults.enemySpeedMultiplier).toBe(1.0);

    // Tier 2
    save.data.ascensionTier = 2;
    mults = save.getAscensionMultipliers();
    expect(mults.tier).toBe(2);
    expect(mults.shardMultiplier).toBe(1.5); // +25% per tier
    expect(mults.scoreMultiplier).toBe(1.4); // +20% per tier
    expect(mults.enemyHpMultiplier).toBe(1.4); // +20% per tier
    expect(mults.enemySpeedMultiplier).toBe(1.4); // +20% per tier
  });

  it('should enforce ascension prerequisites (45+ stars or planet 20 unlocked) and execute prestige reset', () => {
    const save = new SaveSystem();
    save.resetAll();

    expect(save.canAscend()).toBe(false);

    // Award 45 stars
    for (let p = 1; p <= 15; p++) save.data.planetStars[p] = 3;
    expect(save.getTotalStars()).toBe(45);
    expect(save.canAscend()).toBe(true);

    // Upgrade some tech and collect shards
    save.data.shards = 1200;
    save.data.upgrades.turretDmg = 3;
    save.data.wingmanUnlocked = true;
    save.data.unlockedChassis.tesla = true;
    save.data.trophies.APEX_PREDATOR = true;

    // Ascend to Tier 1
    const res = save.ascend();
    expect(res.success).toBe(true);
    expect(res.newTier).toBe(1);

    // Verify planet progress reset
    expect(save.data.unlockedPlanet).toBe(1);
    expect(save.getTotalStars()).toBe(0);

    // Verify tech, shards, chassis, wingman, trophies PRESERVED
    expect(save.data.shards).toBe(1200);
    expect(save.data.upgrades.turretDmg).toBe(3);
    expect(save.data.wingmanUnlocked).toBe(true);
    expect(save.data.unlockedChassis.tesla).toBe(true);
    expect(save.data.trophies.APEX_PREDATOR).toBe(true);
  });

  it('should export and import save data preserving all v2.4 fields', () => {
    const save = new SaveSystem();
    save.resetAll();

    save.data.shards = 880;
    save.data.ascensionTier = 2;
    save.data.selectedTurretSkin = 'sovereign';
    save.data.selectedWingmanDoctrine = 'harvester';
    save.data.wingmanUnlocked = true;
    save.data.bestBossRushTime = 64.2;
    save.data.bossRushCleared = true;

    const code = save.exportSaveCode();
    expect(code).toBeDefined();

    const save2 = new SaveSystem();
    save2.resetAll();
    const imported = save2.importSaveCode(code);

    expect(imported).toBe(true);
    expect(save2.data.shards).toBe(880);
    expect(save2.data.ascensionTier).toBe(2);
    expect(save2.data.selectedTurretSkin).toBe('sovereign');
    expect(save2.data.selectedWingmanDoctrine).toBe('harvester');
    expect(save2.data.wingmanUnlocked).toBe(true);
    expect(save2.data.bestBossRushTime).toBe(64.2);
    expect(save2.data.bossRushCleared).toBe(true);
  });
});
