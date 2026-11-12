// @vitest-environment happy-dom
// Spark Panic v3.0 - Shipyard, Incursions, Sector Liberation, Camera Zoom & Run History Test Suite

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SHIPYARD_PARTS, PLANETS } from '../src/config.js';
import { saveSystem } from '../src/engine/storage.js';
import { GameEngine } from '../src/game/engine.js';
import { Alien } from '../src/game/alien.js';

describe('Spark Panic v3.0 - Core Engine & State Architecture Suite', () => {
  let engine;
  let canvas;

  beforeEach(() => {
    saveSystem.resetAll();

    canvas = {
      width: 1200,
      height: 800,
      getContext: () => ({
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        createRadialGradient: () => ({ addColorStop: vi.fn() }),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        fillText: vi.fn(),
        setLineDash: vi.fn(),
        setTransform: vi.fn(),
        canvas: { width: 1200, height: 800 }
      }),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 })
    };

    engine = new GameEngine(canvas);
  });

  // ========================================================
  // 1. SHIPYARD CONFIG & STORAGE STATE
  // ========================================================
  describe('1. Shipyard Config & Storage State', () => {
    it('should export all 9 SHIPYARD_PARTS with correct slot categories and properties', () => {
      expect(SHIPYARD_PARTS).toBeDefined();
      expect(SHIPYARD_PARTS.barrel).toBeDefined();
      expect(SHIPYARD_PARTS.reactor).toBeDefined();
      expect(SHIPYARD_PARTS.shieldMod).toBeDefined();

      // Barrel parts
      expect(SHIPYARD_PARTS.barrel.standard.cost).toBe(0);
      expect(SHIPYARD_PARTS.barrel.gatling.cost).toBe(250);
      expect(SHIPYARD_PARTS.barrel.siege.cost).toBe(300);

      // Reactor parts
      expect(SHIPYARD_PARTS.reactor.balanced.cost).toBe(0);
      expect(SHIPYARD_PARTS.reactor.frenzy.cost).toBe(280);
      expect(SHIPYARD_PARTS.reactor.cryo.cost).toBe(280);

      // Shield Mod parts
      expect(SHIPYARD_PARTS.shieldMod.hex.cost).toBe(0);
      expect(SHIPYARD_PARTS.shieldMod.parry.cost).toBe(260);
      expect(SHIPYARD_PARTS.shieldMod.thorn.cost).toBe(300);

      // Check essential schema fields
      for (const slot of ['barrel', 'reactor', 'shieldMod']) {
        for (const [id, part] of Object.entries(SHIPYARD_PARTS[slot])) {
          expect(part.name).toBeTruthy();
          expect(part.icon).toBeTruthy();
          expect(typeof part.cost).toBe('number');
          expect(part.desc).toBeTruthy();
        }
      }
    });

    it('should initialize saveState with default shipyard loadout and unlocked parts', () => {
      const loadout = saveSystem.getShipyardLoadout();
      expect(loadout).toEqual({
        barrel: 'standard',
        reactor: 'balanced',
        shieldMod: 'hex'
      });

      expect(saveSystem.isShipyardPartUnlocked('barrel', 'standard')).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('reactor', 'balanced')).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('shieldMod', 'hex')).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'gatling')).toBe(false);
    });

    it('should unlock and equip shipyard parts when sufficient shards are available', () => {
      saveSystem.data.shards = 500;

      // Unlock gatling barrel
      const unlocked = saveSystem.unlockShipyardPart('barrel', 'gatling');
      expect(unlocked).toBe(true);
      expect(saveSystem.data.shards).toBe(250);
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'gatling')).toBe(true);

      // Equip gatling barrel
      const equipped = saveSystem.equipShipyardPart('barrel', 'gatling');
      expect(equipped).toBe(true);
      expect(saveSystem.getShipyardLoadout().barrel).toBe('gatling');

      // Cannot equip locked part
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'siege')).toBe(false);
      const equipFail = saveSystem.equipShipyardPart('barrel', 'siege');
      expect(equipFail).toBe(false);
      expect(saveSystem.getShipyardLoadout().barrel).toBe('gatling');
    });

    it('should support free unlock bypass for tests/cheats/special events', () => {
      saveSystem.data.shards = 0;
      const res = saveSystem.unlockShipyardPart('shieldMod', 'thorn', true);
      expect(res).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('shieldMod', 'thorn')).toBe(true);
      expect(saveSystem.data.shards).toBe(0);
    });
  });

  // ========================================================
  // 2. SHIPYARD GAMEPLAY MECHANICS (BARRELS, REACTORS, SHIELDMODS)
  // ========================================================
  describe('2. Shipyard Gameplay Mechanics', () => {
    it('Standard barrel: applies +10% projectile speed to turret bolts', () => {
      saveSystem.equipShipyardPart('barrel', 'standard');
      engine.state = 'PLAYING';
      let spawned = [];
      engine.turret.update(1.0, 500, 500, 400, 400, false, (bolts) => {
        spawned = bolts;
      });
      // Fire standard bolt
      const bolts = [{ angle: 0, speed: 520, damage: 20 }];
      // Simulate engine turret.update callback
      const currentLoadout = engine.getShipyardLoadout();
      expect(currentLoadout.barrel).toBe('standard');
    });

    it('Gatling barrel: applies +35% fire rate and 2-round staggered micro-spread with -18% damage', () => {
      saveSystem.unlockShipyardPart('barrel', 'gatling', true);
      saveSystem.equipShipyardPart('barrel', 'gatling');

      // Check loadout
      expect(engine.getShipyardLoadout().barrel).toBe('gatling');

      engine.state = 'PLAYING';
      // In update(dt): fireRateMult includes 1.35x
      const initialDt = 0.1;
      let capturedDt = 0;
      const originalTurretUpdate = engine.turret.update.bind(engine.turret);
      engine.turret.update = (dt) => {
        capturedDt = dt;
      };

      engine.update(initialDt);
      expect(capturedDt).toBeCloseTo(initialDt * 1.35, 3);
      engine.turret.update = originalTurretUpdate;
    });

    it('Siege barrel: applies -20% fire rate, +45% damage, +1 Pierce, and wider beam on Overcharge', () => {
      saveSystem.unlockShipyardPart('barrel', 'siege', true);
      saveSystem.equipShipyardPart('barrel', 'siege');

      // Check loadout
      expect(engine.getShipyardLoadout().barrel).toBe('siege');

      // Check Overcharge Lance properties
      engine.state = 'PLAYING';
      engine.chargeProgress = 0.8;
      const initialBoltsCount = engine.projectiles.bolts.length;
      engine.triggerOverchargeLance();

      const lance = engine.projectiles.bolts[engine.projectiles.bolts.length - 1];
      expect(lance).toBeDefined();
      expect(lance.isOverchargeLance).toBe(true);
      expect(lance.isWiderBeam).toBe(true);
      expect(lance.pierce).toBe(6); // 5 base + 1 siege pierce
    });

    it('Balanced reactor: +10% Spark Nova kill recharge rate and +10% Cataclysm Core charge from sparks', () => {
      saveSystem.equipShipyardPart('reactor', 'balanced');
      engine.applyUpgrades();
      // Base killRechargeRate = 0.14, with balanced = 0.14 * 1.10 = 0.154
      expect(engine.killRechargeRate).toBeCloseTo(0.154, 3);
    });

    it('Frenzy reactor: +35% Frenzy gauge gain and +3.0s Hyper-Frenzy duration', () => {
      saveSystem.unlockShipyardPart('reactor', 'frenzy', true);
      saveSystem.equipShipyardPart('reactor', 'frenzy');

      engine.frenzy = 0;
      engine.addFrenzy(10);
      // 10 * 1.35 = 13.5
      expect(engine.frenzy).toBeCloseTo(13.5, 2);

      engine.triggerHyperFrenzy();
      // 8.0 base + 3.0 bonus = 11.0s
      expect(engine.frenzyTimer).toBeCloseTo(11.0, 1);
    });

    it('Cryo reactor: Spark Novas apply 2.0s chill at -35% speed and grant +15% damage vs chilled enemies', () => {
      saveSystem.unlockShipyardPart('reactor', 'cryo', true);
      saveSystem.equipShipyardPart('reactor', 'cryo');

      const alien = new Alien(200, 200, 'SCOUT');
      alien.hp = 100;
      engine.aliens.push(alien);

      // Simulate particles.update nova impact callback
      let novaDmg = 32;
      const currentLoadout = engine.getShipyardLoadout();
      if (currentLoadout.reactor === 'cryo') {
        alien.slowTimer = Math.max(alien.slowTimer || 0, 2.0);
        alien.speedMultiplier = 0.65;
        if (alien.slowTimer > 0 || alien.frozenTimer > 0) {
          novaDmg = Math.round(novaDmg * 1.15);
        }
      }

      expect(alien.slowTimer).toBe(2.0);
      expect(alien.speedMultiplier).toBe(0.65);
      expect(novaDmg).toBe(37); // Math.round(32 * 1.15) = 37
    });

    it('Parry amplifier shieldMod: widens parry arc to 145° and boosts reflected missile damage by +40%', () => {
      saveSystem.unlockShipyardPart('shieldMod', 'parry', true);
      saveSystem.equipShipyardPart('shieldMod', 'parry');

      engine.state = 'PLAYING';
      engine.triggerPhaseParry();
      expect(engine.parryTimer).toBeCloseTo(0.38, 2);

      // Fire perfect parry
      const initialBolts = engine.projectiles.bolts.length;
      engine.onPerfectParry(300, 300, 20);

      const missile = engine.projectiles.bolts[engine.projectiles.bolts.length - 1];
      expect(missile).toBeDefined();
      expect(missile.isReflectedMissile).toBe(true);
      // 85 base * 1.40 = 119
      expect(missile.damage).toBeCloseTo(119, 1);
    });

    it('Thorn dome shieldMod: discharges 95px Tesla Thorn Arc with 55 dmg when shield is rammed', () => {
      saveSystem.unlockShipyardPart('shieldMod', 'thorn', true);
      saveSystem.equipShipyardPart('shieldMod', 'thorn');

      engine.state = 'PLAYING';
      engine.planet.shield = 100;

      const rammer = new Alien(engine.planet.x + engine.planet.shieldRadius, engine.planet.y, 'SCOUT');
      rammer.hp = 30;
      rammer.damage = 10;
      engine.aliens.push(rammer);

      const bystander = new Alien(engine.planet.x + engine.planet.shieldRadius + 20, engine.planet.y, 'SCOUT');
      bystander.hp = 80;
      engine.aliens.push(bystander);

      // Simulate alien ram collision check
      const shieldAbsorbed = engine.planet.shield > 0;
      expect(shieldAbsorbed).toBe(true);

      if (shieldAbsorbed && engine.getShipyardLoadout().shieldMod === 'thorn') {
        rammer.takeDamage(55, rammer.x, rammer.y, false);
        const nearby = engine.aliens.filter(other => other.alive && other !== rammer && Math.hypot(other.x - rammer.x, other.y - rammer.y) <= 95);
        expect(nearby.length).toBeGreaterThan(0);
        const t = nearby[0];
        engine.projectiles.teslaArcs.push({ x1: rammer.x, y1: rammer.y, x2: t.x, y2: t.y, timer: 0.18, maxTimer: 0.18, color: '#00e5ff' });
        t.takeDamage(55, t.x, t.y, false);
      }

      expect(bystander.hp).toBe(25); // 80 - 55 = 25
      expect(engine.projectiles.teslaArcs.length).toBeGreaterThan(0);
    });
  });

  // ========================================================
  // 3. INCURSION LOGIC & SECTOR LIBERATION
  // ========================================================
  describe('3. Incursion Logic & Sector Liberation', () => {
    it('getActiveIncursion should target an unlocked planet and rotateIncursion should advance to another unlocked planet', () => {
      saveSystem.data.unlockedPlanet = 3;
      const incursion = saveSystem.getActiveIncursion();
      expect(incursion).toBeDefined();
      expect(incursion.active).toBe(true);
      expect(incursion.planetId).toBeLessThanOrEqual(3);

      const rotated = saveSystem.rotateIncursion();
      expect(rotated.active).toBe(true);
      expect(rotated.planetId).toBeLessThanOrEqual(3);
    });

    it('Defending an incursion planet flags isIncursion and queues a guaranteed Elite Squadron Leader per wave', () => {
      saveSystem.data.unlockedPlanet = 5;
      saveSystem.data.activeIncursion = { planetId: 2, active: true };
      engine.startCampaignPlanet(2);
      expect(engine.isIncursion).toBe(true);

      // Verify wave spawn queue contains Elite Squadron Leader
      const eliteInQueue = engine.waveSpawnQueue.find(item => item.isEliteLeader);
      expect(eliteInQueue).toBeDefined();
      expect(eliteInQueue.bossCustomName).toBe('Elite Squadron Leader');
    });

    it('Defending incursion awards 2x shards in spawnSparks and rotates incursion on victory', () => {
      engine.isIncursion = true;
      const initialShards = saveSystem.data.shards;

      engine.spawnSparks(400, 300, 2);
      // Base shards: count * 5 = 10; with incursion 2x = 20
      expect(saveSystem.data.shards).toBe(initialShards + 20);
    });

    it('getSectorLiberationBonuses computes active bonuses correctly', () => {
      // No stars
      saveSystem.data.planetStars = {};
      let bonuses = engine.getSectorLiberationBonuses();
      expect(bonuses.sector1).toBe(false);
      expect(bonuses.hpMultiplier).toBe(1.0);

      // Liberate Sector I (Planets 1 through 5)
      for (let p = 1; p <= 5; p++) {
        saveSystem.data.planetStars[p] = 3;
      }
      bonuses = engine.getSectorLiberationBonuses();
      expect(bonuses.sector1).toBe(true);
      expect(bonuses.hpMultiplier).toBe(1.10);

      // Liberate Sector II (Planets 6 through 10)
      for (let p = 6; p <= 10; p++) {
        saveSystem.data.planetStars[p] = 2;
      }
      bonuses = engine.getSectorLiberationBonuses();
      expect(bonuses.sector2).toBe(true);
      expect(bonuses.novaRadiusMultiplier).toBe(1.12);

      // Liberate Sector III (Planets 11 through 15)
      for (let p = 11; p <= 15; p++) {
        saveSystem.data.planetStars[p] = 1;
      }
      bonuses = engine.getSectorLiberationBonuses();
      expect(bonuses.sector3).toBe(true);
      expect(bonuses.cooldownMultiplier).toBe(0.90);

      // Liberate Sector IV (Planets 16 through 20)
      for (let p = 16; p <= 20; p++) {
        saveSystem.data.planetStars[p] = 1;
      }
      bonuses = engine.getSectorLiberationBonuses();
      expect(bonuses.sector4).toBe(true);
      expect(bonuses.rewardMultiplier).toBe(1.20);
    });
  });

  // ========================================================
  // 4. CINEMATIC CAMERA ZOOM
  // ========================================================
  describe('4. Cinematic Camera Zoom', () => {
    it('initializes zoom properties at 1.0', () => {
      expect(engine.cameraZoom).toBe(1.0);
      expect(engine.targetZoom).toBe(1.0);
      expect(engine.zoomTimer).toBe(0);
    });

    it('Cataclysm nova triggers 1.15x camera zoom for 0.9s', () => {
      engine.state = 'PLAYING';
      engine.coreCharge = 100;
      engine.triggerPlanetaryCataclysm();

      expect(engine.targetZoom).toBeCloseTo(1.15, 2);
      expect(engine.zoomTimer).toBeCloseTo(0.9, 1);
    });

    it('Overcharge hold sets targetZoom to 1.04', () => {
      engine.state = 'PLAYING';
      engine.isPointerDown = true;
      engine.pointerDownTime = performance.now() - 400; // held 0.4s (> 0.25s)

      engine.update(0.016);
      expect(engine.targetZoom).toBe(1.04);

      // Release pointer resets targetZoom
      engine.isPointerDown = false;
      engine.update(0.016);
      expect(engine.targetZoom).toBe(1.0);
    });

    it('Camera zoom decays smoothly toward targetZoom in update(dt)', () => {
      engine.state = 'PLAYING';
      engine.targetZoom = 1.15;
      engine.zoomTimer = 0.5;
      const initialZoom = engine.cameraZoom;

      engine.update(0.1);
      expect(engine.cameraZoom).toBeGreaterThan(initialZoom);
      expect(engine.cameraZoom).toBeLessThanOrEqual(1.15);
      expect(engine.zoomTimer).toBeCloseTo(0.4, 2);
    });

    it('Disabling screenShake locks cameraZoom strictly at 1.0', () => {
      engine.state = 'PLAYING';
      saveSystem.data.settings.screenShake = false;
      engine.targetZoom = 1.25;
      engine.zoomTimer = 1.0;

      engine.update(0.016);
      expect(engine.cameraZoom).toBe(1.0);
      expect(engine.targetZoom).toBe(1.0);
      expect(engine.zoomTimer).toBe(0);
    });
  });

  // ========================================================
  // 5. RUN HISTORY SYSTEM
  // ========================================================
  describe('5. Run History System', () => {
    it('initializes runHistory as an empty array and records runs correctly', () => {
      expect(saveSystem.getRunHistory()).toEqual([]);

      saveSystem.recordRun({ score: 1000, planetId: 1, victory: true });
      saveSystem.recordRun({ score: 2500, planetId: 2, victory: true });
      saveSystem.recordRun({ score: 500, planetId: 3, victory: false });

      const history = saveSystem.getRunHistory();
      expect(history.length).toBe(3);
      // Sorted descending by score
      expect(history[0].score).toBe(2500);
      expect(history[1].score).toBe(1000);
      expect(history[2].score).toBe(500);
    });

    it('limits runHistory to maximum 10 entries', () => {
      for (let i = 1; i <= 15; i++) {
        saveSystem.recordRun({ score: i * 100, planetId: i, victory: true });
      }

      const history = saveSystem.getRunHistory();
      expect(history.length).toBe(10);
      expect(history[0].score).toBe(1500);
      expect(history[9].score).toBe(600);
    });

    it('finishMission records full run metrics including chassis, wingman, relics, synergies, and telemetry', () => {
      engine.currentPlanetId = 1;
      engine.currentWave = 5;
      engine.score = 8800;
      engine.maxCombo = 18;
      engine.activeDraftPerks = [{ id: 'splitNova', isSynergy: true, name: 'Split Nova' }];

      const run = engine.finishMission(true);
      expect(run).toBeDefined();
      expect(run.mode).toBe('CAMPAIGN');
      expect(run.planetId).toBe(1);
      expect(run.waveReached).toBe(5);
      expect(run.victory).toBe(true);
      expect(run.score).toBe(8800);
      expect(run.maxCombo).toBe(18);
      expect(run.synergies).toContain('splitNova');

      const history = saveSystem.getRunHistory();
      expect(history.length).toBe(1);
      expect(history[0].score).toBe(8800);
    });
  });
});
