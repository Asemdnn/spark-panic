// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { Alien } from '../src/game/alien.js';
import { ALIEN_CLASSES } from '../src/config.js';

describe('Alien Armada Invader Entities (v2.0)', () => {
  it('should initialize all 7 alien classes with correct base parameters', () => {
    const classes = ['SCOUT', 'INTERCEPTOR', 'CRYO', 'PHASE', 'DROPSHIP', 'DREADNOUGHT', 'BOSS'];

    classes.forEach(cls => {
      const alien = new Alien(100, 100, cls);
      const cfg = ALIEN_CLASSES[cls];
      expect(alien.classKey).toBe(cls);
      expect(alien.hp).toBe(cfg.hp);
      expect(alien.maxHp).toBe(cfg.hp);
      expect(alien.speed).toBe(cfg.speed);
      expect(alien.radius).toBe(cfg.radius);
      expect(alien.score).toBe(cfg.score);
      expect(alien.damage).toBe(cfg.damage);
      expect(alien.novaRadius).toBe(cfg.novaRadius);
      expect(alien.alive).toBe(true);
    });
  });

  it('should take damage and die when hp reaches 0', () => {
    const scout = new Alien(100, 100, 'SCOUT');
    expect(scout.hp).toBe(22);

    const isDead1 = scout.takeDamage(10);
    expect(isDead1).toBe(false);
    expect(scout.hp).toBe(12);
    expect(scout.alive).toBe(true);

    const isDead2 = scout.takeDamage(15);
    expect(isDead2).toBe(true);
    expect(scout.hp).toBeLessThanOrEqual(0);
    expect(scout.alive).toBe(false);
  });

  it('should apply cryo stasis freeze and slow speed by 75%', () => {
    const scout = new Alien(100, 100, 'SCOUT');
    expect(scout.frozenTimer).toBe(0);

    scout.freeze(4.5);
    expect(scout.frozenTimer).toBe(4.5);

    // Initial position
    const startX = scout.x;
    const startY = scout.y;

    // Update with freeze
    scout.update(1.0, 400, 300, 90);
    const distMovedFrozen = Math.hypot(scout.x - startX, scout.y - startY);

    // Unfrozen comparison
    const unfrozenScout = new Alien(100, 100, 'SCOUT');
    unfrozenScout.update(1.0, 400, 300, 90);
    const distMovedNormal = Math.hypot(unfrozenScout.x - startX, unfrozenScout.y - startY);

    expect(distMovedFrozen).toBeLessThan(distMovedNormal * 0.4);
  });

  it('should execute Phase-Shifter quantum warp blinking closer to planet', () => {
    const phase = new Alien(600, 600, 'PHASE');
    const planetX = 400;
    const planetY = 300;
    const initialDist = Math.hypot(planetX - phase.x, planetY - phase.y);

    // Trigger blink
    phase.blinkTimer = 0.05;
    phase.update(0.1, planetX, planetY, 90);

    const newDist = Math.hypot(planetX - phase.x, planetY - phase.y);
    // Should have jumped ~48px closer
    expect(initialDist - newDist).toBeGreaterThan(40);
  });

  it('should spawn mini scouts from Invasion Dropship', () => {
    const drop = new Alien(500, 500, 'DROPSHIP');
    const mockSpawnScout = vi.fn();

    drop.spawnTimer = 0.05;
    drop.update(0.1, 400, 300, 90, mockSpawnScout);

    expect(mockSpawnScout).toHaveBeenCalledWith(drop.x, drop.y);
    expect(drop.spawnTimer).toBe(4.5);
  });

  it('should fire 3-spread torpedo salvos from Sector Mothership Boss', () => {
    const boss = new Alien(500, 500, 'BOSS');
    const mockFireTorpedo = vi.fn();

    boss.torpedoTimer = 0.05;
    boss.update(0.1, 400, 300, 90, null, mockFireTorpedo);

    expect(mockFireTorpedo).toHaveBeenCalledTimes(3);
    expect(boss.torpedoTimer).toBe(3.5);
  });
});
