// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { DefenseSatellite } from '../src/game/satellite.js';

describe('Autonomous Orbital Defense Satellites (v2.0)', () => {
  it('should initialize with distinct orbital angle and firing timer', () => {
    const sat1 = new DefenseSatellite(0, 3);
    const sat2 = new DefenseSatellite(1, 3);
    const sat3 = new DefenseSatellite(2, 3);

    expect(sat1.angle).toBeCloseTo(0);
    expect(sat2.angle).toBeCloseTo((1 / 3) * Math.PI * 2);
    expect(sat3.angle).toBeCloseTo((2 / 3) * Math.PI * 2);
    expect(sat1.damage).toBe(18);
  });

  it('should advance in orbit around planet outside shield radius', () => {
    const sat = new DefenseSatellite(0, 1);
    const planetX = 400;
    const planetY = 300;
    const shieldR = 90;

    sat.update(0.5, planetX, planetY, shieldR, [], []);
    expect(sat.x).toBeDefined();
    expect(sat.y).toBeDefined();
    const distToPlanet = Math.hypot(sat.x - planetX, sat.y - planetY);
    expect(distToPlanet).toBeGreaterThan(shieldR);
  });

  it('should prioritize incoming torpedoes over aliens when firing lasers', () => {
    const sat = new DefenseSatellite(0, 1);
    sat.fireTimer = 0; // ready to fire
    const mockOnFire = vi.fn();

    const planetX = 400;
    const planetY = 300;
    const shieldR = 90;

    const mockAlien = { x: 450, y: 350, alive: true };
    const mockTorpedo = { x: 440, y: 320, alive: true };

    sat.update(0.1, planetX, planetY, shieldR, [mockAlien], [mockTorpedo], mockOnFire);

    expect(mockOnFire).toHaveBeenCalled();
    // Verify target coordinates are for the torpedo
    const targetX = mockOnFire.mock.calls[0][2];
    const targetY = mockOnFire.mock.calls[0][3];
    expect(targetX).toBe(mockTorpedo.x);
    expect(targetY).toBe(mockTorpedo.y);
  });

  it('should target nearest alien if no torpedoes are present', () => {
    const sat = new DefenseSatellite(0, 1);
    sat.fireTimer = 0;
    const mockOnFire = vi.fn();

    const planetX = 400;
    const planetY = 300;
    const shieldR = 90;

    const mockAlien = { x: 450, y: 350, alive: true };
    sat.update(0.1, planetX, planetY, shieldR, [mockAlien], [], mockOnFire);

    expect(mockOnFire).toHaveBeenCalled();
    const targetX = mockOnFire.mock.calls[0][2];
    const targetY = mockOnFire.mock.calls[0][3];
    expect(targetX).toBe(mockAlien.x);
    expect(targetY).toBe(mockAlien.y);
  });
});
