// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../src/game/engine.js';
import { PLANETS } from '../src/config.js';
import { storage } from '../src/engine/storage.js';

describe('GameEngine Coordinator & 360° Defense Loop (v2.0)', () => {
  let engine;
  let mockCanvas;

  beforeEach(() => {
    storage.resetAll();
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => ({
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        setLineDash: vi.fn(),
        setTransform: vi.fn(),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
      }))
    };
    engine = new GameEngine(mockCanvas);
  });

  it('should initialize in TITLE state with base nova charges and clean stats', () => {
    expect(engine.state).toBe('TITLE');
    expect(engine.novaCharges).toBe(3);
    expect(engine.score).toBe(0);
    expect(engine.combo).toBe(0);
    expect(engine.enemiesVaporized).toBe(0);
  });

  it('should start campaign mission and configure planetary shield & waves', () => {
    engine.startMission(1, false); // Planet 1: Aerilon

    expect(engine.state).toBe('PLAYING');
    expect(engine.currentPlanetId).toBe(1);
    expect(engine.isEndlessMode).toBe(false);
    expect(engine.currentWave).toBe(1);
    expect(engine.totalWaves).toBe(PLANETS[0].waves);
    expect(engine.planet.data.name).toBe('Aerilon');
    expect(engine.planet.coreHp).toBe(100);
    expect(engine.planet.shield).toBe(100);
  });

  it('should consume a Spark Nova charge and launch expanding shockwave', () => {
    engine.startMission(1, false);
    const initialCharges = engine.novaCharges;

    const launched = engine.triggerSparkNova(450, 250);
    expect(launched).toBe(true);
    expect(engine.novaCharges).toBe(initialCharges - 1);
    expect(engine.particles.novas.length).toBe(1);

    // If out of charges, triggerSparkNova should return false
    engine.novaCharges = 0;
    const failedLaunch = engine.triggerSparkNova(450, 250);
    expect(failedLaunch).toBe(false);
  });

  it('should trigger cascading chain reaction and combo progression upon alien destruction', () => {
    engine.startMission(1, false);
    const mockAlien = {
      x: 450,
      y: 200,
      score: 45,
      color: '#e040fb',
      classKey: 'INTERCEPTOR',
      novaRadius: 74
    };

    engine.onAlienDestroyed(mockAlien);

    expect(engine.enemiesVaporized).toBe(1);
    expect(engine.score).toBe(45);
    expect(engine.combo).toBe(1);
    expect(engine.particles.novas.length).toBe(1); // secondary nova shockwave
    expect(engine.particles.sparks.length).toBe(1); // dropped cosmic spark
    expect(engine.projectiles.bolts.length).toBe(4); // Trident Quad Plasma Burst!
  });

  it('should execute Cryo-Cruiser stasis field death payload slowing nearby aliens', () => {
    engine.startMission(1, false);

    const cryo = {
      x: 400,
      y: 200,
      score: 50,
      color: '#00e676',
      classKey: 'CRYO',
      novaRadius: 95
    };

    const nearbyAlien = {
      x: 430,
      y: 210,
      alive: true,
      freeze: vi.fn()
    };

    engine.aliens = [nearbyAlien];
    engine.onAlienDestroyed(cryo);

    expect(nearbyAlien.freeze).toHaveBeenCalledWith(4.5);
  });

  it('should calculate 3 stars for Core HP >= 80% on mission victory', () => {
    engine.startMission(1, false);
    engine.planet.coreHp = 90; // 90%
    engine.planet.maxCoreHp = 100;

    const stars = engine.calculateStars();
    expect(stars).toBe(3);

    engine.planet.coreHp = 60; // 60%
    expect(engine.calculateStars()).toBe(2);

    engine.planet.coreHp = 25; // 25%
    expect(engine.calculateStars()).toBe(1);
  });

  it('should handle Endless Cosmic Siege mode scaling', () => {
    engine.startMission(1, true); // Endless mode

    expect(engine.isEndlessMode).toBe(true);
    expect(engine.currentWave).toBe(1);
    expect(engine.totalWaves).toBe(999);
  });

  it('should transition to DEFEAT if planetary core HP reaches 0', () => {
    engine.startMission(1, false);
    engine.planet.coreHp = 0;

    // Simulate game loop update
    engine.update(0.1);
    expect(engine.state).toBe('DEFEAT');
  });
});
