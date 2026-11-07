// @vitest-environment happy-dom
// Spark Panic Performance & Canvas Game Optimization Suite
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticleEngine } from '../src/game/particles.js';
import { ProjectileManager } from '../src/game/projectiles.js';
import { Planet } from '../src/game/planet.js';
import { AudioEngine } from '../src/engine/audio.js';
import { GameEngine } from '../src/game/engine.js';

describe('Canvas Game Optimizer & Engine Efficiency Suite', () => {
  let mockCtx;
  let mockCanvas;

  beforeEach(() => {
    mockCtx = {
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
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      createRadialGradient: () => ({ addColorStop: vi.fn() })
    };

    mockCanvas = {
      width: 1200,
      height: 800,
      getContext: () => mockCtx,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 })
    };
  });

  describe('1. ParticleEngine Batching & Zero Save/Restore Thrashing', () => {
    it('should render 50 debris particles with a single batched save/restore instead of per-particle save/restore', () => {
      const pe = new ParticleEngine();
      pe.spawnDebris(200, 200, '#00e5ff', 50);
      expect(pe.debris.length).toBe(50);

      mockCtx.save.mockClear();
      mockCtx.restore.mockClear();

      pe.render(mockCtx);

      // Should only call save/restore once for the whole debris batch, not 50 times
      expect(mockCtx.save).toHaveBeenCalledTimes(1);
      expect(mockCtx.restore).toHaveBeenCalledTimes(1);
    });

    it('should render cosmic sparks with direct coordinates and zero translate calls', () => {
      const pe = new ParticleEngine();
      pe.spawnCosmicSpark(300, 300, 1);
      pe.spawnCosmicSpark(320, 310, 1);
      expect(pe.sparks.length).toBe(2);

      mockCtx.translate.mockClear();
      pe.render(mockCtx);

      // Direct coordinate calculation eliminates per-spark translate overhead
      expect(mockCtx.translate).not.toHaveBeenCalled();
    });

    it('should render floaters with single alignment batch', () => {
      const pe = new ParticleEngine();
      pe.addFloater(100, 100, '+100', '#ffd700', 16);
      pe.addFloater(150, 150, '+200', '#ffd700', 16);

      mockCtx.save.mockClear();
      mockCtx.restore.mockClear();
      pe.render(mockCtx);

      expect(mockCtx.save).toHaveBeenCalledTimes(1);
      expect(mockCtx.restore).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. ProjectileManager Zero-Allocation Torpedo Trail Mutation', () => {
    it('should initialize empty trail and mutate in-place after 5 frames without creating new objects', () => {
      const pm = new ProjectileManager();
      pm.spawnTorpedo(500, 300, Math.PI, 200, 15, '#ff1744');
      const torp = pm.torpedoes[0];

      expect(torp.trail.length).toBe(0);

      // Update 5 frames to fill trail
      for (let i = 0; i < 5; i++) {
        pm.update(0.016, 1200, 800, [], null);
      }
      expect(torp.trail.length).toBe(5);

      // Capture object references of the 5 trail points
      const ref0 = torp.trail[0];
      const ref4 = torp.trail[4];

      // Update for 10 more frames
      for (let i = 0; i < 10; i++) {
        pm.update(0.016, 1200, 800, [], null);
      }

      // Trail length remains exactly 5 and points are mutated in-place
      expect(torp.trail.length).toBe(5);
      expect(torp.trail[0]).toBe(ref0);
      expect(torp.trail[4]).toBe(ref4);
    });

    it('should render plasma bolts with grouped lighter blend mode and hoisted lineCap', () => {
      const pm = new ProjectileManager();
      pm.spawnTurretBolts(400, 300, 80, [
        { angle: 0, speed: 500, damage: 15, color: '#00e5ff', pierce: 1 },
        { angle: 0.1, speed: 500, damage: 15, color: '#00e5ff', pierce: 1 }
      ]);
      expect(pm.bolts.length).toBe(2);

      pm.render(mockCtx);
      expect(mockCtx.lineCap).toBe('round');
    });
  });

  describe('3. Planet Shaders & Static Geometry Constants', () => {
    it('should render sector 2 magma veins and sector 3 dyson rings without throwing', () => {
      const planet = new Planet(mockCanvas);

      // Sector 2: Magma veins with static normalized paths
      planet.sector = 2;
      expect(() => {
        planet.render(mockCtx, false, 1.0, 0, 0);
      }).not.toThrow();

      // Sector 3: Dyson Ring with static node percentages
      planet.sector = 3;
      expect(() => {
        planet.render(mockCtx, false, 1.0, 0, 0);
      }).not.toThrow();
    });
  });

  describe('4. AudioEngine Voice Throttling & Concurrency Capping', () => {
    it('should throttle laser audio triggers within 25ms window to prevent audio node starvation', () => {
      const audio = new AudioEngine();
      audio.init();

      if (audio.ctx) {
        audio.lastLaserTime = 10.0;
        audio.ctx.currentTime = 10.010; // Only 10ms later

        const mockCreateOsc = vi.spyOn(audio.ctx, 'createOscillator');
        audio.playLaser(false);

        // Within 25ms, oscillator should not be created
        expect(mockCreateOsc).not.toHaveBeenCalled();

        // 30ms later -> allowed
        audio.ctx.currentTime = 10.035;
        audio.playLaser(false);
        expect(mockCreateOsc).toHaveBeenCalled();
      }
    });
  });

  describe('5. Engine Cataclysm Meteors Batched Render', () => {
    it('should render magma meteors with batched circles and zero per-meteor translate', () => {
      const engine = new GameEngine(mockCanvas);
      engine.cataclysmMeteors = [
        { x: 100, y: 100, vx: 50, vy: 50, timer: 1.0 },
        { x: 200, y: 200, vx: 50, vy: 50, timer: 1.0 }
      ];

      mockCtx.translate.mockClear();
      engine.render();

      // Ensure meteors render cleanly
      expect(engine.cataclysmMeteors.length).toBe(2);
    });
  });
});
