// Spark Panic - Game State & Simulation Coordinator

import { SPARK_CONFIG, SPARK_TYPES } from '../config.js';
import { Explosion } from './explosion.js';
import { ParticleManager } from './particle.js';
import { FloaterManager } from './floater.js';
import { LevelManager } from './level-manager.js';
import { StarMap } from './star-map.js';
import { audio } from '../engine/audio.js';
import { storage } from '../engine/storage.js';

export const GAME_STATES = {
  MENU: 'MENU',
  LEVEL_SELECT: 'LEVEL_SELECT',
  PLAYING: 'PLAYING',
  LEVEL_CLEARED: 'LEVEL_CLEARED',
  LEVEL_FAILED: 'LEVEL_FAILED',
  ENDLESS_OVER: 'ENDLESS_OVER',
  PAUSED: 'PAUSED'
};

export class GameState {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.currentState = GAME_STATES.MENU;
    this.previousState = GAME_STATES.MENU;

    this.levelManager = new LevelManager(canvasManager.virtualWidth, canvasManager.virtualHeight);
    this.starMap = new StarMap(canvasManager);
    this.particles = new ParticleManager();
    this.floaters = new FloaterManager();

    this.orbs = [];
    this.explosions = [];

    this.score = 0;
    this.currentCombo = 0;
    this.maxRoundCombo = 0;
    this.starsEarned = 0;
    this.settleDelayTimer = 0; // Delay before showing victory/defeat to let particles settle
  }

  startCampaignLevel(levelIndex) {
    this.score = 0;
    this.currentCombo = 0;
    this.maxRoundCombo = 0;
    this.starsEarned = 0;
    this.settleDelayTimer = 0;

    this.explosions = [];
    this.particles.clear();
    this.floaters.clear();

    this.orbs = this.levelManager.loadLevel(levelIndex);
    this.currentState = GAME_STATES.PLAYING;
  }

  startEndlessMode() {
    this.score = 0;
    this.currentCombo = 0;
    this.maxRoundCombo = 0;
    this.starsEarned = 0;
    this.settleDelayTimer = 0;

    this.explosions = [];
    this.particles.clear();
    this.floaters.clear();

    this.orbs = this.levelManager.startEndless();
    this.currentState = GAME_STATES.PLAYING;
  }

  restartCurrent() {
    if (this.levelManager.mode === 'CAMPAIGN') {
      this.startCampaignLevel(this.levelManager.currentLevel);
    } else {
      this.startEndlessMode();
    }
  }

  togglePause() {
    if (this.currentState === GAME_STATES.PLAYING) {
      this.previousState = this.currentState;
      this.currentState = GAME_STATES.PAUSED;
    } else if (this.currentState === GAME_STATES.PAUSED) {
      this.currentState = this.previousState;
    }
  }

  handleTap(virtualCoords) {
    if (this.currentState !== GAME_STATES.PLAYING) return;

    // Check if player can use a tap
    if (!this.levelManager.useTap()) {
      return;
    }

    audio.init();
    audio.playTap();

    // Trigger initial tap explosion with generous reach
    const exp = new Explosion(virtualCoords.x, virtualCoords.y, SPARK_TYPES.NORMAL, 1);
    exp.maxRadius = 115;
    exp.duration = 3.0;
    exp.expandTime = 0.9;
    this.explosions.push(exp);

    // Initial tap particles & screen shake
    this.particles.spawnBurst(virtualCoords.x, virtualCoords.y, '#00f0ff', 16, 220);
    this.canvasManager.addShake(6, 0.22);
  }

  update(dt) {
    if (this.currentState === GAME_STATES.PAUSED) return;

    if (this.currentState === GAME_STATES.LEVEL_SELECT) {
      this.starMap.update(dt);
      return;
    }

    // Cap delta time to prevent physics anomalies when browser tabs switch
    const cappedDt = Math.min(dt, 0.05);

    // Always update visual particles and floaters
    this.particles.update(cappedDt);
    this.floaters.update(cappedDt);

    if (this.currentState !== GAME_STATES.PLAYING) return;

    // Update active orbs
    for (const orb of this.orbs) {
      orb.update(cappedDt);
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.update(
        cappedDt,
        this.canvasManager.virtualWidth,
        this.canvasManager.virtualHeight,
        (secX, secY, combo) => {
          // Secondary wave for Phase / Repulsor sparks
          this.explosions.push(new Explosion(secX, secY, SPARK_TYPES.NORMAL, combo));
          this.particles.spawnBurst(secX, secY, '#b55fe6', 15, 220);
        }
      );

      // Check collision between active explosion and alive orbs
      for (const orb of this.orbs) {
        if (!orb.alive) continue;

        if (exp.collidesWith(orb)) {
          this.detonateOrb(orb);
        }
      }

      if (!exp.alive) {
        this.explosions.splice(i, 1);
      }
    }

    // Reset current active combo counter if all explosions finished
    if (this.explosions.length === 0) {
      this.currentCombo = 0;
    }

    // Check for round completion (victory or defeat)
    this.checkRoundStatus(cappedDt);
  }

  detonateOrb(orb) {
    orb.alive = false;
    this.currentCombo++;
    this.maxRoundCombo = Math.max(this.maxRoundCombo, this.currentCombo);
    storage.recordCombo(this.currentCombo);

    this.levelManager.recordPop();
    storage.addSparksPopped(1);

    // Calculate score
    const points = (orb.score || 100) * this.currentCombo;
    this.score += points;

    // Audio feedback with pitch escalation
    audio.playPop(this.currentCombo, orb.type);

    // Visual juice
    this.floaters.addScore(orb.x, orb.y, points, this.currentCombo);
    this.particles.spawnBurst(orb.x, orb.y, orb.color, 18, 260);

    // Dynamic screen shake scaling with combo
    const shakePower = Math.min(22, 5 + this.currentCombo * 0.45);
    this.canvasManager.addShake(shakePower, 0.22);

    // Handle Freeze type shockwave
    if (orb.type === SPARK_TYPES.FREEZE) {
      const freezeRadius = SPARK_CONFIG[SPARK_TYPES.FREEZE].blastRadius * 2.2;
      for (const other of this.orbs) {
        if (other.alive && other !== orb) {
          const dist = Math.hypot(other.x - orb.x, other.y - orb.y);
          if (dist <= freezeRadius) {
            other.freeze(SPARK_CONFIG[SPARK_TYPES.FREEZE].slowDuration || 3.5);
          }
        }
      }
    }

    // Endless mode bonus tap check
    if (this.levelManager.mode === 'ENDLESS') {
      const earnedBonus = this.levelManager.checkEndlessBonusTap(this.currentCombo);
      if (earnedBonus) {
        audio.playBonusTap();
        this.floaters.addMessage(orb.x, orb.y - 60, '+1 EXTRA TAP!', '#ffe600', 32);
      }
    }

    // Spawn new chain explosion
    const newExp = new Explosion(orb.x, orb.y, orb.type, this.currentCombo);
    this.explosions.push(newExp);
  }

  checkRoundStatus(dt) {
    if (this.explosions.length > 0) {
      this.settleDelayTimer = 0;
      return;
    }

    // In Endless mode, if all orbs on screen are popped and player still has taps, spawn next wave
    if (this.levelManager.mode === 'ENDLESS') {
      const remainingOrbs = this.orbs.filter(o => o.alive).length;
      if (remainingOrbs === 0 && this.levelManager.tapsRemaining > 0) {
        this.levelManager.endlessWave++;
        this.floaters.addMessage(
          this.canvasManager.virtualWidth / 2,
          this.canvasManager.virtualHeight / 2,
          `WAVE ${this.levelManager.endlessWave}!`,
          '#00f0ff',
          36
        );
        audio.playVictory();
        this.orbs = this.levelManager.spawnEndlessWave(this.levelManager.endlessWave);
        return;
      }
    }

    // If no more taps left and no active explosions, settle round
    if (this.levelManager.tapsRemaining <= 0) {
      this.settleDelayTimer += dt;
      if (this.settleDelayTimer < 0.7) {
        return; // wait a moment for lingering particles/floaters
      }

      if (this.levelManager.mode === 'CAMPAIGN') {
        const cleared = this.levelManager.poppedSparks >= this.levelManager.target;
        if (cleared) {
          this.starsEarned = this.levelManager.calculateStars(
            this.levelManager.poppedSparks,
            this.levelManager.target,
            this.levelManager.totalSparks
          );
          storage.recordLevelCompletion(this.levelManager.currentLevel, this.score, this.starsEarned);
          audio.playVictory();
          this.currentState = GAME_STATES.LEVEL_CLEARED;
        } else {
          audio.playDefeat();
          this.currentState = GAME_STATES.LEVEL_FAILED;
        }
      } else {
        // Endless Mode Over
        storage.recordEndlessScore(this.score, this.levelManager.endlessWave);
        audio.playDefeat();
        this.currentState = GAME_STATES.ENDLESS_OVER;
      }
    }
  }

  render(ctx) {
    if (this.currentState === GAME_STATES.LEVEL_SELECT) {
      this.starMap.render(ctx);
      return;
    }

    // 1. Render all orbs
    for (const orb of this.orbs) {
      orb.render(ctx);
    }

    // 2. Render explosions (using lighter additive blend mode for intense neon glow)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const exp of this.explosions) {
      exp.render(ctx);
    }
    this.particles.render(ctx);
    ctx.restore();

    // 3. Render floating text callouts
    this.floaters.render(ctx);
  }
}
