// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Planet } from '../src/game/planet.js';
import { PLANETS } from '../src/config.js';

describe('Central Living Planet & Aegis Shield Engine (v2.0)', () => {
  let planet;
  const mockCanvas = { width: 800, height: 600 };

  beforeEach(() => {
    planet = new Planet(mockCanvas);
    planet.setPlanet(PLANETS[0], 0); // Aerilon, shield level 0
  });

  it('should initialize at center coordinates with 100 max shield and 100 core HP', () => {
    expect(planet.x).toBe(400);
    expect(planet.y).toBe(318);
    expect(planet.shield).toBe(100);
    expect(planet.maxShield).toBe(100);
    expect(planet.coreHp).toBe(100);
    expect(planet.maxCoreHp).toBe(100);
    expect(planet.shieldRadius).toBeGreaterThan(planet.planetRadius);
  });

  it('should scale max shield and max core HP with Armory shieldGrid upgrade levels', () => {
    const upgradedPlanet = new Planet(mockCanvas);
    upgradedPlanet.setPlanet(PLANETS[0], 3); // Level 3 (+66%)

    expect(upgradedPlanet.maxShield).toBe(166);
    expect(upgradedPlanet.shield).toBe(166);
    expect(upgradedPlanet.maxCoreHp).toBe(166);
    expect(upgradedPlanet.coreHp).toBe(166);
  });

  it('should absorb damage in Aegis shield first without reducing Core HP', () => {
    planet.damage(30, 400, 200);

    expect(planet.shield).toBe(70);
    expect(planet.coreHp).toBe(100);
    expect(planet.shieldRipples.length).toBe(1);
    expect(planet.craters.length).toBe(0);
  });

  it('should overflow damage to Core HP and generate surface craters when shield breaks', () => {
    planet.damage(120, 400, 200);

    expect(planet.shield).toBe(0);
    expect(planet.coreHp).toBe(80); // 120 - 100 = 20 damage to core
    expect(planet.craters.length).toBe(1);
  });

  it('should regenerate shield after 3.5s delay out of combat', () => {
    planet.damage(50, 400, 200);
    expect(planet.shield).toBe(50);
    expect(planet.outOfCombatTimer).toBe(0);

    // Advance 2 seconds (not yet 3.5s)
    planet.update(2.0);
    expect(planet.shield).toBe(50);

    // Advance another 2 seconds (total 4.0s > 3.5s)
    planet.update(2.0);
    expect(planet.shield).toBeGreaterThan(50);
  });

  it('should not regenerate shield if taking damage continually within 3.5s', () => {
    planet.damage(50, 400, 200);
    planet.update(2.0);
    planet.damage(10, 400, 200); // resets outOfCombatTimer
    planet.update(2.0);
    expect(planet.shield).toBe(40);
  });

  it('should restore shield with restoreShield without exceeding maxShield', () => {
    planet.damage(60, 400, 200);
    expect(planet.shield).toBe(40);

    const healed = planet.restoreShield(35);
    expect(healed).toBe(35);
    expect(planet.shield).toBe(75);

    planet.restoreShield(50);
    expect(planet.shield).toBe(100);
  });

  it('should update geometry properly on resize', () => {
    planet.resize(1000, 800);
    expect(planet.x).toBe(500);
    expect(planet.y).toBe(424);
    expect(planet.planetRadius).toBeGreaterThan(68);
    expect(planet.shieldRadius).toBe(planet.planetRadius + 22);
  });

  describe('Planetary Spherical Shader & Texture Caching Engine', () => {
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
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        clip: vi.fn(),
        setLineDash: vi.fn(),
        drawImage: vi.fn(),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
      };
    });

    it('should expose static textureCache and preloadAll without throwing', () => {
      expect(Planet.textureCache).toBeInstanceOf(Map);
      Planet.clearTextureCache();
      expect(Planet.textureCache.size).toBe(0);

      expect(() => Planet.preloadAll(PLANETS)).not.toThrow();
      expect(Planet.textureCache.size).toBeGreaterThan(0);
    });

    it('should handle loadTexture with string id, slug, or config object', () => {
      const p = new Planet(mockCanvas);
      const img1 = p.loadTexture('genesis');
      expect(img1).toBeDefined();

      const img2 = p.loadTexture({ id: 'boreas', name: 'Boreas Prime' });
      expect(img2).toBeDefined();

      // Returns null gracefully for null/undefined
      expect(p.loadTexture(null)).toBeNull();
      expect(p.loadTexture(undefined)).toBeNull();
    });

    it('should reuse cached texture entry on duplicate load calls', () => {
      Planet.clearTextureCache();
      const p1 = new Planet(mockCanvas);
      const img1 = p1.loadTexture('chronos');
      const p2 = new Planet(mockCanvas);
      const img2 = p2.loadTexture('chronos');

      expect(img1).toBe(img2);
      expect(Planet.textureCache.get('chronos').img).toBe(img1);
    });

    it('should render procedural continent swirls when texture is not loaded', () => {
      planet.texture = null;
      planet.textureLoaded = false;
      mockCtx.drawImage.mockClear();
      mockCtx.ellipse.mockClear();

      planet.render(mockCtx, false, 1.0);

      expect(mockCtx.drawImage).not.toHaveBeenCalled();
      expect(mockCtx.ellipse).toHaveBeenCalled();
      expect(mockCtx.createRadialGradient).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should render texture with wrap-around drawImage when textureLoaded is true', () => {
      const dummyImg = {};
      planet.texture = dummyImg;
      planet.textureLoaded = true;
      mockCtx.drawImage.mockClear();

      planet.render(mockCtx, false, 1.5);

      expect(mockCtx.drawImage).toHaveBeenCalledTimes(2);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        dummyImg,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render 3D spherical night-side terminator and limb darkening without error', () => {
      mockCtx.createRadialGradient.mockClear();
      planet.render(mockCtx, false, 2.5);

      // Terminator shadow + limb darkening + atmosphere glow create radial gradients
      expect(mockCtx.createRadialGradient).toHaveBeenCalled();
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should handle uninitialized Image or missing environment gracefully', () => {
      Planet.clearTextureCache();
      const origImage = globalThis.Image;
      const origWinImage = typeof window !== 'undefined' ? window.Image : undefined;
      try {
        // @ts-ignore
        globalThis.Image = undefined;
        if (typeof window !== 'undefined') window.Image = undefined;

        const p = new Planet(mockCanvas);
        expect(() => p.loadTexture('aerilon_fresh')).not.toThrow();
        expect(p.texture).toBeNull();
        expect(p.textureLoaded).toBe(false);

        expect(() => Planet.preloadAll(PLANETS)).not.toThrow();
      } finally {
        globalThis.Image = origImage;
        if (typeof window !== 'undefined') window.Image = origWinImage;
      }
    });
  });
});
