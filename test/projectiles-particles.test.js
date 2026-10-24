// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { ProjectileManager } from '../src/game/projectiles.js';
import { ParticleEngine } from '../src/game/particles.js';
import { Alien } from '../src/game/alien.js';

describe('Projectiles & Particle FX Engine (v2.0)', () => {
  it('should spawn, update, and manage player plasma bolts and torpedoes', () => {
    const pm = new ProjectileManager();
    expect(pm.bolts.length).toBe(0);
    expect(pm.torpedoes.length).toBe(0);

    // Spawn turret bolts
    pm.spawnTurretBolts(400, 300, 90, [{
      angle: 0,
      speed: 500,
      damage: 15,
      color: '#00e5ff',
      pierce: 1
    }]);

    expect(pm.bolts.length).toBe(1);
    expect(pm.bolts[0].vx).toBeCloseTo(500);

    // Spawn enemy siege torpedo
    pm.spawnTorpedo(500, 300, Math.PI, 150, 12, '#e040fb');
    expect(pm.torpedoes.length).toBe(1);

    // Clear
    pm.clear();
    expect(pm.bolts.length).toBe(0);
    expect(pm.torpedoes.length).toBe(0);
  });

  it('should spawn expanding Chain Novas and trigger hit callback on alive aliens', () => {
    const pe = new ParticleEngine();
    const mockHitNova = vi.fn();

    pe.spawnNova(450, 300, 100, '#00e5ff', 35, true);
    expect(pe.novas.length).toBe(1);

    const alien = new Alien(460, 300, 'SCOUT');
    pe.update(0.1, 400, 300, 90, [alien], mockHitNova);

    expect(mockHitNova).toHaveBeenCalled();
  });

  it('should spawn magnetic cosmic sparks and magnetize them toward the orbital turret', () => {
    const pe = new ParticleEngine();
    const mockCollectSpark = vi.fn();

    pe.spawnCosmicSpark(420, 300, 2);
    expect(pe.sparks.length).toBe(1);

    // Update with turret radius: spark should fly toward turret and collect
    pe.update(1.0, 400, 300, 80, [], null, mockCollectSpark);
    expect(mockCollectSpark).toHaveBeenCalled();
  });

  it('should create and fade floating combat text callouts', () => {
    const pe = new ParticleEngine();
    pe.addFloater(400, 300, 'COMBO x5!', '#ffd700', 18);
    expect(pe.floaters.length).toBe(1);
    expect(pe.floaters[0].text).toBe('COMBO x5!');

    // Update over its lifetime
    pe.update(1.2, 400, 300, 80, []);
    expect(pe.floaters.length).toBe(0);
  });
});
