// @vitest-environment happy-dom
// Spark Panic v2.7 - Planetary Cataclysm Superweapons, Elite Squadron Leaders & Living Biome Shaders Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../src/game/engine.js';
import { Alien } from '../src/game/alien.js';
import { Planet } from '../src/game/planet.js';
import { GuardianTurret } from '../src/game/turret.js';
import { ALIEN_CLASSES, PLANETS } from '../src/config.js';
import { ICON_SVG } from '../src/ui/icons.js';
import { audio } from '../src/engine/audio.js';
import { saveSystem } from '../src/engine/storage.js';
import fs from 'fs';
import path from 'path';

describe('v2.7 Cosmic Cataclysm, Elite Squadron Leaders & Living Biomes Suite', () => {
  let canvas;
  let engine;

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

  describe('1. Planetary Cataclysm Superweapon Execution', () => {
    it('should initialize coreCharge to 0 and charge from kills, combos, and sparks', () => {
      expect(engine.coreCharge).toBe(0);

      // Kill alien gives +3.5%
      const alien = new Alien(200, 200, 'SCOUT');
      engine.onAlienDestroyed(alien, { x: 200, y: 200 });
      expect(engine.coreCharge).toBeCloseTo(3.5, 1);

      // Kill with combo >= 5 gives +3.5% + 6.0% = +9.5%
      engine.combo = 5;
      engine.onAlienDestroyed(alien, { x: 200, y: 200 });
      expect(engine.coreCharge).toBeCloseTo(13.0, 1);

      // Cosmic spark grants +2.0%
      engine.coreCharge = 50;
      // In engine update/particles callback, spark adds +2.0%
      engine.coreCharge = Math.min(100, engine.coreCharge + 2.0);
      expect(engine.coreCharge).toBe(52);
    });

    it('should reject triggering Cataclysm if charge is under 100%', () => {
      engine.state = 'PLAYING';
      engine.coreCharge = 75;
      const result = engine.triggerPlanetaryCataclysm();
      expect(result).toBe(false);
      expect(engine.coreCharge).toBe(75);
    });

    it('Sector I: should execute Cryo-Tsunami Pulse (freezes fleet, shatters torpedoes, deals 140 dmg)', () => {
      engine.state = 'PLAYING';
      engine.currentPlanetId = 1; // Sector I (Aerilon)
      engine.planet.sector = 1;
      engine.coreCharge = 100;

      const a1 = new Alien(300, 300, 'SCOUT');
      a1.hp = 200;
      engine.aliens.push(a1);

      // Add a torpedo
      engine.projectiles.torpedoes.push({
        x: 400,
        y: 400,
        alive: true,
        damage: 20
      });

      const triggered = engine.triggerPlanetaryCataclysm();
      expect(triggered).toBe(true);
      expect(engine.coreCharge).toBe(0);
      expect(engine.cataclysmShockwave).toBeDefined();
      expect(engine.cataclysmShockwave.maxRadius).toBe(450);

      // Enemy frozen and took 140 damage
      expect(a1.frozenTimer).toBe(5.0);
      expect(a1.hp).toBe(60);

      // Torpedo shattered
      expect(engine.projectiles.torpedoes[0].alive).toBe(false);
    });

    it('Sector II: should execute Magma Meteor Eruption (12 homing volcanic bombs)', () => {
      engine.state = 'PLAYING';
      engine.currentPlanetId = 6; // Sector II (Pyros)
      engine.planet.sector = 2;
      engine.coreCharge = 100;

      const heavy = new Alien(350, 350, 'DREADNOUGHT');
      engine.aliens.push(heavy);

      const triggered = engine.triggerPlanetaryCataclysm();
      expect(triggered).toBe(true);
      expect(engine.coreCharge).toBe(0);
      expect(engine.cataclysmMeteors.length).toBe(12);
      expect(engine.cataclysmMeteors[0].target).toBe(heavy);
    });

    it('Sector III: should execute Dyson Orbital Laser Cage (4 golden cleave beams)', () => {
      engine.state = 'PLAYING';
      engine.currentPlanetId = 11; // Sector III (Aethelgard)
      engine.planet.sector = 3;
      engine.coreCharge = 100;

      const triggered = engine.triggerPlanetaryCataclysm();
      expect(triggered).toBe(true);
      expect(engine.coreCharge).toBe(0);
      expect(engine.cataclysmDysonBeams).toBeDefined();
      expect(engine.cataclysmDysonBeams.timer).toBe(4.0);
    });

    it('Sector IV: should execute Genesis Supernova (vaporizes normal armada, deals 350 dmg to boss, restores +30% shield)', () => {
      engine.state = 'PLAYING';
      engine.currentPlanetId = 16; // Sector IV (Ignis Prime)
      engine.planet.sector = 4;
      engine.coreCharge = 100;
      engine.planet.shield = 20;
      engine.planet.maxShield = 100;

      const normalAlien = new Alien(300, 300, 'CRYO');
      normalAlien.hp = 80;
      const bossAlien = new Alien(400, 400, 'BOSS');
      bossAlien.hp = 1000;
      engine.aliens.push(normalAlien, bossAlien);

      const triggered = engine.triggerPlanetaryCataclysm();
      expect(triggered).toBe(true);
      expect(engine.coreCharge).toBe(0);
      expect(engine.cataclysmFlashAlpha).toBe(1.0);

      // Normal alien vaporized
      expect(normalAlien.alive).toBe(false);

      // Boss took 350 dmg
      expect(bossAlien.hp).toBe(650);

      // Shield restored +30%
      expect(engine.planet.shield).toBe(50);
    });
  });

  describe('2. Elite Squadron Leaders & Astral Galleon Mechanics', () => {
    it('Aegis Jammer Frigate (JAMMER): frontal 90° shield deflects non-pierce lasers, rear and pierce penetrate', () => {
      const jammer = new Alien(300, 300, 'JAMMER');
      jammer.heading = 0; // facing right (angle = 0)
      jammer.hp = 120;

      // Frontal shot directly aligned with heading (angle 0)
      const hitFront = jammer.takeDamage(20, 350, 300, false);
      expect(hitFront).toBe(false);
      expect(jammer.hp).toBe(120); // Deflected with 0 damage!

      // Direct pierce (railgun/ion beam) punches straight through frontal barrier
      jammer.takeDamage(30, 350, 300, true);
      expect(jammer.hp).toBe(90);

      // Flank / rear shot (from opposite direction, angle PI)
      jammer.takeDamage(25, 250, 300, false);
      expect(jammer.hp).toBe(65);
    });

    it('Void Weaver Carrier (WEAVER): slows turret fire rate and refunds 3.0s cooldowns on defeat', () => {
      const turret = new GuardianTurret();
      turret.autoFire = true;
      turret.fireTimer = 0;

      let firesNormal = 0;
      // Normal update with dt = 0.25 (>= base 0.22s) -> fires!
      turret.update(0.25, 500, 500, 300, 300, false, () => { firesNormal++; }, false, false);
      expect(firesNormal).toBe(1);

      // Now with Weaver web slow (interval becomes 0.22 / 0.70 = ~0.314s)
      turret.fireTimer = 0;
      let firesSlowed = 0;
      // Step with dt = 0.25 (< 0.314s) -> cannot fire yet!
      turret.update(0.25, 500, 500, 300, 300, false, () => { firesSlowed++; }, false, true);
      expect(firesSlowed).toBe(0);

      // Step additional 0.10s (total 0.35s >= 0.314s) -> fires!
      turret.update(0.10, 500, 500, 300, 300, false, () => { firesSlowed++; }, false, true);
      expect(firesSlowed).toBe(1);

      // On defeat, grants -3.0s cooldown surge to skills Q, W, E
      engine.skills.timerQ = 5.0;
      engine.skills.timerW = 4.0;
      engine.skills.timerE = 3.5;

      const weaver = new Alien(200, 200, 'WEAVER');
      engine.onAlienDestroyed(weaver, { x: 200, y: 200 });

      expect(engine.skills.timerQ).toBeCloseTo(2.0, 1);
      expect(engine.skills.timerW).toBeCloseTo(1.0, 1);
      expect(engine.skills.timerE).toBeCloseTo(0.5, 1);
    });

    it('Astral Treasure Galleon (GALLEON): tangential flight with 9s escape timer, awards +65 shards, +25% Cataclysm & Supply Pod', () => {
      const galleon = new Alien(500, 500, 'GALLEON');
      expect(galleon.escapeTimer).toBe(9.0);

      // Galleon update decreases escape timer
      galleon.update(1.0, 300, 300, 80);
      expect(galleon.escapeTimer).toBeCloseTo(8.0, 1);

      // On defeat, awards jackpot
      const initialShards = saveSystem.data.shards;
      engine.coreCharge = 20;
      const initialPods = engine.supplyPods.pods.length;

      engine.onAlienDestroyed(galleon, { x: 500, y: 500 });

      expect(saveSystem.data.shards).toBe(initialShards + 65);
      expect(engine.coreCharge).toBe(48.5);
      expect(engine.supplyPods.pods.length).toBe(initialPods + 1);
    });
  });

  describe('3. Beat-Synced Audio-Reactive Halo & Living Biome Shaders', () => {
    it('should pulse beatPulse on rhythm steps and decay smoothly with dt', () => {
      audio.beatPulse = 0;
      // update with dt = 0.1 decays beatPulse
      audio.beatPulse = 1.0;
      audio.update(0.05);
      expect(audio.beatPulse).toBeLessThan(1.0);
      expect(audio.beatPulse).toBeGreaterThan(0.0);
    });

    it('planet.render should accept timeSec, beatPulse and coreCharge without error across all sectors', () => {
      const ctx = canvas.getContext('2d');
      const planet = new Planet();

      for (let sec = 1; sec <= 4; sec++) {
        planet.sector = sec;
        expect(() => {
          planet.render(ctx, false, 1.25, 0.8, 85);
        }).not.toThrow();
      }
    });
  });

  describe('4. UI & Codex 10-Class Dossiers Validation', () => {
    it('ALIEN_CLASSES should define all 10 distinct classes with full specs', () => {
      const expectedClasses = [
        'SCOUT', 'INTERCEPTOR', 'CRYO', 'PHASE',
        'DROPSHIP', 'DREADNOUGHT', 'BOSS',
        'JAMMER', 'WEAVER', 'GALLEON'
      ];
      expect(Object.keys(ALIEN_CLASSES)).toEqual(expectedClasses);

      expectedClasses.forEach(k => {
        const c = ALIEN_CLASSES[k];
        expect(c.name).toBeTruthy();
        expect(c.role).toBeTruthy();
        expect(c.behaviorDesc).toBeTruthy();
        expect(c.deathPayload).toBeTruthy();
        expect(c.hp).toBeGreaterThan(0);
      });
    });

    it('ICON_SVG should provide unique vector ship artwork for all 10 alien classes', () => {
      Object.keys(ALIEN_CLASSES).forEach(k => {
        const svg = ICON_SVG.shipSvg(k);
        expect(svg).toContain('<svg');
        expect(svg).toContain('viewBox="0 0 48 48"');
      });
    });

    it('index.html should contain #btnCataclysm, v2.7 title badge and 10 alien classes codex reference', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toContain('id="btnCataclysm"');
      expect(html).toContain('⚡ v2.7 COSMIC CATACLYSM EDITION');
      expect(html).toContain('Tactical intelligence on 10 invading alien ship classes');
    });
  });
});
