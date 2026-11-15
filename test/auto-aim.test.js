// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuardianTurret } from '../src/game/turret.js';
import { GameEngine } from '../src/game/engine.js';
import { Alien } from '../src/game/alien.js';
import { saveSystem, SaveSystem } from '../src/engine/storage.js';
import { DEFAULT_SETTINGS } from '../src/config.js';

describe('Auto-Aim System Verification Suite', () => {
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    saveSystem.resetAll();

    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      closePath: vi.fn(),
      clip: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      measureText: vi.fn(() => ({ width: 60 }))
    };

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx)
    };
  });

  describe('1. Turret Auto-Aim Initialization', () => {
    it('should initialize turret.autoAim to true by default', () => {
      const turret = new GuardianTurret();
      expect(turret.autoAim).toBe(true);
      expect(turret.autoFire).toBe(true);
    });

    it('should initialize GameEngine turret with autoAim = true', () => {
      const engine = new GameEngine(mockCanvas);
      expect(engine.turret).toBeDefined();
      expect(engine.turret.autoAim).toBe(true);
    });
  });

  describe('2. findBestAutoAimTarget Priority Logic', () => {
    let engine;

    beforeEach(() => {
      engine = new GameEngine(mockCanvas);
      engine.startMission(1, false);
      engine.aliens = [];
      engine.projectiles.torpedoes = [];
    });

    it('returns null when no targets or only dead threats exist', () => {
      expect(engine.findBestAutoAimTarget()).toBeNull();

      engine.aliens = [{ alive: false, x: 500, y: 300, classKey: 'SCOUT' }];
      engine.projectiles.torpedoes = [{ alive: false, x: 450, y: 300 }];
      expect(engine.findBestAutoAimTarget()).toBeNull();
    });

    it('Priority 1: targets incoming torpedo within danger distance (d <= 220px) over closer alien ships', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Alien at distance 150px
      engine.aliens = [
        { alive: true, x: px + 150, y: py, classKey: 'SCOUT' }
      ];

      // Torpedo at danger distance (d = 190px <= 220px)
      engine.projectiles.torpedoes = [
        { alive: true, x: px, y: py - 190 }
      ];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px);
      expect(target.y).toBe(py - 190);
      expect(target.dist).toBeCloseTo(190, 1);
    });

    it('Priority 1: chooses closest torpedo among multiple near torpedoes (d <= 220px)', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      engine.projectiles.torpedoes = [
        { alive: true, x: px + 210, y: py }, // dist 210
        { alive: true, x: px, y: py + 120 }, // dist 120 (closest danger!)
        { alive: true, x: px - 190, y: py }  // dist 190
      ];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px);
      expect(target.y).toBe(py + 120);
      expect(target.dist).toBeCloseTo(120, 1);
    });

    it('Priority 2: targets active boss exposed weak-spot when weakSpotExposedTimer > 0', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const boss = new Alien(px + 250, py, 'BOSS');
      boss.alive = true;
      boss.weakSpotExposedTimer = 3.0; // Exposed!
      boss.weakSpot = { x: px + 280, y: py };
      engine.aliens = [boss];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px + 280);
      expect(target.y).toBe(py);
    });

    it('Priority 2: targets boss subsystem if weak-spot is unexposed and subsystems are alive', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const boss = new Alien(px + 250, py, 'BOSS');
      boss.alive = true;
      boss.weakSpotExposedTimer = 0;
      expect(boss.subsystems.length).toBeGreaterThan(0);

      engine.aliens = [boss];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      const matchesSub = boss.subsystems.some(
        s => Math.hypot(target.x - s.x, target.y - s.y) < 5
      );
      expect(matchesSub).toBe(true);
    });

    it('Priority 2: targets boss center if weak-spot unexposed and all subsystems destroyed', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const boss = new Alien(px + 250, py, 'BOSS');
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

    it('Priority 3: targets dangerous heavy aliens (Latched Leech, Jammer, Dreadnought) over regular aliens', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const nearScout = new Alien(px + 140, py, 'SCOUT'); // closer regular alien
      const dreadnought = new Alien(px, py - 240, 'DREADNOUGHT'); // further heavy ship

      engine.aliens = [nearScout, dreadnought];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(dreadnought.x);
      expect(target.y).toBe(dreadnought.y);
    });

    it('Priority 3: targets latched Leech pods siphoning cities ahead of Jammers and Dreadnoughts', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const jammer = new Alien(px + 200, py, 'JAMMER');
      const leech = new Alien(px, py + 85, 'LEECH');
      leech.latched = true; // Siphoning city

      engine.aliens = [jammer, leech];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(leech.x);
      expect(target.y).toBe(leech.y);
    });

    it('Priority 4: targets nearest alien ship to planet when no torpedoes or heavy threats exist', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const farScout = new Alien(px + 300, py, 'SCOUT');
      const nearScout = new Alien(px, py - 125, 'SCOUT'); // Closer!

      engine.aliens = [farScout, nearScout];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(nearScout.x);
      expect(target.y).toBe(nearScout.y);
      expect(target.dist).toBeCloseTo(125, 1);
    });

    it('Fallback: targets distant torpedoes if no aliens remain', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Torpedo at 280px (beyond 220px danger limit)
      engine.projectiles.torpedoes = [
        { alive: true, x: px + 280, y: py }
      ];

      const target = engine.findBestAutoAimTarget();
      expect(target).not.toBeNull();
      expect(target.x).toBe(px + 280);
      expect(target.y).toBe(py);
    });
  });

  describe('3. Auto-Aim Tracking without Manual Mouse Movement', () => {
    let engine;

    beforeEach(() => {
      engine = new GameEngine(mockCanvas);
      engine.startMission(1, false);
      engine.aliens = [];
      engine.projectiles.torpedoes = [];
    });

    it('rotates turret toward threat angle automatically without mouse movement', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Place alien stationary directly to the right (angle 0) with high HP so it survives the tracking duration
      const scout = new Alien(px + 200, py, 'SCOUT');
      scout.speed = 0;
      scout.hp = 999999;
      scout.maxHp = 999999;
      engine.aliens = [scout];

      // Turret initially facing straight up (-PI/2)
      engine.turret.angle = -Math.PI / 2;
      engine.pointerX = px;
      engine.pointerY = py - 200; // Pointer was at straight up

      // Run update frames without touching pointer manually
      for (let i = 0; i < 20; i++) {
        engine.update(0.05);
      }

      // Turret angle should have rotated smoothly towards angle 0 (threat)
      expect(engine.turret.angle).toBeCloseTo(0, 0.2);
    });

    it('retains manual pointer tracking when turret.autoAim is set to false', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Alien to the right
      const scout = new Alien(px + 200, py, 'SCOUT');
      engine.aliens = [scout];

      // Disable auto-aim
      engine.turret.autoAim = false;

      // Manual mouse set to straight down (angle PI/2)
      engine.pointerX = px;
      engine.pointerY = py + 200;

      for (let i = 0; i < 20; i++) {
        engine.update(0.05);
      }

      // Turret should track manual pointer (PI/2), ignoring the alien at 0
      expect(engine.turret.angle).toBeCloseTo(Math.PI / 2, 0.2);
    });
  });

  describe('4. Overcharge Lance Locking with Auto-Aim Active', () => {
    let engine;

    beforeEach(() => {
      engine = new GameEngine(mockCanvas);
      engine.startMission(1, false);
      engine.aliens = [];
      engine.projectiles.torpedoes = [];
    });

    it('locks turret angle directly onto target angle when charging Overcharge Lance', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      // Place target at angle PI (to the left)
      const scout = new Alien(px - 220, py, 'SCOUT');
      scout.speed = 0;
      engine.aliens = [scout];

      // Turret was initially pointing upwards
      engine.turret.angle = -Math.PI / 2;
      engine.isChargingOvercharge = true;

      engine.update(0.016);

      // Overcharge Lance instantly locks turret angle onto target angle
      expect(Math.abs(engine.turret.angle)).toBeCloseTo(Math.PI, 0.1);
    });

    it('does not lock angle onto alien if autoAim is disabled during Overcharge Lance', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const scout = new Alien(px - 220, py, 'SCOUT');
      engine.aliens = [scout];

      engine.turret.autoAim = false;
      engine.turret.angle = -Math.PI / 2;
      engine.pointerX = px;
      engine.pointerY = py - 200; // Pointer straight up

      engine.isChargingOvercharge = true;
      engine.update(0.016);

      // Remains pointed upwards towards manual pointer
      expect(engine.turret.angle).toBeCloseTo(-Math.PI / 2, 0.2);
    });
  });

  describe('5. Settings Toggle Persistence in Storage', () => {
    it('has autoAim enabled in DEFAULT_SETTINGS', () => {
      expect(DEFAULT_SETTINGS.autoAim).toBe(true);
    });

    it('persists setAutoAim toggle in saveSystem and reads back via getAutoAim', () => {
      expect(saveSystem.getAutoAim()).toBe(true);

      saveSystem.setAutoAim(false);
      expect(saveSystem.getAutoAim()).toBe(false);
      expect(saveSystem.getSettings().autoAim).toBe(false);

      saveSystem.setAutoAim(true);
      expect(saveSystem.getAutoAim()).toBe(true);
      expect(saveSystem.getSettings().autoAim).toBe(true);
    });

    it('reloads saved autoAim preference in a fresh SaveSystem instance', () => {
      saveSystem.setAutoAim(false);

      const reloadedSaveSystem = new SaveSystem();
      expect(reloadedSaveSystem.getAutoAim()).toBe(false);

      reloadedSaveSystem.setAutoAim(true);
      const reloadedAgain = new SaveSystem();
      expect(reloadedAgain.getAutoAim()).toBe(true);
    });
  });

  describe('6. Laser Sight Pointing at Target when Auto-Aim is Active', () => {
    let engine;

    beforeEach(() => {
      engine = new GameEngine(mockCanvas);
      engine.startMission(1, false);
      engine.state = 'PLAYING';
      engine.aliens = [];
      engine.projectiles.torpedoes = [];
    });

    it('updates pointerX and pointerY to target coordinates for laser sight aiming', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const scout = new Alien(px + 234, py - 123, 'SCOUT');
      scout.speed = 0;
      engine.aliens = [scout];

      // Update engine frame
      engine.update(0.016);

      expect(engine.pointerX).toBe(scout.x);
      expect(engine.pointerY).toBe(scout.y);

      // Now render laser sight
      vi.spyOn(engine, 'updateHUD').mockImplementation(() => {});
      const renderSightSpy = vi.spyOn(engine.turret, 'renderLaserSight');
      engine.render();

      expect(renderSightSpy).toHaveBeenCalledWith(
        mockCtx,
        px,
        py,
        scout.x,
        scout.y,
        expect.any(Boolean)
      );
    });

    it('draws dotted laser sight line from planet center to the auto-aimed target', () => {
      const px = engine.planet.x;
      const py = engine.planet.y;

      const targetX = px + 180;
      const targetY = py + 90;

      engine.turret.renderLaserSight(mockCtx, px, py, targetX, targetY, false);

      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.setLineDash).toHaveBeenCalledWith([4, 6]);
      expect(mockCtx.moveTo).toHaveBeenCalledWith(px, py);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(targetX, targetY);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });
});
