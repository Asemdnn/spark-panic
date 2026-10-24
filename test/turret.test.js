// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuardianTurret } from '../src/game/turret.js';

describe('360° Orbital Guardian Turret (v2.0)', () => {
  let turret;

  beforeEach(() => {
    turret = new GuardianTurret();
  });

  it('should initialize pointing upward with auto-fire enabled', () => {
    expect(turret.angle).toBeCloseTo(-Math.PI / 2);
    expect(turret.autoFire).toBe(true);
    expect(turret.level).toBe(0);
  });

  it('should smoothly rotate toward pointer coordinates', () => {
    // Planet at (400, 300), pointer at (500, 300) -> angle should be 0 (rightward)
    turret.update(1.0, 500, 300, 400, 300, false);
    expect(turret.angle).toBeCloseTo(0, 0.5);
  });

  it('should scale damage and fire rate with Armory level', () => {
    const baseDmg = turret.getDamage(false);
    expect(baseDmg).toBe(12);

    turret.setUpgradeLevel(4);
    const upgradedDmg = turret.getDamage(false);
    // 12 + 4 * 4.5 = 30
    expect(upgradedDmg).toBe(30);
    expect(turret.fireInterval).toBeLessThan(turret.baseFireInterval);
  });

  it('should boost damage and pierce in Aegis Overdrive mode', () => {
    turret.setUpgradeLevel(2);
    const normalDmg = turret.getDamage(false);
    const overdriveDmg = turret.getDamage(true);
    expect(overdriveDmg).toBe(normalDmg * 1.5);
  });

  it('should fire single bolt at level 0-2, twin bolts at level 3-4, and triple bolts at level 5-6', () => {
    const mockOnFire = vi.fn();

    // Lv 0 -> Single bolt
    turret.setUpgradeLevel(0);
    turret.fireTimer = 1.0;
    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire);
    expect(mockOnFire).toHaveBeenCalled();
    let firedBolts = mockOnFire.mock.calls[0][0];
    expect(firedBolts.length).toBe(1);

    // Lv 3 -> Twin bolts
    mockOnFire.mockClear();
    turret.setUpgradeLevel(3);
    turret.fireTimer = 1.0;
    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire);
    expect(mockOnFire).toHaveBeenCalled();
    firedBolts = mockOnFire.mock.calls[0][0];
    expect(firedBolts.length).toBe(2);

    // Lv 5 -> Triple bolts
    mockOnFire.mockClear();
    turret.setUpgradeLevel(5);
    turret.fireTimer = 1.0;
    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire);
    expect(mockOnFire).toHaveBeenCalled();
    firedBolts = mockOnFire.mock.calls[0][0];
    expect(firedBolts.length).toBe(3);
  });

  it('should respect autoFire toggle and manual firing states', () => {
    const mockOnFire = vi.fn();
    turret.autoFire = false;
    turret.isFiring = false;
    turret.fireTimer = 1.0;

    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire);
    expect(mockOnFire).not.toHaveBeenCalled();

    // Enable manual firing
    turret.isFiring = true;
    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire);
    expect(mockOnFire).toHaveBeenCalled();
  });

  it('should apply Quad-Pulse Overclock mode (+35% fire rate and +2 extra barrels)', () => {
    const mockOnFire = vi.fn();
    // At Level 0 normally 1 barrel, with Overclock becomes 3 barrels
    turret.setUpgradeLevel(0);
    turret.fireTimer = 1.0;

    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire, true); // isOverclock = true
    expect(mockOnFire).toHaveBeenCalled();
    const firedBoltsLv0 = mockOnFire.mock.calls[0][0];
    expect(firedBoltsLv0.length).toBe(3); // 1 + 2 = 3

    // At Level 3 normally 2 barrels, with Overclock becomes 4 barrels
    mockOnFire.mockClear();
    turret.setUpgradeLevel(3);
    turret.fireTimer = 1.0;

    turret.update(0.1, 400, 100, 400, 300, false, mockOnFire, true); // isOverclock = true
    expect(mockOnFire).toHaveBeenCalled();
    const firedBoltsLv3 = mockOnFire.mock.calls[0][0];
    expect(firedBoltsLv3.length).toBe(4); // 2 + 2 = 4
  });
});
