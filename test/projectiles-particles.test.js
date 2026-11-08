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

  it('should strictly enforce the 250 active projectile hard cap across all spawning methods', () => {
    const pm = new ProjectileManager();
    // Pre-fill to 248 bolts
    for (let i = 0; i < 248; i++) {
      pm.addPlasmaBolt({ x: 0, y: 0, angle: 0, damage: 10 });
    }
    expect(pm.bolts.length).toBe(248);

    // Quad burst attempts to spawn 4 bolts, should cap at 250
    pm.spawnQuadBurst(100, 100, 20);
    expect(pm.bolts.length).toBe(250);

    // Additional addPlasmaBolt should return null and not exceed 250
    const res = pm.addPlasmaBolt({ x: 100, y: 100, angle: 0, damage: 10 });
    expect(res).toBeNull();
    expect(pm.bolts.length).toBe(250);

    // spawnTurretBolts should break at 250
    pm.spawnTurretBolts(400, 300, 90, [
      { angle: 0, speed: 500, damage: 10 },
      { angle: 0.5, speed: 500, damage: 10 }
    ]);
    expect(pm.bolts.length).toBe(250);
  });

  it('should safeguard Twin Wormhole Portals against ping-pong infinite warping', () => {
    const pm = new ProjectileManager();
    const wormholes = {
      life: 10,
      a: { x: 200, y: 200, radius: 28, color: '#00e5ff' },
      b: { x: 600, y: 400, radius: 28, color: '#e040fb' }
    };
    const mockPlanet = {
      x: 400,
      y: 300,
      engine: {
        wormholes,
        particles: null
      }
    };

    // Spawn a bullet inside portal A's radius
    pm.addPlasmaBolt({
      x: 200,
      y: 200,
      angle: 0,
      speed: 400,
      damage: 20
    });
    expect(pm.bolts.length).toBe(1);
    const bolt = pm.bolts[0];
    expect(bolt.warped).toBe(false);

    // Run first update: bullet should teleport to portal B and be marked warped: true
    pm.update(0.016, 800, 600, [], mockPlanet);
    expect(bolt.warped).toBe(true);
    expect(bolt.hasTeleported).toBe(true);
    expect(bolt.damage).toBe(29); // 20 * 1.45 = 29
    expect(bolt.pierce).toBe(3);  // 1 + 2 = 3

    // Manually place the already-warped bullet back into portal A or B
    bolt.x = wormholes.b.x;
    bolt.y = wormholes.b.y;
    const dmgBefore = bolt.damage;
    const pierceBefore = bolt.pierce;

    // Run second update: warped bullet MUST NOT teleport again
    pm.update(0.016, 800, 600, [], mockPlanet);
    expect(bolt.damage).toBe(dmgBefore);
    expect(bolt.pierce).toBe(pierceBefore);
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
