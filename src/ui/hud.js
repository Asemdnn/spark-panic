// Spark Panic - Responsive HTML/CSS UI & HUD Controller

import { LEVELS } from '../config.js';
import { GAME_STATES } from '../game/state.js';
import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';

export class UIController {
  constructor(uiContainer, gameState) {
    this.container = uiContainer;
    this.gameState = gameState;
    this.currentView = null;

    this.renderInitialDOM();
    this.bindEvents();
  }

  renderInitialDOM() {
    this.container.innerHTML = `
      <!-- TOP IN-GAME HUD -->
      <div id="hud-top" class="hud-top hidden">
        <div class="hud-left">
          <div class="hud-badge" id="hud-level-badge">LVL 1</div>
          <div class="hud-taps-container" id="hud-taps-box">
            <span class="hud-label">TAPS</span>
            <div id="hud-taps-icons" class="hud-taps-icons"></div>
          </div>
        </div>

        <div class="hud-center">
          <div class="hud-target-text" id="hud-target-label">0 / 0</div>
          <div class="hud-progress-bar-bg">
            <div class="hud-progress-bar-fill" id="hud-progress-fill"></div>
          </div>
        </div>

        <div class="hud-right">
          <div class="hud-score-box">
            <span class="hud-label">SCORE</span>
            <span class="hud-score-val" id="hud-score-val">0</span>
          </div>
          <button id="btn-sound-toggle" class="icon-btn" aria-label="Toggle Sound" title="Sound (M)">🔊</button>
          <button id="btn-pause" class="icon-btn" aria-label="Pause" title="Pause (P)">⏸</button>
        </div>
      </div>

      <!-- MAIN MENU OVERLAY -->
      <div id="overlay-menu" class="screen-overlay">
        <div class="screen-card">
          <div class="title-logo">
            <span class="title-spark">SPARK</span>
            <span class="title-panic">PANIC</span>
          </div>
          <div class="title-tagline">NEON CHAIN REACTION</div>

          <div class="menu-stats-row">
            <div class="stat-pill">⭐ <span id="menu-total-stars">0 / 60</span></div>
            <div class="stat-pill">🏆 <span id="menu-endless-high">0</span></div>
          </div>

          <div class="menu-actions">
            <button id="btn-play-campaign" class="btn btn-primary pulse-btn">CAMPAIGN MODE</button>
            <button id="btn-play-endless" class="btn btn-secondary">ENDLESS ARCADE</button>
            <button id="btn-how-to-play" class="btn btn-outline">HOW TO PLAY</button>
          </div>
        </div>
      </div>

      <!-- LEVEL SELECT OVERLAY -->
      <div id="overlay-level-select" class="screen-overlay hidden">
        <div class="screen-card wide-card">
          <div class="modal-header">
            <h2 class="neon-heading">SELECT LEVEL</h2>
            <button id="btn-levels-back" class="icon-btn">✕</button>
          </div>
          <div id="levels-grid" class="levels-grid"></div>
        </div>
      </div>

      <!-- LEVEL CLEARED OVERLAY -->
      <div id="overlay-victory" class="screen-overlay hidden">
        <div class="screen-card">
          <div class="celebration-title">LEVEL CLEARED!</div>
          <div id="victory-stars" class="stars-display"></div>

          <div class="summary-stats">
            <div class="stat-row">
              <span>Sparks Popped:</span>
              <strong id="victory-popped-val">0 / 0</strong>
            </div>
            <div class="stat-row">
              <span>Max Combo:</span>
              <strong id="victory-combo-val" class="text-neon-cyan">x0</strong>
            </div>
            <div class="stat-row">
              <span>Level Score:</span>
              <strong id="victory-score-val" class="text-neon-gold">0</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button id="btn-next-level" class="btn btn-primary">NEXT LEVEL ➔</button>
            <button id="btn-replay-level" class="btn btn-secondary">REPLAY ⟲</button>
            <button id="btn-victory-levels" class="btn btn-outline">LEVELS ☰</button>
          </div>
        </div>
      </div>

      <!-- LEVEL FAILED OVERLAY -->
      <div id="overlay-defeat" class="screen-overlay hidden">
        <div class="screen-card">
          <div class="defeat-title">CHAIN BROKE!</div>
          <p class="defeat-subtitle">Target sparks not reached</p>

          <div class="summary-stats">
            <div class="stat-row">
              <span>Popped:</span>
              <strong id="defeat-popped-val" class="text-neon-magenta">0 / 0</strong>
            </div>
            <div class="stat-row">
              <span>Target Needed:</span>
              <strong id="defeat-target-val">0</strong>
            </div>
            <div class="stat-row">
              <span>Score:</span>
              <strong id="defeat-score-val">0</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button id="btn-defeat-retry" class="btn btn-primary">TRY AGAIN ⟲</button>
            <button id="btn-defeat-levels" class="btn btn-outline">LEVELS ☰</button>
          </div>
        </div>
      </div>

      <!-- ENDLESS GAME OVER OVERLAY -->
      <div id="overlay-endless-over" class="screen-overlay hidden">
        <div class="screen-card">
          <div class="defeat-title">OUT OF TAPS!</div>
          <div id="endless-new-high" class="badge-new-record hidden">★ NEW HIGH SCORE! ★</div>

          <div class="summary-stats">
            <div class="stat-row">
              <span>Final Score:</span>
              <strong id="endless-final-score" class="text-neon-gold">0</strong>
            </div>
            <div class="stat-row">
              <span>Wave Reached:</span>
              <strong id="endless-final-wave" class="text-neon-cyan">Wave 1</strong>
            </div>
            <div class="stat-row">
              <span>Best Combo:</span>
              <strong id="endless-final-combo" class="text-neon-green">x0</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button id="btn-endless-retry" class="btn btn-primary">PLAY AGAIN ⟲</button>
            <button id="btn-endless-menu" class="btn btn-outline">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- PAUSE OVERLAY -->
      <div id="overlay-pause" class="screen-overlay hidden">
        <div class="screen-card">
          <h2 class="neon-heading">PAUSED</h2>
          <div class="modal-actions">
            <button id="btn-resume" class="btn btn-primary">RESUME ▶</button>
            <button id="btn-pause-restart" class="btn btn-secondary">RESTART ⟲</button>
            <button id="btn-pause-menu" class="btn btn-outline">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- HOW TO PLAY GUIDE MODAL -->
      <div id="overlay-how-to-play" class="screen-overlay hidden">
        <div class="screen-card wide-card guide-card">
          <div class="modal-header">
            <h2 class="neon-heading">HOW TO PLAY</h2>
            <button id="btn-guide-back" class="icon-btn">✕</button>
          </div>

          <div class="guide-content">
            <div class="guide-item">
              <div class="guide-bullet bullet-cyan"></div>
              <div>
                <strong>Tap to Trigger</strong>
                <p>Tap anywhere inside the arena to create an expanding shockwave.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-yellow"></div>
              <div>
                <strong>Mega Spark</strong>
                <p>Golden orbs cause huge screen-clearing explosions with double radius.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-magenta"></div>
              <div>
                <strong>Splitter Spark</strong>
                <p>Launches 4 high-speed darts that ignite distant clusters of sparks.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-mint"></div>
              <div>
                <strong>Frost Spark</strong>
                <p>Emits an icy blast that slows surrounding sparks down by 70%.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-violet"></div>
              <div>
                <strong>Phase Spark</strong>
                <p>Detonates, then pulses a second delayed shockwave ring.</p>
              </div>
            </div>
          </div>

          <button id="btn-guide-close" class="btn btn-primary" style="margin-top: 18px;">GOT IT!</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Menu
    document.getElementById('btn-play-campaign').addEventListener('click', () => {
      audio.init();
      this.showLevelSelect();
    });

    document.getElementById('btn-play-endless').addEventListener('click', () => {
      audio.init();
      this.gameState.startEndlessMode();
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      document.getElementById('overlay-how-to-play').classList.remove('hidden');
    });

    document.getElementById('btn-guide-back').addEventListener('click', () => {
      document.getElementById('overlay-how-to-play').classList.add('hidden');
    });

    document.getElementById('btn-guide-close').addEventListener('click', () => {
      document.getElementById('overlay-how-to-play').classList.add('hidden');
    });

    // Level Select Back
    document.getElementById('btn-levels-back').addEventListener('click', () => {
      this.showMainMenu();
    });

    // Sound toggle
    const soundBtn = document.getElementById('btn-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      soundBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    // Pause toggle
    document.getElementById('btn-pause').addEventListener('click', () => {
      this.gameState.togglePause();
    });

    // Pause Modal Buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.gameState.togglePause();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.gameState.restartCurrent();
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.showMainMenu();
    });

    // Victory Modal Buttons
    document.getElementById('btn-next-level').addEventListener('click', () => {
      const nextLvl = this.gameState.levelManager.currentLevel + 1;
      if (nextLvl <= LEVELS.length) {
        this.gameState.startCampaignLevel(nextLvl);
      } else {
        this.showLevelSelect();
      }
    });

    document.getElementById('btn-replay-level').addEventListener('click', () => {
      this.gameState.restartCurrent();
    });

    document.getElementById('btn-victory-levels').addEventListener('click', () => {
      this.showLevelSelect();
    });

    // Defeat Modal Buttons
    document.getElementById('btn-defeat-retry').addEventListener('click', () => {
      this.gameState.restartCurrent();
    });

    document.getElementById('btn-defeat-levels').addEventListener('click', () => {
      this.showLevelSelect();
    });

    // Endless Over Buttons
    document.getElementById('btn-endless-retry').addEventListener('click', () => {
      this.gameState.startEndlessMode();
    });

    document.getElementById('btn-endless-menu').addEventListener('click', () => {
      this.showMainMenu();
    });
  }

  showMainMenu() {
    this.gameState.currentState = GAME_STATES.MENU;
    this.hideAllOverlays();
    document.getElementById('overlay-menu').classList.remove('hidden');
    document.getElementById('hud-top').classList.add('hidden');

    document.getElementById('menu-total-stars').textContent = `${storage.getTotalStars()} / ${LEVELS.length * 3}`;
    document.getElementById('menu-endless-high').textContent = storage.getData().endlessHighScore.toLocaleString();
  }

  showLevelSelect() {
    this.gameState.currentState = GAME_STATES.LEVEL_SELECT;
    this.hideAllOverlays();
    document.getElementById('overlay-level-select').classList.remove('hidden');
    document.getElementById('hud-top').classList.add('hidden');

    this.renderLevelGrid();
  }

  renderLevelGrid() {
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';

    const unlocked = storage.getUnlockedLevel();

    LEVELS.forEach((lvl) => {
      const isUnlocked = lvl.level <= unlocked;
      const stars = storage.getLevelStars(lvl.level);

      const item = document.createElement('button');
      item.className = `level-node ${isUnlocked ? 'unlocked' : 'locked'}`;

      if (isUnlocked) {
        let starsStr = '';
        for (let s = 1; s <= 3; s++) {
          starsStr += s <= stars ? '★' : '☆';
        }
        item.innerHTML = `
          <div class="level-num">${lvl.level}</div>
          <div class="level-stars">${starsStr}</div>
        `;
        item.addEventListener('click', () => {
          this.gameState.startCampaignLevel(lvl.level);
        });
      } else {
        item.innerHTML = `
          <div class="level-lock">🔒</div>
          <div class="level-num dim">${lvl.level}</div>
        `;
      }

      grid.appendChild(item);
    });
  }

  hideAllOverlays() {
    const overlays = [
      'overlay-menu',
      'overlay-level-select',
      'overlay-victory',
      'overlay-defeat',
      'overlay-endless-over',
      'overlay-pause',
      'overlay-how-to-play'
    ];
    overlays.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  updateHUD() {
    const state = this.gameState.currentState;
    const hudTop = document.getElementById('hud-top');

    if (state === GAME_STATES.PLAYING || state === GAME_STATES.PAUSED) {
      hudTop.classList.remove('hidden');

      const isCampaign = this.gameState.levelManager.mode === 'CAMPAIGN';

      // Badge
      const badge = document.getElementById('hud-level-badge');
      badge.textContent = isCampaign ? `LVL ${this.gameState.levelManager.currentLevel}` : `WAVE ${this.gameState.levelManager.endlessWave}`;

      // Taps
      const tapsContainer = document.getElementById('hud-taps-icons');
      tapsContainer.innerHTML = '';
      for (let i = 0; i < this.gameState.levelManager.tapsRemaining; i++) {
        const dot = document.createElement('span');
        dot.className = 'tap-dot';
        tapsContainer.appendChild(dot);
      }

      // Progress & Target
      const targetLabel = document.getElementById('hud-target-label');
      const progressFill = document.getElementById('hud-progress-fill');

      if (isCampaign) {
        const popped = this.gameState.levelManager.poppedSparks;
        const target = this.gameState.levelManager.target;
        targetLabel.textContent = `${popped} / ${target}`;
        const pct = Math.min(100, (popped / target) * 100);
        progressFill.style.width = `${pct}%`;
        progressFill.style.background = popped >= target ? 'linear-gradient(90deg, #00ffa3, #ffe600)' : 'linear-gradient(90deg, #00f0ff, #00ffa3)';
      } else {
        const popped = this.gameState.levelManager.poppedSparks;
        targetLabel.textContent = `POPPED: ${popped}`;
        progressFill.style.width = '100%';
        progressFill.style.background = 'linear-gradient(90deg, #ff00aa, #ffe600)';
      }

      // Score
      document.getElementById('hud-score-val').textContent = this.gameState.score.toLocaleString();
    } else {
      hudTop.classList.add('hidden');
    }

    // Modal Overlays synchronization
    this.syncOverlays(state);
  }

  syncOverlays(state) {
    const victory = document.getElementById('overlay-victory');
    const defeat = document.getElementById('overlay-defeat');
    const endlessOver = document.getElementById('overlay-endless-over');
    const pause = document.getElementById('overlay-pause');

    if (state === GAME_STATES.LEVEL_CLEARED && victory.classList.contains('hidden')) {
      this.hideAllOverlays();
      victory.classList.remove('hidden');

      const popped = this.gameState.levelManager.poppedSparks;
      const total = this.gameState.levelManager.totalSparks;
      document.getElementById('victory-popped-val').textContent = `${popped} / ${total} (${Math.round((popped / total) * 100)}%)`;
      document.getElementById('victory-combo-val').textContent = `x${this.gameState.maxRoundCombo}`;
      document.getElementById('victory-score-val').textContent = this.gameState.score.toLocaleString();

      const starsContainer = document.getElementById('victory-stars');
      starsContainer.innerHTML = '';
      for (let s = 1; s <= 3; s++) {
        const star = document.createElement('span');
        star.className = `star-icon ${s <= this.gameState.starsEarned ? 'earned' : 'empty'}`;
        star.textContent = '★';
        starsContainer.appendChild(star);
      }
    } else if (state === GAME_STATES.LEVEL_FAILED && defeat.classList.contains('hidden')) {
      this.hideAllOverlays();
      defeat.classList.remove('hidden');

      const popped = this.gameState.levelManager.poppedSparks;
      const total = this.gameState.levelManager.totalSparks;
      document.getElementById('defeat-popped-val').textContent = `${popped} / ${total}`;
      document.getElementById('defeat-target-val').textContent = `${this.gameState.levelManager.target}`;
      document.getElementById('defeat-score-val').textContent = this.gameState.score.toLocaleString();
    } else if (state === GAME_STATES.ENDLESS_OVER && endlessOver.classList.contains('hidden')) {
      this.hideAllOverlays();
      endlessOver.classList.remove('hidden');

      document.getElementById('endless-final-score').textContent = this.gameState.score.toLocaleString();
      document.getElementById('endless-final-wave').textContent = `Wave ${this.gameState.levelManager.endlessWave}`;
      document.getElementById('endless-final-combo').textContent = `x${this.gameState.maxRoundCombo}`;

      const isNewHigh = this.gameState.score >= storage.getData().endlessHighScore;
      const badge = document.getElementById('endless-new-record');
      if (badge) badge.classList.toggle('hidden', !isNewHigh);
    } else if (state === GAME_STATES.PAUSED) {
      pause.classList.remove('hidden');
    } else if (state !== GAME_STATES.PAUSED) {
      pause.classList.add('hidden');
    }
  }
}
