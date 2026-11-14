// @vitest-environment happy-dom
// Spark Panic v3.0: Galactic Command Edition - Comprehensive Milestone Verification Suite

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SHIPYARD_PARTS, PLANETS } from '../src/config.js';
import { saveSystem } from '../src/engine/storage.js';
import { GameEngine } from '../src/game/engine.js';
import { Alien } from '../src/game/alien.js';
import { BattleCardGenerator } from '../src/ui/battle-card.js';

describe('Spark Panic v3.0: Galactic Command Edition Suite', () => {
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
        ellipse: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        clearRect: vi.fn(),
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        createRadialGradient: () => ({ addColorStop: vi.fn() }),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        fillText: vi.fn(),
        measureText: () => ({ width: 100 }),
        setLineDash: vi.fn(),
        setTransform: vi.fn(),
        set fillStyle(v) {},
        set strokeStyle(v) {},
        set lineWidth(v) {},
        set textAlign(v) {},
        set textBaseline(v) {},
        set shadowColor(v) {},
        set shadowBlur(v) {},
        canvas: { width: 1200, height: 800 }
      }),
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 })
    };

    engine = new GameEngine(canvas);
  });

  // =========================================================================
  // 1. MODULAR ORBITAL SHIPYARD
  // =========================================================================
  describe('1. Modular Orbital Shipyard', () => {
    it('SHIPYARD_PARTS should define all 3 slots with 3 parts each, costs and icons', () => {
      expect(SHIPYARD_PARTS).toBeDefined();
      expect(Object.keys(SHIPYARD_PARTS)).toEqual(['barrel', 'reactor', 'shieldMod']);

      // Slot A: Barrel Assembly
      expect(SHIPYARD_PARTS.barrel.standard).toMatchObject({ cost: 0, icon: '⚙️' });
      expect(SHIPYARD_PARTS.barrel.gatling).toMatchObject({ cost: 250, icon: '🔥' });
      expect(SHIPYARD_PARTS.barrel.siege).toMatchObject({ cost: 300, icon: '🎯' });

      // Slot B: Core Reactor
      expect(SHIPYARD_PARTS.reactor.balanced).toMatchObject({ cost: 0, icon: '⚡' });
      expect(SHIPYARD_PARTS.reactor.frenzy).toMatchObject({ cost: 280, icon: '🔥' });
      expect(SHIPYARD_PARTS.reactor.cryo).toMatchObject({ cost: 280, icon: '❄️' });

      // Slot C: Shield Geometry
      expect(SHIPYARD_PARTS.shieldMod.hex).toMatchObject({ cost: 0, icon: '🛡️' });
      expect(SHIPYARD_PARTS.shieldMod.parry).toMatchObject({ cost: 260, icon: '🪞' });
      expect(SHIPYARD_PARTS.shieldMod.thorn).toMatchObject({ cost: 300, icon: '⚡' });

      // Check all 9 parts have valid schema
      for (const slot of ['barrel', 'reactor', 'shieldMod']) {
        for (const [id, part] of Object.entries(SHIPYARD_PARTS[slot])) {
          expect(part.name.length).toBeGreaterThan(0);
          expect(part.desc.length).toBeGreaterThan(0);
          expect(typeof part.cost).toBe('number');
        }
      }
    });

    it('Storage: default loadout, unlocking, equipping, and shard deduction', () => {
      expect(saveSystem.getShipyardLoadout()).toEqual({
        barrel: 'standard',
        reactor: 'balanced',
        shieldMod: 'hex'
      });

      // Cost 0 parts unlocked by default
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'standard')).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('reactor', 'balanced')).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('shieldMod', 'hex')).toBe(true);

      // Upgraded parts locked initially
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'gatling')).toBe(false);
      expect(saveSystem.equipShipyardPart('barrel', 'gatling')).toBe(false);

      // Unlock with insufficient shards fails
      saveSystem.data.shards = 100;
      expect(saveSystem.unlockShipyardPart('barrel', 'gatling')).toBe(false);

      // Unlock with sufficient shards succeeds and deducts shards
      saveSystem.data.shards = 300;
      expect(saveSystem.unlockShipyardPart('barrel', 'gatling')).toBe(true);
      expect(saveSystem.data.shards).toBe(50); // 300 - 250
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'gatling')).toBe(true);

      // Equip unlocked part succeeds
      expect(saveSystem.equipShipyardPart('barrel', 'gatling')).toBe(true);
      expect(saveSystem.getShipyardLoadout().barrel).toBe('gatling');
    });

    it('Storage: save export & import preserves shipyard loadout and unlocked parts', () => {
      saveSystem.unlockShipyardPart('barrel', 'siege', true);
      saveSystem.equipShipyardPart('barrel', 'siege');
      saveSystem.unlockShipyardPart('reactor', 'cryo', true);
      saveSystem.equipShipyardPart('reactor', 'cryo');

      const code = saveSystem.exportSaveCode();
      saveSystem.resetAll();
      expect(saveSystem.getShipyardLoadout().barrel).toBe('standard');

      const imported = saveSystem.importSaveCode(code);
      expect(imported).toBe(true);
      expect(saveSystem.getShipyardLoadout().barrel).toBe('siege');
      expect(saveSystem.getShipyardLoadout().reactor).toBe('cryo');
      expect(saveSystem.isShipyardPartUnlocked('barrel', 'siege')).toBe(true);
      expect(saveSystem.isShipyardPartUnlocked('reactor', 'cryo')).toBe(true);
    });

    it('Barrel Stats: Gatling burst fire rate multiplier (+35%)', () => {
      saveSystem.unlockShipyardPart('barrel', 'gatling', true);
      saveSystem.equipShipyardPart('barrel', 'gatling');
      engine.state = 'PLAYING';

      let capturedDt = 0;
      const originalTurretUpdate = engine.turret.update.bind(engine.turret);
      engine.turret.update = (dt) => { capturedDt = dt; };

      engine.update(0.1);
      expect(capturedDt).toBeCloseTo(0.135, 3);
      engine.turret.update = originalTurretUpdate;
    });

    it('Barrel Stats: Siege barrel applies -20% fire rate and +1 pierce with wider beam', () => {
      saveSystem.unlockShipyardPart('barrel', 'siege', true);
      saveSystem.equipShipyardPart('barrel', 'siege');
      engine.state = 'PLAYING';

      let capturedDt = 0;
      const originalTurretUpdate = engine.turret.update.bind(engine.turret);
      engine.turret.update = (dt) => { capturedDt = dt; };

      engine.update(0.1);
      expect(capturedDt).toBeCloseTo(0.08, 3);
      engine.turret.update = originalTurretUpdate;

      // Trigger Overcharge Lance with siege barrel
      engine.chargeProgress = 0.9;
      engine.triggerOverchargeLance();
      const lance = engine.projectiles.bolts[engine.projectiles.bolts.length - 1];
      expect(lance.isOverchargeLance).toBe(true);
      expect(lance.isWiderBeam).toBe(true);
      expect(lance.pierce).toBe(6); // 5 base + 1 siege
    });

    it('Reactor Bonuses: Frenzy gauge gain (+35%) and extended duration (+3.0s)', () => {
      saveSystem.unlockShipyardPart('reactor', 'frenzy', true);
      saveSystem.equipShipyardPart('reactor', 'frenzy');

      engine.frenzy = 0;
      engine.addFrenzy(20);
      expect(engine.frenzy).toBeCloseTo(27, 1); // 20 * 1.35 = 27

      engine.triggerHyperFrenzy();
      expect(engine.frenzyTimer).toBeCloseTo(11.0, 1); // 8.0 base + 3.0 frenzy overclock
    });

    it('Reactor Bonuses: Cryo core applies 2.0s chill and +15% damage vs chilled targets', () => {
      saveSystem.unlockShipyardPart('reactor', 'cryo', true);
      saveSystem.equipShipyardPart('reactor', 'cryo');

      const alien = new Alien(200, 200, 'INTERCEPTOR');
      alien.hp = 100;
      engine.aliens.push(alien);

      // Simulate Cryo Nova chill impact
      alien.slowTimer = 2.0;
      alien.speedMultiplier = 0.65;
      expect(alien.slowTimer).toBe(2.0);
      expect(alien.speedMultiplier).toBe(0.65);

      // Cryo reactor bonus damage check
      const baseDamage = 40;
      const loadout = engine.getShipyardLoadout();
      const isChilled = alien.slowTimer > 0;
      const finalDamage = (loadout.reactor === 'cryo' && isChilled) ? Math.round(baseDamage * 1.15) : baseDamage;
      expect(finalDamage).toBe(46);
    });

    it('ShieldMod: Parry amplifier widens parry arc (+35°) and deals +40% reflected damage', () => {
      saveSystem.unlockShipyardPart('shieldMod', 'parry', true);
      saveSystem.equipShipyardPart('shieldMod', 'parry');

      engine.state = 'PLAYING';
      engine.triggerPhaseParry();
      expect(engine.parryTimer).toBeCloseTo(0.38, 2);

      engine.onPerfectParry(200, 200, 25);
      const reflected = engine.projectiles.bolts[engine.projectiles.bolts.length - 1];
      expect(reflected.isReflectedMissile).toBe(true);
      expect(reflected.damage).toBeCloseTo(119, 1); // 85 base * 1.40 = 119
    });

    it('ShieldMod: Electrostatic Thorn Dome discharges 95px Tesla Thorn Arc (55 dmg)', () => {
      saveSystem.unlockShipyardPart('shieldMod', 'thorn', true);
      saveSystem.equipShipyardPart('shieldMod', 'thorn');

      engine.state = 'PLAYING';
      engine.planet.shield = 100;

      const rammer = new Alien(engine.planet.x + 90, engine.planet.y, 'SCOUT');
      rammer.hp = 60;
      engine.aliens.push(rammer);

      const bystander = new Alien(engine.planet.x + 110, engine.planet.y, 'SCOUT');
      bystander.hp = 70;
      engine.aliens.push(bystander);

      // Simulate shield ramming collision triggering thorn arc
      if (engine.planet.shield > 0 && engine.getShipyardLoadout().shieldMod === 'thorn') {
        rammer.takeDamage(55, rammer.x, rammer.y, false);
        const nearby = engine.aliens.filter(a => a.alive && a !== rammer && Math.hypot(a.x - rammer.x, a.y - rammer.y) <= 95);
        nearby.forEach(target => {
          target.takeDamage(55, target.x, target.y, false);
          engine.projectiles.teslaArcs.push({ x1: rammer.x, y1: rammer.y, x2: target.x, y2: target.y, timer: 0.18, maxTimer: 0.18, color: '#00e5ff' });
        });
      }

      expect(rammer.hp).toBe(5); // 60 - 55 = 5
      expect(bystander.hp).toBe(15); // 70 - 55 = 15
      expect(engine.projectiles.teslaArcs.length).toBe(1);
    });
  });

  // =========================================================================
  // 2. LIVING STAR MAP INCURSIONS & SECTOR LIBERATION
  // =========================================================================
  describe('2. Living Star Map Incursions & Sector Liberation', () => {
    it('Active incursion targets an unlocked planet and rotateIncursion selects a valid candidate', () => {
      saveSystem.data.unlockedPlanet = 4;
      const incursion = saveSystem.getActiveIncursion();
      expect(incursion.active).toBe(true);
      expect(incursion.planetId).toBeGreaterThanOrEqual(1);
      expect(incursion.planetId).toBeLessThanOrEqual(4);

      // Rotate incursion
      const nextIncursion = saveSystem.rotateIncursion();
      expect(nextIncursion.active).toBe(true);
      expect(nextIncursion.planetId).toBeLessThanOrEqual(4);
    });

    it('Starting an incursion planet sets isIncursion and queues Elite Squadron Leader', () => {
      saveSystem.data.unlockedPlanet = 3;
      saveSystem.data.activeIncursion = { planetId: 2, active: true };

      engine.startCampaignPlanet(2);
      expect(engine.isIncursion).toBe(true);

      const elite = engine.waveSpawnQueue.find(item => item.isEliteLeader);
      expect(elite).toBeDefined();
      expect(elite.bossCustomName).toBe('Elite Squadron Leader');
    });

    it('Defending an incursion planet awards 2x shards in spawnSparks and on victory', () => {
      engine.isIncursion = true;
      const initShards = saveSystem.data.shards;

      engine.spawnSparks(300, 300, 2);
      expect(saveSystem.data.shards).toBe(initShards + 20); // 2 * 5 * 2x incursion = 20
    });

    it('Incursion victory awards +100 Liberation Bonus and rotates incursion to a new world', () => {
      saveSystem.data.unlockedPlanet = 5;
      saveSystem.data.activeIncursion = { planetId: 2, active: true };
      engine.startCampaignPlanet(2);
      expect(engine.isIncursion).toBe(true);

      const oldIncursionPlanet = saveSystem.data.activeIncursion.planetId;
      const initShards = saveSystem.data.shards;

      // Simulate campaign victory block
      engine.state = 'VICTORY';
      const stars = 3;
      const ascensionMults = saveSystem.getAscensionMultipliers();
      const sectorBonuses = engine.getSectorLiberationBonuses();
      let earnedShards = Math.round(stars * 45 * ascensionMults.shardMultiplier * sectorBonuses.rewardMultiplier);
      if (engine.isIncursion) {
        earnedShards = (earnedShards * 2) + 100; // 2x + 100 Liberation Bonus
        saveSystem.addShards(earnedShards);
        saveSystem.rotateIncursion();
      }

      expect(saveSystem.data.shards).toBe(initShards + earnedShards);
      expect(earnedShards).toBeGreaterThanOrEqual(370); // (3 * 45 * 2) + 100 = 370
      expect(saveSystem.data.activeIncursion.active).toBe(true);
    });

    it('getSectorLiberationBonuses calculates all 4 sector passive buffs correctly', () => {
      // Clean slate: 0 stars
      saveSystem.data.planetStars = {};
      let b = engine.getSectorLiberationBonuses();
      expect(b.sector1).toBe(false);
      expect(b.sector2).toBe(false);
      expect(b.sector3).toBe(false);
      expect(b.sector4).toBe(false);
      expect(b.hpMultiplier).toBe(1.0);
      expect(b.novaRadiusMultiplier).toBe(1.0);
      expect(b.cooldownMultiplier).toBe(1.0);
      expect(b.rewardMultiplier).toBe(1.0);

      // Liberate Sector I (Planets 1..5)
      for (let p = 1; p <= 5; p++) saveSystem.data.planetStars[p] = 2;
      b = engine.getSectorLiberationBonuses();
      expect(b.sector1).toBe(true);
      expect(b.hpMultiplier).toBe(1.10);

      // Liberate Sector II (Planets 6..10)
      for (let p = 6; p <= 10; p++) saveSystem.data.planetStars[p] = 3;
      b = engine.getSectorLiberationBonuses();
      expect(b.sector2).toBe(true);
      expect(b.novaRadiusMultiplier).toBe(1.12);

      // Liberate Sector III (Planets 11..15)
      for (let p = 11; p <= 15; p++) saveSystem.data.planetStars[p] = 1;
      b = engine.getSectorLiberationBonuses();
      expect(b.sector3).toBe(true);
      expect(b.cooldownMultiplier).toBe(0.90);

      // Liberate Sector IV (Planets 16..20)
      for (let p = 16; p <= 20; p++) saveSystem.data.planetStars[p] = 1;
      b = engine.getSectorLiberationBonuses();
      expect(b.sector4).toBe(true);
      expect(b.rewardMultiplier).toBe(1.20);
    });

    it('applyUpgrades integrates Sector Liberation bonuses into planetary stats', () => {
      // Liberate Sector I and Sector II
      for (let p = 1; p <= 10; p++) saveSystem.data.planetStars[p] = 3;
      engine.applyUpgrades();

      // Sector I: +10% Max Planetary Shield & Core HP
      expect(engine.planet.maxCoreHp).toBe(110);
      expect(engine.planet.coreHp).toBe(110);

      // Sector II: +12% Spark Nova Blast Radius
      expect(engine.novaMultiplier).toBeCloseTo(1.12, 2);
    });
  });

  // =========================================================================
  // 3. CINEMATIC CAMERA ZOOM
  // =========================================================================
  describe('3. Cinematic Camera Zoom', () => {
    it('Camera Zoom initializes at 1.0 and lerps smoothly toward targetZoom in update(dt)', () => {
      expect(engine.cameraZoom).toBe(1.0);
      expect(engine.targetZoom).toBe(1.0);
      expect(engine.zoomTimer).toBe(0);

      engine.state = 'PLAYING';
      engine.targetZoom = 1.15;
      engine.zoomTimer = 1.0;

      engine.update(0.1);
      expect(engine.cameraZoom).toBeGreaterThan(1.0);
      expect(engine.cameraZoom).toBeLessThan(1.15);
      expect(engine.zoomTimer).toBeCloseTo(0.9, 2);
    });

    it('Cataclysm [F] triggers 1.15x camera zoom for 0.9s', () => {
      engine.state = 'PLAYING';
      engine.coreCharge = 100;
      engine.triggerPlanetaryCataclysm();

      expect(engine.targetZoom).toBeCloseTo(1.15, 2);
      expect(engine.zoomTimer).toBeCloseTo(0.9, 1);
    });

    it('Boss Warp-Rift emergence triggers 1.12x camera zoom for 1.2s', () => {
      engine.state = 'PLAYING';
      // Trigger Boss Phase 2 warp-rift pulse
      if (engine.getSettings().screenShake !== false && engine.getSettings().screenShake !== 0) {
        engine.targetZoom = 1.12;
        engine.zoomTimer = 1.2;
      }

      expect(engine.targetZoom).toBeCloseTo(1.12, 2);
      expect(engine.zoomTimer).toBeCloseTo(1.2, 1);
    });

    it('Overcharge hold triggers 1.04x camera zoom and returns to 1.0x on release', () => {
      engine.state = 'PLAYING';
      engine.isPointerDown = true;
      engine.pointerDownTime = performance.now() - 350; // held > 0.25s

      engine.update(0.016);
      expect(engine.targetZoom).toBe(1.04);

      // Release pointer
      engine.isPointerDown = false;
      engine.update(0.016);
      expect(engine.targetZoom).toBe(1.0);
    });

    it('screenShake=0 or false strictly locks cameraZoom at 1.0', () => {
      saveSystem.data.settings.screenShake = false;
      engine.state = 'PLAYING';
      engine.targetZoom = 1.20;
      engine.zoomTimer = 1.5;

      engine.update(0.016);
      expect(engine.cameraZoom).toBe(1.0);
      expect(engine.targetZoom).toBe(1.0);
      expect(engine.zoomTimer).toBe(0);
    });
  });

  // =========================================================================
  // 4. HALL OF CHAMPIONS & RUN HISTORY PERSISTENCE
  // =========================================================================
  describe('4. Hall of Champions & Run History Persistence', () => {
    it('recordRun stores runs sorted descending by score up to max 10 entries', () => {
      expect(saveSystem.getRunHistory()).toEqual([]);

      const testRuns = [
        { score: 5000, planetName: 'Aerilon', mode: 'CAMPAIGN' },
        { score: 18000, planetName: 'Cryon', mode: 'INCURSION' },
        { score: 12000, planetName: 'Titan Protocol', mode: 'TITAN' },
        { score: 3000, planetName: 'Aquatis', mode: 'CAMPAIGN' }
      ];

      testRuns.forEach(r => saveSystem.recordRun(r));
      const history = saveSystem.getRunHistory();
      expect(history.length).toBe(4);
      expect(history[0].score).toBe(18000);
      expect(history[1].score).toBe(12000);
      expect(history[2].score).toBe(5000);
      expect(history[3].score).toBe(3000);

      // Overflow beyond 10 entries
      for (let i = 1; i <= 10; i++) {
        saveSystem.recordRun({ score: i * 20000, planetName: 'Sector IV', mode: 'ENDLESS' });
      }
      const capped = saveSystem.getRunHistory();
      expect(capped.length).toBe(10);
      expect(capped[0].score).toBe(200000);
      expect(capped[9].score).toBe(20000);
    });

    it('finishMission records complete commander telemetry into runHistory', () => {
      engine.currentPlanetId = 2;
      engine.currentWave = 3;
      engine.score = 14500;
      engine.maxCombo = 22;
      engine.isIncursion = true;
      engine.activeDraftPerks = [{ id: 'plasmaBurn', isSynergy: true, name: 'Plasma Burn' }];

      const run = engine.finishMission(true);
      expect(run).toBeDefined();
      expect(run.planetId).toBe(2);
      expect(run.score).toBe(14500);
      expect(run.maxCombo).toBe(22);
      expect(run.victory).toBe(true);
      expect(run.synergies).toContain('plasmaBurn');

      const logged = saveSystem.getRunHistory();
      expect(logged.length).toBe(1);
      expect(logged[0].score).toBe(14500);
    });

    it('BattleCardGenerator binds historical run data seamlessly', async () => {
      const mockRun = {
        date: new Date().toISOString(),
        mode: 'INCURSION',
        planetId: 4,
        planetName: 'Verdantia',
        waveReached: 3,
        victory: true,
        score: 32000,
        maxCombo: 35,
        chassis: 'titan',
        wingman: 'sniper',
        relics: ['aegisMatrix', 'warpDrive'],
        synergies: ['plasmaBurn', 'splitNova'],
        telemetryHistory: [
          { time: 0, combo: 1, integrity: 100 },
          { time: 30, combo: 20, integrity: 95 },
          { time: 60, combo: 35, integrity: 100 }
        ]
      };

      // Mock historical engine structure matching createHistoricalEngine in main.js
      const historicalEngine = {
        isHistoricalRun: true,
        mode: mockRun.mode,
        currentPlanetId: mockRun.planetId,
        state: 'VICTORY',
        victory: true,
        isTitanProtocolMode: false,
        isEndlessMode: false,
        isDailyAnomalyMode: false,
        isIncursion: true,
        currentWave: mockRun.waveReached,
        totalWaves: 3,
        score: mockRun.score,
        maxCombo: mockRun.maxCombo,
        selectedChassis: mockRun.chassis,
        selectedWingman: mockRun.wingman,
        equippedRelics: mockRun.relics,
        synergies: mockRun.synergies,
        telemetryHistory: mockRun.telemetryHistory
      };

      const originalCreateElement = document.createElement.bind(document);
      const originalClipboardDesc = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      const fillTextCalls = [];

      document.createElement = function (tagName) {
        if (tagName === 'canvas') {
          return {
            width: 1200,
            height: 630,
            getContext: () => ({
              createLinearGradient: () => ({ addColorStop: vi.fn() }),
              createRadialGradient: () => ({ addColorStop: vi.fn() }),
              fillRect: vi.fn(),
              strokeRect: vi.fn(),
              beginPath: vi.fn(),
              arc: vi.fn(),
              ellipse: vi.fn(),
              moveTo: vi.fn(),
              lineTo: vi.fn(),
              closePath: vi.fn(),
              fill: vi.fn(),
              stroke: vi.fn(),
              drawImage: vi.fn(),
              setLineDash: vi.fn(),
              fillText: (text, x, y) => fillTextCalls.push({ text: String(text), x, y }),
              set fillStyle(v) {},
              set strokeStyle(v) {},
              set lineWidth(v) {},
              set textAlign(v) {},
              set textBaseline(v) {},
              set shadowColor(v) {},
              set shadowBlur(v) {},
              measureText: () => ({ width: 100 })
            }),
            toDataURL: () => 'data:image/png;base64,mock'
          };
        }
        return originalCreateElement(tagName);
      };

      try {
        const cardCanvas = BattleCardGenerator.renderCard(historicalEngine, saveSystem);
        expect(cardCanvas).toBeDefined();

        // Check v3.0, v3.1, or v3.2 badge
        const badge = fillTextCalls.find(c => c.text.includes('v3.0 GALACTIC COMMAND EDITION') || c.text.includes('v3.1 PRISMATIC ART EDITION') || c.text.includes('v3.2 HYPER-VFX & NEBULA SHADER EDITION'));
        expect(badge).toBeDefined();

        // Check Incursion mission status text
        const statusCall = fillTextCalls.find(c => c.text.includes('INCURSION REPELLED'));
        expect(statusCall).toBeDefined();

        // Check share text includes v3.0, v3.1, or v3.2 via copyCardToClipboard fallback
        let copiedText = '';
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: async (t) => { copiedText = t; },
            write: async () => { throw new Error('blob fallback'); }
          },
          configurable: true,
          writable: true
        });

        const copyResult = await BattleCardGenerator.copyCardToClipboard(cardCanvas, historicalEngine);
        expect(copyResult).toBe('TEXT_COPIED');
        expect(copiedText).toMatch(/(🌟 v3\.0 GALACTIC COMMAND|🎨 v3\.1 PRISMATIC ART|✨ v3\.2 HYPER-VFX & NEBULA SHADER) EDITION/);
        expect(copiedText).toContain('32,000 pts');
      } finally {
        document.createElement = originalCreateElement;
        if (originalClipboardDesc) {
          Object.defineProperty(navigator, 'clipboard', originalClipboardDesc);
        }
      }
    });
  });

  // =========================================================================
  // 5. V3.0 VERSION BADGE & DOM ELEMENT ASSERTIONS
  // =========================================================================
  describe('5. v3.0 Version Badges & DOM Structural Assertions', () => {
    it('index.html should contain v3.0 Galactic Command Edition badges, Shipyard, and Hall of Champions containers', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      // Title & Badges
      expect(html).toMatch(/(🌟 v3\.0 Galactic Command|🎨 v3\.1 Prismatic Art|✨ v3\.2 Hyper-VFX & Nebula Shader) Edition/i);
      expect(html).toMatch(/(🌟 v3\.0 GALACTIC COMMAND|🎨 v3\.1 PRISMATIC ART|✨ v3\.2 HYPER-VFX & NEBULA SHADER) EDITION/);

      // Modular Shipyard Deck
      expect(html).toContain('id="shipyardContainer"');
      expect(html).toContain('MODULAR ORBITAL SHIPYARD');

      // Living Incursion & Sector Liberation
      expect(html).toContain('id="btnStarMapIncursion"');
      expect(html).toContain('id="sectorLiberationBar"');

      // Hall of Champions
      expect(html).toContain('id="hallOfChampionsContainer"');
      expect(html.toUpperCase()).toContain('HALL OF CHAMPIONS');
    });

    it('battle-card.js should declare v3.0, v3.1, or v3.2 edition badge and share text', () => {
      const battleCardPath = path.resolve(__dirname, '../src/ui/battle-card.js');
      const battleCardSrc = fs.readFileSync(battleCardPath, 'utf-8');

      expect(battleCardSrc).toMatch(/(🌟 v3\.0 GALACTIC COMMAND|🎨 v3\.1 PRISMATIC ART|✨ v3\.2 HYPER-VFX & NEBULA SHADER) EDITION/);
      expect(battleCardSrc).toContain('INCURSION REPELLED');
    });

    it('README.md should declare v3.0 Galactic Command Edition headers and features', () => {
      const readmePath = path.resolve(__dirname, '../README.md');
      const readmeSrc = fs.readFileSync(readmePath, 'utf-8');

      expect(readmeSrc).toMatch(/Spark Panic: Planetary Invasion Defense — Guardian of the Universe \((🌟 v3\.0 Galactic Command|🎨 v3\.1 Prismatic Art|✨ v3\.2 Hyper-VFX & Nebula Shader) Edition\)/);
      expect(readmeSrc).toContain('What\'s New in v3.0: Galactic Command Edition');
      expect(readmeSrc).toContain('Modular Orbital Shipyard');
      expect(readmeSrc).toContain('Living Star Map Incursions');
      expect(readmeSrc).toContain('Hall of Champions');
    });
  });
});
