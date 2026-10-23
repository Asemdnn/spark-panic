import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, GAME_STATES } from '../src/game/state.js';
import { Orb } from '../src/game/orb.js';
import { Explosion } from '../src/game/explosion.js';
import { SPARK_TYPES } from '../src/config.js';

describe('Game State & Collision Simulation', () => {
  let mockCanvasManager;
  let gameState;

  beforeEach(() => {
    mockCanvasManager = {
      virtualWidth: 720,
      virtualHeight: 1280,
      addShake: () => {}
    };
    gameState = new GameState(mockCanvasManager);
  });

  it('should initialize in MENU state with clean variables', () => {
    expect(gameState.currentState).toBe(GAME_STATES.MENU);
    expect(gameState.score).toBe(0);
    expect(gameState.currentCombo).toBe(0);
  });

  it('should start campaign level and populate orbs', () => {
    gameState.startCampaignLevel(1);
    expect(gameState.currentState).toBe(GAME_STATES.PLAYING);
    expect(gameState.orbs.length).toBeGreaterThan(0);
    expect(gameState.explosions.length).toBe(0);
  });

  it('should handle pause and unpause correctly', () => {
    gameState.startCampaignLevel(1);
    expect(gameState.currentState).toBe(GAME_STATES.PLAYING);

    gameState.togglePause();
    expect(gameState.currentState).toBe(GAME_STATES.PAUSED);

    gameState.togglePause();
    expect(gameState.currentState).toBe(GAME_STATES.PLAYING);
  });

  it('should detect collisions between active explosion and alive orb', () => {
    const explosion = new Explosion(100, 100, SPARK_TYPES.NORMAL, 1);
    // Fast-forward explosion to have radius
    explosion.update(0.3, 720, 1280);
    expect(explosion.currentRadius).toBeGreaterThan(0);

    const orbNearby = new Orb(120, 100, SPARK_TYPES.NORMAL, 720, 1280);
    const orbFarAway = new Orb(450, 450, SPARK_TYPES.NORMAL, 720, 1280);

    expect(explosion.collidesWith(orbNearby)).toBe(true);
    expect(explosion.collidesWith(orbFarAway)).toBe(false);
  });

  it('should calculate score and combo multipliers upon detonating orbs', () => {
    gameState.startCampaignLevel(1);
    const testOrb = new Orb(200, 200, SPARK_TYPES.NORMAL, 720, 1280);

    expect(gameState.score).toBe(0);
    expect(gameState.currentCombo).toBe(0);

    // Detonate 1st orb
    gameState.detonateOrb(testOrb);
    expect(gameState.currentCombo).toBe(1);
    expect(gameState.score).toBe(testOrb.score * 1);
    expect(gameState.explosions.length).toBe(1);

    // Detonate 2nd orb in chain
    const testOrb2 = new Orb(250, 200, SPARK_TYPES.MEGA, 720, 1280);
    gameState.detonateOrb(testOrb2);
    expect(gameState.currentCombo).toBe(2);
    expect(gameState.score).toBe((testOrb.score * 1) + (testOrb2.score * 2));
    expect(gameState.maxRoundCombo).toBe(2);
  });

  it('should freeze surrounding orbs when a Freeze spark explodes', () => {
    gameState.startCampaignLevel(7);
    const freezeOrb = new Orb(300, 300, SPARK_TYPES.FREEZE, 720, 1280);
    const nearbyOrb = new Orb(320, 310, SPARK_TYPES.NORMAL, 720, 1280);
    gameState.orbs = [freezeOrb, nearbyOrb];

    expect(nearbyOrb.frozenTimer).toBe(0);
    gameState.detonateOrb(freezeOrb);

    expect(nearbyOrb.frozenTimer).toBeGreaterThan(0);
  });

  it('should launch tap explosion when player taps inside arena', () => {
    gameState.startCampaignLevel(1);
    expect(gameState.levelManager.tapsRemaining).toBe(1);

    gameState.handleTap({ x: 300, y: 400, isInside: true });

    expect(gameState.levelManager.tapsRemaining).toBe(0);
    expect(gameState.explosions.length).toBe(1);
    expect(gameState.explosions[0].x).toBe(300);
    expect(gameState.explosions[0].y).toBe(400);

    // Further taps should be ignored when out of taps
    gameState.handleTap({ x: 320, y: 420, isInside: true });
    expect(gameState.explosions.length).toBe(1);
  });

  it('should delegate update and render to StarMap during LEVEL_SELECT state', () => {
    gameState.currentState = GAME_STATES.LEVEL_SELECT;
    const initialPhase = gameState.starMap.solarPhase;

    gameState.update(0.1);
    expect(gameState.starMap.solarPhase).toBeGreaterThan(initialPhase);

    const mockCtx = {
      save: () => {},
      restore: () => {},
      scale: () => {},
      translate: () => {},
      rotate: () => {},
      beginPath: () => {},
      arc: () => {},
      ellipse: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      setLineDash: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} })
    };

    expect(() => gameState.render(mockCtx)).not.toThrow();
  });
});
