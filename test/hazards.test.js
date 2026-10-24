// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HazardManager } from '../src/game/hazards.js';

describe('Sector Environmental Hazards System (v2.1)', () => {
  let hazards;

  beforeEach(() => {
    hazards = new HazardManager();
  });

  it('should initialize with correct hazard info for each sector', () => {
    hazards.reset(1);
    expect(hazards.getHazardInfo().name).toContain('ASTEROID');

    hazards.reset(2);
    expect(hazards.getHazardInfo().name).toContain('ION NEBULA');

    hazards.reset(3);
    expect(hazards.getHazardInfo().name).toContain('GRAVITY');

    hazards.reset(4);
    expect(hazards.getHazardInfo().name).toContain('SOLAR CORONA');
  });

  it('should spawn, drift, and detect hits on Sector I Drifting Asteroids', () => {
    hazards.reset(1);
    // Fast-forward spawn timer
    hazards.asteroidTimer = 0.05;
    hazards.update(0.1, 400, 300, 75, []);

    expect(hazards.asteroids.length).toBeGreaterThan(0);
    const ast = hazards.asteroids[0];
    expect(ast.radius).toBeGreaterThan(10);

    const onShattered = vi.fn();
    // Hit asteroid directly at its position
    const hit = hazards.checkHitAsteroids(ast.x, ast.y, ast.radius + 5, 20, onShattered);
    expect(hit).toBe(true);
    expect(onShattered).toHaveBeenCalledWith(ast.x, ast.y);
    expect(hazards.asteroids.length).toBe(0);
  });

  it('should detect when coordinates are inside Sector II Ionized Nebula Clouds', () => {
    hazards.reset(2);
    expect(hazards.nebulaClouds.length).toBe(2);

    const cloud = hazards.nebulaClouds[0];
    // Exact center of nebula cloud
    expect(hazards.isInsideNebula(cloud.x, cloud.y)).toBe(true);

    // Far outside any cloud
    expect(hazards.isInsideNebula(cloud.x + 9999, cloud.y + 9999)).toBe(false);
  });

  it('should attract alien ships with Sector III Gravity Well Singularity', () => {
    hazards.reset(3);
    expect(hazards.singularity).not.toBeNull();

    const sing = hazards.singularity;
    const mockAlien = {
      x: sing.x + 100,
      y: sing.y,
      vx: 0,
      vy: 0,
      alive: true
    };

    const initialDist = Math.hypot(mockAlien.x - sing.x, mockAlien.y - sing.y);
    hazards.update(0.5, 400, 300, 75, [mockAlien]);

    const newDist = Math.hypot(mockAlien.x - sing.x, mockAlien.y - sing.y);
    // Alien pulled closer to singularity
    expect(newDist).toBeLessThan(initialDist);
  });

  it('should trigger Sector IV Solar Corona flare waves that pulse outward', () => {
    hazards.reset(4);
    hazards.solarFlareTimer = 0.05;

    const onPulse = vi.fn();
    hazards.update(0.1, 400, 300, 75, [], null, onPulse);

    expect(onPulse).toHaveBeenCalledWith(400, 300, 75 + 75);
    expect(hazards.activeSolarFlare).not.toBeNull();
  });
});
