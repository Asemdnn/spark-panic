// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { GameEngine } from '../src/game/engine.js';
import { ParticleEngine } from '../src/game/particles.js';
import { ProjectileManager } from '../src/game/projectiles.js';
import { TacticalSkills } from '../src/game/skills.js';
import { Alien } from '../src/game/alien.js';
import { saveSystem, DEFAULT_SETTINGS as STORAGE_DEFAULT_SETTINGS } from '../src/engine/storage.js';
import { DEFAULT_SETTINGS as CONFIG_DEFAULT_SETTINGS } from '../src/config.js';

function createMockCtx() {
  return {
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
    measureText: vi.fn(() => ({ width: 60 })),
    globalAlpha: 1.0,
    globalCompositeOperation: 'source-over',
    lineWidth: 1.0,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    shadowColor: 'transparent',
    shadowBlur: 0
  };
}

describe('Spark Panic v3.2: Hyper-VFX, Volumetric Cosmic Nebulae & Screen Shaders Verification Suite', () => {
  let engine;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    saveSystem.resetAll();
    mockCtx = createMockCtx();
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx)
    };
    engine = new GameEngine(mockCanvas);
  });

  describe('1. Multi-Octave Volumetric Cosmic Nebulae', () => {
    it('initializes 20 procedural volumetric cloud nodes across 3 distinct octaves with valid geometry and alpha', () => {
      expect(engine.nebulaClouds).toBeDefined();
      expect(engine.nebulaClouds.length).toBe(20);

      const octaves = new Set();
      for (const cloud of engine.nebulaClouds) {
        expect(cloud.u).toBeGreaterThanOrEqual(0);
        expect(cloud.u).toBeLessThanOrEqual(1);
        expect(cloud.v).toBeGreaterThanOrEqual(0);
        expect(cloud.v).toBeLessThanOrEqual(1);
        expect(cloud.baseRadius).toBeGreaterThan(0);
        expect(cloud.parallaxFactor).toBeGreaterThan(0);
        expect(cloud.alpha).toBeGreaterThan(0);
        expect(['primary', 'secondary']).toContain(cloud.colorKey);
        octaves.add(cloud.octave);
      }

      // Must cover Octave 1 (macro), Octave 2 (meso), Octave 3 (micro)
      expect(octaves.has(1)).toBe(true);
      expect(octaves.has(2)).toBe(true);
      expect(octaves.has(3)).toBe(true);
    });

    it('maps sector color schemes accurately across Sectors I through IV', () => {
      const s1 = engine.getSectorNebulaColors(1);
      expect(s1.primary).toBe('#00e5ff');
      expect(s1.secondary).toBe('#0284c7');
      expect(s1.name).toContain('Celestial Aurora');

      const s2 = engine.getSectorNebulaColors(2);
      expect(s2.primary).toBe('#ff3d00');
      expect(s2.secondary).toBe('#f59e0b');
      expect(s2.name).toContain('Magma Clouds');

      const s3 = engine.getSectorNebulaColors(3);
      expect(s3.primary).toBe('#a855f7');
      expect(s3.secondary).toBe('#6366f1');
      expect(s3.name).toContain('Quantum Nebulae');

      const s4 = engine.getSectorNebulaColors(4);
      expect(s4.primary).toBe('#10b981');
      expect(s4.secondary).toBe('#7c3aed');
      expect(s4.name).toContain('Accretion Swirls');
    });

    it('registers and expands radial ripple displacement from detonations and alters cloud offset', () => {
      const countBefore = engine.nebulaRipples.length;
      engine.addNebulaRipple(400, 300, 400, 50);
      expect(engine.nebulaRipples.length).toBe(countBefore + 1);

      const ripple = engine.nebulaRipples[engine.nebulaRipples.length - 1];
      expect(ripple.x).toBe(400);
      expect(ripple.y).toBe(300);
      expect(ripple.radius).toBe(10);
      expect(ripple.amplitude).toBe(50);

      // Advance engine time
      const prevRad = ripple.radius;
      engine.update(0.08);
      expect(ripple.radius).toBeGreaterThan(prevRad);

      // Render volumetric nebulae with active ripple displacement
      mockCtx.fill.mockClear();
      engine.drawVolumetricNebulae(mockCtx);
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('bypasses volumetric nebula rendering when volumetricNebula setting is disabled', () => {
      mockCtx.fill.mockClear();
      vi.spyOn(engine, 'getSettings').mockReturnValue({ volumetricNebula: false });
      engine.drawVolumetricNebulae(mockCtx);
      expect(mockCtx.fill).not.toHaveBeenCalled();
    });
  });

  describe('2. Planetary Atmospheric Weather Shaders', () => {
    it('renders dynamic Rayleigh scattering rim glow with sun angle rotation and illuminated limb arc', () => {
      mockCtx.arc.mockClear();
      mockCtx.stroke.mockClear();
      engine.drawRayleighScattering(mockCtx, engine.planet, 75, 1.2, '#00e5ff');
      expect(mockCtx.arc).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('executes sector atmospheric weather overlays for all 4 distinct planetary biomes', () => {
      // Sector I: Drifting translucent cloud whorls with continent shadow projection
      mockCtx.fill.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 1, engine.planet, 75, 1.0, 'astral');
      expect(mockCtx.fill).toHaveBeenCalled();

      // Sector II: Molten tectonic magma rivers glowing between continental fissures
      mockCtx.stroke.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 2, engine.planet, 75, 2.0, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();

      // Sector III: Shimmering bio-luminescent polar aurora curtains
      mockCtx.stroke.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 3, engine.planet, 75, 3.0, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();

      // Sector IV: Gravitational accretion disc ring matter spiraling inward
      mockCtx.stroke.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 4, engine.planet, 75, 4.0, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('renders drawPlanetEntity across all 4 sectors without exception', () => {
      for (let s = 1; s <= 4; s++) {
        engine.planet.sector = s;
        expect(() => engine.drawPlanetEntity(mockCtx)).not.toThrow();
      }
    });
  });

  describe('3. Polygonal Hull Fragmentation Physics', () => {
    let particles;

    beforeEach(() => {
      particles = new ParticleEngine();
    });

    it('spawns physically authentic tumbling geometric polygon shards with valid topology and lifespans', () => {
      particles.spawnHullFragments(350, 250, '#ff3d00', 8, 180);
      expect(particles.hullFragments.length).toBe(8);

      const shard = particles.hullFragments[0];
      expect(shard.x).toBe(350);
      expect(shard.y).toBe(250);
      expect(typeof shard.vx).toBe('number');
      expect(typeof shard.vy).toBe('number');
      expect(typeof shard.rotation).toBe('number');
      expect(typeof shard.angularVelocity).toBe('number');
      expect(shard.life).toBeGreaterThan(0);
      expect(shard.maxLife).toBeGreaterThan(0);
      expect(shard.vertices.length).toBeGreaterThanOrEqual(3);
      expect(shard.bounced).toBe(false);
      expect(Array.isArray(shard.trail)).toBe(true);
    });

    it('respects hullDebrisShards toggle and particle density settings', () => {
      particles.getSettings = () => ({ hullDebrisShards: false, particleDensity: 'high' });
      particles.spawnHullFragments(350, 250, '#ff3d00', 8, 180);
      expect(particles.hullFragments.length).toBe(0);

      particles.getSettings = () => ({ hullDebrisShards: true, particleDensity: 'low' });
      particles.spawnHullFragments(350, 250, '#ff3d00', 8, 180);
      expect(particles.hullFragments.length).toBe(4);
    });

    it('bounces fragments off planet shield with deflection and micro-sparks', () => {
      particles.hullFragments.push({
        x: 486,
        y: 300,
        vx: -150,
        vy: 0,
        rotation: 0,
        angularVelocity: 3,
        color: '#00e5ff',
        life: 1.0,
        maxLife: 1.0,
        vertices: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: -5, y: 5 }],
        trail: [],
        bounced: false,
        alive: true
      });

      const initialDebris = particles.debris.length;
      particles.update(0.016, 400, 300, 76, []);

      const shard = particles.hullFragments[0];
      expect(shard.bounced).toBe(true);
      expect(shard.vx).toBeGreaterThan(0);
      expect(particles.debris.length).toBeGreaterThan(initialDebris);
    });

    it('decays shards and dissolves them into energy dust upon lifespan expiration', () => {
      particles.spawnHullFragments(300, 300, '#a855f7', 2, 120);
      particles.hullFragments[0].life = 0.01;
      particles.hullFragments[1].life = 0.01;

      const initialDebris = particles.debris.length;
      particles.update(0.05, 400, 300, 80, []);

      expect(particles.hullFragments.length).toBe(0);
      expect(particles.debris.length).toBeGreaterThan(initialDebris);
    });

    it('triggers hull fragments when boss subsystems are destroyed', () => {
      const boss = new Alien(450, 450, 'BOSS');
      const mockEng = {
        particles: new ParticleEngine(),
        addScreenShake: vi.fn(),
        supplyPods: { spawnPod: vi.fn() }
      };

      const wpnSub = boss.subsystems.find(s => s.type === 'weapons');
      expect(wpnSub).toBeDefined();
      boss.damageSubsystem(wpnSub.id, 99999, mockEng);
      expect(wpnSub.alive).toBe(false);
      expect(mockEng.particles.hullFragments.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('4. Weapon Core VFX & Multi-Layer Projectile Shaders', () => {
    let pm;

    beforeEach(() => {
      pm = new ProjectileManager();
    });

    it('renders multi-stage plasma bolts with oscillating tendrils and engine wake', () => {
      pm.addPlasmaBolt({
        x: 200,
        y: 200,
        speed: 550,
        angle: 0.5,
        damage: 30,
        color: '#00e5ff'
      });

      expect(() => pm.render(mockCtx, 400, 300, 85, true)).not.toThrow();
    });

    it('generates ionizing railgun laser trails that splinter into secondary prismatic sparks', () => {
      pm.addPlasmaBolt({
        x: 100,
        y: 100,
        speed: 800,
        angle: 0,
        damage: 120,
        isRailgun: true,
        color: '#ffd700'
      });

      pm.update(0.04, 1000, 800, [], null);
      expect(pm.railgunTrails.length).toBeGreaterThan(0);

      const trail = pm.railgunTrails[0];
      expect(trail.sparks.length).toBeGreaterThan(0);
      expect(trail.sparks[0]).toHaveProperty('color');
      expect(trail.sparks[0]).toHaveProperty('life');

      const prevLife = trail.sparks[0].life;
      pm.update(0.04, 1000, 800, [], null);
      expect(trail.sparks[0].life).toBeLessThan(prevLife);
    });

    it('renders helical ion beam intertwining coils with procedural lightning arcs via renderHelicalIonBeam and TacticalSkills Q', () => {
      expect(() => pm.renderHelicalIonBeam(mockCtx, 90, 1000, 26, 1.2)).not.toThrow();

      const skills = new TacticalSkills();
      skills.useSkillQ(0);
      expect(() => skills.render(mockCtx, 400, 300, 85, 1200, 800)).not.toThrow();
    });

    it('spawns and renders reflective crystal hexagonal prism shield flash on Aegis Phase-Parry', () => {
      pm.spawnParryShieldFlash(400, 300, 0);
      expect(pm.parryFlashes.length).toBe(1);

      const flash = pm.parryFlashes[0];
      expect(flash.sparks.length).toBeGreaterThan(15);
      expect(flash.timer).toBeCloseTo(0.35, 2);

      pm.update(0.04, 1000, 800, [], null);
      expect(pm.parryFlashes[0].timer).toBeLessThan(0.35);

      expect(() => pm.render(mockCtx, 400, 300, 85, true)).not.toThrow();
    });
  });

  describe('5. Graphics Settings Toggles & Storage Persistence', () => {
    it('declares volumetricNebula, crtPostProcessing, and hullDebrisShards in DEFAULT_SETTINGS with default true', () => {
      expect(CONFIG_DEFAULT_SETTINGS.volumetricNebula).toBe(true);
      expect(CONFIG_DEFAULT_SETTINGS.crtPostProcessing).toBe(true);
      expect(CONFIG_DEFAULT_SETTINGS.hullDebrisShards).toBe(true);

      expect(STORAGE_DEFAULT_SETTINGS.volumetricNebula).toBe(true);
      expect(STORAGE_DEFAULT_SETTINGS.crtPostProcessing).toBe(true);
      expect(STORAGE_DEFAULT_SETTINGS.hullDebrisShards).toBe(true);
    });

    it('provides getters, setters, and persistence for all 3 graphics settings in SaveSystem', () => {
      expect(saveSystem.getVolumetricNebula()).toBe(true);
      expect(saveSystem.getCrtPostProcessing()).toBe(true);
      expect(saveSystem.getHullDebrisShards()).toBe(true);

      saveSystem.setVolumetricNebula(false);
      expect(saveSystem.getVolumetricNebula()).toBe(false);
      expect(saveSystem.getSettings().volumetricNebula).toBe(false);

      saveSystem.setCrtPostProcessing(false);
      expect(saveSystem.getCrtPostProcessing()).toBe(false);
      expect(saveSystem.getSettings().crtPostProcessing).toBe(false);

      saveSystem.setHullDebrisShards(false);
      expect(saveSystem.getHullDebrisShards()).toBe(false);
      expect(saveSystem.getSettings().hullDebrisShards).toBe(false);

      saveSystem.setVolumetricNebula(true);
      saveSystem.setCrtPostProcessing(true);
      saveSystem.setHullDebrisShards(true);
      expect(saveSystem.getVolumetricNebula()).toBe(true);
      expect(saveSystem.getCrtPostProcessing()).toBe(true);
      expect(saveSystem.getHullDebrisShards()).toBe(true);
    });

    it('index.html provides settings toggle controls in #modalSettings', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toContain('id="modalSettings"');
      expect(html).toContain('id="settingNebulaBtns"');
      expect(html).toContain('btn-setting-nebula');
      expect(html).toContain('id="settingCrtBtns"');
      expect(html).toContain('btn-setting-crt');
      expect(html).toContain('id="settingDebrisBtns"');
      expect(html).toContain('btn-setting-debris');
    });
  });

  describe('6. Milestone v3.2 Version Badges & Documentation Verification', () => {
    it('index.html contains v3.2 Hyper-VFX & Nebula Shader Edition badges', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toContain('✨ v3.2 Hyper-VFX & Nebula Shader Edition');
      expect(html).toContain('✨ v3.2 HYPER-VFX & NEBULA SHADER EDITION');
      expect(html).toContain('hud-svg-corner');
      expect(html).toContain('visor-status-readout');
      expect(html).toContain('combat-floater-text');
    });

    it('battle-card.js contains v3.2 Hyper-VFX & Nebula Shader Edition branding', () => {
      const cardPath = path.resolve(__dirname, '../src/ui/battle-card.js');
      const cardSrc = fs.readFileSync(cardPath, 'utf-8');

      expect(cardSrc).toContain('✨ v3.2 HYPER-VFX & NEBULA SHADER EDITION');
    });

    it('README.md comprehensively documents v3.2 graphics upgrades and shaders', () => {
      const readmePath = path.resolve(__dirname, '../README.md');
      const readmeSrc = fs.readFileSync(readmePath, 'utf-8');

      expect(readmeSrc).toContain('✨ v3.2 Hyper-VFX & Nebula Shader Edition');
      expect(readmeSrc).toContain('What\'s New in v3.2: Hyper-VFX & Nebula Shader Edition');
      expect(readmeSrc).toContain('Multi-Octave Volumetric Cosmic Nebulae');
      expect(readmeSrc).toContain('Planetary Atmospheric Weather Shaders & Dynamic Rayleigh Glow');
      expect(readmeSrc).toContain('Polygonal Hull Fragmentation Physics & Shard Ricochets');
      expect(readmeSrc).toContain('Multi-Layer Weapon Core VFX & Projectile Shaders');
      expect(readmeSrc).toContain('Enhanced Cinematic Post-Processing & CRT Shaders');
      expect(readmeSrc).toContain('Granular Graphics Settings & Chamfered Mecha-Cockpit Visor Polish');
    });
  });
});
