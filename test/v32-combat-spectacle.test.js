// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticleEngine } from '../src/game/particles.js';
import { ProjectileManager } from '../src/game/projectiles.js';
import { Alien } from '../src/game/alien.js';
import { TacticalSkills } from '../src/game/skills.js';
import { GameEngine } from '../src/game/engine.js';
import { SaveSystem } from '../src/engine/storage.js';

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 60 })),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',
    lineWidth: 1.0,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    shadowColor: 'transparent',
    shadowBlur: 0
  };
}

describe('Spark Panic v3.2 - Combat Spectacle, Projectile Shaders & Destruction Physics', () => {
  describe('1. Polygonal Hull Fragmentation Physics (src/game/particles.js)', () => {
    let pe;

    beforeEach(() => {
      pe = new ParticleEngine();
    });

    it('should spawn physically authentic tumbling geometric polygon shards', () => {
      pe.spawnHullFragments(300, 200, '#00e5ff', 8, 160);
      expect(pe.hullFragments.length).toBe(8);

      const shard = pe.hullFragments[0];
      expect(shard.x).toBe(300);
      expect(shard.y).toBe(200);
      expect(typeof shard.vx).toBe('number');
      expect(typeof shard.vy).toBe('number');
      expect(typeof shard.rotation).toBe('number');
      expect(typeof shard.angularVelocity).toBe('number');
      expect(shard.life).toBeGreaterThan(0);
      expect(shard.maxLife).toBeGreaterThan(0);
      expect(Array.isArray(shard.vertices)).toBe(true);
      expect(shard.vertices.length).toBeGreaterThanOrEqual(3);
      expect(Array.isArray(shard.trail)).toBe(true);
      expect(shard.bounced).toBe(false);
    });

    it('should respect hullDebrisShards settings toggle', () => {
      pe.getSettings = () => ({ hullDebrisShards: false, particleDensity: 'high' });
      pe.spawnHullFragments(300, 200, '#00e5ff', 8, 160);
      expect(pe.hullFragments.length).toBe(0);

      pe.getSettings = () => ({ hullDebrisShards: true, particleDensity: 'high' });
      pe.spawnHullFragments(300, 200, '#00e5ff', 8, 160);
      expect(pe.hullFragments.length).toBe(8);
    });

    it('should scale shard count down when particleDensity is low', () => {
      pe.getSettings = () => ({ hullDebrisShards: true, particleDensity: 'low' });
      pe.spawnHullFragments(300, 200, '#00e5ff', 8, 160);
      expect(pe.hullFragments.length).toBe(4);
    });

    it('should update fragment position, rotation, drag and trail points', () => {
      pe.spawnHullFragments(300, 200, '#e040fb', 4, 150);
      const initialRot = pe.hullFragments[0].rotation;
      pe.update(0.1, 800, 600, 90, []);

      const shard = pe.hullFragments[0];
      expect(shard.rotation).not.toBe(initialRot);
      expect(shard.trail.length).toBeGreaterThan(0);
    });

    it('should bounce off planet shield with mini-sparks', () => {
      // Planet at (400, 300) with shield radius 90 (turretRadius 76 + 14 = 90)
      pe.hullFragments.push({
        x: 485,
        y: 300,
        vx: -120, // moving towards planet
        vy: 0,
        rotation: 0,
        angularVelocity: 2,
        color: '#00e5ff',
        life: 1.0,
        maxLife: 1.0,
        vertices: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: -5, y: 5 }],
        trail: [],
        bounced: false,
        alive: true
      });

      const initialDebris = pe.debris.length;
      pe.update(0.016, 400, 300, 76, []);

      const shard = pe.hullFragments[0];
      expect(shard.bounced).toBe(true);
      expect(shard.vx).toBeGreaterThan(0); // bounced back outward
      expect(pe.debris.length).toBeGreaterThan(initialDebris); // mini-sparks spawned
    });

    it('should dissolve into energy dust when lifespan expires', () => {
      pe.spawnHullFragments(300, 200, '#ffd700', 2, 100);
      pe.hullFragments[0].life = 0.01;
      pe.hullFragments[1].life = 0.01;

      const initialDebris = pe.debris.length;
      pe.update(0.05, 400, 300, 80, []);

      expect(pe.hullFragments.length).toBe(0);
      expect(pe.debris.length).toBeGreaterThan(initialDebris);
    });

    it('should render polygon shards and smoke trails without canvas context errors', () => {
      pe.spawnHullFragments(200, 200, '#00e5ff', 4, 120);
      pe.update(0.05, 400, 300, 80, []);

      const ctx = createMockCtx();
      expect(() => pe.render(ctx, 'astral')).not.toThrow();
      expect(() => pe.render(ctx, 'comic')).not.toThrow();
    });

    it('should hook hull fragment spawning into boss subsystem destruction', () => {
      const boss = new Alien(500, 500, 'BOSS');
      const mockEngine = {
        particles: new ParticleEngine(),
        addScreenShake: vi.fn(),
        supplyPods: { spawnPod: vi.fn() }
      };

      const wpnSub = boss.subsystems.find(s => s.type === 'weapons');
      expect(wpnSub).toBeDefined();

      boss.damageSubsystem(wpnSub.id, 9999, mockEngine);
      expect(wpnSub.alive).toBe(false);
      expect(mockEngine.particles.hullFragments.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('2. Weapon Core VFX & Multi-Layer Projectile Shaders (src/game/projectiles.js)', () => {
    let pm;

    beforeEach(() => {
      pm = new ProjectileManager();
    });

    it('should generate lingering ionizing laser trails with secondary prismatic sparks for Railgun shots', () => {
      pm.addPlasmaBolt({
        x: 100,
        y: 100,
        speed: 800,
        angle: 0,
        damage: 100,
        isRailgun: true,
        color: '#ffd700'
      });

      expect(pm.bolts.length).toBe(1);
      pm.update(0.05, 1200, 800, [], null);

      expect(pm.railgunTrails.length).toBeGreaterThan(0);
      const trail = pm.railgunTrails[0];
      expect(trail.sparks).toBeDefined();
      expect(trail.sparks.length).toBeGreaterThan(0);
      expect(trail.sparks[0]).toHaveProperty('color');
      expect(trail.sparks[0]).toHaveProperty('life');
    });

    it('should update and decay railgun secondary prismatic sparks over time', () => {
      pm.addPlasmaBolt({
        x: 100,
        y: 100,
        speed: 800,
        angle: 0,
        damage: 100,
        isRailgun: true,
        color: '#ffd700'
      });
      pm.update(0.02, 1200, 800, [], null);

      const trail = pm.railgunTrails[0];
      const initialSparkLife = trail.sparks[0].life;
      pm.update(0.05, 1200, 800, [], null);

      expect(trail.sparks[0].life).toBeLessThan(initialSparkLife);
    });

    it('should spawn reflective crystal hexagonal prism shield flash and holographic sparks on Aegis Phase-Parry', () => {
      pm.spawnParryShieldFlash(400, 300, 0);
      expect(pm.parryFlashes.length).toBe(1);

      const flash = pm.parryFlashes[0];
      expect(flash.timer).toBeCloseTo(0.35, 2);
      expect(flash.sparks.length).toBeGreaterThan(15);
      expect(flash.sparks[0]).toHaveProperty('color');
      expect(flash.sparks[0]).toHaveProperty('rotation');
    });

    it('should update and render Aegis parry shield flash and holographic sparks', () => {
      pm.spawnParryShieldFlash(400, 300, 0);
      const ctx = createMockCtx();

      pm.update(0.05, 1200, 800, [], null);
      expect(pm.parryFlashes[0].timer).toBeLessThan(0.35);

      expect(() => pm.render(ctx, 400, 300, 85, true)).not.toThrow();
    });

    it('should render multi-stage plasma bolts with oscillating tendril and sparkling engine wake', () => {
      pm.addPlasmaBolt({
        x: 200,
        y: 200,
        speed: 500,
        angle: 0,
        damage: 25,
        color: '#00e5ff'
      });

      const ctx = createMockCtx();
      expect(() => pm.render(ctx, 400, 300, 85, true)).not.toThrow();
    });

    it('should render true double-helix intertwining energy coils with procedural lightning arcs via renderHelicalIonBeam', () => {
      const ctx = createMockCtx();
      expect(() => pm.renderHelicalIonBeam(ctx, 95, 1200, 24, 1.25)).not.toThrow();
    });

    it('TacticalSkills Helical Ion Beam ([Q]) should render twin intertwining coils and lightning arcs seamlessly', () => {
      const skills = new TacticalSkills();
      skills.useSkillQ(0);
      expect(skills.ionBeamActive).toBe(true);

      const ctx = createMockCtx();
      expect(() => skills.render(ctx, 400, 300, 75, 0.5)).not.toThrow();
    });
  });

  describe('3. Alien Ship Visual Polish (src/game/alien.js)', () => {
    it('should draw dynamic damage scars / glowing crack lines when ship HP drops below 50%', () => {
      const scout = new Alien(100, 100, 'SCOUT');
      const ctx = createMockCtx();

      const drawScarsSpy = vi.spyOn(scout, 'drawDamageScars');

      // Ship at full HP (22/22) - should not draw scars
      scout.render(ctx, null, 1.0);
      expect(drawScarsSpy).not.toHaveBeenCalled();

      // Damage ship to 40% HP (8/22) - should draw damage scars
      scout.hp = 8;
      scout.render(ctx, null, 1.0);
      expect(drawScarsSpy).toHaveBeenCalled();
      const [calledCtx, calledR, calledDmgPct] = drawScarsSpy.mock.calls[0];
      expect(calledR).toBe(scout.radius);
      expect(calledDmgPct).toBeGreaterThan(0);
    });

    it('should render Boss hardpoint tear lines, venting plasma fire and electrical arcs when subsystems are damaged', () => {
      const boss = new Alien(400, 300, 'BOSS');
      const wpnSub = boss.subsystems.find(s => s.type === 'weapons');

      // Damage subsystem to 50% HP
      wpnSub.hp = wpnSub.maxHp * 0.5;

      const ctx = createMockCtx();

      // Rendering damaged boss should not throw and should execute tear line rendering
      expect(() => boss.render(ctx, null, 1.5)).not.toThrow();

      // Ruin subsystem completely
      wpnSub.alive = false;
      wpnSub.hp = 0;
      expect(() => boss.render(ctx, null, 2.0)).not.toThrow();
    });
  });

  describe('4. Full GameEngine Integration', () => {
    let engine;
    let canvas;

    beforeEach(() => {
      localStorage.clear();
      const mockCtx = createMockCtx();
      canvas = {
        width: 1200,
        height: 800,
        style: {},
        getContext: vi.fn(() => mockCtx),
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 1200, height: 800 })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      const save = new SaveSystem();
      engine = new GameEngine(canvas, save);
      engine.state = 'PLAYING';
    });

    it('should trigger parry flash and holographic sparks on perfect parry', () => {
      engine.triggerPhaseParry();
      expect(engine.parryTimer).toBeGreaterThan(0);

      engine.onPerfectParry(450, 300, 20);
      expect(engine.projectiles.parryFlashes.length).toBeGreaterThan(0);
      const flash = engine.projectiles.parryFlashes[0];
      expect(flash.sparks.length).toBeGreaterThan(0);
    });

    it('should spawn hull fragments in ParticleEngine on alien destruction in engine', () => {
      const alien = new Alien(350, 250, 'SCOUT');
      engine.onAlienDestroyed(alien, null);

      expect(engine.particles.hullFragments.length).toBeGreaterThanOrEqual(8);
      const frag = engine.particles.hullFragments[0];
      expect(frag.vertices.length).toBeGreaterThanOrEqual(3);
    });
  });
});
