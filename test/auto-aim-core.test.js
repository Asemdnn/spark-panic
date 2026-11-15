// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuardianTurret } from '../src/game/turret.js';
import { GameEngine } from '../src/game/engine.js';
import { Alien } from '../src/game/alien.js';
import { storage } from '../src/engine/storage.js';

describe('Auto-Aim Targeting System (v3.2 Core Suite)', () => {
  describe('1. GuardianTurret Auto-Aim Properties & Angle Override Tracking', () => {
    let turret;

    beforeEach(() => {
      turret = new GuardianTurret();
    });

    it('should initialize with autoAim = true by default', () => {
      expect(turret.autoAim).toBe(true);
      expect(turret.autoFire).toBe(true);
    });

    it('should smoothly rotate toward targetAngleOverride number when autoAim is enabled', () => {
      // Planet at (400, 300), pointer at (400, 100) -> pointer angle is -PI/2
      // targetAngleOverride is 0 (rightward)
      turret.angle = -Math.PI / 2;
      turret.update(
        1.0,
        400,
        100,
        400,
        300,
        false,
        null,
        false,
        false,
        0 // targetAngleOverride
      );
      expect(turret.angle).toBeCloseTo(0, 0.4);
    });

    it('should accept targetAngleOverride as an object with { angle } or { x, y }', () => {
      turret.angle = -Math.PI / 2;
      // Object with angle
      turret.update(
        1.0,
        400,
        100,
        400,
        300,
        false,
        null,
        false,
        false,
        { angle: Math.PI / 2 } // downward
      );
      expect(turret.angle).toBeCloseTo(Math.PI / 2, 0.4);

      // Object with x, y coordinates (right of planet)
      turret.update(
        1.0,
        400,
        100,
        400,
        300,
        false,
        null,
        false,
        false,
        { x: 500, y: 300 }
      );
      expect(turret.angle).toBeCloseTo(0, 0.4);
    });

    it('should accept autoAimTarget via 11th parameter when targetAngleOverride is null', () => {
      turret.angle = -Math.PI / 2;
      turret.update(
        1.0,
        400,
        100,
        400,
        300,
        false,
        null,
        false,
        false,
        null,
        { angle: 0, x: 500, y: 300 }
      );
      expect(turret.angle).toBeCloseTo(0, 0.4);
    });

    it('should fall back to manual pointer angle when targetAngleOverride is null', () => {
      turret.angle = -Math.PI / 2;
      // Pointer at (500, 300) -> angle 0
      turret.update(1.0, 500, 300, 400, 300, false);
      expect(turret.angle).toBeCloseTo(0, 0.4);
    });

    it('should ignore targetAngleOverride when autoAim is disabled (full manual aiming backward compatibility)', () => {
      turret.autoAim = false;
      turret.angle = -Math.PI / 2;
      // Pointer at (400, 100) -> angle -PI/2
      // targetAngleOverride is 0 (rightward)
      turret.update(
        1.0,
        400,
        100,
        400,
        300,
        false,
        null,
        false,
        false,
        0
      );
      // Because autoAim is false, it tracks the pointer (-PI/2), NOT the override (0)
      expect(turret.angle).toBeCloseTo(-Math.PI / 2, 0.1);
    });

    it('should preserve getDamage, level scaling, and plasma bolt firing', () => {
      expect(turret.getDamage(false)).toBe(12);
      turret.setUpgradeLevel(3);
      expect(turret.getDamage(false)).toBe(12 + 3 * 4.5);
      expect(turret.getDamage(true)).toBe((12 + 3 * 4.5) * 1.5);
    });
  });

  describe('2. GameEngine.findBestAutoAimTarget() Priority Scanning', () => {
    let engine;
    let mockCanvas;

    beforeEach(() => {
      storage.resetAll();
      mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => ({
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          scale: vi.fn(),
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          setLineDash: vi.fn(),
          setTransform: vi.fn(),
          createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
          createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
        }))
      };
      engine = new GameEngine(mockCanvas);
      engine.startMission(1, false);
    });

    it('should return null when no threats exist on screen', () => {
      engine.aliens = [];
      engine.projectiles.torpedoes = [];
      expect(engine.findBestAutoAimTarget()).toBeNull();
    });

    it('should ignore dead aliens and dead torpedoes', () => {
      engine.aliens = [
        { alive: false, x: 450, y: 300, classKey: 'SCOUT' }
      ];
      engine.projectiles.torpedoes = [
        { alive: false, x: 420, y: 300 }
      ];
      expect(engine.findBestAutoAimTarget()).toBeNull();
    });

    it('Priority 1: should prioritize incoming torpedoes within danger distance (d <= 220px) over closer alien ships', () => {
      // Planet at (400, 300)
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Alien at distance 150px (d = 150)
      engine.aliens = [
        { alive: true, x: px + 150, y: py, classKey: 'SCOUT' }
      ];

      // Torpedo at distance 190px (d <= 220)
      engine.projectiles.torpedoes = [
        { alive: true, x: px, y: py - 190 }
      ];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px);
      expect(target.y).toBe(py - 190);
      expect(target.dist).toBeCloseTo(190, 1);
    });

    it('Priority 1: should choose the closest torpedo when multiple incoming torpedoes are within d <= 220px', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      engine.projectiles.torpedoes = [
        { alive: true, x: px + 210, y: py }, // d = 210
        { alive: true, x: px, y: py + 140 }, // d = 140 (closest danger!)
        { alive: true, x: px - 180, y: py }  // d = 180
      ];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px);
      expect(target.y).toBe(py + 140);
      expect(target.dist).toBeCloseTo(140, 1);
    });

    it('Priority 1: should NOT prioritize torpedoes outside danger distance (d > 220px) over alien ships', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Torpedo at d = 260px (outside danger radius)
      engine.projectiles.torpedoes = [
        { alive: true, x: px + 260, y: py }
      ];

      // Alien at d = 200px
      engine.aliens = [
        { alive: true, x: px, y: py - 200, classKey: 'SCOUT' }
      ];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px);
      expect(target.y).toBe(py - 200);
    });

    it('Priority 2: should target active boss weak-spot when weakSpotExposedTimer > 0', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const boss = new Alien(px + 240, py, 'BOSS');
      boss.alive = true;
      boss.heading = 0;
      boss.weakSpotAngle = 0;
      boss.weakSpotExposedTimer = 2.0; // Exposed!
      engine.aliens = [boss];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      const expectedWsX = boss.x + boss.radius * 0.85;
      expect(target.x).toBeCloseTo(expectedWsX, 1);
      expect(target.y).toBeCloseTo(boss.y, 1);
    });

    it('Priority 2: should target alive boss subsystems when weak-spot is not exposed', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const boss = new Alien(px + 240, py, 'BOSS');
      boss.alive = true;
      boss.weakSpotExposedTimer = 0; // Not exposed
      expect(boss.subsystems).toBeDefined();
      expect(boss.subsystems.length).toBeGreaterThan(0);

      engine.aliens = [boss];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      // Target should match one of the alive subsystems, not boss center
      const matchesSub = boss.subsystems.some(
        s => Math.hypot(target.x - s.x, target.y - s.y) < 5
      );
      expect(matchesSub).toBe(true);
    });

    it('Priority 2: should target boss center when weak-spot is not exposed and all subsystems are destroyed', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const boss = new Alien(px + 240, py, 'BOSS');
      boss.alive = true;
      boss.weakSpotExposedTimer = 0;
      for (const s of boss.subsystems) {
        s.alive = false;
        s.destroyed = true;
      }

      engine.aliens = [boss];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(boss.x);
      expect(target.y).toBe(boss.y);
    });

    it('Priority 3: should prioritize dangerous heavy ships (Leech pods latching on cities, Jammers, Dreadnoughts) over normal aliens', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Closer scout at d = 160px
      const scout = new Alien(px + 160, py, 'SCOUT');
      // Dreadnought further out at d = 260px
      const dread = new Alien(px, py - 260, 'DREADNOUGHT');

      engine.aliens = [scout, dread];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(dread.x);
      expect(target.y).toBe(dread.y);
    });

    it('Priority 3: should prioritize latched Leech pods on cities above all heavy threats', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const jammer = new Alien(px + 220, py, 'JAMMER');
      const leech = new Alien(px, py + 85, 'LEECH');
      leech.latched = true; // Siphoning city!

      engine.aliens = [jammer, leech];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(leech.x);
      expect(target.y).toBe(leech.y);
    });

    it('Priority 4: should target nearest alien to planet when only regular aliens exist', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const farScout = new Alien(px + 280, py, 'SCOUT');
      const nearScout = new Alien(px, py - 130, 'SCOUT'); // Closer!

      engine.aliens = [farScout, nearScout];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(nearScout.x);
      expect(target.y).toBe(nearScout.y);
      expect(target.dist).toBeCloseTo(130, 1);
    });
  });

  describe('3. Engine Update Loop Integration & Overcharge Lock', () => {
    let engine;
    let mockCanvas;

    beforeEach(() => {
      storage.resetAll();
      mockCanvas = {
        width: 800,
        height: 600,
        getContext: vi.fn(() => ({
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          scale: vi.fn(),
          beginPath: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          setLineDash: vi.fn(),
          setTransform: vi.fn(),
          createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
          createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
        }))
      };
      engine = new GameEngine(mockCanvas);
      engine.startMission(1, false);
    });

    it('should automatically sync pointerX, pointerY and turret targetAngle to best target during update', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const scout = new Alien(px + 200, py, 'SCOUT');
      scout.speed = 0; // Stationary target for precise coordinate matching
      engine.aliens = [scout];

      // Update one frame
      engine.update(0.016);

      expect(engine.pointerX).toBe(scout.x);
      expect(engine.pointerY).toBe(scout.y);
      expect(engine.turret.targetAngle).toBeCloseTo(0, 0.1);
    });

    it('should lock turret.angle directly to target.angle when charging Overcharge Lance', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const scout = new Alien(px, py - 200, 'SCOUT'); // angle -PI/2
      engine.aliens = [scout];

      engine.isChargingOvercharge = true;
      engine.update(0.016);

      expect(engine.turret.angle).toBeCloseTo(-Math.PI / 2, 0.1);
    });

    it('should advance tutorial step 1 when autoAim acquires target or timer elapses', () => {
      engine.startTutorial();
      expect(engine.isTutorialActive).toBe(true);
      expect(engine.tutorialStep).toBe(1);

      const px = engine.planet.x;
      const py = engine.planet.y;
      const scout = new Alien(px + 150, py, 'SCOUT');
      engine.aliens = [scout];

      engine.update(0.016);

      // Should automatically advance to Step 2
      expect(engine.tutorialStep).toBe(2);
    });

    it('should preserve manual pointer coordinates and manual aiming when turret.autoAim is false', () => {
      engine.turret.autoAim = false;

      const px = engine.planet.x;
      const py = engine.planet.y;
      const scout = new Alien(px + 250, py, 'SCOUT');
      engine.aliens = [scout];

      engine.pointerX = 123;
      engine.pointerY = 456;

      engine.update(0.016);

      // pointerX and pointerY should NOT be overwritten by auto-aim!
      expect(engine.pointerX).toBe(123);
      expect(engine.pointerY).toBe(456);
      const expectedAngle = Math.atan2(456 - py, 123 - px);
      expect(engine.turret.targetAngle).toBeCloseTo(expectedAngle, 0.1);
    });
  });
});
