// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StarMap } from '../src/game/star-map.js';
import { PLANETS, SECTORS } from '../src/config.js';
import { storage } from '../src/engine/storage.js';

describe('StarMap Interactive Celestial Engine', () => {
  let starMap;
  let mockCanvasManager;

  beforeEach(() => {
    storage.resetAll();
    mockCanvasManager = {
      virtualWidth: 720,
      virtualHeight: 1280,
      dpr: 1,
      scale: 1,
      canvas: { width: 1024, height: 768, style: {} }
    };
    starMap = new StarMap(mockCanvasManager);
  });

  it('should initialize 20 celestial worlds orbiting Sol Genesis with progressive radii and Keplerian speeds', () => {
    expect(starMap.planets.length).toBe(20);

    for (let i = 0; i < starMap.planets.length; i++) {
      const p = starMap.planets[i];
      expect(p.level).toBe(i + 1);
      expect(p.orbitRadius).toBeGreaterThan(200);
      if (i > 0) {
        expect(p.orbitRadius).toBeGreaterThan(starMap.planets[i - 1].orbitRadius);
        expect(p.orbitSpeed).toBeLessThan(starMap.planets[i - 1].orbitSpeed);
      }
      expect(p.palette).toBeDefined();
      expect(p.palette.mid).toBeDefined();
    }
  });

  it('should initialize cosmic starfield and alien patrol drones', () => {
    expect(starMap.stars.length).toBeGreaterThanOrEqual(300);
    expect(starMap.alienDrones.length).toBeGreaterThanOrEqual(30);
  });

  it('should accurately convert screen coordinates to universe world coordinates', () => {
    starMap.cameraX = 100;
    starMap.cameraY = -50;
    starMap.zoom = 1.0;

    // Center of screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const centerWorld = starMap.screenToWorld(centerX, centerY);

    expect(centerWorld.x).toBeCloseTo(100);
    expect(centerWorld.y).toBeCloseTo(-50);

    // Zoomed world coordinates
    starMap.zoom = 2.0;
    const offsetWorld = starMap.screenToWorld(centerX + 200, centerY + 100);
    expect(offsetWorld.x).toBeCloseTo(100 + 100); // 200 / 2 = 100 offset
    expect(offsetWorld.y).toBeCloseTo(-50 + 50); // 100 / 2 = 50 offset
  });

  it('should pan camera smoothly during drag gestures and release planet lock', () => {
    starMap.selectedPlanet = starMap.planets[0];
    starMap.handlePointerDown(500, 400);

    expect(starMap.isDragging).toBe(true);
    expect(starMap.selectedPlanet).toBeNull(); // lock released

    starMap.handlePointerMove(450, 350); // dragged 50px left, 50px up
    expect(starMap.targetCameraX).toBe(50);
    expect(starMap.targetCameraY).toBe(50);
  });

  it('should detect planet clicks and fire onSelectPlanet callback', () => {
    const callback = vi.fn();
    starMap.onSelectPlanet(callback);

    const targetPlanet = starMap.planets[0];
    // Center camera on target planet so it sits at screen center
    starMap.cameraX = targetPlanet.x;
    starMap.cameraY = targetPlanet.y;
    starMap.targetCameraX = targetPlanet.x;
    starMap.targetCameraY = targetPlanet.y;
    starMap.zoom = 1;

    const screenCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    starMap.handlePointerDown(screenCenter.x, screenCenter.y);
    const clicked = starMap.handlePointerUp(screenCenter.x, screenCenter.y);

    expect(clicked).toBe(true);
    expect(starMap.selectedPlanet).toBe(targetPlanet);
    expect(callback).toHaveBeenCalledWith(targetPlanet);
  });

  it('should clamp wheel zooming within min and max boundaries', () => {
    starMap.targetZoom = 1.0;

    // Zoom in repeatedly
    for (let i = 0; i < 20; i++) {
      starMap.handleWheel(-100);
    }
    expect(starMap.targetZoom).toBeLessThanOrEqual(1.85);

    // Zoom out repeatedly
    for (let i = 0; i < 30; i++) {
      starMap.handleWheel(100);
    }
    expect(starMap.targetZoom).toBeGreaterThanOrEqual(0.35);
  });

  it('should focus sectors, galactic core, and current objective', () => {
    // Focus Sector 1
    starMap.focusSector(1);
    expect(starMap.targetZoom).toBeCloseTo(0.72);

    // Focus Sol Genesis Core
    starMap.focusCore();
    expect(starMap.targetCameraX).toBe(0);
    expect(starMap.targetCameraY).toBe(0);
    expect(starMap.targetZoom).toBeCloseTo(0.85);

    // Focus Objective
    storage.recordLevelCompletion(1, 1000, 3); // Unlocks level 2
    starMap.focusCurrentObjective();
    expect(starMap.selectedPlanet.level).toBe(2);
  });

  it('should advance planetary orbits and update alien swarm during physics simulation', () => {
    const p0 = starMap.planets[0];
    const initialAngle = p0.orbitAngle;
    const initialDroneAngle = starMap.alienDrones[0].angle;

    starMap.update(0.1);

    expect(p0.orbitAngle).toBeGreaterThan(initialAngle);
    expect(starMap.alienDrones[0].angle).not.toBe(initialDroneAngle);
    expect(starMap.solarPhase).toBeGreaterThan(0);
  });

  it('should render star map onto canvas without runtime exceptions', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      setLineDash: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    };

    expect(() => starMap.render(mockCtx)).not.toThrow();
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });
});
