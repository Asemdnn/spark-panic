// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../src/game/engine.js';
import { saveSystem, DEFAULT_SETTINGS } from '../src/engine/storage.js';

describe('Spark Panic v3.2: Cosmic Nebulae, Planetary Weather & Cinematic Shaders', () => {
  let engine;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
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
      closePath: vi.fn(),
      clip: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
    };

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx)
    };

    engine = new GameEngine(mockCanvas);
  });

  describe('1. Multi-Octave Volumetric Cosmic Nebulae (drawVolumetricNebulae)', () => {
    it('should initialize multi-octave cloud nodes with 3 distinct octaves and parameters', () => {
      expect(engine.nebulaClouds).toBeDefined();
      expect(engine.nebulaClouds.length).toBe(20);

      const octaves = new Set(engine.nebulaClouds.map(c => c.octave));
      expect(octaves.has(1)).toBe(true);
      expect(octaves.has(2)).toBe(true);
      expect(octaves.has(3)).toBe(true);

      for (const cloud of engine.nebulaClouds) {
        expect(cloud.u).toBeGreaterThanOrEqual(0);
        expect(cloud.u).toBeLessThanOrEqual(1);
        expect(cloud.v).toBeGreaterThanOrEqual(0);
        expect(cloud.v).toBeLessThanOrEqual(1);
        expect(cloud.baseRadius).toBeGreaterThan(0);
        expect(cloud.parallaxFactor).toBeGreaterThan(0);
        expect(cloud.alpha).toBeGreaterThan(0);
        expect(['primary', 'secondary']).toContain(cloud.colorKey);
      }
    });

    it('should map sector-themed color gradients accurately for Sectors I through IV', () => {
      // Sector I: Cyan & Aquamarine Celestial Aurora ('#00e5ff', '#0284c7')
      const s1 = engine.getSectorNebulaColors(1);
      expect(s1.primary).toBe('#00e5ff');
      expect(s1.secondary).toBe('#0284c7');
      expect(s1.name).toContain('Celestial Aurora');

      // Sector II: Amber & Solar Crimson Magma Clouds ('#ff3d00', '#f59e0b')
      const s2 = engine.getSectorNebulaColors(2);
      expect(s2.primary).toBe('#ff3d00');
      expect(s2.secondary).toBe('#f59e0b');
      expect(s2.name).toContain('Magma Clouds');

      // Sector III: Deep Amethyst & Indigo Quantum Nebulae ('#a855f7', '#6366f1')
      const s3 = engine.getSectorNebulaColors(3);
      expect(s3.primary).toBe('#a855f7');
      expect(s3.secondary).toBe('#6366f1');
      expect(s3.name).toContain('Quantum Nebulae');

      // Sector IV: Emerald & Electric Violet Accretion Swirls ('#10b981', '#7c3aed')
      const s4 = engine.getSectorNebulaColors(4);
      expect(s4.primary).toBe('#10b981');
      expect(s4.secondary).toBe('#7c3aed');
      expect(s4.name).toContain('Accretion Swirls');
    });

    it('should execute drawVolumetricNebulae across all 4 sectors without error', () => {
      for (let s = 1; s <= 4; s++) {
        engine.planet.sector = s;
        mockCtx.fill.mockClear();
        expect(() => engine.drawVolumetricNebulae(mockCtx)).not.toThrow();
        expect(mockCtx.fill).toHaveBeenCalled();
      }
    });

    it('should respect volumetricNebula setting toggle when disabled', () => {
      mockCtx.fill.mockClear();
      vi.spyOn(engine, 'getSettings').mockReturnValue({ volumetricNebula: false });
      engine.drawVolumetricNebulae(mockCtx);
      expect(mockCtx.fill).not.toHaveBeenCalled();
    });

    it('should register and update radial ripple displacement on Nova or Cataclysm detonations', () => {
      expect(engine.nebulaRipples).toBeDefined();
      const initialCount = engine.nebulaRipples.length;

      // Add a detonation ripple
      engine.addNebulaRipple(400, 300, 350, 45);
      expect(engine.nebulaRipples.length).toBe(initialCount + 1);

      const rip = engine.nebulaRipples[engine.nebulaRipples.length - 1];
      expect(rip.x).toBe(400);
      expect(rip.y).toBe(300);
      expect(rip.radius).toBe(10);
      expect(rip.amplitude).toBe(45);

      // Advance time and verify radius expansion & alpha decay
      const prevRadius = rip.radius;
      engine.update(0.1);
      expect(rip.radius).toBeGreaterThan(prevRadius);

      // Draw volumetric nebulae with active ripple and verify no throw
      expect(() => engine.drawVolumetricNebulae(mockCtx)).not.toThrow();
    });
  });

  describe('2. Planetary Atmospheric Weather Shaders (drawPlanetEntity)', () => {
    it('should execute dynamic Rayleigh scattering rim glow with sun angle rotation', () => {
      expect(() => engine.drawRayleighScattering(mockCtx, engine.planet, 75, 1.5, '#00e5ff')).not.toThrow();
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.arc).toHaveBeenCalled();
    });

    it('should render Sector I drifting cloud whorls with soft continent shadow projection', () => {
      mockCtx.fill.mockClear();
      mockCtx.stroke.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 1, engine.planet, 75, 2.0, 'astral');
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should render Sector II molten tectonic magma rivers with heat shimmer', () => {
      mockCtx.stroke.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 2, engine.planet, 75, 3.5, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled();
    });

    it('should render Sector III bio-luminescent polar aurora curtains across both poles', () => {
      mockCtx.stroke.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 3, engine.planet, 75, 4.0, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should render Sector IV gravitational accretion disc ring matter spiraling inward', () => {
      mockCtx.stroke.mockClear();
      mockCtx.fill.mockClear();
      engine.drawPlanetaryWeather(mockCtx, 4, engine.planet, 75, 5.0, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should render complete drawPlanetEntity incorporating weather and Rayleigh scattering', () => {
      for (let s = 1; s <= 4; s++) {
        engine.planet.sector = s;
        expect(() => engine.drawPlanetEntity(mockCtx)).not.toThrow();
      }
    });
  });

  describe('3. Enhanced Cinematic Post-Processing Pipeline', () => {
    it('should render Vector Oscilloscope CRT curvature, raster scanline flicker, and phosphor persistence', () => {
      engine.setArtStyle('vector');
      mockCtx.fillRect.mockClear();
      mockCtx.stroke.mockClear();

      engine.applyPostProcessing(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should render Comic mode screen vignette and Ben-Day halftone shading on active shockwaves', () => {
      engine.setArtStyle('comic');
      engine.particles.novas = [{ x: 400, y: 300, radius: 60, alpha: 0.8 }];
      mockCtx.fill.mockClear();

      engine.applyPostProcessing(mockCtx);
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should render Astral mode edge chromatic aberration and lens flare on mega-combos or heavy shakes', () => {
      engine.setArtStyle('astral');
      engine.combo = 12; // mega-combo >= 10
      mockCtx.fillRect.mockClear();
      mockCtx.fill.mockClear();

      engine.applyPostProcessing(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();

      // Test heavy screen shake trigger
      engine.combo = 0;
      engine.shakeTimer = 0.3;
      engine.shakeIntensity = 8;
      mockCtx.fillRect.mockClear();

      engine.applyPostProcessing(mockCtx);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should respect crtPostProcessing setting toggle when disabled', () => {
      engine.setArtStyle('vector');
      mockCtx.fillRect.mockClear();
      vi.spyOn(engine, 'getSettings').mockReturnValue({ crtPostProcessing: false });

      engine.applyPostProcessing(mockCtx);
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });
  });
});
