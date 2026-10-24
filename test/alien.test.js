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

  it('should trigger Boss Phase 2 Overdrive Siege at <= 50% HP with escort wing summon', () => {
    const boss = new Alien(500, 500, 'BOSS');
    expect(boss.isPhase2).toBe(false);
    expect(boss.maxHp).toBe(950);

    const onPhase2 = vi.fn();

    // Damage to 500 HP (> 50%)
    boss.takeDamage(450, null, null, false, onPhase2);
    expect(boss.isPhase2).toBe(false);
    expect(onPhase2).not.toHaveBeenCalled();

    // Damage past 50% threshold (hp becomes 400 <= 475)
    boss.takeDamage(100, null, null, false, onPhase2);
    expect(boss.isPhase2).toBe(true);
    expect(onPhase2).toHaveBeenCalledWith(boss);
  });

  it('should deflect frontal turret fire by 50% via 110° rotating shield arc in Phase 2, but allow rear hits and piercing attacks', () => {
    const boss = new Alien(500, 500, 'BOSS');
    boss.isPhase2 = true;
    boss.shieldAngle = 0; // Shield facing directly to the right (+X)
    boss.hp = 400;

    // 1. Frontal hit along shield vector (angle 0)
    const frontHitX = boss.x + 30;
    const frontHitY = boss.y;
    boss.takeDamage(40, frontHitX, frontHitY, false);
    // Deflected by 50%: damage is 20, HP goes from 400 to 380
    expect(boss.hp).toBe(380);

    // 2. Rear hit from behind (angle PI, 180 degrees away)
    const rearHitX = boss.x - 30;
    const rearHitY = boss.y;
    boss.takeDamage(40, rearHitX, rearHitY, false);
    // Not in 110° arc: takes full 40 damage, HP goes from 380 to 340
    expect(boss.hp).toBe(340);

    // 3. Piercing hit (Spark Nova / Ion Beam) hitting frontal shield
    boss.takeDamage(40, frontHitX, frontHitY, true); // isDirectPierce = true
    // Pierces through shield: takes full 40 damage, HP goes from 340 to 300
    expect(boss.hp).toBe(300);
  });
});
