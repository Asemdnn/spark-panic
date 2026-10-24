// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
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
});
