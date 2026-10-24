// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TacticalSkills } from '../src/game/skills.js';
import { Alien } from '../src/game/alien.js';

describe('Tactical Planetary Skills System (v2.0)', () => {
  let skills;

  beforeEach(() => {
    skills = new TacticalSkills();
  });

  it('should initialize all 3 tactical skills ready with base cooldowns', () => {
    expect(skills.canUseQ()).toBe(true);
    expect(skills.canUseW()).toBe(true);
    expect(skills.canUseE()).toBe(true);
    expect(skills.baseCdQ).toBe(9.0);
    expect(skills.baseCdW).toBe(12.0);
    expect(skills.baseCdE).toBe(14.0);
  });

  it('should reduce cooldowns with Armory tacticalCd levels', () => {
    skills.setCooldownReduction(3); // 3 * 12% = 36% reduction -> cdMultiplier = 0.64
    expect(skills.cdMultiplier).toBeCloseTo(0.64);

    skills.useSkillQ(0);
    expect(skills.timerQ).toBeCloseTo(9.0 * 0.64);
  });

  it('should activate Skill Q (Orbital Ion Beam) and damage enemies in its beam vector', () => {
    const success = skills.useSkillQ(0); // aim rightward along angle 0
    expect(success).toBe(true);
    expect(skills.ionBeamActive).toBe(true);
    expect(skills.ionBeamAngle).toBe(0);
    expect(skills.canUseQ()).toBe(false);

    // Alien in beam path (x: 500, y: 300) when planet is at (400, 300) -> angle = 0
    const alien = new Alien(500, 300, 'SCOUT');
    const prevHp = alien.hp;

    skills.update(0.1, 0, 400, 300, [alien], [], 1.0);
    expect(alien.hp).toBeLessThan(prevHp);
  });

  it('should activate Skill W (Planetary EMP Shockwave), destroy missiles, freeze aliens, and push non-bosses', () => {
    const success = skills.useSkillW(400, 300);
    expect(success).toBe(true);
    expect(skills.empActive).toBe(true);
    expect(skills.canUseW()).toBe(false);

    // Torpedo near planet
    const torpedo = { x: 420, y: 300, radius: 5, alive: true };
    // Alien at distance 70
    const scout = new Alien(470, 300, 'SCOUT');
    const startX = scout.x;

    // Simulate EMP expanding over the entities
    skills.empRadius = 60;
    skills.update(0.01, 0, 400, 300, [scout], [torpedo], 1.0);

    expect(torpedo.alive).toBe(false);
    expect(scout.frozenTimer).toBe(3.0);
    expect(scout.x).toBeGreaterThan(startX); // pushed outward
  });

  it('should activate Skill E (Aegis Overdrive), restoring 55% shield, granting +1 Nova, and setting overdrive timer', () => {
    const mockPlanet = {
      maxShield: 100,
      shield: 20,
      restoreShield: vi.fn(function(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
      })
    };
    const mockGainNova = vi.fn();

    const success = skills.useSkillE(mockPlanet, mockGainNova);
    expect(success).toBe(true);
    expect(skills.overdriveActive).toBe(true);
    expect(skills.overdriveTimer).toBe(6.0);
    expect(mockPlanet.restoreShield).toHaveBeenCalledWith(55);
    expect(mockGainNova).toHaveBeenCalledWith(1);
    expect(skills.canUseE()).toBe(false);

    // After 6 seconds, overdrive should end
    skills.update(6.1, 0, 400, 300, [], [], 1.0);
    expect(skills.overdriveActive).toBe(false);
  });
});
