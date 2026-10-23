import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/engine/storage.js';

describe('Storage Manager & Persistence', () => {
  beforeEach(() => {
    storage.resetAll();
  });

  it('should start with default values', () => {
    expect(storage.getUnlockedLevel()).toBe(1);
    expect(storage.getTotalStars()).toBe(0);
    expect(storage.getLevelStars(1)).toBe(0);
    expect(storage.isSoundMuted()).toBe(false);
  });

  it('should unlock next level and record stars', () => {
    storage.recordLevelCompletion(1, 15000, 3);

    expect(storage.getLevelStars(1)).toBe(3);
    expect(storage.getUnlockedLevel()).toBe(2);
    expect(storage.getTotalStars()).toBe(3);
  });

  it('should not downgrade stars if replay gets fewer stars', () => {
    storage.recordLevelCompletion(1, 20000, 3);
    storage.recordLevelCompletion(1, 10000, 1);

    expect(storage.getLevelStars(1)).toBe(3);
  });

  it('should record endless high scores correctly', () => {
    const isNew1 = storage.recordEndlessScore(5000, 3);
    expect(isNew1).toBe(true);
    expect(storage.getData().endlessHighScore).toBe(5000);
    expect(storage.getData().endlessMaxWave).toBe(3);

    const isNew2 = storage.recordEndlessScore(3000, 2);
    expect(isNew2).toBe(false);
    expect(storage.getData().endlessHighScore).toBe(5000);
  });

  it('should track max combo and total sparks popped', () => {
    storage.addSparksPopped(15);
    storage.addSparksPopped(10);
    expect(storage.getData().totalSparksPopped).toBe(25);

    storage.recordCombo(8);
    storage.recordCombo(14);
    storage.recordCombo(12);
    expect(storage.getData().maxCombo).toBe(14);
  });

  it('should toggle sound mute state', () => {
    expect(storage.isSoundMuted()).toBe(false);
    storage.setSoundMuted(true);
    expect(storage.isSoundMuted()).toBe(true);
    storage.setSoundMuted(false);
    expect(storage.isSoundMuted()).toBe(false);
  });
});
