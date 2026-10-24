// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanetDefense } from '../src/game/planet-defense.js';
import { Orb } from '../src/game/orb.js';
import { Explosion } from '../src/game/explosion.js';
import { SPARK_TYPES, PLANETS } from '../src/config.js';

describe('Planet Defense & Atmospheric Planetary Shield System', () => {
  let planetDefense;
  let mockCanvasManager;

  beforeEach(() => {
    mockCanvasManager = {
      virtualWidth: 720,
      virtualHeight: 1280,
      addShake: vi.fn()
    };
    planetDefense = new PlanetDefense(mockCanvasManager);
  });

  it('should initialize with 100% planetary shield and correct celestial geometry', () => {
    expect(planetDefense.shieldHp).toBe(100);
    expect(planetDefense.maxShieldHp).toBe(100);
    expect(planetDefense.x).toBe(360);
    expect(planetDefense.y).toBe(1170);
    expect(planetDefense.planetRadius).toBe(240);
    expect(planetDefense.shieldRadius).toBe(315);
    expect(planetDefense.empEnergy).toBe(0);
    expect(planetDefense.turrets.length).toBe(2);
  });

  it('should take damage, trigger screen shake, and generate ripple effect on shield impact', () => {
    expect(planetDefense.shieldHits.length).toBe(0);

    planetDefense.damageShield(15, 360, 860);
    expect(planetDefense.shieldHp).toBe(85);
    expect(planetDefense.shieldHits.length).toBe(1);
    expect(planetDefense.shieldHits[0].x).toBe(360);
    expect(planetDefense.shieldHits[0].y).toBe(860);
    expect(mockCanvasManager.addShake).toHaveBeenCalled();

    // Shield should clamp at 0
    planetDefense.damageShield(100, 360, 860);
    expect(planetDefense.shieldHp).toBe(0);
  });

  it('should repair shield up to maxShieldHp when absorbing energy cores', () => {
    planetDefense.shieldHp = 60;
    const healed = planetDefense.repairShield(25);
    expect(healed).toBe(25);
    expect(planetDefense.shieldHp).toBe(85);

    // Should not exceed 100
    planetDefense.repairShield(30);
    expect(planetDefense.shieldHp).toBe(100);
  });

  it('should accumulate EMP energy and unleash EMP shockwave freezing alien armada', () => {
    expect(planetDefense.isEmpReady()).toBe(false);

    // Charge EMP
    planetDefense.chargeEmp(50);
    expect(planetDefense.empEnergy).toBe(50);
    expect(planetDefense.isEmpReady()).toBe(false);

    planetDefense.chargeEmp(60);
    expect(planetDefense.empEnergy).toBe(100);
    expect(planetDefense.isEmpReady()).toBe(true);

    // Setup invaders
    const orb1 = new Orb(200, 400, SPARK_TYPES.NORMAL, 720, 1280);
    const orb2 = new Orb(350, 500, SPARK_TYPES.MEGA, 720, 1280);
    const orbs = [orb1, orb2];

    const mockParticles = { spawnBurst: vi.fn() };
    const mockFloaters = { addMessage: vi.fn() };

    const triggered = planetDefense.triggerEmp(orbs, mockParticles, mockFloaters);
    expect(triggered).toBe(true);
    expect(planetDefense.empEnergy).toBe(0);
    expect(planetDefense.empWave).toBeDefined();
    expect(orb1.frozenTimer).toBeGreaterThan(0);
    expect(orb2.frozenTimer).toBeGreaterThan(0);
    expect(orb1.vy).toBeLessThan(0); // Repelled upward
    expect(mockFloaters.addMessage).toHaveBeenCalled();
  });

  it('should detect alien collision with shield dome and inflict damage while deflecting alien', () => {
    const planet = PLANETS[0];
    planetDefense.reset(planet);

    // Place alien right inside shield dome
    const invader = new Orb(360, 870, SPARK_TYPES.NORMAL, 720, 1280);
    invader.vy = 120;
    const orbs = [invader];

    planetDefense.update(0.016, orbs, [], null, null);

    expect(planetDefense.shieldHp).toBeLessThan(100);
    expect(invader.vy).toBeLessThan(0); // Bounced backward away from planet
  });

  it('should intercept alien bombardment bolts when player explosions touch them', () => {
    planetDefense.bombardmentBolts.push({
      x: 300,
      y: 400,
      vx: 0,
      vy: 200,
      color: '#ffe600',
      damage: 6
    });

    // Create explosion that overlaps bolt
    const explosion = new Explosion(300, 400, SPARK_TYPES.NORMAL, 1);
    explosion.update(0.2, 720, 1280); // Expand explosion
    expect(explosion.currentRadius).toBeGreaterThan(10);

    const mockParticles = { spawnBurst: vi.fn() };
    const mockFloaters = { addMessage: vi.fn() };

    planetDefense.update(0.016, [], [explosion], mockParticles, mockFloaters);

    // Bolt should be destroyed safely
    expect(planetDefense.bombardmentBolts.length).toBe(0);
    expect(mockFloaters.addMessage).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      'INTERCEPTED!',
      '#00f0ff',
      14
    );
  });

  it('should render celestial planet and planetary defense shield onto canvas without error', () => {
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      clip: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
    };

    planetDefense.reset(PLANETS[0]);
    expect(() => planetDefense.render(mockCtx)).not.toThrow();
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });
});
