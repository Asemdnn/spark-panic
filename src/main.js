// Spark Panic 2.0 - Application Bootstrap & Event Controller

import { PLANETS, SECTORS, ALIEN_CLASSES, ARMORY_CONFIG, TROPHIES, GUARDIAN_RANKS } from './config.js';
import { audio } from './engine/audio.js';
import { saveSystem } from './engine/storage.js';
import { GameEngine } from './game/engine.js';
import { ICON_SVG } from './ui/icons.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const engine = new GameEngine(canvas);

  // Selected Sector & Planet in Star Map
  let selectedSector = 1;
  let selectedPlanetId = 1;

  // Track pointer
  window.addEventListener('pointermove', (e) => {
    engine.pointerX = e.clientX;
    engine.pointerY = e.clientY;
  });

  // Canvas Tap/Click: Spark Nova or Manual Fire
  canvas.addEventListener('pointerdown', (e) => {
    audio.init();
    if (engine.state === 'PLAYING') {
      const dx = e.clientX - engine.planet.x;
      const dy = e.clientY - engine.planet.y;
      const dist = Math.hypot(dx, dy);

      // If clicked inside planet shield, don't waste nova
      if (dist > engine.planet.shieldRadius + 8) {
        engine.triggerSparkNova(e.clientX, e.clientY);
      }
      engine.turret.isFiring = true;
    }
  });

  window.addEventListener('pointerup', () => {
    engine.turret.isFiring = false;
  });

  // Keyboard Hotkeys
  window.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();

    if (e.code === 'Space') {
      e.preventDefault();
      audio.init();
      if (engine.state === 'PLAYING') {
        engine.triggerSparkNova(engine.pointerX, engine.pointerY);
      }
    } else if (key === 'Q' || key === '1') {
      if (engine.state === 'PLAYING') {
        engine.skills.useSkillQ(engine.turret.angle);
      }
    } else if (key === 'W' || key === '2') {
      if (engine.state === 'PLAYING') {
        engine.skills.useSkillW(engine.planet.x, engine.planet.y);
      }
    } else if (key === 'E' || key === '3') {
      if (engine.state === 'PLAYING') {
        engine.skills.useSkillE(engine.planet, (gained) => {
          engine.novaCharges = Math.min(engine.maxNovaCharges, engine.novaCharges + gained);
        });
      }
    } else if (key === 'T') {
      engine.turret.autoFire = !engine.turret.autoFire;
    } else if (key === 'P' || key === 'ESCAPE') {
      togglePause();
    } else if (key === 'M') {
      const isMuted = audio.toggleMute();
      const muteBtn = document.getElementById('btnMute');
      if (muteBtn) muteBtn.innerHTML = ICON_SVG.volume(isMuted, 'w-4 h-4');
    } else if (key === 'R') {
      if (engine.state === 'PLAYING' || engine.state === 'DEFEAT' || engine.state === 'PAUSED') {
        restartCurrent();
      }
    }
  });

  // Bottom Tactical Deck Buttons
  document.getElementById('btnSkillQ')?.addEventListener('click', () => {
    if (engine.state === 'PLAYING') engine.skills.useSkillQ(engine.turret.angle);
  });
  document.getElementById('btnSkillW')?.addEventListener('click', () => {
    if (engine.state === 'PLAYING') engine.skills.useSkillW(engine.planet.x, engine.planet.y);
  });
  document.getElementById('btnSkillE')?.addEventListener('click', () => {
    if (engine.state === 'PLAYING') {
      engine.skills.useSkillE(engine.planet, (gained) => {
        engine.novaCharges = Math.min(engine.maxNovaCharges, engine.novaCharges + gained);
      });
    }
  });
  document.getElementById('btnAutoFire')?.addEventListener('click', () => {
    engine.turret.autoFire = !engine.turret.autoFire;
  });

  // Top HUD Controls
  document.getElementById('btnMute')?.addEventListener('click', () => {
    audio.init();
    const isMuted = audio.toggleMute();
    const muteBtn = document.getElementById('btnMute');
    if (muteBtn) muteBtn.innerHTML = ICON_SVG.volume(isMuted, 'w-4 h-4');
  });
  document.getElementById('btnPause')?.addEventListener('click', () => {
    togglePause();
  });

  // Title Command Deck Controls
  document.getElementById('btnStartCampaign')?.addEventListener('click', () => {
    audio.init();
    openStarMap();
  });
  document.getElementById('btnStartEndless')?.addEventListener('click', () => {
    audio.init();
    hideAllModals();
    engine.startEndless();
  });
  document.getElementById('btnOpenArmory')?.addEventListener('click', () => {
    audio.init();
    openArmory();
  });
  document.getElementById('btnOpenCodex')?.addEventListener('click', () => {
    audio.init();
    openCodex();
  });

  // Star Map Navigation & Launch
  document.getElementById('btnStarMapBack')?.addEventListener('click', () => {
    openTitle();
  });
  document.getElementById('btnLaunchMission')?.addEventListener('click', () => {
    audio.init();
    hideAllModals();
    engine.startCampaignPlanet(selectedPlanetId);
  });

  // Sector Tab Filtering
  const sectorTabs = document.querySelectorAll('.sector-tab');
  sectorTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      audio.init();
      sectorTabs.forEach(t => {
        t.classList.remove('active', 'bg-cosmic-cyan/20', 'text-cosmic-cyan', 'border-cosmic-cyan');
        t.classList.add('bg-slate-900/50', 'text-slate-400', 'border-slate-800');
      });
      e.currentTarget.classList.add('active', 'bg-cosmic-cyan/20', 'text-cosmic-cyan', 'border-cosmic-cyan');
      e.currentTarget.classList.remove('bg-slate-900/50', 'text-slate-400', 'border-slate-800');

      selectedSector = parseInt(e.currentTarget.getAttribute('data-sector'), 10);
      renderStarMapPlanets();
    });
  });

  // Armory Close & Refund All Tech
  document.getElementById('btnArmoryClose')?.addEventListener('click', () => {
    document.getElementById('modalArmory').classList.add('hidden');
    updateTitleStats();
  });
  document.getElementById('btnRefundTech')?.addEventListener('click', () => {
    audio.init();
    const refunded = saveSystem.refundAllTech();
    renderArmoryGrid();
    engine.applyUpgrades();
    engine.showToast(`REFUNDED ${refunded} STAR SHARDS!`, '#00e676');
  });

  // Codex Close
  document.getElementById('btnCodexClose')?.addEventListener('click', () => {
    document.getElementById('modalCodex').classList.add('hidden');
  });

  // Victory Modal Actions
  document.getElementById('btnVictoryNext')?.addEventListener('click', () => {
    audio.init();
    hideAllModals();
    const nextPlanet = Math.min(20, engine.currentPlanetId + 1);
    engine.startCampaignPlanet(nextPlanet);
  });
  document.getElementById('btnVictoryRetry')?.addEventListener('click', () => {
    audio.init();
    hideAllModals();
    engine.startCampaignPlanet(engine.currentPlanetId);
  });
  document.getElementById('btnVictoryMap')?.addEventListener('click', () => {
    audio.init();
    openStarMap();
  });

  // Defeat Modal Actions
  document.getElementById('btnDefeatRetry')?.addEventListener('click', () => {
    audio.init();
    hideAllModals();
    if (engine.isEndlessMode) engine.startEndless();
    else engine.startCampaignPlanet(engine.currentPlanetId);
  });
  document.getElementById('btnDefeatArmory')?.addEventListener('click', () => {
    audio.init();
    openArmory();
  });
  document.getElementById('btnDefeatMap')?.addEventListener('click', () => {
    audio.init();
    openStarMap();
  });

  // Tactical Pause Actions
  document.getElementById('btnResume')?.addEventListener('click', () => {
    togglePause();
  });
  document.getElementById('btnPauseRestart')?.addEventListener('click', () => {
    restartCurrent();
  });
  document.getElementById('btnPauseStarMap')?.addEventListener('click', () => {
    openStarMap();
  });

  function togglePause() {
    if (engine.state === 'PLAYING') {
      engine.state = 'PAUSED';
      document.getElementById('modalPause').classList.remove('hidden');
    } else if (engine.state === 'PAUSED') {
      engine.state = 'PLAYING';
      document.getElementById('modalPause').classList.add('hidden');
    }
  }

  function restartCurrent() {
    hideAllModals();
    if (engine.isEndlessMode) engine.startEndless();
    else engine.startCampaignPlanet(engine.currentPlanetId);
  }

  function hideAllModals() {
    const modals = [
      'modalTitle', 'modalStarMap', 'modalArmory', 'modalCodex',
      'modalVictory', 'modalDefeat', 'modalPause'
    ];
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  function openTitle() {
    hideAllModals();
    engine.state = 'TITLE';
    updateTitleStats();
    document.getElementById('modalTitle').classList.remove('hidden');
  }

  function updateTitleStats() {
    const rank = saveSystem.getGuardianRank();
    const rankEl = document.getElementById('titleGuardianRank');
    if (rankEl) {
      rankEl.textContent = rank.title;
      rankEl.style.color = rank.color;
    }
    const totalStars = saveSystem.getTotalStars();
    const starsEl = document.getElementById('titleTotalStars');
    if (starsEl) {
      starsEl.innerHTML = `<span class="flex items-center gap-1.5">${totalStars} / 60 ${ICON_SVG.star('w-4 h-4 text-cosmic-gold')}</span>`;
    }
  }

  function openStarMap() {
    hideAllModals();
    engine.state = 'STARMAP';
    document.getElementById('modalStarMap').classList.remove('hidden');
    document.getElementById('starMapShards').textContent = saveSystem.data.shards.toLocaleString();

    // Default to sector of highest unlocked planet
    const unlocked = saveSystem.data.unlockedPlanet || 1;
    const targetPlanet = PLANETS.find(p => p.id === unlocked) || PLANETS[0];
    selectedSector = targetPlanet.sector;
    selectedPlanetId = targetPlanet.id;

    // Activate tab
    const tabs = document.querySelectorAll('.sector-tab');
    tabs.forEach(t => {
      if (parseInt(t.getAttribute('data-sector'), 10) === selectedSector) {
        t.classList.add('active', 'bg-cosmic-cyan/20', 'text-cosmic-cyan', 'border-cosmic-cyan');
        t.classList.remove('bg-slate-900/50', 'text-slate-400', 'border-slate-800');
      } else {
        t.classList.remove('active', 'bg-cosmic-cyan/20', 'text-cosmic-cyan', 'border-cosmic-cyan');
        t.classList.add('bg-slate-900/50', 'text-slate-400', 'border-slate-800');
      }
    });

    renderStarMapPlanets();
    updateTacticalBriefing();
  }

  function renderStarMapPlanets() {
    const grid = document.getElementById('planetsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const sectorPlanets = PLANETS.filter(p => p.sector === selectedSector);
    const unlocked = saveSystem.data.unlockedPlanet || 1;

    for (const p of sectorPlanets) {
      const isLocked = p.id > unlocked;
      const isSelected = p.id === selectedPlanetId;
      const stars = saveSystem.data.planetStars[p.id] || 0;

      const card = document.createElement('div');
      card.className = `glass-card p-3 rounded-2xl flex flex-col items-center text-center cursor-pointer transition border ${
        isSelected ? 'border-cosmic-cyan ring-2 ring-cosmic-cyan/50 bg-cosmic-cyan/10' : (isLocked ? 'border-slate-800 opacity-60' : 'border-slate-700/60 hover:border-cosmic-cyan/60')
      }`;

      const starIcons = isLocked
        ? '<span class="text-[10px] text-slate-500 font-orbitron">LOCKED</span>'
        : Array.from({ length: 3 }, (_, i) => ICON_SVG.star('w-3.5 h-3.5 ' + (i < stars ? 'text-cosmic-gold' : 'text-slate-700'), i < stars)).join('');

      card.innerHTML = `
        <div class="w-12 h-12 rounded-full mb-2 flex items-center justify-center text-xl shadow-lg relative" style="background: radial-gradient(circle at 35% 35%, ${p.color2}, ${p.color1} 70%, #030712); box-shadow: 0 0 12px ${p.atmo}66;">
          ${isLocked ? `<span class="bg-slate-900/90 p-1 rounded-full flex items-center justify-center">${ICON_SVG.lock('w-3 h-3 text-slate-300')}</span>` : ''}
          ${p.bossName ? `<span class="absolute -top-1 -right-1 flex items-center justify-center">${ICON_SVG.crown('w-3.5 h-3.5 text-cosmic-gold')}</span>` : ''}
        </div>
        <div class="text-xs font-black font-orbitron text-white truncate w-full">${p.name}</div>
        <div class="text-[9px] text-slate-400 truncate w-full">${p.title}</div>
        <div class="flex items-center gap-0.5 text-xs text-cosmic-gold mt-1.5">
          ${starIcons}
        </div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          audio.init();
          selectedPlanetId = p.id;
          renderStarMapPlanets();
          updateTacticalBriefing();
        });
      }

      grid.appendChild(card);
    }
  }

  function updateTacticalBriefing() {
    const planet = PLANETS.find(p => p.id === selectedPlanetId) || PLANETS[0];
    const stars = saveSystem.data.planetStars[planet.id] || 0;

    document.getElementById('briefingSectorTag').textContent = `SECTOR ${'I'.repeat(planet.sector)}`;
    const starBriefing = Array.from({ length: 3 }, (_, i) => 
      ICON_SVG.star('w-4 h-4 ' + (i < stars ? 'text-cosmic-gold drop-shadow-[0_0_6px_#ffd700]' : 'text-slate-700'), i < stars)
    ).join('');
    document.getElementById('briefingStars').innerHTML = starBriefing;
    document.getElementById('briefingPlanetName').textContent = planet.name.toUpperCase();
    document.getElementById('briefingPlanetTitle').textContent = planet.title;
    document.getElementById('briefingWaves').textContent = `${planet.waves} Invasion Waves`;
    document.getElementById('briefingEnemies').textContent = `${planet.baseEnemies} Alien Invaders`;
    document.getElementById('briefingRings').textContent = planet.rings ? 'Yes (Encircled)' : 'None';
    document.getElementById('briefingBoss').textContent = planet.bossName ? `BOSS: ${planet.bossName}` : 'Standard Armada';

    // Draw preview canvas
    const pCanvas = document.getElementById('briefingPlanetCanvas');
    if (pCanvas) {
      const pCtx = pCanvas.getContext('2d');
      pCtx.clearRect(0, 0, 70, 70);

      // Sphere
      const grad = pCtx.createRadialGradient(25, 25, 5, 35, 35, 32);
      grad.addColorStop(0, planet.color2);
      grad.addColorStop(0.7, planet.color1);
      grad.addColorStop(1, '#050814');

      pCtx.beginPath();
      pCtx.arc(35, 35, 26, 0, Math.PI * 2);
      pCtx.fillStyle = grad;
      pCtx.fill();

      // Atmospheric rim
      pCtx.strokeStyle = planet.atmo;
      pCtx.lineWidth = 2.5;
      pCtx.shadowColor = planet.atmo;
      pCtx.shadowBlur = 8;
      pCtx.stroke();
      pCtx.shadowBlur = 0;
    }
  }

  function openArmory() {
    document.getElementById('modalArmory').classList.remove('hidden');
    renderArmoryGrid();
  }

  function renderArmoryGrid() {
    const grid = document.getElementById('armoryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    document.getElementById('armoryShards').textContent = saveSystem.data.shards.toLocaleString();

    for (const [techId, cfg] of Object.entries(ARMORY_CONFIG)) {
      const lvl = saveSystem.data.upgrades[techId] || 0;
      const isMaxed = lvl >= cfg.maxLevel;
      const cost = saveSystem.getUpgradeCost(techId);
      const canAfford = !isMaxed && saveSystem.data.shards >= cost;

      const card = document.createElement('div');
      card.className = 'glass-card p-3.5 rounded-2xl flex flex-col justify-between border border-slate-700/60';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="flex items-center gap-2 font-orbitron font-bold text-xs text-white">
              <span class="text-base">${cfg.icon}</span>
              <span>${cfg.name}</span>
            </span>
            <span class="text-[10px] font-orbitron font-extrabold px-2 py-0.5 rounded-md ${
              isMaxed ? 'bg-cosmic-mint/20 text-cosmic-mint border border-cosmic-mint/30' : 'bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/30'
            }">
              ${isMaxed ? 'MAX LEVEL' : `Lv.${lvl} / ${cfg.maxLevel}`}
            </span>
          </div>
          <p class="text-[11px] text-slate-300 leading-snug mb-3">${cfg.desc}</p>
        </div>

        <button class="btn-upgrade-tech w-full py-2 rounded-xl font-orbitron font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
          isMaxed ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : (canAfford ? 'bg-gradient-to-r from-cosmic-gold to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black shadow-md' : 'bg-slate-800/80 text-slate-400 border border-slate-700')
        }" data-tech="${techId}" ${isMaxed || !canAfford ? 'disabled' : ''}>
          ${isMaxed ? 'TECH MAXED' : `<span class="flex items-center gap-1">UPGRADE [${ICON_SVG.shard('w-3.5 h-3.5 ' + (canAfford ? 'text-slate-950' : 'text-cosmic-gold'))} ${cost}]</span>`}
        </button>
      `;

      grid.appendChild(card);
    }

    // Attach upgrade listeners
    const upgradeButtons = grid.querySelectorAll('.btn-upgrade-tech');
    upgradeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        audio.init();
        const techId = e.currentTarget.getAttribute('data-tech');
        const success = saveSystem.upgradeTech(techId);
        if (success) {
          audio.playShardPickup();
          renderArmoryGrid();
          engine.applyUpgrades();
        }
      });
    });
  }

  function openCodex() {
    document.getElementById('modalCodex').classList.remove('hidden');
    renderCodexList();
  }

  function renderCodexList() {
    const list = document.getElementById('codexList');
    if (!list) return;
    list.innerHTML = '';

    // 7 Alien Dossiers
    for (const [key, alien] of Object.entries(ALIEN_CLASSES)) {
      const card = document.createElement('div');
      card.className = 'glass-card p-3.5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-slate-700/50 hover:border-cosmic-cyan/40 transition';

      card.innerHTML = `
        <div class="flex items-center gap-3.5">
          <div class="shrink-0 flex items-center justify-center p-1.5 rounded-xl bg-slate-950/70 border" style="border-color: ${alien.color}44;">
            ${ICON_SVG.shipSvg(key)}
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="font-orbitron font-bold text-sm text-white">${alien.name}</h4>
              <span class="text-[9px] font-orbitron px-2 py-0.5 rounded-full font-bold" style="background: ${alien.color}22; color: ${alien.color}; border: 1px solid ${alien.color}44;">
                ${alien.role}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 mt-1 max-w-md">${alien.behaviorDesc}</p>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span class="text-[10px] font-orbitron px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                HP: <strong class="text-white">${alien.hp}</strong>
              </span>
              <span class="text-[10px] font-orbitron px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                SPEED: <strong class="text-white">${alien.speed} px/s</strong>
              </span>
              <span class="text-[10px] font-orbitron px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                NOVA: <strong class="text-cosmic-gold">${alien.novaRadius}px</strong>
              </span>
              <span class="text-[10px] font-orbitron px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                VAL: <strong class="text-cosmic-cyan">${alien.score} pts</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="text-left md:text-right shrink-0 font-orbitron text-[10px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 min-w-[170px]">
          <div class="text-slate-400 font-semibold mb-0.5">DEATH PAYLOAD:</div>
          <div class="font-bold text-xs" style="color: ${alien.color};">${alien.deathPayload}</div>
        </div>
      `;

      list.appendChild(card);
    }

    // Trophies section inside Codex
    const trophHeader = document.createElement('h3');
    trophHeader.className = 'font-orbitron font-black text-sm text-cosmic-gold mt-4 mb-2 flex items-center gap-2';
    trophHeader.innerHTML = `${ICON_SVG.trophy('w-4 h-4 text-cosmic-gold')} <span>GUARDIAN TROPHIES SHOWCASE</span>`;
    list.appendChild(trophHeader);

    for (const t of TROPHIES) {
      const isUnlocked = !!saveSystem.data.trophies[t.id];
      const card = document.createElement('div');
      card.className = `glass-card p-3 rounded-2xl flex items-center justify-between gap-3 border ${
        isUnlocked ? 'border-cosmic-gold/50 bg-cosmic-gold/10' : 'border-slate-800 opacity-60'
      }`;

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">${t.icon}</span>
          <div>
            <div class="font-orbitron font-bold text-xs ${isUnlocked ? 'text-cosmic-gold' : 'text-slate-400'}">${t.name}</div>
            <div class="text-[10px] text-slate-400">${t.desc}</div>
          </div>
        </div>
        <div class="font-orbitron text-xs font-bold ${isUnlocked ? 'text-cosmic-mint' : 'text-slate-500'}">
          ${isUnlocked ? `<span class="flex items-center gap-1 font-bold">UNLOCKED (+${t.reward} ${ICON_SVG.shard('w-3.5 h-3.5 text-cosmic-gold')})</span>` : 'LOCKED'}
        </div>
      `;
      list.appendChild(card);
    }
  }

  // Start in Title Command Deck view
  openTitle();

  // YouTube Playables SDK ready hooks
  try {
    if (typeof window !== 'undefined' && window.ytgame?.game) {
      window.ytgame.game.firstFrameReady?.();
      window.ytgame.game.gameReady?.();
    }
  } catch (e) {
    console.debug('YouTube Playables notice:', e);
  }

  // Main Game Loop (requestAnimationFrame)
  let lastTime = performance.now();

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    engine.update(dt);
    engine.render();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
