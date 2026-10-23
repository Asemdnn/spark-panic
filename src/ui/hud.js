// Guardian of the Universe - Responsive HTML/CSS UI & Planetary HUD Controller

import { PLANETS, LEVELS, SPARK_CONFIG, SPARK_TYPES } from '../config.js';
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
          <div class="hud-badge" id="hud-level-badge">🪐 PLANET AERILON</div>
          <div class="hud-taps-container" id="hud-taps-box">
            <span class="hud-label">CHARGES</span>
            <div id="hud-taps-icons" class="hud-taps-icons"></div>
          </div>
        </div>

        <div class="hud-center">
          <div class="hud-target-text" id="hud-target-label">ALIENS PURGED: 0 / 0</div>
          <div class="hud-progress-bar-bg">
            <div class="hud-progress-bar-fill" id="hud-progress-fill"></div>
          </div>
        </div>

        <div class="hud-right">
          <div class="hud-score-box">
            <span class="hud-label">COSMIC SCORE</span>
            <span class="hud-score-val" id="hud-score-val">0</span>
          </div>
          <button id="btn-sound-toggle" class="icon-btn" aria-label="Toggle Sound" title="Sound (M)">🔊</button>
          <button id="btn-pause" class="icon-btn" aria-label="Pause" title="Pause (P)">⏸</button>
        </div>
      </div>

      <!-- MAIN MENU OVERLAY -->
      <div id="overlay-menu" class="screen-overlay">
        <div class="screen-card">
          <div class="menu-hero-banner-container">
            <img src="./assets/game-cover.jpg" alt="Guardian of the Universe Key Art" class="menu-hero-banner" />
            <div class="hero-overlay-gradient"></div>
          </div>
          <div class="title-logo">
            <span class="title-spark">GUARDIAN</span>
            <span class="title-panic">OF THE UNIVERSE</span>
          </div>
          <div class="title-tagline">DEFEND THE GALAXY FROM THE ALIEN INVASION</div>

          <div class="menu-stats-row">
            <div class="stat-pill">⭐ <span id="menu-total-stars">0 / 60</span></div>
            <div class="stat-pill">🏆 <span id="menu-endless-high">0</span></div>
          </div>

          <div class="menu-actions">
            <button id="btn-play-campaign" class="btn btn-primary pulse-btn">DEFEND PLANETS (CAMPAIGN)</button>
            <button id="btn-play-endless" class="btn btn-secondary">ENDLESS ALIEN SWARM</button>
            <button id="btn-how-to-play" class="btn btn-outline">GUARDIAN ARCHIVES</button>
          </div>
        </div>
      </div>

      <!-- GALAXY STAR MAP (PLANETS) OVERLAY -->
      <div id="overlay-level-select" class="screen-overlay hidden">
        <div class="screen-card wide-card galaxy-map-card">
          <div class="modal-header">
            <div>
              <h2 class="neon-heading">GALAXY STAR MAP</h2>
              <p class="galaxy-subtitle">Choose a planet to liberate from the alien armada</p>
            </div>
            <button id="btn-levels-back" class="icon-btn" title="Back to Main Menu">✕</button>
          </div>
          <div id="levels-grid" class="planets-galaxy-grid"></div>
        </div>
      </div>

      <!-- LEVEL CLEARED (PLANET DEFENDED) OVERLAY -->
      <div id="overlay-victory" class="screen-overlay hidden">
        <div class="screen-card">
          <div class="planet-badge-icon" id="victory-planet-icon">🪐</div>
          <div class="celebration-title">PLANET DEFENDED!</div>
          <p class="celebration-subtitle" id="victory-planet-subtitle">Planet successfully liberated!</p>
          <div id="victory-stars" class="stars-display"></div>

          <div class="summary-stats">
            <div class="stat-row">
              <span>Aliens Purged:</span>
              <strong id="victory-popped-val" class="text-neon-cyan">0 / 0</strong>
            </div>
            <div class="stat-row">
              <span>Max Guardian Combo:</span>
              <strong id="victory-combo-val" class="text-neon-gold">x0</strong>
            </div>
            <div class="stat-row">
              <span>Mission Score:</span>
              <strong id="victory-score-val" class="text-neon-green">0</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button id="btn-next-level" class="btn btn-primary">NEXT PLANET ➔</button>
            <button id="btn-replay-level" class="btn btn-secondary">RETRY DEFENSE ⟲</button>
            <button id="btn-victory-levels" class="btn btn-outline">GALAXY MAP ☰</button>
          </div>
        </div>
      </div>

      <!-- LEVEL FAILED (PLANET OVERRUN) OVERLAY -->
      <div id="overlay-defeat" class="screen-overlay hidden">
        <div class="screen-card">
          <div class="defeat-badge-icon">⚠️ 🛸 💥</div>
          <div class="defeat-title">PLANET OVERRUN!</div>
          <p class="defeat-subtitle" id="defeat-planet-subtitle">Alien armada breached planetary defenses</p>

          <div class="summary-stats">
            <div class="stat-row">
              <span>Aliens Purged:</span>
              <strong id="defeat-popped-val" class="text-neon-magenta">0 / 0</strong>
            </div>
            <div class="stat-row">
              <span>Required to Save:</span>
              <strong id="defeat-target-val">0</strong>
            </div>
            <div class="stat-row">
              <span>Cosmic Score:</span>
              <strong id="defeat-score-val">0</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button id="btn-defeat-retry" class="btn btn-primary">RETRY DEFENSE ⟲</button>
            <button id="btn-defeat-levels" class="btn btn-outline">GALAXY MAP ☰</button>
          </div>
        </div>
      </div>

      <!-- ENDLESS GAME OVER OVERLAY -->
      <div id="overlay-endless-over" class="screen-overlay hidden">
        <div class="screen-card">
          <div class="defeat-title">OUT OF CHARGES!</div>
          <div id="endless-new-high" class="badge-new-record hidden">★ NEW GALAXY RECORD! ★</div>

          <div class="summary-stats">
            <div class="stat-row">
              <span>Total Aliens Destroyed:</span>
              <strong id="endless-final-score" class="text-neon-gold">0</strong>
            </div>
            <div class="stat-row">
              <span>Swarm Wave Reached:</span>
              <strong id="endless-final-wave" class="text-neon-cyan">Wave 1</strong>
            </div>
            <div class="stat-row">
              <span>Peak Guardian Combo:</span>
              <strong id="endless-final-combo" class="text-neon-green">x0</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button id="btn-endless-retry" class="btn btn-primary">DEFEND AGAIN ⟲</button>
            <button id="btn-endless-menu" class="btn btn-outline">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- PAUSE OVERLAY -->
      <div id="overlay-pause" class="screen-overlay hidden">
        <div class="screen-card">
          <h2 class="neon-heading">TACTICAL PAUSE</h2>
          <div class="modal-actions">
            <button id="btn-resume" class="btn btn-primary">RESUME DEFENSE ▶</button>
            <button id="btn-pause-restart" class="btn btn-secondary">RESTART PLANET ⟲</button>
            <button id="btn-pause-menu" class="btn btn-outline">GALAXY MAP</button>
          </div>
        </div>
      </div>

      <!-- GUARDIAN ARCHIVES GUIDE MODAL -->
      <div id="overlay-how-to-play" class="screen-overlay hidden">
        <div class="screen-card wide-card guide-card">
          <div class="modal-header">
            <h2 class="neon-heading">GUARDIAN ARCHIVES</h2>
            <button id="btn-guide-back" class="icon-btn">✕</button>
          </div>

          <div class="guide-content">
            <div class="guide-item">
              <div class="guide-bullet bullet-cyan"></div>
              <div>
                <strong>Guardian Energy Nova</strong>
                <p>Tap anywhere in orbital space to detonate an expanding energy shockwave.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-cyan"></div>
              <div>
                <strong>Alien Scout (Cyan)</strong>
                <p>Fast recon drones that form the vanguard of the alien armada.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-yellow"></div>
              <div>
                <strong>Alien Dreadnought (Gold)</strong>
                <p>Heavily armored flagship. When destroyed, triggers a massive screen-clearing nova blast!</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-magenta"></div>
              <div>
                <strong>Alien Interceptor (Magenta)</strong>
                <p>Swarm warship. When destroyed, fires 4 high-speed plasma darts across the galaxy.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-mint"></div>
              <div>
                <strong>Alien Cryo-Ship (Mint)</strong>
                <p>Emits a cold stasis blast slowing surrounding alien invaders down by 75%.</p>
              </div>
            </div>

            <div class="guide-item">
              <div class="guide-bullet bullet-violet"></div>
              <div>
                <strong>Alien Phase-Shifter (Violet)</strong>
                <p>Warp vessel that triggers a secondary delayed shockwave across time and space.</p>
              </div>
            </div>
          </div>

          <button id="btn-guide-close" class="btn btn-primary" style="margin-top: 18px;">ENTER BATTLE!</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Menu Actions
    document.getElementById('btn-play-campaign').addEventListener('click', () => {
      audio.init();
      this.showLevelSelect();
    });

    document.getElementById('btn-play-endless').addEventListener('click', () => {
      audio.init();
      this.hideAllOverlays();
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
      this.hideAllOverlays();
      this.gameState.restartCurrent();
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      this.showLevelSelect();
    });

    // Victory Modal Buttons
    document.getElementById('btn-next-level').addEventListener('click', () => {
      const nextLvl = this.gameState.levelManager.currentLevel + 1;
      this.hideAllOverlays();
      if (nextLvl <= PLANETS.length) {
        this.gameState.startCampaignLevel(nextLvl);
      } else {
        this.showLevelSelect();
      }
    });

    document.getElementById('btn-replay-level').addEventListener('click', () => {
      this.hideAllOverlays();
      this.gameState.restartCurrent();
    });

    document.getElementById('btn-victory-levels').addEventListener('click', () => {
      this.showLevelSelect();
    });

    // Defeat Modal Buttons
    document.getElementById('btn-defeat-retry').addEventListener('click', () => {
      this.hideAllOverlays();
      this.gameState.restartCurrent();
    });

    document.getElementById('btn-defeat-levels').addEventListener('click', () => {
      this.showLevelSelect();
    });

    // Endless Over Buttons
    document.getElementById('btn-endless-retry').addEventListener('click', () => {
      this.hideAllOverlays();
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

    document.getElementById('menu-total-stars').textContent = `${storage.getTotalStars()} / ${PLANETS.length * 3}`;
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

    PLANETS.forEach((planet) => {
      const isUnlocked = planet.level <= unlocked;
      const stars = storage.getLevelStars(planet.level);

      const card = document.createElement('div');
      card.className = `planet-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        starsHtml += `<span class="planet-star ${s <= stars ? 'earned' : 'empty'}">★</span>`;
      }

      card.innerHTML = `
        <div class="planet-visual-container">
          <div class="planet-sphere" style="background: ${planet.gradient}; box-shadow: 0 0 20px ${planet.shadowColor};">
            ${planet.hasRings ? `<div class="planet-ring" style="border-color: ${planet.ringColor};"></div>` : ''}
          </div>
          ${!isUnlocked ? '<div class="planet-shield-lock">🔒</div>' : ''}
        </div>
        <div class="planet-meta">
          <div class="planet-num">PLANET ${planet.level}</div>
          <div class="planet-title">${planet.name}</div>
          <div class="planet-type">${planet.typeDesc}</div>
          <div class="planet-stars-row">${starsHtml}</div>
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.hideAllOverlays();
          this.gameState.startCampaignLevel(planet.level);
        });
      }

      grid.appendChild(card);
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

      // Badge: Planet Name or Wave
      const badge = document.getElementById('hud-level-badge');
      if (isCampaign) {
        const planetIndex = this.gameState.levelManager.currentLevel - 1;
        const currentPlanet = PLANETS[planetIndex] || PLANETS[0];
        badge.innerHTML = `🪐 <strong>${currentPlanet.name.toUpperCase()}</strong>`;
      } else {
        badge.innerHTML = `🛸 <strong>WAVE ${this.gameState.levelManager.endlessWave}</strong>`;
      }

      // Guardian Nova Charges
      const tapsContainer = document.getElementById('hud-taps-icons');
      tapsContainer.innerHTML = '';
      for (let i = 0; i < this.gameState.levelManager.tapsRemaining; i++) {
        const dot = document.createElement('span');
        dot.className = 'tap-dot';
        dot.title = 'Guardian Strike Ready';
        tapsContainer.appendChild(dot);
      }

      // Progress & Target
      const targetLabel = document.getElementById('hud-target-label');
      const progressFill = document.getElementById('hud-progress-fill');

      if (isCampaign) {
        const popped = this.gameState.levelManager.poppedSparks;
        const target = this.gameState.levelManager.target;
        targetLabel.textContent = `ALIENS PURGED: ${popped} / ${target}`;
        const pct = Math.min(100, (popped / target) * 100);
        progressFill.style.width = `${pct}%`;
        progressFill.style.background = popped >= target ? 'linear-gradient(90deg, #00ffa3, #ffe600)' : 'linear-gradient(90deg, #00f0ff, #00ffa3)';
      } else {
        const popped = this.gameState.levelManager.poppedSparks;
        targetLabel.textContent = `ALIENS PURGED: ${popped}`;
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
    if (state === GAME_STATES.PLAYING) {
      const victory = document.getElementById('overlay-victory');
      const defeat = document.getElementById('overlay-defeat');
      const endlessOver = document.getElementById('overlay-endless-over');
      const pause = document.getElementById('overlay-pause');
      const menu = document.getElementById('overlay-menu');
      const lvlSelect = document.getElementById('overlay-level-select');

      if (victory && !victory.classList.contains('hidden')) victory.classList.add('hidden');
      if (defeat && !defeat.classList.contains('hidden')) defeat.classList.add('hidden');
      if (endlessOver && !endlessOver.classList.contains('hidden')) endlessOver.classList.add('hidden');
      if (pause && !pause.classList.contains('hidden')) pause.classList.add('hidden');
      if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
      if (lvlSelect && !lvlSelect.classList.contains('hidden')) lvlSelect.classList.add('hidden');
      return;
    }

    const victory = document.getElementById('overlay-victory');
    const defeat = document.getElementById('overlay-defeat');
    const endlessOver = document.getElementById('overlay-endless-over');
    const pause = document.getElementById('overlay-pause');

    if (state === GAME_STATES.LEVEL_CLEARED && victory.classList.contains('hidden')) {
      this.hideAllOverlays();
      victory.classList.remove('hidden');

      const planetIndex = this.gameState.levelManager.currentLevel - 1;
      const planet = PLANETS[planetIndex] || PLANETS[0];

      document.getElementById('victory-planet-subtitle').textContent = `You saved Planet ${planet.name} from the alien armada!`;
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

      const planetIndex = this.gameState.levelManager.currentLevel - 1;
      const planet = PLANETS[planetIndex] || PLANETS[0];
      document.getElementById('defeat-planet-subtitle').textContent = `Alien armada breached planetary defenses on ${planet.name}`;

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
