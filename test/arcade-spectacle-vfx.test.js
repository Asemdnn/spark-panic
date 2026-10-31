// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectileManager } from '../src/game/projectiles.js';
import { GuardianTurret } from '../src/game/turret.js';
import { TacticalSkills } from '../src/game/skills.js';
import { ParticleEngine } from '../src/game/particles.js';
import { GameEngine } from '../src/game/engine.js';
import { SaveSystem } from '../src/engine/storage.js';

describe('v2.6 Arcade Juice, Next-Gen Canvas VFX & Readability Suite', () => {

  describe('1. Directional Plasma Laser Bolts & Tactical Warheads', () => {
    let pm;

    beforeEach(() => {
      pm = new ProjectileManager();
    });

    it('should initialize torpedoes with an empty trajectory trail array', () => {
      pm.spawnTorpedo(100, 200, 0, 100, 10, '#ff1744');
      const torp = pm.torpedoes[0];
      expect(torp).toBeDefined();
      expect(Array.isArray(torp.trail)).toBe(true);
      expect(torp.trail.length).toBe(0);
    });

    it('should record trailing positions during torpedo updates up to 5 points', () => {
      pm.spawnTorpedo(100, 200, 0, 100, 10, '#ff1744');
      const torp = pm.torpedoes[0];
      const mockPlanet = { x: 400, y: 300, radius: 75, shieldRadius: 105, isShieldActive: () => true };
      for (let i = 0; i < 10; i++) {
        pm.update(0.016, 800, 600, [], mockPlanet, () => {}, () => {});
      }
      expect(torp.trail.length).toBeLessThanOrEqual(5);
      expect(torp.trail.length).toBeGreaterThan(0);
      expect(torp.trail[0]).toHaveProperty('x');
      expect(torp.trail[0]).toHaveProperty('y');
    });

    it('should calculate directional rotation angle for plasma bolts', () => {
      pm.spawnTurretBolts(400, 300, 90, [{
        angle: 0,
        speed: 500,
        damage: 15,
        color: '#00e5ff'
      }]);
      const bolt = pm.bolts[0];
      expect(bolt).toBeDefined();
      expect(bolt.vx).toBeGreaterThan(0);
      const angle = Math.atan2(bolt.vy, bolt.vx);
      expect(angle).toBeCloseTo(0, 2);
    });

    it('should generate railgun wake trails for railgun bolts', () => {
      pm.spawnTurretBolts(400, 300, 90, [{
        angle: Math.PI / 4,
        speed: 500,
        damage: 15,
        color: '#ffd700',
        isRailgun: true
      }]);
      const mockPlanet = { x: 400, y: 300, radius: 75, shieldRadius: 105, isShieldActive: () => true };
      pm.update(0.016, 800, 600, [], mockPlanet, () => {}, () => {});
      expect(pm.railgunTrails.length).toBeGreaterThan(0);
    });
  });

  describe('2. Turret Recoil, Muzzle Flash & Atmospheric Rim Light', () => {
    let turret;

    beforeEach(() => {
      turret = new GuardianTurret();
    });

    it('should initialize recoil to 0 and muzzleFlash to 0', () => {
      expect(turret.recoil).toBe(0);
      expect(turret.muzzleFlash).toBe(0);
    });

    it('should set recoil kickback and muzzle flash flare when firing bolts', () => {
      const mockOnFire = vi.fn();
      turret.fireTimer = 1.0;
      turret.update(0.1, 500, 300, 400, 300, false, mockOnFire);
      expect(mockOnFire).toHaveBeenCalled();
      expect(turret.recoil).toBe(5.5);
      expect(turret.muzzleFlash).toBe(1.0);
    });

    it('should decay recoil smoothly towards 0 when not firing', () => {
      turret.autoFire = false;
      turret.recoil = 5.5;
      turret.update(0.05, 500, 300, 400, 300, false);
      expect(turret.recoil).toBeLessThan(5.5);
      expect(turret.recoil).toBeGreaterThanOrEqual(0);

      turret.update(0.5, 500, 300, 400, 300, false);
      expect(turret.recoil).toBe(0);
    });

    it('should decay muzzle flash smoothly towards 0 when not firing', () => {
      turret.autoFire = false;
      turret.muzzleFlash = 1.0;
      turret.update(0.05, 500, 300, 400, 300, false);
      expect(turret.muzzleFlash).toBeLessThan(1.0);
      expect(turret.muzzleFlash).toBeGreaterThanOrEqual(0);

      turret.update(0.5, 500, 300, 400, 300, false);
      expect(turret.muzzleFlash).toBe(0);
    });
  });

  describe('3. Helical [Q] Orbital Ion Beam', () => {
    let skills;

    beforeEach(() => {
      skills = new TacticalSkills();
    });

    it('should activate ion beam and set active flags', () => {
      const activated = skills.useSkillQ(0);
      expect(activated).toBe(true);
      expect(skills.ionBeamActive).toBe(true);
      expect(skills.ionBeamTimer).toBe(0.75);
    });

    it('should check beam collision starting outside turret cannon tip (planetRadius + 10)', () => {
      skills.useSkillQ(0);
      const alienInsidePlanet = { x: 420, y: 300, radius: 16, alive: true, hp: 50, takeDamage: vi.fn() };
      const alienInBeamTarget = { x: 550, y: 300, radius: 16, alive: true, hp: 50, takeDamage: (dmg) => { alienInBeamTarget.hp -= dmg; } };

      skills.update(0.1, 0, 400, 300, [alienInsidePlanet, alienInBeamTarget], [], 1, null, 75);
      // alienInBeamTarget is along angle 0 (x=550, y=300: dist=150 > 85), should take damage
      expect(alienInBeamTarget.hp).toBeLessThan(50);
      expect(alienInsidePlanet.takeDamage).not.toHaveBeenCalled();
    });
  });

  describe('4. Supernova Multi-Ring Shockwaves', () => {
    let pe;

    beforeEach(() => {
      pe = new ParticleEngine();
    });

    it('should spawn shockwave with isPlayer flag', () => {
      pe.spawnNova(200, 200, 100, '#ff0055', 35, true);
      expect(pe.novas.length).toBe(1);
      expect(pe.novas[0].isPlayer).toBe(true);
    });

    it('should update shockwaves over time', () => {
      pe.spawnNova(200, 200, 100, '#ff0055', 35, true);
      pe.update(0.05, 400, 300, 90, [], () => {});
      expect(pe.novas[0].radius).toBeGreaterThan(0);
    });
  });

  describe('5. Arcade Juice: Hit-Stop, Chain Tethers, Debris Shards & Portals', () => {
    let engine;
    let canvas;

    beforeEach(() => {
      localStorage.clear();
      canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const save = new SaveSystem();
      engine = new GameEngine(canvas, save);
      engine.state = 'PLAYING';
    });

    it('should initialize v2.6 arcade spectacle arrays and states', () => {
      expect(Array.isArray(engine.chainTethers)).toBe(true);
      expect(Array.isArray(engine.debris)).toBe(true);
      expect(Array.isArray(engine.threatIndicators)).toBe(true);
      expect(Array.isArray(engine.warpPortals)).toBe(true);
      expect(Array.isArray(engine.comets)).toBe(true);
      expect(engine.timeScale).toBe(1.0);
      expect(engine.hitStopTimer).toBe(0);
      expect(engine.vignettePulse).toBe(0);
    });

    it('should spawn 3-5 hull debris shards on alien destruction', () => {
      const mockAlien = { x: 300, y: 300, color: '#ff3366', radius: 16 };
      engine.onAlienDestroyed(mockAlien, null);
      expect(engine.debris.length).toBeGreaterThanOrEqual(3);
      expect(engine.debris.length).toBeLessThanOrEqual(5);
      const piece = engine.debris[0];
      expect(piece).toHaveProperty('angle');
      expect(piece).toHaveProperty('vRot');
      expect(piece).toHaveProperty('life');
      expect(piece).toHaveProperty('color');
    });

    it('should trigger milestone hit-stop / micro bullet-time on x8, x12, x16 combos', () => {
      const mockAlien = { x: 300, y: 300, color: '#ff3366', radius: 16 };
      engine.combo = 7; // calling onAlienDestroyed increments combo to 8
      engine.onAlienDestroyed(mockAlien, null);
      expect(engine.combo).toBe(8);
      expect(engine.hitStopTimer).toBe(0.14);
      expect(engine.timeScale).toBe(0.35);
      expect(engine.vignettePulse).toBe(1.0);
    });

    it('should recover timeScale back towards 1.0 smoothly after hit-stop finishes', () => {
      engine.hitStopTimer = 0.14;
      engine.timeScale = 0.35;
      // Step while hitStopTimer is active
      engine.update(0.04);
      expect(engine.hitStopTimer).toBeCloseTo(0.10, 2);
      expect(engine.timeScale).toBeGreaterThan(0.35);
      expect(engine.timeScale).toBeLessThan(1.0);

      // Step past hitStopTimer
      engine.update(0.15);
      expect(engine.hitStopTimer).toBe(0);
      expect(engine.timeScale).toBe(1.0);
    });

    it('should initialize stars with 3 parallax layers', () => {
      engine.initStars();
      expect(engine.stars.length).toBeGreaterThan(0);
      const layers = new Set(engine.stars.map(s => s.layer));
      expect(layers.has(1)).toBe(true);
      expect(layers.has(2)).toBe(true);
      expect(layers.has(3)).toBe(true);
    });

    it('should support subspace warp-rift portals emergence', () => {
      engine.warpPortals.push({
        x: 400,
        y: 200,
        duration: 1.0,
        timer: 1.0,
        rot: 0,
        color: '#ff0077',
        item: { classKey: 'BOSS', bossCustomName: 'Kaelen', bossCustomHp: 500 }
      });

      expect(engine.warpPortals.length).toBe(1);
      // Advance by 1.1s to finish portal
      engine.update(1.1);
      expect(engine.warpPortals.length).toBe(0);
      // Alien should now have emerged into aliens list
      expect(engine.aliens.some(a => a.name === 'Kaelen' || a.boss)).toBe(true);
    });

    it('should support threat indicator chevrons', () => {
      engine.threatIndicators.push({
        angle: Math.PI / 2,
        label: 'TEST INCURSION',
        color: '#ff0044',
        duration: 1.2,
        timer: 1.2
      });

      expect(engine.threatIndicators.length).toBe(1);
      engine.update(0.6);
      expect(engine.threatIndicators.length).toBe(1);
      engine.update(0.7);
      expect(engine.threatIndicators.length).toBe(0);
    });
  });
});
