// Spark Panic: Planetary Invasion Defense 2.5 - Core Game Engine Coordinator

import { PLANETS, SECTORS, ALIEN_CLASSES, ARMORY_CONFIG, TROPHIES, GUARDIAN_RANKS, getDailyAnomalyConfig, DAILY_MUTATORS, TITAN_PROTOCOL_CONFIG, WINGMAN_CONFIG, ASCENSION_CONFIG, TURRET_SKINS, COSMIC_RELICS, STRUCTURE_CONFIG, DEFAULT_SETTINGS, TACTICAL_DRAFT_PERKS, SYNERGY_EVOLUTIONS } from '../config.js';
import { audio } from '../engine/audio.js';
import { saveSystem } from '../engine/storage.js';
import { Planet } from './planet.js';
import { GuardianTurret } from './turret.js';
import { DefenseSatellite } from './satellite.js';
import { Alien } from './alien.js';
import { TacticalSkills } from './skills.js';
import { ProjectileManager } from './projectiles.js';
import { ParticleEngine } from './particles.js';
import { HazardManager } from './hazards.js';
import { SupplyPodManager } from './supply-pods.js';
import { WingmanFighter } from './wingman.js';
import { StructureManager } from './structures.js';
import { ICON_SVG } from '../ui/icons.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Display scaling
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Game state: 'TITLE' | 'STARMAP' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEFEAT'
    this.state = 'TITLE';

    // Subsystems
    this.planet = new Planet(this);
    this.planet.engine = this;
    this.turret = new GuardianTurret();
    this.satellites = [];
    this.wingman = new WingmanFighter(this);
    this.wingmanActive = false;
    this.wingman2 = null;
    this.structures = new StructureManager(this);
    this.skills = new TacticalSkills();
    this.projectiles = new ProjectileManager();
    this.particles = new ParticleEngine();
    this.hazards = new HazardManager();
    this.supplyPods = new SupplyPodManager();

    // Relic & Structure combat states
    this.relicChronoStasisCooldown = 0;
    this.turretShotCount = 0;
    this.solarEmberZones = [];

    // Gamepad controller state
    this.gamepadConnected = false;
    this.gamepadReticleX = this.width * 0.5;
    this.gamepadReticleY = this.height * 0.3;
    this.gamepadPrevButtons = {};

    // Active Mission State
    this.currentPlanetId = 1;
    this.isEndlessMode = false;
    this.isDailyAnomalyMode = false;
    this.isTitanProtocolMode = false;
    this.dailyAnomalyConfig = null;
    this.titanProtocolTimer = 0;
    this.isTitanPitStop = false;
    this.titanPitStopTimer = 0;

    // Tactical Telemetry & Damage Tracking
    this.telemetryHistory = [];
    this.telemetrySampleTimer = 0;
    this.missionTimer = 0;
    this.damageSources = { turret: 0, nova: 0, wingman: 0 };

    this.currentWave = 1;
    this.totalWaves = 2;
    this.waveSpawnQueue = [];
    this.spawnTimer = 0;
    this.aliens = [];

    // Interactive 3-Step Tutorial State
    this.isTutorialActive = false;
    this.tutorialStep = 1;
    this.tutorialAimAccum = 0;
    this.tutorialTimer = 0;
    this.lastTurretAngle = -Math.PI / 2;

    // Player Combat Stats
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.novaCharges = 3;
    this.maxNovaCharges = 3;
    this.novaProgress = 0;
    this.novaMultiplier = 1.0;
    this.killRechargeRate = 0.14;

    // Mission counters
    this.enemiesVaporized = 0;
    this.totalMissionEnemies = 0;
    this.activeBoss = null;

    // Pointer Input
    this.pointerX = this.width * 0.5;
    this.pointerY = this.height * 0.2;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeTimer = 0;

    // Deep Space Starfield & Arcade VFX
    this.stars = [];
    this.turretRecoil = 0;
    this.chainTethers = [];
    this.debris = [];
    this.threatIndicators = [];
    this.warpPortals = [];
    this.timeScale = 1.0;
    this.hitStopTimer = 0;
    this.vignettePulse = 0;
    this.comets = [];
    this.cometTimer = 0;
    this.parallaxX = 0;
    this.parallaxY = 0;
    this.gameTime = 0;
    this.coreCharge = 0;
    this.cataclysmShockwave = null;
    this.cataclysmMeteors = [];
    this.cataclysmDysonBeams = null;
    this.cataclysmFlashAlpha = 0;
    this.galleonSpawnedThisMission = false;

    // v2.8 Tactical Combat Mastery Systems
    this.parryTimer = 0;
    this.parryCooldown = 2.2;
    this.parryCooldownTimer = 0;
    this.isPointerDown = false;
    this.pointerDownTime = 0;
    this.isChargingOvercharge = false;
    this.chargeProgress = 0;
    this.activeDraftPerks = [];
    this.waveDraftPending = false;
    this.currentDraftOptions = [];
    this.beaconSpawnedThisMission = false;
    this.naniteSurgeTriggered = false;
    this.chainMomentumStacks = 0;
    this.lastKillTime = 0;
    this.onShowWaveDraftModal = null;
    this.onHideWaveDraftModal = null;
    this.onUpdateDraftBadges = null;

    // v2.9 Synergy Evolutions, Space Anomalies & Frenzy Overdrive Systems
    this.frenzy = 0;
    this.frenzyActive = false;
    this.frenzyTimer = 0;
    this.frenzyPauseTimer = 0;
    this.stormClouds = [];
    this.laserFirewalls = [];
    this.omegaDrones = [];
    this.wormholes = null;
    this.wormholeSpawnTimer = 18.0;
    this.plasmaBarrels = [];
    this.plasmaBarrelSpawnTimer = 15.0;

    this.initStars();

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      const layer = (i % 5 === 0) ? 3 : ((i % 2 === 0) ? 2 : 1);
      let size = Math.random() * 1.0 + 0.6;
      let alpha = Math.random() * 0.4 + 0.3;
      let speed = Math.random() * 1.5 + 0.8;
      if (layer === 2) {
        size = Math.random() * 1.2 + 1.3;
        alpha = Math.random() * 0.35 + 0.55;
        speed = Math.random() * 2.0 + 1.4;
      } else if (layer === 3) {
        size = Math.random() * 1.4 + 2.2;
        alpha = Math.random() * 0.25 + 0.75;
        speed = Math.random() * 2.5 + 2.0;
      }
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        layer,
        size,
        alpha,
        phase: Math.random() * Math.PI * 2,
        speed
      });
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    if (this.ctx && typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    this.planet.resize(this.width, this.height);
    this.initStars();
  }

  applyUpgrades() {
    const up = saveSystem.data.upgrades;

    // 1. Turret Firepower & Barrels & Chassis & Skin
    this.turret.setUpgradeLevel(up.turretDmg || 0);
    this.turret.setChassis(saveSystem.getSelectedChassis());
    this.turret.setSkin(saveSystem.getSelectedTurretSkin());

    // 2. Nova Radius & Catalyst
    this.novaMultiplier = 1.0 + (up.novaRadius || 0) * 0.14;
    if (this.hasDailyMutator('supernovaChain')) {
      this.novaMultiplier *= 1.35;
    }

    // 3. Nova Charges & Kill Recharge
    this.maxNovaCharges = 3 + (up.novaCharges || 0);
    this.novaCharges = this.maxNovaCharges;
    this.killRechargeRate = 0.14 + (up.novaCharges || 0) * 0.02;
    if (this.hasDailyMutator('hyperCapacitor')) {
      this.killRechargeRate *= 1.6;
    }

    // 4. Shield Grid
    this.planet.setPlanet(this.planet.data || PLANETS[0], up.shieldGrid || 0);

    // 5. Autonomous Satellites (up to 4)
    this.satellites = [];
    const satCount = up.satellites || 0;
    for (let i = 0; i < satCount; i++) {
      this.satellites.push(new DefenseSatellite(i, satCount));
    }

    // 6. Autonomous AI Wingman Fighter (WING-01)
    this.wingmanActive = saveSystem.isWingmanUnlocked();
    if (this.wingmanActive && this.wingman) {
      this.wingman.setDoctrine(saveSystem.getSelectedWingmanDoctrine());
    }

    // WING-02 Fighter via Ancient Cosmic Relic (twinWingman)
    if (this.wingmanActive && this.hasRelic('twinWingman')) {
      if (!this.wingman2) {
        this.wingman2 = new WingmanFighter(this, 'WING-02', Math.PI);
      }
      this.wingman2.setDoctrine(saveSystem.getSelectedWingmanDoctrine());
    } else {
      this.wingman2 = null;
    }

    // 7. Tactical Core Cooldowns
    this.skills.setCooldownReduction(up.tacticalCd || 0);
  }

  hasRelic(id) {
    if (!saveSystem || !saveSystem.isRelicEquipped) return false;
    return saveSystem.isRelicEquipped(id);
  }

  getSettings() {
    if (!saveSystem || !saveSystem.getSettings) return DEFAULT_SETTINGS;
    return saveSystem.getSettings();
  }

  deployStructure() {
    if (this.state !== 'PLAYING') return false;
    const structure = this.structures.deploy(this.turret.angle);
    return !!structure;
  }

  triggerPlanetaryCataclysm() {
    if (this.state !== 'PLAYING') return false;
    if (this.coreCharge < 100) {
      this.particles.addFloater(this.planet.x, this.planet.y - 50, `CATACLYSM CHARGING: ${Math.round(this.coreCharge)}%`, '#ff9100', 14);
      return false;
    }

    this.coreCharge = 0;
    audio.playCataclysm();
    this.addScreenShake(20, 0.7);

    const sector = this.planet.sector || (this.planet.data ? this.planet.data.sector : 1) || 1;

    if (sector === 1) {
      // Sector I — ❄️ CRYO-TSUNAMI PULSE
      this.cataclysmShockwave = {
        x: this.planet.x,
        y: this.planet.y,
        radius: 15,
        maxRadius: 450,
        speed: 540,
        color: '#00e5ff'
      };
      // Freeze all enemies on screen for 5.0s & deal 140 damage
      for (const a of this.aliens) {
        if (a.alive) {
          a.freeze(5.0);
          a.takeDamage(140, this.planet.x, this.planet.y, true);
        }
      }
      // Shatter all torpedoes into healing sparks
      let torpHeals = 0;
      for (const torp of this.projectiles.torpedoes) {
        if (torp.alive) {
          torp.alive = false;
          torpHeals++;
          this.particles.spawnCosmicSpark(torp.x, torp.y, 2);
        }
      }
      if (torpHeals > 0) {
        this.planet.restoreShield(Math.min(45, torpHeals * 15));
        this.planet.coreHp = Math.min(this.planet.maxCoreHp, this.planet.coreHp + torpHeals * 10);
      }
      this.particles.addFloater(this.planet.x, this.planet.y - 80, '❄️ CRYO-TSUNAMI PULSE! FLEET FROZEN & 140 DMG!', '#00e5ff', 20);
    } else if (sector === 2) {
      // Sector II — 🌋 MAGMA METEOR ERUPTION
      this.cataclysmMeteors = [];
      const count = 12;
      const targets = this.aliens.filter(a => a.alive).sort((a, b) => b.hp - a.hp);

      for (let m = 0; m < count; m++) {
        const mAngle = (m / count) * Math.PI * 2;
        const target = targets.length > 0 ? targets[m % targets.length] : null;
        this.cataclysmMeteors.push({
          x: this.planet.x + Math.cos(mAngle) * (this.planet.planetRadius + 10),
          y: this.planet.y + Math.sin(mAngle) * (this.planet.planetRadius + 10),
          vx: Math.cos(mAngle) * 220,
          vy: Math.sin(mAngle) * 220,
          target,
          timer: 1.5,
          maxTimer: 1.5,
          speed: 380,
          color: '#ff3d00'
        });
      }
      this.particles.addFloater(this.planet.x, this.planet.y - 80, '🌋 MAGMA METEOR ERUPTION! 12 VOLCANIC BOMBS!', '#ff3d00', 20);
    } else if (sector === 3) {
      // Sector III — ⚙️ DYSON ORBITAL LASER CAGE
      this.cataclysmDysonBeams = {
        angle: 0,
        timer: 4.0,
        maxTimer: 4.0,
        length: Math.max(this.width, this.height) * 0.95
      };
      this.particles.addFloater(this.planet.x, this.planet.y - 80, '⚙️ DYSON ORBITAL LASER CAGE! 360° FLEET CLEAVE!', '#ffd700', 20);
    } else {
      // Sector IV — ☀️ GENESIS SUPERNOVA
      this.cataclysmFlashAlpha = 1.0;
      for (const a of this.aliens) {
        if (a.alive) {
          if (a.classKey === 'BOSS') {
            a.takeDamage(350, this.planet.x, this.planet.y, true);
          } else {
            a.takeDamage(9999, this.planet.x, this.planet.y, true);
          }
        }
      }
      this.planet.restoreShield(Math.round(this.planet.maxShield * 0.30));
      this.particles.addFloater(this.planet.x, this.planet.y - 80, '☀️ GENESIS SUPERNOVA! ARMADA VAPORIZED +30% SHIELD!', '#ffd700', 20);
    }

    this.updateCataclysmUI();
    return true;
  }

  updateCataclysmUI() {
    const btn = document.getElementById('btnCataclysm');
    const fill = document.getElementById('cataclysmFill');
    const label = document.getElementById('cataclysmPercent');
    const glow = document.getElementById('cataclysmReadyGlow');
    if (!btn) return;

    const pct = Math.min(100, Math.max(0, Math.round(this.coreCharge || 0)));
    if (fill) fill.style.height = `${pct}%`;

    if (pct >= 100) {
      if (label) label.textContent = '[F] READY!';
      if (glow) glow.classList.remove('hidden');
      btn.classList.add('border-amber-400', 'shadow-[0_0_18px_rgba(251,191,36,0.5)]');
    } else {
      if (label) label.textContent = `[F] ${pct}%`;
      if (glow) glow.classList.add('hidden');
      btn.classList.remove('border-amber-400', 'shadow-[0_0_18px_rgba(251,191,36,0.5)]');
    }
  }

  onShieldBroken() {
    if (this.hasRelic('chronoStasis') && this.relicChronoStasisCooldown <= 0) {
      this.relicChronoStasisCooldown = 18;
      for (const alien of this.aliens) {
        if (!alien.alive) continue;
        alien.speedMultiplier = 0.35;
        alien.slowTimer = 4.0;
      }
      this.particles.spawnNovaRing(this.planet.x, this.planet.y, '#00e5ff', 240);
      this.particles.addFloater(this.planet.x, this.planet.y - 30, '⏱️ CHRONO STASIS TRIGGERED!', '#00e5ff', 16);
      audio.playTimeWarp();
    }

    // v2.8 Emergency Nanite Surge: Restore 40% Core HP & Shield on shield break once per mission
    if (this.hasPerk('naniteSurge') && !this.naniteSurgeTriggered) {
      this.naniteSurgeTriggered = true;
      this.planet.shield = Math.round(this.planet.maxShield * 0.40);
      this.planet.coreHp = Math.min(this.planet.maxCoreHp, Math.round(this.planet.coreHp + this.planet.maxCoreHp * 0.40));
      this.particles.spawnNovaRing(this.planet.x, this.planet.y, '#00e676', 180);
      this.particles.addFloater(this.planet.x, this.planet.y - 50, '💉 EMERGENCY NANITE SURGE! +40% HP & SHIELD', '#00e676', 18);
      audio.playSkill('E');
    }
  }

  pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    let gp = null;
    for (const g of gamepads) {
      if (g && g.connected) { gp = g; break; }
    }
    if (!gp) {
      this.gamepadConnected = false;
      return;
    }
    this.gamepadConnected = true;

    // Left stick aims turret
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    if (Math.hypot(lx, ly) > 0.22) {
      this.pointerX = this.planet.x + lx * 240;
      this.pointerY = this.planet.y + ly * 240;
    }

    // Right stick moves reticle
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;
    if (Math.hypot(rx, ry) > 0.2) {
      const speed = 650;
      this.gamepadReticleX = Math.max(40, Math.min(this.width - 40, this.gamepadReticleX + rx * speed * 0.016));
      this.gamepadReticleY = Math.max(40, Math.min(this.height - 40, this.gamepadReticleY + ry * speed * 0.016));
    }

    const isPressed = (idx) => gp.buttons[idx] && (gp.buttons[idx].pressed || gp.buttons[idx].value > 0.5);
    const wasJustPressed = (idx) => isPressed(idx) && !this.gamepadPrevButtons[idx];

    // RT (button 7) or A (button 0): Spark Nova
    if (wasJustPressed(7) || wasJustPressed(0)) {
      this.triggerSparkNova(this.gamepadReticleX, this.gamepadReticleY);
    }
    // X (button 2): Skill Q (Ion Beam)
    if (wasJustPressed(2)) {
      this.triggerSkill('Q');
    }
    // Y (button 3): Skill W (EMP Wave)
    if (wasJustPressed(3)) {
      this.triggerSkill('W');
    }
    // B (button 1): Skill E (Aegis Overdrive)
    if (wasJustPressed(1)) {
      this.triggerSkill('E');
    }
    // RB (button 5): Skill R (Deploy Structure)
    if (wasJustPressed(5)) {
      this.deployStructure();
    }
    // LB (button 4) or D-pad Up (button 12): Planetary Cataclysm Superweapon
    if (wasJustPressed(4) || wasJustPressed(12)) {
      this.triggerPlanetaryCataclysm();
    }
    // Start (button 9): Pause
    if (wasJustPressed(9)) {
      this.togglePause();
    }

    for (let i = 0; i < gp.buttons.length; i++) {
      this.gamepadPrevButtons[i] = isPressed(i);
    }
  }

  renderGamepadReticle(ctx) {
    if (!this.gamepadConnected || this.state !== 'PLAYING') return;
    const rx = this.gamepadReticleX;
    const ry = this.gamepadReticleY;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, 14, 0, Math.PI * 2);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rx - 20, ry);
    ctx.lineTo(rx - 8, ry);
    ctx.moveTo(rx + 8, ry);
    ctx.lineTo(rx + 20, ry);
    ctx.moveTo(rx, ry - 20);
    ctx.lineTo(rx, ry - 8);
    ctx.moveTo(rx, ry + 8);
    ctx.lineTo(rx, ry + 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  startMission(planetId = 1, isEndless = false) {
    if (isEndless) {
      this.startEndless();
    } else {
      this.startCampaignPlanet(planetId);
    }
  }

  startCampaignPlanet(planetId) {
    this.currentPlanetId = planetId;
    this.isEndlessMode = false;
    this.isDailyAnomalyMode = false;
    this.isTitanProtocolMode = false;
    this.dailyAnomalyConfig = null;
    const cfg = PLANETS.find(p => p.id === planetId) || PLANETS[0];
    this.totalWaves = cfg.waves;
    this.currentWave = 1;

    this.resetCombatState();
    this.planet.setPlanet(cfg, saveSystem.data.upgrades.shieldGrid || 0);
    this.applyUpgrades();
    this.hazards.initSector(cfg.sector, this.planet.x, this.planet.y, this.planet.planetRadius);
    this.supplyPods.reset();
    this.setupWaveSpawns();

    this.state = 'PLAYING';
    audio.init();
    audio.startBgm();

    // Trigger onboarding tutorial if on Planet 1 and not yet completed
    if (planetId === 1 && !saveSystem.isTutorialCompleted()) {
      this.startTutorial();
    }
  }

  startDailyAnomaly(dateStr) {
    this.isDailyAnomalyMode = true;
    this.isEndlessMode = false;
    this.isTitanProtocolMode = false;
    const cfg = getDailyAnomalyConfig(dateStr);
    this.dailyAnomalyConfig = cfg;
    this.currentPlanetId = cfg.planet.id;
    this.totalWaves = 3; // 3 intense anomaly waves
    this.currentWave = 1;

    this.resetCombatState();
    this.planet.setPlanet(cfg.planet, saveSystem.data.upgrades.shieldGrid || 0);
    this.applyUpgrades();

    // Mutator: Glass Aegis
    if (this.hasDailyMutator('glassAegis')) {
      this.planet.maxCoreHp = Math.round(this.planet.maxCoreHp * 0.6);
      this.planet.coreHp = this.planet.maxCoreHp;
      this.planet.maxShield = Math.round(this.planet.maxShield * 2.0);
      this.planet.shield = this.planet.maxShield;
      this.planet.shieldRegenRate *= 2.0;
    }

    this.hazards.initSector(cfg.hazardSector, this.planet.x, this.planet.y, this.planet.planetRadius);
    this.supplyPods.reset();
    this.setupWaveSpawns();

    this.state = 'PLAYING';
    audio.init();
    audio.startBgm();

    this.particles.addFloater(this.planet.x, this.planet.y - 120, '⚡ DAILY ANOMALY: ' + cfg.dateKey, '#ffd700', 26);
    this.addScreenShake(8, 0.3);
  }

  hasDailyMutator(mutatorId) {
    if (!this.isDailyAnomalyMode || !this.dailyAnomalyConfig || !this.dailyAnomalyConfig.mutators) return false;
    return this.dailyAnomalyConfig.mutators.some(m => m.id === mutatorId);
  }

  startEndless() {
    this.isEndlessMode = true;
    this.isDailyAnomalyMode = false;
    this.isTitanProtocolMode = false;
    this.dailyAnomalyConfig = null;
    this.currentPlanetId = 1;
    this.currentWave = 1;
    this.totalWaves = 999;

    this.resetCombatState();
    const endlessPlanet = {
      ...PLANETS[0],
      name: 'Earth Prime',
      title: 'Cosmic Core Bastion',
      atmo: '#00e5ff',
      rings: true
    };
    this.planet.setPlanet(endlessPlanet, saveSystem.data.upgrades.shieldGrid || 0);
    this.applyUpgrades();
    this.hazards.initSector(1, this.planet.x, this.planet.y, this.planet.planetRadius);
    this.supplyPods.reset();
    this.setupWaveSpawns();

    this.state = 'PLAYING';
    audio.init();
    audio.startBgm();
  }

  startTitanProtocol() {
    this.isTitanProtocolMode = true;
    this.isEndlessMode = false;
    this.isDailyAnomalyMode = false;
    this.dailyAnomalyConfig = null;
    this.titanProtocolTimer = 0;
    this.totalWaves = TITAN_PROTOCOL_CONFIG.totalWaves;
    this.currentWave = 1;

    this.resetCombatState();
    const waveCfg = TITAN_PROTOCOL_CONFIG.waves[0];
    const planetCfg = PLANETS.find(p => p.id === waveCfg.planetId) || PLANETS[4];
    this.planet.setPlanet(planetCfg, saveSystem.data.upgrades.shieldGrid || 0);
    this.applyUpgrades();
    this.hazards.initSector(waveCfg.hazardSector, this.planet.x, this.planet.y, this.planet.planetRadius);
    this.supplyPods.reset();
    this.setupWaveSpawns();

    this.state = 'PLAYING';
    audio.init();
    audio.startBgm();

    this.particles.addFloater(this.planet.x, this.planet.y - 120, '👑 TITAN PROTOCOL INITIATED', '#ffd700', 28);
    this.addScreenShake(12, 0.4);
  }

  resetCombatState() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.novaProgress = 0;
    this.enemiesVaporized = 0;
    this.totalMissionEnemies = 0;
    this.activeBoss = null;

    this.aliens = [];
    this.waveSpawnQueue = [];
    this.projectiles.clear();
    this.particles.clear();

    // v2.4 Tactical Telemetry & Damage Breakdown
    this.telemetryHistory = [];
    this.telemetrySampleTimer = 0;
    this.missionTimer = 0;
    this.damageSources = { turret: 0, nova: 0, wingman: 0 };
    this.isTitanPitStop = false;
    this.titanPitStopTimer = 0;
    if (this.wingman) {
      this.wingman.mines = [];
    }
    if (this.wingman2) {
      this.wingman2.mines = [];
    }
    if (this.structures) {
      this.structures.reset();
    }
    this.solarEmberZones = [];
    this.turretShotCount = 0;
    this.relicChronoStasisCooldown = 0;

    // v2.6 Arcade Juice & Spectacle states
    this.chainTethers = [];
    this.debris = [];
    this.threatIndicators = [];
    this.warpPortals = [];
    this.timeScale = 1.0;
    this.hitStopTimer = 0;
    this.vignettePulse = 0;
    this.comets = [];
    this.cometTimer = 0;
    this.turretRecoil = 0;
    this.coreCharge = 0;
    this.cataclysmShockwave = null;
    this.cataclysmMeteors = [];
    this.cataclysmDysonBeams = null;
    this.cataclysmFlashAlpha = 0;
    this.galleonSpawnedThisMission = false;

    // v2.8 Tactical Mastery states
    this.parryTimer = 0;
    this.parryCooldownTimer = 0;
    this.isPointerDown = false;
    this.pointerDownTime = 0;
    this.isChargingOvercharge = false;
    this.chargeProgress = 0;
    this.activeDraftPerks = [];
    this.waveDraftPending = false;
    this.currentDraftOptions = [];
    this.beaconSpawnedThisMission = false;
    this.naniteSurgeTriggered = false;
    this.chainMomentumStacks = 0;
    this.lastKillTime = 0;
    if (this.onUpdateDraftBadges) {
      this.onUpdateDraftBadges(this.activeDraftPerks);
    }

    // v2.9 Synergy Evolutions, Space Anomalies & Frenzy Overdrive states
    this.frenzy = 0;
    this.frenzyActive = false;
    this.frenzyTimer = 0;
    this.frenzyPauseTimer = 0;
    this.stormClouds = [];
    this.laserFirewalls = [];
    this.omegaDrones = [];
    this.wormholes = null;
    this.wormholeSpawnTimer = 18.0;
    this.plasmaBarrels = [];
    this.plasmaBarrelSpawnTimer = 15.0;
    audio.setBgmTempoMultiplier(1.0);
    this.updateFrenzyUI();
  }

  setupWaveSpawns() {
    this.waveSpawnQueue = [];
    this.spawnTimer = 0.5;

    // Titan Protocol 4-Boss Rush Waves
    if (this.isTitanProtocolMode) {
      const waveCfg = TITAN_PROTOCOL_CONFIG.waves[this.currentWave - 1] || TITAN_PROTOCOL_CONFIG.waves[0];
      this.hazards.initSector(waveCfg.hazardSector, this.planet.x, this.planet.y, this.planet.planetRadius);
      const planetCfg = PLANETS.find(p => p.id === waveCfg.planetId) || PLANETS[0];
      this.planet.color1 = planetCfg.color1;
      this.planet.color2 = planetCfg.color2;
      this.planet.atmo = planetCfg.atmo;
      this.planet.hasRings = !!planetCfg.rings;
      this.planet.name = planetCfg.name;

      this.particles.addFloater(this.planet.x, this.planet.y - 120, waveCfg.title, '#ffd700', 22);

      let delay = 0.5;
      for (const escort of waveCfg.escorts) {
        for (let e = 0; e < escort.count; e++) {
          this.waveSpawnQueue.push({
            classKey: escort.classKey,
            delay: delay
          });
          delay += 0.45;
        }
      }

      this.waveSpawnQueue.push({
        classKey: 'BOSS',
        delay: delay + 1.0,
        bossCustomName: waveCfg.bossName,
        bossCustomHp: waveCfg.bossHp
      });

      this.totalMissionEnemies += this.waveSpawnQueue.length;
      return;
    }

    // Endless Mode Cosmic Shift & Biome Rotation every 3 waves (Wave 1, Wave 4, Wave 7, ...)
    if (this.isEndlessMode && (this.currentWave - 1) % 3 === 0) {
      const hazardIndex = (Math.floor((this.currentWave - 1) / 3) % 4) + 1;
      this.hazards.initSector(hazardIndex, this.planet.x, this.planet.y, this.planet.planetRadius);

      const pCfg = PLANETS[(this.currentWave - 1) % PLANETS.length];
      this.planet.color1 = pCfg.color1;
      this.planet.color2 = pCfg.color2;
      this.planet.atmo = pCfg.atmo;
      this.planet.hasRings = !!pCfg.rings;
      this.planet.name = pCfg.name;

      if (this.currentWave > 1) {
        const hInfo = this.hazards.getHazardInfo();
        this.particles.addFloater(this.planet.x, this.planet.y - 120, '⚡ COSMIC SHIFT: ' + hInfo.name, '#ffd700', 26);
        this.addScreenShake(10, 0.3);
        audio.playSkill('W');
      }
    }

    let totalEnemies = 12;
    if (this.isDailyAnomalyMode) {
      totalEnemies = 16 + this.currentWave * 6;
      if (this.hasDailyMutator('swarmBlitz')) {
        totalEnemies = Math.round(totalEnemies * 1.5);
      }
    } else if (this.isEndlessMode) {
      totalEnemies = 16 + this.currentWave * 4;
    } else {
      const cfg = PLANETS.find(p => p.id === this.currentPlanetId) || PLANETS[0];
      totalEnemies = Math.round(cfg.baseEnemies * (0.85 + (this.currentWave - 1) * 0.35));
    }

    this.totalMissionEnemies += totalEnemies;

    // Check if wave is boss wave
    let isBossWave = false;
    if (this.isDailyAnomalyMode) {
      isBossWave = (this.currentWave === this.totalWaves);
    } else if (this.isEndlessMode) {
      isBossWave = (this.currentWave % 5 === 0);
    } else {
      const cfg = PLANETS.find(p => p.id === this.currentPlanetId) || PLANETS[0];
      isBossWave = (this.currentWave === this.totalWaves && cfg.bossName !== null);
    }

    // Determine ship distribution
    for (let i = 0; i < totalEnemies; i++) {
      let classKey = 'SCOUT';
      const roll = Math.random();

      if (this.currentPlanetId >= 2 && roll < 0.22) classKey = 'INTERCEPTOR';
      else if (this.currentPlanetId >= 3 && roll < 0.32) classKey = 'JAMMER';
      else if (this.currentPlanetId >= 4 && roll < 0.42) classKey = 'CRYO';
      else if (this.currentPlanetId >= 5 && roll < 0.52) classKey = (roll < 0.47 ? 'PHASE' : 'LEECH');
      else if (this.currentPlanetId >= 7 && roll < 0.65) classKey = (roll < 0.58 ? 'WEAVER' : 'LEECH');
      else if (this.currentPlanetId >= 10 && roll < 0.78) classKey = 'DROPSHIP';
      else if (this.currentPlanetId >= 13 && roll < 0.90) classKey = 'DREADNOUGHT';

      this.waveSpawnQueue.push({ classKey, delay: i * (1.1 - Math.min(0.6, this.currentWave * 0.08)) });
    }

    // v2.8 Warp Ambush Beacon (Outer orbit in Wave 2+ or Endless Wave 3+)
    if (!this.beaconSpawnedThisMission && (this.currentWave >= 2 || (this.isEndlessMode && this.currentWave >= 3))) {
      this.waveSpawnQueue.push({
        classKey: 'BEACON',
        delay: 2.5
      });
      this.beaconSpawnedThisMission = true;
    }

    // Astral Treasure Galleon mid-wave encounter (once per mission from wave 2+, or every 2 waves in Endless/Daily)
    if (!this.galleonSpawnedThisMission && (this.currentWave >= 2 || (this.isEndlessMode && this.currentWave % 2 === 0))) {
      this.waveSpawnQueue.push({
        classKey: 'GALLEON',
        delay: Math.max(3.0, totalEnemies * 0.45)
      });
      this.galleonSpawnedThisMission = true;
    }

    // Boss spawn
    if (isBossWave) {
      const cfg = PLANETS.find(p => p.id === this.currentPlanetId);
      this.waveSpawnQueue.push({
        classKey: 'BOSS',
        delay: totalEnemies * 0.4,
        bossCustomName: cfg ? cfg.bossName : `Mothership Core W${this.currentWave}`
      });
    } else if (this.hasDailyMutator('bossRush')) {
      this.waveSpawnQueue.push({
        classKey: 'DREADNOUGHT',
        delay: totalEnemies * 0.35,
        bossCustomName: 'Elite Anomaly Escort'
      });
    }
  }

  triggerSparkNova(targetX, targetY) {
    if (this.novaCharges <= 0) return false;
    this.novaCharges--;

    audio.playNovaLaunch();
    const inNebula = this.hazards.isInsideNebula(targetX, targetY);
    let blastRadius = 86 * this.novaMultiplier;
    let damage = 38 * this.novaMultiplier;
    let color = '#00e5ff';

    if (inNebula) {
      blastRadius *= 1.35; // +35% blast radius in Ion Nebula
      damage *= 1.25;      // +25% damage in Ion Nebula
      color = '#e040fb';
      this.particles.addFloater(targetX, targetY - 24, '⚡ ION SUPERCHARGE!', '#e040fb', 18);
      this.particles.spawnDebris(targetX, targetY, '#e040fb', 16);
    }

    if (this.hasDailyMutator('supernovaChain')) {
      blastRadius *= 1.35;
    }

    // Singularity Lens Relic: Inward Gravitational Pull (135px)
    if (this.hasRelic('singularityLens')) {
      for (const alien of this.aliens) {
        if (!alien.alive) continue;
        const dist = Math.hypot(alien.x - targetX, alien.y - targetY);
        if (dist > 0 && dist <= 320) {
          const pullAngle = Math.atan2(targetY - alien.y, targetX - alien.x);
          const pullDist = Math.min(dist - 10, 135);
          if (pullDist > 0) {
            alien.x += Math.cos(pullAngle) * pullDist;
            alien.y += Math.sin(pullAngle) * pullDist;
          }
        }
      }
      this.particles.spawnNovaRing(targetX, targetY, '#e040fb', blastRadius * 1.3);
      this.particles.addFloater(targetX, targetY - 32, '🌀 SINGULARITY PULL!', '#e040fb', 15);
    }

    // Supernova Echo Relic: 2.5s Solar Ember Burning Zone (35 dmg/s DoT)
    if (this.hasRelic('supernovaEcho')) {
      this.solarEmberZones.push({
        x: targetX,
        y: targetY,
        radius: blastRadius * 0.95,
        life: 2.5,
        maxLife: 2.5,
        dps: 35
      });
      this.particles.addFloater(targetX, targetY + 22, '🔥 SOLAR EMBER ZONE', '#ff9800', 13);
    }

    if (this.isTutorialActive && this.tutorialStep === 2) {
      this.advanceTutorial(3);
    }

    this.particles.spawnNova(targetX, targetY, blastRadius, color, damage, true);

    // v2.8 Split-Nova Catalyst Draft Perk: Splits into 4 homing mini-plasmas
    if (this.hasPerk('splitNova')) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        this.projectiles.addPlasmaBolt({
          x: targetX,
          y: targetY,
          angle: a,
          speed: 520,
          damage: 45,
          color: '#ffd700',
          isRocket: true,
          splashRadius: 35,
          source: 'nova'
        });
      }
    }

    // v2.9 Thunderstorm Singularity Synergy: Spawns 4.0s Ionized Storm Cloud (115px) zapping 4 aliens every 0.4s
    if (this.hasPerk('thunderstormSingularity')) {
      this.stormClouds.push({
        x: targetX,
        y: targetY,
        radius: 115,
        life: 4.0,
        maxLife: 4.0,
        zapTimer: 0.4
      });
      this.particles.addFloater(targetX, targetY - 40, '🌩️ THUNDERSTORM SINGULARITY!', '#00e5ff', 18);
    }

    // v2.9 Spark Nova Portal Echo: detonating within 45px of Portal A triggers twin echo at Portal B (and vice-versa)
    if (this.wormholes) {
      const wh = this.wormholes;
      const distA = Math.hypot(targetX - wh.a.x, targetY - wh.a.y);
      const distB = Math.hypot(targetX - wh.b.x, targetY - wh.b.y);
      if (distA <= 45) {
        this.particles.spawnNova(wh.b.x, wh.b.y, blastRadius, '#e040fb', damage, true);
        this.particles.addFloater(wh.b.x, wh.b.y - 30, '🌀 NOVA PORTAL ECHO!', '#e040fb', 18);
      } else if (distB <= 45) {
        this.particles.spawnNova(wh.a.x, wh.a.y, blastRadius, '#00e5ff', damage, true);
        this.particles.addFloater(wh.a.x, wh.a.y - 30, '🌀 NOVA PORTAL ECHO!', '#00e5ff', 18);
      }
    }

    this.addScreenShake(inNebula ? 9 : 6, 0.2);
    return true;
  }

  triggerQuickNova() {
    if (this.state !== 'PLAYING') return false;
    const spawnDist = (this.planet.planetRadius || 75) + 130;
    const nx = this.planet.x + Math.cos(this.turret.angle) * spawnDist;
    const ny = this.planet.y + Math.sin(this.turret.angle) * spawnDist;
    return this.triggerSparkNova(nx, ny);
  }

  addScreenShake(intensity = 6, duration = 0.2) {
    const settings = this.getSettings();
    const scale = (settings.screenShake ?? 100) / 100;
    if (scale <= 0) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity * scale);
    this.shakeTimer = duration;
  }

  onBossPhase2(boss) {
    this.addScreenShake(16, 0.45);
    audio.playSkill('W');
    this.particles.addFloater(boss.x, boss.y - 45, '⚠️ PHASE 2: OVERDRIVE SIEGE! ⚠️', '#ff1744', 22);

    const bossBar = document.getElementById('bossHudBar');
    if (bossBar) {
      bossBar.classList.add('ring-4', 'ring-cosmic-crimson', 'animate-pulse');
    }

    // Boss Escort Wing Summon: 3 Trident Interceptors + 2 Cryo-Cruisers
    const escorts = [
      { classKey: 'INTERCEPTOR', angleOffset: -0.6, dist: 75 },
      { classKey: 'INTERCEPTOR', angleOffset: 0, dist: 85 },
      { classKey: 'INTERCEPTOR', angleOffset: 0.6, dist: 75 },
      { classKey: 'CRYO', angleOffset: -1.2, dist: 70 },
      { classKey: 'CRYO', angleOffset: 1.2, dist: 70 }
    ];

    for (const e of escorts) {
      const ex = boss.x + Math.cos(boss.heading + e.angleOffset) * e.dist;
      const ey = boss.y + Math.sin(boss.heading + e.angleOffset) * e.dist;
      const escortShip = new Alien(ex, ey, e.classKey);
      escortShip.engine = this;
      this.aliens.push(escortShip);
      this.particles.spawnDebris(ex, ey, escortShip.color, 8);
    }
  }

  onSupplyPodDestroyed(x, y, buffType) {
    audio.playShardPickup();
    this.particles.spawnDebris(x, y, '#ffd700', 16);
    this.addScreenShake(6, 0.15);

    if (buffType === 'QUAD_PULSE') {
      this.particles.addFloater(x, y, '🔥 QUAD-PULSE OVERCLOCK (8s)!', '#f97316', 18);
      this.showToast('🔥 QUAD-PULSE OVERCLOCK! +2 BARRELS & +35% FIRE RATE', '#f97316');
    } else if (buffType === 'CRYO_TIMEWARP') {
      this.particles.addFloater(x, y, '❄️ CRYO TIME-WARP (6s)!', '#00e676', 18);
      this.showToast('❄️ CRYO TIME-WARP! ALL ENEMIES SLOWED 60%', '#00e676');
    } else if (buffType === 'NOVA_SURGE') {
      this.novaCharges = Math.min(this.maxNovaCharges, this.novaCharges + 2);
      const shieldRestored = this.planet.restoreShield(Math.round(this.planet.maxShield * 0.35));
      this.particles.addFloater(x, y, `⚡ +2 NOVAS & +${shieldRestored} SHIELD!`, '#00e5ff', 18);
      this.showToast('⚡ NOVA & SHIELD SURGE! +2 NOVAS & +35% SHIELD', '#00e5ff');
    }

    if (this.hasRelic('starlightSynth')) {
      this.novaCharges = Math.min(this.maxNovaCharges, this.novaCharges + 1);
      this.particles.addFloater(x, y - 24, '+1 NOVA (STARLIGHT SYNTH)', '#ffd700', 14);
    }
  }

  onAsteroidShattered(x, y) {
    let shardReward = 15;
    if (this.hasRelic('starlightSynth')) {
      shardReward = Math.round(shardReward * 1.35);
    }
    saveSystem.addShards(shardReward);
    audio.playShardPickup();
    this.particles.spawnDebris(x, y, '#94a3b8', 14);
    this.particles.spawnCosmicSpark(x, y, 3);
    this.particles.addFloater(x, y, `+${shardReward} SHARDS! ASTEROID SHATTER!`, '#ffd700', 16);
    this.addScreenShake(6, 0.2);

    // Kinetic shockwave (65px, damages nearby aliens for 40 dmg)
    this.particles.spawnNova(x, y, 65, '#94a3b8', 40, false);
  }

  onSolarFlarePulse(px, py, maxRadius) {
    audio.playSkill('W');
    this.addScreenShake(10, 0.3);
    this.particles.addFloater(px, py - 90, '☀️ SOLAR CORONA ERUPTION!', '#ffd700', 20);

    for (const alien of this.aliens) {
      if (!alien.alive) continue;
      const d = Math.hypot(alien.x - px, alien.y - py);
      if (d <= maxRadius + alien.radius) {
        alien.takeDamage(35, null, null, true);
        this.particles.spawnDebris(alien.x, alien.y, '#ffd700', 6);
      }
    }

    this.novaProgress += 0.15;
    if (this.novaProgress >= 1.0) {
      this.novaProgress -= 1.0;
      this.novaCharges = Math.min(this.maxNovaCharges, this.novaCharges + 1);
    }
  }

  onAlienDestroyed(alien, killerNova = null) {
    this.enemiesVaporized++;
    let pts = (alien.score || 25) * Math.max(1, this.combo);
    if (this.hasDailyMutator('swarmBlitz')) {
      pts = Math.round(pts * 1.35);
    }
    this.score += pts;

    // Ascending harmonic pentatonic chime with combo
    this.combo++;
    this.comboTimer = 2.0; // 2 seconds to extend chain combo
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    audio.playChainChime(this.combo);

    // Supernova Spectacle: Chain-Reaction Lightning Tethers
    if (killerNova && typeof killerNova.x === 'number' && typeof killerNova.y === 'number') {
      this.chainTethers.push({
        x1: killerNova.x,
        y1: killerNova.y,
        x2: alien.x,
        y2: alien.y,
        color: alien.color || '#00e5ff',
        life: 0.28,
        maxLife: 0.28
      });
    }

    // Supernova Spectacle: Polygon Ship Hull Shatter Shards
    const shardCount = 3 + Math.floor(Math.random() * 3);
    for (let s = 0; s < shardCount; s++) {
      const sAngle = Math.random() * Math.PI * 2;
      const sSpd = 70 + Math.random() * 180;
      this.debris.push({
        x: alien.x,
        y: alien.y,
        vx: Math.cos(sAngle) * sSpd,
        vy: Math.sin(sAngle) * sSpd,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
        size: 5 + Math.random() * 7,
        color: alien.color || '#00e5ff',
        life: 0.65,
        maxLife: 0.65
      });
    }

    // Multi-Ring Shockwaves & Hit-Stop Micro-Slow-Mo on Milestone Mega Chains (x8, x12, x16, x20+)
    if (this.combo === 8 || this.combo === 12 || this.combo === 16 || (this.combo >= 20 && this.combo % 4 === 0)) {
      this.hitStopTimer = 0.14;
      this.timeScale = 0.35;
      this.vignettePulse = 1.0;
      this.addScreenShake(8, 0.2);
    }

    // Planetary Cataclysm Core Overcharge (+3.5% per kill, +6% for x5+ combo)
    this.coreCharge = Math.min(100, this.coreCharge + 3.5);
    if (this.combo >= 5) {
      this.coreCharge = Math.min(100, this.coreCharge + 6.0);
    }

    // Void Weaver defeat: Overcharge Surge resets Q, W, E cooldowns by 3.0s
    if (alien.classKey === 'WEAVER') {
      this.skills.timerQ = Math.max(0, this.skills.timerQ - 3.0);
      this.skills.timerW = Math.max(0, this.skills.timerW - 3.0);
      this.skills.timerE = Math.max(0, this.skills.timerE - 3.0);
      this.particles.addFloater(this.planet.x, this.planet.y - 45, 'OVERCHARGE SURGE! -3.0s CD', '#d946ef', 18);
      this.particles.spawnNova(alien.x, alien.y, 95, '#d946ef', 0, false);
    }

    // Astral Treasure Galleon defeat: Jackpot Shower (+65 Shards, +25% Cataclysm, 1 Supply Pod)
    if (alien.classKey === 'GALLEON') {
      saveSystem.addShards(65);
      this.coreCharge = Math.min(100, this.coreCharge + 25.0);
      this.supplyPods.spawnPod(alien.x, alien.y, this.planet.planetRadius, 'OVERCHARGE');
      this.particles.addFloater(alien.x, alien.y - 65, '💎 ASTRAL JACKPOT! +65 ✦ SHARDS! +25% CATACLYSM!', '#ffd700', 20);
      this.particles.spawnDebris(alien.x, alien.y, '#ffd700', 24);
      audio.playVictory();
    }

    // v2.8 Leech Pod defeat: City Saved (+25 Star Shards)
    if (alien.classKey === 'LEECH') {
      saveSystem.addShards(25);
      this.particles.addFloater(alien.x, alien.y - 45, '+25 ✦ City Saved!', '#00e676', 17);
    }

    // v2.8 Warp Ambush Beacon defeat: Trigger Reinforced Elite Ambush Squadron
    if (alien.classKey === 'BEACON') {
      this.triggerEliteAmbush(alien.x, alien.y);
    }

    // v2.8 Ambush Squadron Reward: 2x Shards, 2x Score, +30% Cataclysm
    if (alien.isAmbushReward) {
      saveSystem.addShards(15);
      this.score += pts;
      this.coreCharge = Math.min(100, this.coreCharge + 30.0);
      this.particles.addFloater(alien.x, alien.y - 40, '⚠️ AMBUSH REWARD: 2x ✦ & +30% CATACLYSM!', '#ffd700', 16);
    }

    // v2.8 Orbital Gravity Well Draft Perk: Pull adjacent enemies 40px closer
    if (this.hasPerk('gravityWell')) {
      for (const other of this.aliens) {
        if (other !== alien && other.alive) {
          const da = Math.hypot(other.x - alien.x, other.y - alien.y);
          if (da <= 140) {
            const pullAngle = Math.atan2(alien.y - other.y, alien.x - other.x);
            other.x += Math.cos(pullAngle) * 40;
            other.y += Math.sin(pullAngle) * 40;
          }
        }
      }
    }

    // v2.8 Chain-Reaction Momentum Draft Perk: +15% damage per rapid kill (up to 5x)
    if (this.hasPerk('chainMomentum')) {
      const now = performance.now();
      if (now - (this.lastKillTime || 0) <= 1000) {
        this.chainMomentumStacks = Math.min(5, (this.chainMomentumStacks || 0) + 1);
      } else {
        this.chainMomentumStacks = 1;
      }
      this.lastKillTime = now;
      if (this.chainMomentumStacks >= 2) {
        this.particles.addFloater(this.planet.x, this.planet.y - 135, `🔥 MOMENTUM x${this.chainMomentumStacks} (+${this.chainMomentumStacks * 15}% DMG)`, '#ff9100', 14);
      }
    }

    // v2.8 Bounty Hunter Protocol Draft Perk: +100% Shards & +500 score on Elites/Bosses
    if (this.hasPerk('bountyProtocol') && ['DREADNOUGHT', 'BOSS', 'DROPSHIP', 'JAMMER', 'WEAVER'].includes(alien.classKey)) {
      saveSystem.addShards(20);
      this.score += 500;
      this.particles.addFloater(alien.x, alien.y - 50, '💎 BOUNTY: +500 PTS & +20 ✦', '#ffd700', 15);
    }

    // v2.9 Frenzy Overdrive Gauge: +4% per kill, +3% per chain combo step
    this.addFrenzy(4.0);
    if (this.combo > 1) {
      this.addFrenzy(3.0);
    }

    // v2.9 Absolute Zero Shatter-Core Synergy: Shatters into 6 piercing ice-plasma shards when destroyed while chilled/frozen
    if (this.hasPerk('absoluteZeroShatterCore') && (alien.frozenTimer > 0 || alien.slowTimer > 0)) {
      for (let i = 0; i < 6; i++) {
        const shardAngle = (i / 6) * Math.PI * 2;
        this.projectiles.addPlasmaBolt({
          x: alien.x,
          y: alien.y,
          angle: shardAngle,
          speed: 420,
          damage: 28,
          color: '#00e5ff',
          pierce: 2,
          isIceShard: true,
          source: 'shatter'
        });
      }
      this.particles.spawnNovaRing(alien.x, alien.y, '#00e5ff', 45);
      this.particles.addFloater(alien.x, alien.y - 25, '❄️ ICE SHATTER!', '#00e5ff', 14);
    }

    // Vampiric Core Relic: Heal Core HP + Shield on x8+ Combo
    if (this.hasRelic('vampiricCore') && this.combo >= 8) {
      this.planet.coreHp = Math.min(this.planet.maxCoreHp, this.planet.coreHp + 15);
      this.planet.restoreShield(25);
      this.particles.spawnNovaRing(this.planet.x, this.planet.y, '#00e676', 60);
      this.particles.addFloater(this.planet.x, this.planet.y - 25, 'VAMPIRIC DRAIN +HP/SHIELD!', '#00e676', 13);
    }

    // Nova kill recharge energy (+14% per kill, +15% bonus for Pulse Striker, 2x during Frenzy)
    const isStriker = this.turret && this.turret.chassis === 'striker';
    this.novaProgress += this.killRechargeRate * (isStriker ? 1.15 : 1.0) * (this.frenzyActive ? 2.0 : 1.0);
    if (this.novaProgress >= 1.0) {
      this.novaProgress -= 1.0;
      this.novaCharges = Math.min(this.maxNovaCharges, this.novaCharges + 1);
    }

    if (alien === this.activeBoss) {
      this.activeBoss = null;
    }

    // Defeating any Sector Boss drops a guaranteed Ancient Cosmic Relic
    if (alien.classKey === 'BOSS') {
      const drop = saveSystem.unlockRandomRelic();
      if (drop.unlocked) {
        this.showToast(`🏺 ANCIENT RELIC DISCOVERED: ${drop.relic.name.toUpperCase()}!`, '#ffd700');
        this.particles.addFloater(alien.x, alien.y - 60, `🏺 ${drop.relic.name}!`, '#ffd700', 18);
      }
    }

    // Drop magnetic Cosmic Sparks (+✦)
    const sparkCount = alien.classKey === 'BOSS' ? 25 : (alien.classKey === 'DREADNOUGHT' ? 4 : 1);
    this.particles.spawnCosmicSpark(alien.x, alien.y, sparkCount);

    // Floating combat callout
    this.particles.addFloater(alien.x, alien.y - 12, `+${pts}`, '#ffd700', 15);
    if (this.combo >= 2) {
      this.particles.addFloater(alien.x, alien.y - 30, `x${this.combo} CHAIN!`, '#e040fb', 17);
    }

    // Secondary Class-Specific Death Payload Shockwave (boosted in Ion Nebula)
    const inNebula = this.hazards.isInsideNebula(alien.x, alien.y);
    let nRadius = (alien.novaRadius || 68) * this.novaMultiplier;
    let nDmg = 32 * this.novaMultiplier;
    if (inNebula) {
      nRadius *= 1.35;
      nDmg *= 1.25;
      this.particles.addFloater(alien.x, alien.y - 36, '⚡ ION RESONANCE!', '#00e5ff', 16);
    }
    if (this.hasDailyMutator('supernovaChain')) {
      nRadius *= 1.35;
    }

    this.particles.spawnNova(alien.x, alien.y, nRadius, alien.color, nDmg, false);
    this.particles.spawnDebris(alien.x, alien.y, alien.color, 14);

    // Class specific death payload mechanics
    if (alien.classKey === 'INTERCEPTOR') {
      // Quad Plasma Burst
      this.projectiles.spawnQuadBurst(alien.x, alien.y, 22 * this.novaMultiplier, alien.color);
      this.particles.addFloater(alien.x, alien.y - 48, 'QUAD PLASMA BURST!', '#e040fb', 14);
    } else if (alien.classKey === 'CRYO') {
      // Cryo Stasis Field (slows surrounding aliens in 155px by 75%)
      const stasisRadius = 155 * this.novaMultiplier;
      for (const other of this.aliens) {
        if (!other.alive) continue;
        if (Math.hypot(other.x - alien.x, other.y - alien.y) <= stasisRadius) {
          other.freeze(4.5);
        }
      }
      this.particles.addFloater(alien.x, alien.y - 48, 'CRYO STASIS FIELD!', '#00e676', 14);
    } else if (alien.classKey === 'PHASE') {
      // Echo Warp Nova 220ms delayed
      setTimeout(() => {
        if (this.state === 'PLAYING') {
          this.particles.spawnNova(alien.x, alien.y, nRadius * 0.9, '#a855f7', 28 * this.novaMultiplier, false);
          this.particles.addFloater(alien.x, alien.y, 'ECHO WARP NOVA!', '#a855f7', 14);
        }
      }, 220);
    } else if (alien.classKey === 'DREADNOUGHT') {
      // Solar Super-Nova
      this.addScreenShake(14, 0.45);
      this.particles.addFloater(alien.x, alien.y - 50, '☀️ SOLAR SUPER-NOVA!', '#ffd700', 18);
    } else if (alien.classKey === 'BOSS') {
      // Apex Galaxy Super-Nova
      this.activeBoss = null;
      this.addScreenShake(22, 0.7);
      this.particles.spawnNova(alien.x, alien.y, 210 * this.novaMultiplier, '#ff1744', 100, false);
      this.particles.addFloater(alien.x, alien.y - 60, '👑 MOTHERSHIP VAPORIZED!', '#ff1744', 22);
      this.checkTrophy('MOTHERSHIP_BREAKER');
    }

    // Trophy checks
    if (this.combo >= 10) this.checkTrophy('NOVA_CATALYST');
    if (this.combo >= 20) this.checkTrophy('SUPERNOVA_ARCHITECT');
  }

  checkTrophy(trophyId) {
    const unlocked = saveSystem.unlockTrophy(trophyId);
    if (unlocked) {
      this.showToast(`UNLOCKED: ${unlocked.name}! (+100 SHARDS)`, '#ffd700');
    }
  }

  showToast(text, color = '#ffd700') {
    const toast = document.getElementById('toastBanner');
    const toastText = document.getElementById('toastText');
    if (!toast || !toastText) return;

    toastText.textContent = text;
    toastText.style.color = color;
    toast.classList.remove('opacity-0', '-translate-y-8');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', '-translate-y-8');
    }, 3200);
  }

  update(dt) {
    // Hit-stop recovery & arcade time scaling
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
      if (this.hitStopTimer <= 0) {
        this.timeScale = 1.0;
      } else {
        this.timeScale = 0.35 + (1 - this.hitStopTimer / 0.14) * 0.65;
      }
    }
    if (this.vignettePulse > 0) {
      this.vignettePulse = Math.max(0, this.vignettePulse - dt * 4.5);
    }
    const effectiveDt = dt * this.timeScale;
    this.gameTime += dt;
    this.turretRecoil = this.turret ? (this.turret.recoil || 0) : 0;

    // Stars twinkling
    for (const s of this.stars) {
      s.phase += dt * s.speed;
    }

    // Parallax camera offset lerp towards turret angle
    const targetPx = Math.cos(this.turret ? this.turret.angle : 0) * -14;
    const targetPy = Math.sin(this.turret ? this.turret.angle : 0) * -14;
    this.parallaxX += (targetPx - this.parallaxX) * Math.min(1, dt * 6);
    this.parallaxY += (targetPy - this.parallaxY) * Math.min(1, dt * 6);

    // Shooting Star / Ice Comet every 8-12 seconds
    this.cometTimer += dt;
    if (this.cometTimer >= 9.0) {
      this.cometTimer = 0;
      const startX = Math.random() * (this.width || 800);
      const startY = Math.random() * ((this.height || 600) * 0.4);
      const cAngle = Math.PI / 4 + (Math.random() - 0.5) * 0.35;
      const spd = 720 + Math.random() * 260;
      this.comets.push({
        x: startX,
        y: startY,
        vx: Math.cos(cAngle) * spd,
        vy: Math.sin(cAngle) * spd,
        color: '#38bdf8',
        life: 0.85,
        maxLife: 0.85
      });
    }
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      if (c.life <= 0) this.comets.splice(i, 1);
    }

    // Screen Shake decay
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    audio.update(dt);

    // Update Cataclysm Visual & Combat Lifecycles
    if (this.cataclysmFlashAlpha > 0) {
      this.cataclysmFlashAlpha = Math.max(0, this.cataclysmFlashAlpha - dt * 1.4);
    }
    if (this.cataclysmShockwave) {
      this.cataclysmShockwave.radius += this.cataclysmShockwave.speed * dt;
      if (this.cataclysmShockwave.radius >= this.cataclysmShockwave.maxRadius) {
        this.cataclysmShockwave = null;
      }
    }
    for (let mIdx = this.cataclysmMeteors.length - 1; mIdx >= 0; mIdx--) {
      const m = this.cataclysmMeteors[mIdx];
      const tx = m.target && m.target.alive ? m.target.x : m.x + m.vx;
      const ty = m.target && m.target.alive ? m.target.y : m.y + m.vy;
      const mAng = Math.atan2(ty - m.y, tx - m.x);
      m.vx += Math.cos(mAng) * 850 * dt;
      m.vy += Math.sin(mAng) * 850 * dt;
      const spd = Math.hypot(m.vx, m.vy);
      if (spd > 480) { m.vx = (m.vx / spd) * 480; m.vy = (m.vy / spd) * 480; }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.timer -= dt;

      let hit = false;
      for (const a of this.aliens) {
        if (a.alive && Math.hypot(a.x - m.x, a.y - m.y) < a.radius + 14) {
          hit = true;
          break;
        }
      }
      if (hit || m.timer <= 0) {
        this.particles.spawnNova(m.x, m.y, 85 * this.novaMultiplier, '#ff3d00', 95 * this.novaMultiplier, true);
        this.particles.spawnDebris(m.x, m.y, '#ff9100', 8);
        this.addScreenShake(6, 0.15);
        this.cataclysmMeteors.splice(mIdx, 1);
      }
    }
    if (this.cataclysmDysonBeams) {
      this.cataclysmDysonBeams.timer -= dt;
      this.cataclysmDysonBeams.angle += dt * (Math.PI * 2 / 4.0);
      const bAngles = [
        this.cataclysmDysonBeams.angle,
        this.cataclysmDysonBeams.angle + Math.PI * 0.5,
        this.cataclysmDysonBeams.angle + Math.PI,
        this.cataclysmDysonBeams.angle + Math.PI * 1.5
      ];
      for (const a of this.aliens) {
        if (!a.alive) continue;
        const dist = Math.hypot(a.x - this.planet.x, a.y - this.planet.y);
        const aAngle = Math.atan2(a.y - this.planet.y, a.x - this.planet.x);
        for (const bAng of bAngles) {
          let diff = Math.abs(aAngle - bAng);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff * dist < a.radius + 15) {
            a.takeDamage(220 * dt, this.planet.x, this.planet.y, true);
            this.particles.spawnDebris(a.x, a.y, '#ffd700', 1);
            break;
          }
        }
      }
      if (this.cataclysmDysonBeams.timer <= 0) {
        this.cataclysmDysonBeams = null;
      }
    }

    // Astral Treasure Galleon stardust spark trails
    for (const a of this.aliens) {
      if (a.alive && a.classKey === 'GALLEON') {
        if (Math.random() < 0.45) {
          this.particles.spawnCosmicSpark(a.x + (Math.random() - 0.5) * 16, a.y + (Math.random() - 0.5) * 16, 1);
        }
      }
    }

    this.updateCataclysmUI();

    if (this.state !== 'PLAYING') return;

    // Dynamic BGM Tempo Boost during Boss battles (136 BPM vs 118 BPM)
    if (this.activeBoss && this.activeBoss.alive) {
      audio.setBgmTempo(136);
    } else {
      audio.setBgmTempo(118);
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    const isOverdrive = this.skills.overdriveActive;

    // Mission timer & Titan Protocol timer
    this.missionTimer += dt;
    if (this.isTitanProtocolMode) {
      this.titanProtocolTimer += dt;
    }

    // Record Telemetry sample every 3.0s
    this.telemetrySampleTimer += dt;
    if (this.telemetrySampleTimer >= 3.0) {
      this.telemetrySampleTimer = 0;
      this.recordTelemetrySample();
    }

    // Inter-wave Tactical Pit-Stop Repairs & Nanite Particles
    if (this.isTitanPitStop) {
      this.titanPitStopTimer -= dt;
      if (Math.random() < 0.45) {
        const ang = Math.random() * Math.PI * 2;
        const r = this.planet.shieldRadius * (0.8 + Math.random() * 0.4);
        this.particles.addFloater(
          this.planet.x + Math.cos(ang) * r,
          this.planet.y + Math.sin(ang) * r,
          '✦',
          '#00e676',
          14
        );
      }
      if (this.titanPitStopTimer <= 0) {
        this.isTitanPitStop = false;
        this.currentWave++;
        this.setupWaveSpawns();
      }
    }

    // v2.8 Tactical Mastery timers & charging
    if (this.parryTimer > 0) this.parryTimer = Math.max(0, this.parryTimer - dt);
    if (this.parryCooldownTimer > 0) this.parryCooldownTimer = Math.max(0, this.parryCooldownTimer - dt);
    this.updateParryUI();

    if (this.isPointerDown && this.state === 'PLAYING') {
      const heldSec = (performance.now() - this.pointerDownTime) / 1000;
      if (heldSec >= 0.25) {
        this.isChargingOvercharge = true;
        this.chargeProgress = Math.min(1.0, (heldSec - 0.25) / 0.40);
        this.turret.angle = Math.atan2(this.pointerY - this.planet.y, this.pointerX - this.planet.x);
      }
    }

    // Poll connected Gamepad
    this.pollGamepad();

    // 1. Update Central Planet & Aegis Shield
    this.planet.update(dt, isOverdrive);

    // Tutorial progression check
    if (this.isTutorialActive) {
      if (this.tutorialStep === 1) {
        let diff = Math.abs(this.turret.angle - this.lastTurretAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        this.tutorialAimAccum += diff;
        this.lastTurretAngle = this.turret.angle;
        this.tutorialTimer += dt;
        if (this.tutorialAimAccum >= 0.78 || this.tutorialTimer >= 4.0) {
          this.advanceTutorial(2);
        }
      } else if (this.tutorialStep === 3) {
        this.tutorialTimer += dt;
        if (this.tutorialTimer >= 6.0) {
          this.completeTutorial();
        }
      }
    }

    if (this.hasDailyMutator('meteorStorm')) {
      this.supplyPods.spawnTimer += dt * 1.5;
    }

    // Defeat Check: Planet Core HP Depleted
    if (this.planet.coreHp <= 0) {
      this.onMissionDefeat();
      return;
    }

    // 2. Update Guardian Turret (+2 barrels & +35% fire rate when Overclock is active; Weaver web slows by 30%; +40% fire rate during Frenzy)
    const isOverclock = this.supplyPods.isQuadPulseActive();
    const isWeaverSlowed = this.aliens.some(a => a.alive && a.classKey === 'WEAVER');
    const turretDt = this.frenzyActive ? dt * 1.4 : dt;
    this.turret.update(
      turretDt,
      this.pointerX,
      this.pointerY,
      this.planet.x,
      this.planet.y,
      isOverdrive,
      (bolts, angle) => {
        // While charging Overcharge Lance, pause standard auto-fire bursts
        if (this.isChargingOvercharge) return;

        // v2.9 Frenzy Overdrive: Chromatic Rainbow Plasma Lances (+25% damage)
        if (this.frenzyActive) {
          for (const b of bolts) {
            b.isChromatic = true;
            b.damage = Math.round(b.damage * 1.25);
          }
        }

        // v2.8 Chain-Reaction Momentum perk: bonus damage per rapid kill
        if (this.hasPerk('chainMomentum') && this.chainMomentumStacks > 0) {
          const mult = 1.0 + this.chainMomentumStacks * 0.15;
          for (const b of bolts) {
            b.damage = Math.round(b.damage * mult);
          }
        }

        if (this.hasRelic('overchargedCoil')) {
          this.turretShotCount++;
          if (this.turretShotCount % 4 === 0) {
            for (const b of bolts) {
              b.isOvercharged = true;
              b.damage = Math.round(b.damage * 2.2);
              b.color = '#ffd700';
            }
          }
        }
        this.projectiles.spawnTurretBolts(this.planet.x, this.planet.y, this.planet.planetRadius, bolts);
      },
      isOverclock,
      isWeaverSlowed
    );

    // 3. Update Autonomous Defense Satellites
    for (const sat of this.satellites) {
      sat.update(
        dt,
        this.planet.x,
        this.planet.y,
        this.planet.shieldRadius,
        this.aliens,
        this.projectiles.torpedoes,
        (sx, sy, tx, ty, angle, dmg) => {
          this.projectiles.spawnSatelliteLaser(sx, sy, tx, ty, angle, dmg);
          for (const alien of this.aliens) {
            if (!alien.alive) continue;
            if (Math.hypot(alien.x - tx, alien.y - ty) <= (alien.radius || 18)) {
              const destroyed = alien.takeDamage(dmg, tx, ty, false);
              this.damageSources.wingman += dmg;
              if (destroyed) this.onAlienDestroyed(alien, { x: tx, y: ty });
              break;
            }
          }
          for (const torp of this.projectiles.torpedoes) {
            if (!torp.alive) continue;
            if (Math.hypot(torp.x - tx, torp.y - ty) <= 16) {
              torp.alive = false;
              this.damageSources.wingman += 10;
              this.particles.spawnDebris(tx, ty, '#e040fb', 6);
              this.particles.addFloater(tx, ty, 'SATELLITE INTERCEPT!', '#00e676', 12);
              break;
            }
          }
        }
      );
    }

    // 3.5. Update Autonomous AI Wingman Fighters (WING-01 & WING-02, +40% fire rate during Frenzy)
    const wingmanDt = this.frenzyActive ? dt * 1.4 : dt;
    if (this.wingmanActive && this.wingman) {
      this.wingman.update(wingmanDt, this);
    }
    if (this.wingmanActive && this.wingman2 && this.hasRelic('twinWingman')) {
      this.wingman2.update(wingmanDt, this);
    }

    // Deployable Orbital Structures Update
    this.structures.update(dt);

    // Solar Ember Burning Zones Update
    for (let i = this.solarEmberZones.length - 1; i >= 0; i--) {
      const zone = this.solarEmberZones[i];
      zone.life -= dt;
      const dps = zone.dps || 35;
      for (const alien of this.aliens) {
        if (!alien.alive) continue;
        const dist = Math.hypot(alien.x - zone.x, alien.y - zone.y);
        if (dist <= zone.radius) {
          const dmg = dps * dt;
          const destroyed = alien.takeDamage(dmg);
          this.damageSources.nova += dmg;
          if (destroyed) this.onAlienDestroyed(alien, { x: zone.x, y: zone.y });
        }
      }
      if (zone.life <= 0) {
        this.solarEmberZones.splice(i, 1);
      }
    }

    if (this.relicChronoStasisCooldown > 0) {
      this.relicChronoStasisCooldown = Math.max(0, this.relicChronoStasisCooldown - dt);
    }

    // v2.9 Update Frenzy Overdrive Timers
    if (this.frenzyPauseTimer > 0) {
      this.frenzyPauseTimer = Math.max(0, this.frenzyPauseTimer - dt);
    }
    if (this.frenzyActive) {
      this.frenzyTimer -= dt;
      this.frenzy = Math.max(0, (this.frenzyTimer / 8.0) * 100);
      if (this.frenzyTimer <= 0) {
        this.frenzyActive = false;
        this.frenzy = 0;
        audio.setBgmTempoMultiplier(1.0);
        this.particles.addFloater(this.planet.x, this.planet.y - 60, 'FRENZY COOLDOWN', '#94a3b8', 16);
      }
      this.updateFrenzyUI();
    }

    // v2.9 Update Battlefield Anomalies & Synergies
    this.updateWormholes(dt);
    this.updatePlasmaBarrels(dt);
    this.updateStormClouds(dt);
    this.updateLaserFirewalls(dt);
    this.updateOmegaDrones(dt);

    // 4. Update Tactical Skills
    this.skills.update(
      dt,
      this.turret.angle,
      this.planet.x,
      this.planet.y,
      this.aliens,
      this.projectiles.torpedoes,
      this.novaMultiplier,
      (int, dur) => this.addScreenShake(int, dur)
    );

    // Update Sector Environmental Hazards
    this.hazards.update(
      dt,
      this.planet.x,
      this.planet.y,
      this.planet.planetRadius,
      this.aliens,
      (ax, ay) => this.onAsteroidShattered(ax, ay),
      (px, py, rad) => this.onSolarFlarePulse(px, py, rad)
    );

    // Update Mid-Battle Orbital Supply Pods
    this.supplyPods.update(
      dt,
      this.planet.x,
      this.planet.y,
      this.planet.planetRadius,
      (px, py, buffType) => this.onSupplyPodDestroyed(px, py, buffType)
    );

    // Enemy movement speed scale (Slowed by 60% during Cryo Time-Warp)
    const enemySpeedScale = this.supplyPods.isCryoTimeWarpActive() ? 0.40 : 1.0;

    // 5. Update Projectiles
    this.projectiles.update(
      dt,
      this.width,
      this.height,
      this.aliens,
      this.planet,
      (alien, destroyed, hitX, hitY, dmg, source) => {
        this.particles.spawnDebris(hitX, hitY, alien.color, 4);
        if (source === 'wingman') {
          this.damageSources.wingman += (dmg || 14);
        } else {
          this.damageSources.turret += (dmg || 12);
        }
        if (destroyed) this.onAlienDestroyed(alien, { x: hitX, y: hitY });
      },
      (torpX, torpY) => {
        this.particles.spawnDebris(torpX, torpY, '#e040fb', 6);
        this.particles.addFloater(torpX, torpY, 'TORPEDO DOWN!', '#00e5ff', 12);
      },
      (boss) => this.onBossPhase2(boss),
      this.hazards,
      this.supplyPods,
      enemySpeedScale,
      (ax, ay) => this.onAsteroidShattered(ax, ay),
      (px, py, bType) => this.onSupplyPodDestroyed(px, py, bType),
      this.structures
    );

    // Update Subspace Warp Portals (Boss Incursion Emergence)
    for (let i = this.warpPortals.length - 1; i >= 0; i--) {
      const wp = this.warpPortals[i];
      wp.timer -= dt;
      wp.rot += dt * 8;
      if (wp.timer <= 0) {
        const alien = new Alien(wp.x, wp.y, wp.item.classKey, wp.item.bossCustomName);
        alien.engine = this;
        if (wp.item.bossCustomHp) {
          alien.hp = wp.item.bossCustomHp;
          alien.maxHp = wp.item.bossCustomHp;
        }
        const ascensionMults = saveSystem.getAscensionMultipliers();
        if (ascensionMults.tier > 0) {
          alien.hp = Math.round(alien.hp * ascensionMults.enemyHpMultiplier);
          alien.maxHp = Math.round(alien.maxHp * ascensionMults.enemyHpMultiplier);
          alien.speed *= ascensionMults.enemySpeedMultiplier;
        }
        this.activeBoss = alien;
        this.aliens.push(alien);
        this.particles.spawnNova(wp.x, wp.y, 110, '#e040fb', 0, false);
        this.addScreenShake(12, 0.3);
        this.warpPortals.splice(i, 1);
      }
    }

    // Update Threat Warning Indicators
    for (let i = this.threatIndicators.length - 1; i >= 0; i--) {
      const ind = this.threatIndicators[i];
      ind.timer -= dt;
      if (ind.timer <= 0) this.threatIndicators.splice(i, 1);
    }

    // Update Chain-Reaction Lightning Tethers
    for (let i = this.chainTethers.length - 1; i >= 0; i--) {
      const t = this.chainTethers[i];
      t.life -= dt;
      if (t.life <= 0) this.chainTethers.splice(i, 1);
    }

    // Update Polygon Hull Shatter Debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.x += d.vx * effectiveDt;
      d.y += d.vy * effectiveDt;
      d.angle += d.vRot * effectiveDt;
      d.life -= dt;
      if (d.life <= 0) this.debris.splice(i, 1);
    }

    // 6. Spawn Alien Wave Incursions
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.waveSpawnQueue.length > 0) {
      const item = this.waveSpawnQueue.shift();
      this.spawnTimer = 0.55;

      // Spawn alien along 360° outer arena perimeter
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnDist = Math.max(this.width, this.height) * 0.58;
      const ax = this.planet.x + Math.cos(spawnAngle) * spawnDist;
      const ay = this.planet.y + Math.sin(spawnAngle) * spawnDist;

      if (item.classKey === 'BOSS') {
        // Swirling Subspace Warp Rift for 1.0s before Boss emergence
        this.warpPortals.push({
          x: ax,
          y: ay,
          radius: 55,
          timer: 1.0,
          maxTimer: 1.0,
          rot: 0,
          item,
          angle: spawnAngle
        });
        // Perimeter threat arrow
        this.threatIndicators.push({
          angle: spawnAngle,
          timer: 1.2,
          maxTimer: 1.2,
          classKey: 'BOSS',
          name: item.bossCustomName || 'APEX MOTHERSHIP'
        });
      } else {
        if (item.classKey === 'DREADNOUGHT' || item.classKey === 'DROPSHIP') {
          this.threatIndicators.push({
            angle: spawnAngle,
            timer: 1.2,
            maxTimer: 1.2,
            classKey: item.classKey,
            name: item.classKey
          });
        }
        const alien = new Alien(ax, ay, item.classKey, item.bossCustomName);
        alien.engine = this;
        if (item.bossCustomHp) {
          alien.hp = item.bossCustomHp;
          alien.maxHp = item.bossCustomHp;
        }
        if (this.hasDailyMutator('swarmBlitz') && (item.classKey === 'SCOUT' || item.classKey === 'INTERCEPTOR')) {
          alien.speed *= 1.20;
        }
        // Ascension enemy scaling
        const ascensionMults = saveSystem.getAscensionMultipliers();
        if (ascensionMults.tier > 0) {
          alien.hp = Math.round(alien.hp * ascensionMults.enemyHpMultiplier);
          alien.maxHp = Math.round(alien.maxHp * ascensionMults.enemyHpMultiplier);
          alien.speed *= ascensionMults.enemySpeedMultiplier;
        }
        this.aliens.push(alien);
      }
    }

    // 7. Update Aliens
    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const alien = this.aliens[i];
      alien.update(
        dt * enemySpeedScale,
        this.planet.x,
        this.planet.y,
        this.planet.shieldRadius,
        (sx, sy) => {
          // Dropship scout / leech spawn callback
          const cls = Math.random() < 0.35 ? 'LEECH' : 'SCOUT';
          const spawned = new Alien(sx, sy, cls);
          spawned.engine = this;
          this.aliens.push(spawned);
        },
        (tx, ty, angle, speed, dmg, color) => {
          // Torpedo fire callback
          this.projectiles.spawnTorpedo(tx, ty, angle, speed, dmg, color);
        },
        this.planet
      );

      // Check collision with planet shield/core (Leech and Beacon do not suicide-ram into shields)
      const dist = Math.hypot(this.planet.x - alien.x, this.planet.y - alien.y);
      const hitRadius = this.planet.shield > 0 ? this.planet.shieldRadius : this.planet.planetRadius;

      if (!alien.isLeech && !alien.isBeacon && dist <= hitRadius + alien.radius) {
        this.planet.damage(alien.damage, alien.x, alien.y);
        this.addScreenShake(alien.classKey === 'BOSS' ? 18 : 8, 0.25);
        this.particles.spawnDebris(alien.x, alien.y, alien.color, 10);
        alien.alive = false;
        this.aliens.splice(i, 1);
        continue;
      }

      if (!alien.alive) {
        this.aliens.splice(i, 1);
        continue;
      }
    }

    // 8. Update Particles & Chain Novas
    this.particles.update(
      dt,
      this.planet.x,
      this.planet.y,
      this.planet.planetRadius,
      this.aliens,
      (alien, destroyed, nova) => {
        this.damageSources.nova += (nova.damage || 32);
        if (destroyed) this.onAlienDestroyed(alien, nova);
      },
      (val) => {
        saveSystem.addShards(val);
        this.coreCharge = Math.min(100, this.coreCharge + 2.0);
      },
      (boss) => this.onBossPhase2(boss),
      this.hazards,
      this.supplyPods,
      (ax, ay) => this.onAsteroidShattered(ax, ay),
      (px, py, bType) => this.onSupplyPodDestroyed(px, py, bType),
      this.structures
    );

    // 9. Wave Progression / Victory Check
    if (this.waveSpawnQueue.length === 0 && this.aliens.length === 0 && this.warpPortals.length === 0 && !this.isTitanPitStop && !this.waveDraftPending) {
      if (this.currentWave < this.totalWaves || this.isEndlessMode) {
        // v2.8 Mid-Mission Roguelike Tactical Command Draft between waves
        this.triggerWaveDraft();
      } else {
        this.onMissionVictory();
      }
    }
  }

  calculateStars() {
    const maxCore = this.planet.maxCoreHp || 100;
    const corePct = Math.round((this.planet.coreHp / maxCore) * 100);
    return corePct >= 80 ? 3 : (corePct >= 40 ? 2 : 1);
  }

  onMissionVictory() {
    this.state = 'VICTORY';
    audio.playVictory();
    audio.stopBgm();

    // Star calculation: 3 stars if Core HP >= 80%, 2 stars if >= 40%, 1 star otherwise
    const corePct = Math.round((this.planet.coreHp / (this.planet.maxCoreHp || 100)) * 100);
    const stars = this.calculateStars();

    if (corePct === 100) this.checkTrophy('IMPENETRABLE_AEGIS');
    this.checkTrophy('FIRST_DEFENSE');

    // Sector 1 clear check
    if (this.currentPlanetId === 5) {
      this.checkTrophy('SECTOR_ONE_GUARDIAN');
    }

    // Launch celebratory fireworks from surface cyber-cities
    this.planet.triggerVictoryFireworks();

    // Guaranteed Ancient Relic drop for clearing Titan Protocol or Daily Anomaly
    if (this.isTitanProtocolMode || this.isDailyAnomalyMode) {
      const drop = saveSystem.unlockRandomRelic();
      if (drop.unlocked) {
        this.showToast(`🏺 ANCIENT RELIC DISCOVERED: ${drop.relic.name.toUpperCase()}!`, '#ffd700');
      }
    }

    let earnedShards = 0;
    if (this.isTitanProtocolMode) {
      const res = saveSystem.recordBossRushVictory(this.titanProtocolTimer);
      this.checkTrophy('TITAN_CONQUEROR');
      earnedShards = res.bonusShards;
      const elTitle = document.getElementById('victoryPlanetTitle');
      if (elTitle) elTitle.textContent = '👑 TITAN PROTOCOL CONQUERED (4/4 MOTHERSHIPS)';
      if (res.isFirstClear) {
        this.showToast('👑 TITAN PROTOCOL CONQUERED! +300 ✦ SHARDS', '#ffd700');
      } else {
        this.showToast(`👑 TITAN RUSH CLEARED: ${this.titanProtocolTimer.toFixed(1)}s!`, '#00e5ff');
      }
    } else if (this.isDailyAnomalyMode && this.dailyAnomalyConfig) {
      const res = saveSystem.recordDailyScore(this.dailyAnomalyConfig.dateKey, this.score);
      earnedShards = res.bonusAwarded;
      const elTitle = document.getElementById('victoryPlanetTitle');
      if (elTitle) elTitle.textContent = `DAILY ANOMALY CONQUERED (${this.dailyAnomalyConfig.dateKey})`;
      if (res.isFirstClearToday) {
        this.showToast('⚡ DAILY ANOMALY LIBERATED! +150 ✦ SHARDS', '#ffd700');
      } else {
        this.showToast('⚡ DAILY CHALLENGE COMPLETE!', '#00e5ff');
      }
    } else {
      saveSystem.recordPlanetClear(this.currentPlanetId, this.score, stars);
      const cfg = PLANETS.find(p => p.id === this.currentPlanetId) || PLANETS[0];
      const elTitle = document.getElementById('victoryPlanetTitle');
      if (elTitle) elTitle.textContent = `${cfg.name.toUpperCase()} PRIME SAVED`;
      const ascensionMults = saveSystem.getAscensionMultipliers();
      earnedShards = Math.round(stars * 45 * ascensionMults.shardMultiplier);
    }

    const elEnemies = document.getElementById('vicStatEnemies');
    if (elEnemies) elEnemies.textContent = `${this.enemiesVaporized}`;
    const elCombo = document.getElementById('vicStatCombo');
    if (elCombo) elCombo.textContent = `x${this.maxCombo}`;
    const elCore = document.getElementById('vicStatCore');
    if (elCore) elCore.textContent = `${corePct}%`;
    const elShards = document.getElementById('vicStatShards');
    if (elShards) {
      elShards.innerHTML = `<span class="flex items-center justify-end gap-1 font-bold text-cosmic-gold">+${earnedShards} ${ICON_SVG.shard('w-3.5 h-3.5 text-cosmic-gold')}</span>`;
    }
    const elScore = document.getElementById('vicStatScore');
    if (elScore) elScore.textContent = this.score.toLocaleString();

    // Render stars
    const starsEl = document.getElementById('victoryStarsContainer');
    if (starsEl) {
      starsEl.innerHTML = '';
      for (let s = 1; s <= 3; s++) {
        const sp = document.createElement('span');
        sp.className = s <= stars ? 'text-cosmic-gold drop-shadow-[0_0_12px_#ffd700]' : 'text-slate-700 opacity-40';
        sp.innerHTML = ICON_SVG.star('w-8 h-8', s <= stars);
        starsEl.appendChild(sp);
      }
    }

    this.renderTelemetrySparkline();
    document.getElementById('modalVictory')?.classList.remove('hidden');
  }

  onMissionDefeat() {
    this.state = 'DEFEAT';
    audio.playDefeat();
    audio.stopBgm();

    const cfg = PLANETS.find(p => p.id === this.currentPlanetId) || PLANETS[0];
    const elTitle = document.getElementById('defeatPlanetTitle');
    if (elTitle) {
      if (this.isTitanProtocolMode) {
        elTitle.textContent = 'TITAN PROTOCOL DEFENSE BREACHED';
      } else if (this.isEndlessMode) {
        elTitle.textContent = 'ENDLESS SIEGE TERMINATED';
      } else {
        elTitle.textContent = `PLANETARY DEFENSES BREACHED ON ${cfg.name.toUpperCase()}`;
      }
    }
    const elWave = document.getElementById('defStatWave');
    if (elWave) {
      if (this.isTitanProtocolMode) {
        elWave.textContent = `Titan ${this.currentWave} / 4`;
      } else if (this.isEndlessMode) {
        elWave.textContent = `Wave ${this.currentWave}`;
      } else {
        elWave.textContent = `Wave ${this.currentWave} / ${this.totalWaves}`;
      }
    }
    const elEnemies = document.getElementById('defStatEnemies');
    if (elEnemies) elEnemies.textContent = `${this.enemiesVaporized}`;
    const elShards = document.getElementById('defStatShards');
    if (elShards) elShards.innerHTML = `<span class="flex items-center justify-end gap-1 font-bold text-cosmic-gold">+${Math.round(this.enemiesVaporized * 0.5)} ${ICON_SVG.shard('w-3.5 h-3.5 text-cosmic-gold')}</span>`;

    // Record Endless score and check for new record
    if (this.isEndlessMode) {
      const isNewRecord = saveSystem.recordEndlessScore(this.score, this.currentWave);
      const recordBanner = document.getElementById('defeatRecordBanner');
      if (recordBanner) {
        if (isNewRecord) {
          recordBanner.classList.remove('hidden');
          recordBanner.innerHTML = `<span class="text-cosmic-gold font-bold text-glow-gold flex items-center justify-center gap-1.5 animate-pulse">${ICON_SVG.trophy('w-4 h-4 text-cosmic-gold')} NEW ENDLESS RECORD! Wave ${this.currentWave} • ${this.score.toLocaleString()} pts</span>`;
        } else {
          recordBanner.classList.add('hidden');
        }
      }
    }

    this.renderTelemetrySparkline();
    document.getElementById('modalDefeat')?.classList.remove('hidden');
  }

  recordTelemetrySample() {
    const sPct = Math.round(((this.planet.shield || 0) / (this.planet.maxShield || 100)) * 100);
    const cPct = Math.round(((this.planet.coreHp || 0) / (this.planet.maxCoreHp || 100)) * 100);
    const avgIntegrity = Math.round((sPct + cPct) / 2);
    this.telemetryHistory.push({
      time: Math.round(this.missionTimer || 0),
      wave: this.currentWave,
      combo: Math.max(1, this.combo),
      shieldPct: sPct,
      corePct: cPct,
      integrity: avgIntegrity
    });
    if (this.telemetryHistory.length > 30) {
      this.telemetryHistory.shift();
    }
  }

  renderTelemetrySparkline() {
    const victoryCanvas = document.getElementById('victoryTelemetryCanvas');
    const defeatCanvas = document.getElementById('defeatTelemetryCanvas');

    const totalDamage = (this.damageSources?.turret || 0) + (this.damageSources?.nova || 0) + (this.damageSources?.wingman || 0);
    let pctTurret = 55;
    let pctNova = 30;
    let pctWingman = 15;
    if (totalDamage > 0) {
      pctTurret = Math.round((this.damageSources.turret / totalDamage) * 100);
      pctNova = Math.round((this.damageSources.nova / totalDamage) * 100);
      pctWingman = Math.max(0, 100 - pctTurret - pctNova);
    }

    const breakdownText = `Turret ${pctTurret}% • Novas ${pctNova}% • Wingman ${pctWingman}%`;

    // Update Victory Breakdown Elements
    const vicText = document.getElementById('vicDmgBreakdownText');
    if (vicText) vicText.textContent = breakdownText;
    const vicBarT = document.getElementById('vicDmgBarTurret');
    if (vicBarT) vicBarT.style.width = pctTurret + '%';
    const vicBarN = document.getElementById('vicDmgBarNova');
    if (vicBarN) vicBarN.style.width = pctNova + '%';
    const vicBarW = document.getElementById('vicDmgBarWingman');
    if (vicBarW) vicBarW.style.width = pctWingman + '%';

    // Update Defeat Breakdown Elements
    const defText = document.getElementById('defDmgBreakdownText');
    if (defText) defText.textContent = breakdownText;
    const defBarT = document.getElementById('defDmgBarTurret');
    if (defBarT) defBarT.style.width = pctTurret + '%';
    const defBarN = document.getElementById('defDmgBarNova');
    if (defBarN) defBarN.style.width = pctNova + '%';
    const defBarW = document.getElementById('defDmgBarWingman');
    if (defBarW) defBarW.style.width = pctWingman + '%';

    // Ensure we have samples
    const history = [...(this.telemetryHistory || [])];
    if (history.length < 2) {
      history.unshift({ time: 0, combo: 1, integrity: 100 });
      history.push({
        time: Math.round(this.missionTimer || 1),
        combo: Math.max(1, this.combo),
        integrity: Math.round((((this.planet.shield || 0) + (this.planet.coreHp || 0)) / ((this.planet.maxShield || 100) + (this.planet.maxCoreHp || 100))) * 100)
      });
    }

    let maxComboVal = 5;
    for (const h of history) {
      if (h.combo > maxComboVal) maxComboVal = h.combo;
    }

    [victoryCanvas, defeatCanvas].forEach(cvs => {
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      const w = cvs.width || 280;
      const h = cvs.height || 56;
      ctx.clearRect(0, 0, w, h);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      [h * 0.25, h * 0.5, h * 0.75].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(8, y);
        ctx.lineTo(w - 8, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      const padX = 10;
      const padY = 8;
      const plotW = w - padX * 2;
      const plotH = h - padY * 2;

      // 1. Draw Planetary Integrity Curve (#00e676 emerald line)
      ctx.beginPath();
      history.forEach((pt, idx) => {
        const x = padX + (idx / (history.length - 1)) * plotW;
        const normIntegrity = Math.max(0, Math.min(100, pt.integrity !== undefined ? pt.integrity : 100)) / 100;
        const y = padY + plotH * (1 - normIntegrity);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 2. Draw Combo Peak Intensity Curve (#e040fb magenta line)
      ctx.beginPath();
      history.forEach((pt, idx) => {
        const x = padX + (idx / (history.length - 1)) * plotW;
        const normCombo = Math.min(1, (pt.combo || 1) / maxComboVal);
        const y = padY + plotH * (1 - normCombo);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    // Screen Shake transform
    if (this.shakeTimer > 0 && this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Render Deep Space Background Void & 3-Layer Parallax Starfield
    const bgGrad = ctx.createRadialGradient(
      this.planet.x, this.planet.y, 80,
      this.planet.x, this.planet.y, Math.max(this.width, this.height) * 0.75
    );
    bgGrad.addColorStop(0, '#0c132c');
    bgGrad.addColorStop(0.5, '#070b1a');
    bgGrad.addColorStop(1, '#03050c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 3-Layer Parallax Starfield & Nebula Clouds
    ctx.save();
    for (const s of this.stars) {
      const layerOffset = s.layer || 1;
      let sx = s.x + this.parallaxX * layerOffset;
      let sy = s.y + this.parallaxY * layerOffset;
      if (this.width > 0 && this.height > 0) {
        while (sx < 0) sx += this.width;
        while (sx > this.width) sx -= this.width;
        while (sy < 0) sy += this.height;
        while (sy > this.height) sy -= this.height;
      }

      const a = Math.max(0.15, Math.min(1, s.alpha * (0.6 + Math.sin(s.phase) * 0.4)));
      ctx.fillStyle = s.layer === 3 ? `rgba(224, 242, 254, ${a})` : (s.layer === 2 ? `rgba(186, 230, 253, ${a})` : `rgba(255, 255, 255, ${a})`);
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant Shooting Stars / Ice Comets
    for (const c of this.comets) {
      const alpha = Math.max(0, c.life / c.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - (c.vx / 18), c.y - (c.vy / 18));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - (c.vx / 10), c.y - (c.vy / 10));
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 2. Render Background Ring Half
    this.planet.renderBackRing(ctx);

    // Render Subspace Warp Rift Portals
    for (const wp of this.warpPortals) {
      const progress = Math.min(1, Math.max(0, 1 - (wp.timer / wp.maxTimer)));
      const curR = wp.radius * Math.sin(progress * Math.PI);
      ctx.save();
      ctx.translate(wp.x, wp.y);
      ctx.rotate(wp.rot || 0);

      // Dark event-horizon core
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, curR * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = '#050814';
      ctx.fill();

      // Swirling outer crimson/violet energy rift
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, curR), 0, Math.PI * 2);
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 24;
      ctx.stroke();

      // Rotating lightning spokes
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.0;
      for (let sp = 0; sp < 6; sp++) {
        const a = (sp / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * curR, Math.sin(a) * curR);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render Living Central Planet & Aegis Shield
    const isOverdrive = this.skills.overdriveActive;
    const beatPulse = this.audio ? (this.audio.beatPulse || 0) : (audio ? (audio.beatPulse || 0) : 0);
    this.planet.render(ctx, isOverdrive, this.gameTime, beatPulse, this.coreCharge || 0);

    // 4. Render Orbital Guardian Turret
    this.turret.render(ctx, this.planet.x, this.planet.y, this.planet.planetRadius, isOverdrive);

    // 5. Render Laser Targeting Sight (only during PLAYING state)
    if (this.state === 'PLAYING') {
      this.turret.renderLaserSight(ctx, this.planet.x, this.planet.y, this.pointerX, this.pointerY, isOverdrive);
    }

    // v2.8 Overcharge Shot Converging Ring & Narrowing Reticle
    if (this.isChargingOvercharge && this.state === 'PLAYING') {
      const nozzleDist = this.planet.planetRadius + 18;
      const nozzleX = this.planet.x + Math.cos(this.turret.angle) * nozzleDist;
      const nozzleY = this.planet.y + Math.sin(this.turret.angle) * nozzleDist;
      const ringRadius = (1.0 - this.chargeProgress) * 22 + 6;

      ctx.save();
      // Converging cyan-gold energy ring around nozzle
      ctx.beginPath();
      ctx.arc(nozzleX, nozzleY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = this.chargeProgress >= 1.0 ? '#ffd700' : '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = this.chargeProgress >= 1.0 ? '#ffd700' : '#00e5ff';
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Narrowing twin-line laser target sight extending to cursor
      const spread = (1.0 - this.chargeProgress) * 14 + 2;
      const sightAngle = this.turret.angle;
      const normX = -Math.sin(sightAngle);
      const normY = Math.cos(sightAngle);

      ctx.strokeStyle = this.chargeProgress >= 1.0 ? 'rgba(255, 215, 0, 0.75)' : 'rgba(0, 229, 255, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);

      // Left sight line
      ctx.beginPath();
      ctx.moveTo(nozzleX + normX * spread, nozzleY + normY * spread);
      ctx.lineTo(this.pointerX + normX * spread * 0.4, this.pointerY + normY * spread * 0.4);
      ctx.stroke();

      // Right sight line
      ctx.beginPath();
      ctx.moveTo(nozzleX - normX * spread, nozzleY - normY * spread);
      ctx.lineTo(this.pointerX - normX * spread * 0.4, this.pointerY - normY * spread * 0.4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 6. Render Autonomous Satellites
    for (const sat of this.satellites) {
      sat.render(ctx);
    }

    // Render Autonomous AI Wingman Fighters (WING-01 & WING-02)
    if (this.wingmanActive && this.wingman) {
      this.wingman.render(ctx);
    }
    if (this.wingmanActive && this.wingman2 && this.hasRelic('twinWingman')) {
      this.wingman2.render(ctx);
    }

    // Render Deployable Orbital Structures
    this.structures.render(ctx);

    // Render Solar Ember Burning Zones (Supernova Echo Relic)
    for (const zone of this.solarEmberZones) {
      const alpha = Math.max(0, zone.life / zone.maxLife);
      ctx.save();
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 152, 0, ${alpha * 0.22})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.75})`;
      ctx.lineWidth = 2.0;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 7. Render Active Tactical Skills (Ion Beam & EMP)
    this.skills.render(ctx, this.planet.x, this.planet.y, this.planet.planetRadius, this.gameTime);

    // Render Sector Environmental Hazards
    this.hazards.render(ctx, this.planet.x, this.planet.y);

    // Render Mid-Battle Orbital Supply Pods
    this.supplyPods.render(ctx);

    // v2.9 Render Battlefield Anomalies & Synergies
    this.renderStormClouds(ctx);
    this.renderLaserFirewalls(ctx);
    this.renderWormholes(ctx);
    this.renderPlasmaBarrels(ctx);
    this.renderOmegaDrones(ctx);

    // 8. Render Aliens
    for (const alien of this.aliens) {
      alien.render(ctx);
    }

    // Void Weaver Graviton Web Tethers (slows turret by 30%)
    for (const alien of this.aliens) {
      if (alien.alive && alien.classKey === 'WEAVER') {
        const orbitR = this.planet.planetRadius + 8;
        const tx = this.planet.x + Math.cos(this.turret.angle) * orbitR;
        const ty = this.planet.y + Math.sin(this.turret.angle) * orbitR;

        ctx.save();
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#e040fb';
        ctx.shadowBlur = 14;

        const segments = 8;
        ctx.beginPath();
        ctx.moveTo(alien.x, alien.y);
        for (let s = 1; s < segments; s++) {
          const pct = s / segments;
          const bx = alien.x + (tx - alien.x) * pct;
          const by = alien.y + (ty - alien.y) * pct;
          const distTot = Math.hypot(tx - alien.x, ty - alien.y) || 1;
          const wave = Math.sin(this.gameTime * 14 + s * 1.5) * 6;
          const perpX = -(ty - alien.y) / distTot * wave;
          const perpY = (tx - alien.x) / distTot * wave;
          ctx.lineTo(bx + perpX, by + perpY);
        }
        ctx.lineTo(tx, ty);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Cataclysm Sector III: Dyson Orbital Laser Cage
    if (this.cataclysmDysonBeams) {
      const bAngles = [
        this.cataclysmDysonBeams.angle,
        this.cataclysmDysonBeams.angle + Math.PI * 0.5,
        this.cataclysmDysonBeams.angle + Math.PI,
        this.cataclysmDysonBeams.angle + Math.PI * 1.5
      ];
      const maxLen = Math.max(this.width, this.height) * 1.2;
      ctx.save();
      for (const bAng of bAngles) {
        ctx.beginPath();
        ctx.moveTo(this.planet.x, this.planet.y);
        ctx.lineTo(this.planet.x + Math.cos(bAng) * maxLen, this.planet.y + Math.sin(bAng) * maxLen);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 25;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Cataclysm Sector I: Cryo-Tsunami Expanding Shockwave
    if (this.cataclysmShockwave) {
      const cr = this.cataclysmShockwave.radius;
      const alpha = Math.max(0, 1 - cr / this.cataclysmShockwave.maxRadius);
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.planet.x, this.planet.y, cr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.lineWidth = 5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 24;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.planet.x, this.planet.y, Math.max(0, cr - 12), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Cataclysm Sector II: Magma Meteors (Batched coordinate rendering without per-meteor translate)
    if (this.cataclysmMeteors && this.cataclysmMeteors.length > 0) {
      ctx.save();
      ctx.fillStyle = '#ff3d00';
      ctx.shadowColor = '#ff6d00';
      ctx.shadowBlur = 18;
      for (const m of this.cataclysmMeteors) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff3e0';
      ctx.shadowBlur = 6;
      for (const m of this.cataclysmMeteors) {
        ctx.beginPath();
        ctx.arc(m.x, m.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // High-Contrast Threat Rings (Settings Toggle)
    if (this.getSettings().threatRings) {
      for (const alien of this.aliens) {
        if (!alien.alive) continue;
        if (alien.isBoss || alien.classKey === 'DREADNOUGHT' || (alien.speed && alien.speed > 80)) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(alien.x, alien.y, alien.radius + 10, 0, Math.PI * 2);
          ctx.strokeStyle = alien.isBoss ? 'rgba(255, 23, 68, 0.75)' : 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    // Perimeter Lock-On Threat Indicators (Edge Spawns)
    if (this.threatIndicators && this.threatIndicators.length > 0) {
      const radarR = Math.min(this.width, this.height) * 0.44;
      for (const ind of this.threatIndicators) {
        const alpha = Math.max(0, ind.timer / ind.maxTimer);
        const pulse = 1.0 + Math.sin(Date.now() * 0.015) * 0.25;
        const ix = this.planet.x + Math.cos(ind.angle) * radarR;
        const iy = this.planet.y + Math.sin(ind.angle) * radarR;

        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(ind.angle);
        ctx.globalAlpha = alpha;

        // Pulsing directional chevron
        ctx.beginPath();
        ctx.moveTo(12 * pulse, 0);
        ctx.lineTo(-8 * pulse, -10 * pulse);
        ctx.lineTo(-4 * pulse, 0);
        ctx.lineTo(-8 * pulse, 10 * pulse);
        ctx.closePath();
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 15;
        ctx.fill();

        ctx.font = 'bold 11px Orbitron, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ HEAVY INCURSION', 0, -16);
        ctx.restore();
      }
    }

    // Supernova Spectacle: Chain-Reaction Lightning Tethers
    if (this.chainTethers && this.chainTethers.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const t of this.chainTethers) {
        const alpha = Math.max(0, t.life / t.maxLife);
        const segments = 5;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        for (let seg = 1; seg < segments; seg++) {
          const pct = seg / segments;
          const basePx = t.x1 + (t.x2 - t.x1) * pct;
          const basePy = t.y1 + (t.y2 - t.y1) * pct;
          const perpX = -(t.y2 - t.y1) * 0.06 * Math.sin(seg * 3.7 + t.life * 45);
          const perpY = (t.x2 - t.x1) * 0.06 * Math.cos(seg * 3.7 + t.life * 45);
          ctx.lineTo(basePx + perpX, basePy + perpY);
        }
        ctx.lineTo(t.x2, t.y2);
        ctx.strokeStyle = t.color || '#00e5ff';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = t.color || '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.stroke();

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
      ctx.restore();
    }

    // Supernova Spectacle: Polygon Ship Hull Shatter Shards
    for (const d of this.debris) {
      const alpha = Math.max(0, d.life / d.maxLife);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = d.color || '#00e5ff';
      ctx.shadowColor = d.color || '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-d.size, -d.size * 0.5);
      ctx.lineTo(d.size, 0);
      ctx.lineTo(-d.size * 0.5, d.size * 0.8);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    }

    // Tutorial Step 2: Draw pulsing golden target reticle ring on nearest alien
    if (this.isTutorialActive && this.tutorialStep === 2 && this.state === 'PLAYING') {
      let closestAlien = null;
      let minDist = Infinity;
      for (const a of this.aliens) {
        if (!a.alive) continue;
        const d = Math.hypot(a.x - this.planet.x, a.y - this.planet.y);
        if (d < minDist) {
          minDist = d;
          closestAlien = a;
        }
      }
      if (closestAlien) {
        const pulse = Math.sin(performance.now() * 0.008) * 4;
        const r = closestAlien.radius + 14 + pulse;
        ctx.save();
        ctx.beginPath();
        ctx.arc(closestAlien.x, closestAlien.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(closestAlien.x - r - 6, closestAlien.y); ctx.lineTo(closestAlien.x - r + 4, closestAlien.y);
        ctx.moveTo(closestAlien.x + r - 4, closestAlien.y); ctx.lineTo(closestAlien.x + r + 6, closestAlien.y);
        ctx.moveTo(closestAlien.x, closestAlien.y - r - 6); ctx.lineTo(closestAlien.x, closestAlien.y - r + 4);
        ctx.moveTo(closestAlien.x, closestAlien.y + r - 4); ctx.lineTo(closestAlien.x, closestAlien.y + r + 6);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 9. Render Projectiles (Directional Plasma Bolts, Warheads, Lasers)
    this.projectiles.render(ctx, this.planet.x, this.planet.y, this.planet.shieldRadius, this.getSettings().threatRings !== false);

    // 10. Render Particles, Chain Novas, Sparks, and Floating Combat Callouts
    this.particles.render(ctx);

    // Edge Vignette Pulse on Mega Chains
    if (this.vignettePulse > 0.02) {
      ctx.save();
      const vGrad = ctx.createRadialGradient(
        this.width * 0.5, this.height * 0.5, Math.min(this.width, this.height) * 0.45,
        this.width * 0.5, this.height * 0.5, Math.max(this.width, this.height) * 0.75
      );
      vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vGrad.addColorStop(1, `rgba(224, 64, 251, ${this.vignettePulse * 0.35})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 11. Render Gamepad Tactical Reticle
    this.renderGamepadReticle(ctx);

    // Cataclysm Sector IV: Genesis Supernova Cosmic Flash
    if (this.cataclysmFlashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 245, 220, ${this.cataclysmFlashAlpha * 0.85})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    ctx.restore();

    // Update In-Game HUD Overlays
    this.updateHUD();
  }

  updateHUD() {
    const isPlaying = (this.state === 'PLAYING' || this.state === 'PAUSED');
    const hudTop = document.getElementById('hudTop');
    const hudBottom = document.getElementById('hudBottom');

    if (!isPlaying) {
      if (hudTop) hudTop.style.opacity = '0';
      if (hudBottom) hudBottom.style.opacity = '0';
      return;
    }

    if (hudTop) hudTop.style.opacity = '1';
    if (hudBottom) hudBottom.style.opacity = '1';

    // Sector & Planet
    const cfg = PLANETS.find(p => p.id === this.currentPlanetId) || PLANETS[0];
    const sectorCfg = SECTORS.find(s => s.id === cfg.sector) || SECTORS[0];
    if (this.isDailyAnomalyMode) {
      document.getElementById('hudSectorLabel').textContent = 'DAILY ANOMALY';
      document.getElementById('hudPlanetLabel').textContent = this.dailyAnomalyConfig ? this.dailyAnomalyConfig.planet.name.toUpperCase() : cfg.name.toUpperCase();
    } else if (this.isEndlessMode) {
      document.getElementById('hudSectorLabel').textContent = 'ENDLESS SIEGE';
      document.getElementById('hudPlanetLabel').textContent = cfg.name.toUpperCase();
    } else {
      document.getElementById('hudSectorLabel').textContent = sectorCfg.shortName;
      document.getElementById('hudPlanetLabel').textContent = cfg.name.toUpperCase();
    }

    const waveEl = document.getElementById('hudWaveValue');
    if (waveEl) {
      if (this.isEndlessMode) {
        waveEl.innerHTML = `${this.currentWave} / <span class="font-bold text-sm leading-none inline-block align-middle">&infin;</span>`;
      } else {
        waveEl.textContent = `${this.currentWave} / ${this.totalWaves}`;
      }
    }

    // Shield Bar & Core HP Bar
    const shieldPct = Math.max(0, Math.round((this.planet.shield / this.planet.maxShield) * 100));
    document.getElementById('hudShieldText').textContent = `${shieldPct}%`;
    document.getElementById('hudShieldBar').style.width = `${shieldPct}%`;

    const corePct = Math.max(0, Math.round((this.planet.coreHp / this.planet.maxCoreHp) * 100));
    document.getElementById('hudCoreText').textContent = `${corePct}%`;
    document.getElementById('hudCoreBar').style.width = `${corePct}%`;

    // Boss Bar & v2.9 Destructible Sub-Systems
    const bossHudBar = document.getElementById('bossHudBar');
    const bossSubsContainer = document.getElementById('bossSubsystemsContainer');
    if (this.activeBoss && this.activeBoss.alive) {
      bossHudBar.classList.remove('hidden');
      const bossName = this.activeBoss.coreExposed ? `${this.activeBoss.name.toUpperCase()} (CORE EXPOSED +50%)` : this.activeBoss.name.toUpperCase();
      document.getElementById('bossNameLabel').textContent = bossName;
      const bPct = Math.max(0, Math.round((this.activeBoss.hp / this.activeBoss.maxHp) * 100));
      document.getElementById('bossHealthText').textContent = `${bPct}%`;
      document.getElementById('bossHealthFill').style.width = `${bPct}%`;

      if (bossSubsContainer && this.activeBoss.subsystems) {
        bossSubsContainer.classList.remove('hidden');
        const wpnSub = this.activeBoss.subsystems.find(s => s.id === 'portTorpedoBattery');
        const hgrSub = this.activeBoss.subsystems.find(s => s.id === 'starboardDroneHangar');

        const wpnFill = document.getElementById('bossWpnSubsystemBar');
        const wpnText = document.getElementById('bossWpnSubsystemText');
        if (wpnSub && wpnFill) {
          const wPct = wpnSub.destroyed ? 0 : Math.round((wpnSub.hp / wpnSub.maxHp) * 100);
          wpnFill.style.width = `${wPct}%`;
          if (wpnText) wpnText.textContent = wpnSub.destroyed ? 'OFFLINE' : `${wPct}%`;
        }

        const hgrFill = document.getElementById('bossHgrSubsystemBar');
        const hgrText = document.getElementById('bossHgrSubsystemText');
        if (hgrSub && hgrFill) {
          const hPct = hgrSub.destroyed ? 0 : Math.round((hgrSub.hp / hgrSub.maxHp) * 100);
          hgrFill.style.width = `${hPct}%`;
          if (hgrText) hgrText.textContent = hgrSub.destroyed ? 'OFFLINE' : `${hPct}%`;
        }
      }
    } else {
      bossHudBar.classList.add('hidden');
      if (bossSubsContainer) bossSubsContainer.classList.add('hidden');
    }

    // Shards & Score
    document.getElementById('hudShards').textContent = saveSystem.data.shards.toLocaleString();
    document.getElementById('hudScore').textContent = this.score.toLocaleString();

    // Combo Indicator
    const comboEl = document.getElementById('hudCombo');
    if (this.combo >= 2) {
      comboEl.textContent = `x${this.combo}`;
      comboEl.style.opacity = '1';
      comboEl.style.transform = 'scale(1.1)';
    } else {
      comboEl.textContent = 'x1';
      comboEl.style.opacity = '0.5';
      comboEl.style.transform = 'scale(0.95)';
    }

    // v2.9 Overdrive Frenzy UI
    this.updateFrenzyUI();

    // Nova Charges Dots & Recharge progress
    document.getElementById('hudNovaCount').textContent = `${this.novaCharges} / ${this.maxNovaCharges}`;
    const dotsContainer = document.getElementById('hudNovaDots');
    dotsContainer.innerHTML = '';
    for (let i = 0; i < this.maxNovaCharges; i++) {
      const dot = document.createElement('div');
      dot.className = `nova-dot ${i < this.novaCharges ? '' : 'empty'}`;
      dotsContainer.appendChild(dot);
    }
    document.getElementById('hudNovaProgress').style.width = `${Math.min(100, Math.round(this.novaProgress * 100))}%`;

    // Skills Cooldown Overlays
    const cdQEl = document.getElementById('skillCdQ');
    const cdFillQ = document.getElementById('cdFillQ');
    if (this.skills.timerQ > 0) {
      if (cdQEl) {
        cdQEl.classList.remove('hidden');
        cdQEl.textContent = `${this.skills.timerQ.toFixed(1)}s`;
      }
      if (cdFillQ) {
        const pct = (this.skills.timerQ / (this.skills.baseCdQ * this.skills.cdMultiplier)) * 100;
        cdFillQ.style.height = `${pct}%`;
      }
    } else {
      if (cdQEl) cdQEl.classList.add('hidden');
      if (cdFillQ) cdFillQ.style.height = '0%';
    }

    const isTesla = this.turret && this.turret.chassis === 'tesla';
    const cdWEl = document.getElementById('skillCdW');
    const cdFillW = document.getElementById('cdFillW');
    if (this.skills.timerW > 0) {
      if (cdWEl) {
        cdWEl.classList.remove('hidden');
        cdWEl.textContent = `${this.skills.timerW.toFixed(1)}s`;
      }
      if (cdFillW) {
        const maxW = this.skills.baseCdW * this.skills.cdMultiplier * (isTesla ? 0.8 : 1.0);
        const pct = (this.skills.timerW / maxW) * 100;
        cdFillW.style.height = `${pct}%`;
      }
    } else {
      if (cdWEl) cdWEl.classList.add('hidden');
      if (cdFillW) cdFillW.style.height = '0%';
    }

    const cdEEl = document.getElementById('skillCdE');
    const cdFillE = document.getElementById('cdFillE');
    if (this.skills.timerE > 0) {
      if (cdEEl) {
        cdEEl.classList.remove('hidden');
        cdEEl.textContent = `${this.skills.timerE.toFixed(1)}s`;
      }
      if (cdFillE) {
        const pct = (this.skills.timerE / (this.skills.baseCdE * this.skills.cdMultiplier)) * 100;
        cdFillE.style.height = `${pct}%`;
      }
    } else {
      if (cdEEl) cdEEl.classList.add('hidden');
      if (cdFillE) cdFillE.style.height = '0%';
    }

    // Skill R: Deployable Orbital Structure Cooldown
    const cdREl = document.getElementById('skillCdR');
    const cdFillR = document.getElementById('cdFillR');
    const labelR = document.getElementById('skillRLabel');
    if (this.structures) {
      if (labelR) {
        const chassis = this.turret?.chassisId || 'striker';
        if (chassis === 'tesla') labelR.textContent = 'GRAV-WELL';
        else if (chassis === 'railgun') labelR.textContent = 'FLAK BATT';
        else labelR.textContent = 'PRISM PYLON';
      }
      if (this.structures.cooldownTimer > 0) {
        if (cdREl) {
          cdREl.classList.remove('hidden');
          cdREl.textContent = `${this.structures.cooldownTimer.toFixed(1)}s`;
        }
        if (cdFillR) {
          const pct = this.structures.getCooldownRatio() * 100;
          cdFillR.style.height = `${pct}%`;
        }
      } else {
        if (cdREl) cdREl.classList.add('hidden');
        if (cdFillR) cdFillR.style.height = '0%';
      }
    }

    // Auto-Fire Toggle Label
    const autoLabel = document.getElementById('autoFireLabel');
    if (autoLabel) {
      autoLabel.textContent = this.turret.autoFire ? 'AUTO: ON' : 'AUTO: OFF';
    }

    // Sector Environmental Hazard Badge
    const hBadge = document.getElementById('hudHazardBadge');
    if (hBadge) {
      const hInfo = this.hazards.getHazardInfo();
      const hIcon = document.getElementById('hazardIcon');
      const hLabel = document.getElementById('hazardLabel');
      if (hIcon) hIcon.textContent = hInfo.icon;
      if (hLabel) hLabel.textContent = hInfo.name;
      hBadge.title = hInfo.desc;
    }

    // Active Temporary Buff Timers Pills
    const buffsContainer = document.getElementById('hudBuffs');
    if (buffsContainer) {
      buffsContainer.innerHTML = '';
      if (this.supplyPods.isQuadPulseActive()) {
        const pill = document.createElement('div');
        pill.className = 'glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 font-orbitron font-extrabold text-[10px] md:text-xs text-amber-300 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-pulse';
        pill.innerHTML = `<span>🔥 OVERCLOCK</span> <span>${this.supplyPods.quadPulseTimer.toFixed(1)}s</span>`;
        buffsContainer.appendChild(pill);
      }
      if (this.supplyPods.isCryoTimeWarpActive()) {
        const pill = document.createElement('div');
        pill.className = 'glass-panel px-3 py-1 rounded-full flex items-center gap-1.5 font-orbitron font-extrabold text-[10px] md:text-xs text-cosmic-mint border-cosmic-mint/60 shadow-[0_0_12px_rgba(0,230,118,0.4)] animate-pulse';
        pill.innerHTML = `<span>❄️ TIME-WARP</span> <span>${this.supplyPods.cryoTimeWarpTimer.toFixed(1)}s</span>`;
        buffsContainer.appendChild(pill);
      }
    }
  }

  // Interactive 3-Step Tactical Tutorial Overlay Methods
  startTutorial() {
    this.isTutorialActive = true;
    this.tutorialStep = 1;
    this.tutorialAimAccum = 0;
    this.tutorialTimer = 0;
    this.lastTurretAngle = this.turret.angle;
    this.updateTutorialUI();
  }

  advanceTutorial(step) {
    this.tutorialStep = step;
    this.tutorialTimer = 0;
    this.updateTutorialUI();
  }

  completeTutorial() {
    if (!this.isTutorialActive) return;
    this.isTutorialActive = false;
    const rewarded = saveSystem.completeTutorial();
    this.updateTutorialUI();
    if (rewarded) {
      this.showToast('🎓 Tactical Training Complete! +50 ✦ Shards', '#00e676');
    }
  }

  skipTutorial() {
    this.isTutorialActive = false;
    saveSystem.data.tutorialCompleted = true;
    saveSystem.save();
    this.updateTutorialUI();
    this.showToast('Tutorial Skipped', '#94a3b8');
  }

  updateTutorialUI() {
    const banner = document.getElementById('tutorialBanner');
    if (!banner) return;
    if (!this.isTutorialActive) {
      banner.classList.add('hidden');
      return;
    }
    banner.classList.remove('hidden');

    const stepText = document.getElementById('tutorialStepText');
    const titleText = document.getElementById('tutorialTitleText');
    const promptText = document.getElementById('tutorialPromptText');
    const btnComplete = document.getElementById('btnTutorialComplete');
    const dot1 = document.getElementById('tutDot1');
    const dot2 = document.getElementById('tutDot2');
    const dot3 = document.getElementById('tutDot3');

    if (dot1 && dot2 && dot3) {
      dot1.className = this.tutorialStep >= 1 ? 'w-2 h-2 rounded-full bg-cosmic-cyan shadow-[0_0_8px_#00e5ff]' : 'w-2 h-2 rounded-full bg-slate-700';
      dot2.className = this.tutorialStep >= 2 ? 'w-2 h-2 rounded-full bg-cosmic-gold shadow-[0_0_8px_#ffd700]' : 'w-2 h-2 rounded-full bg-slate-700';
      dot3.className = this.tutorialStep >= 3 ? 'w-2 h-2 rounded-full bg-cosmic-mint shadow-[0_0_8px_#00e676]' : 'w-2 h-2 rounded-full bg-slate-700';
    }

    if (this.tutorialStep === 1) {
      if (stepText) stepText.textContent = 'STEP 1 OF 3';
      if (titleText) titleText.textContent = '🎯 360° ORBITAL TURRET AIMING';
      if (promptText) promptText.textContent = 'Move your cursor or drag your finger around the planet to rotate your Orbital Guardian Turret. Your cannon auto-fires at invading alien ships and red torpedoes.';
      if (btnComplete) btnComplete.classList.add('hidden');
    } else if (this.tutorialStep === 2) {
      if (stepText) stepText.textContent = 'STEP 2 OF 3';
      if (titleText) titleText.textContent = '💥 DETONATE A SPARK NOVA';
      if (promptText) promptText.textContent = 'Click or tap anywhere in deep space (or press [SPACE]) to launch a Chain-Reaction Spark Nova! Destroyed aliens detonate and trigger cascading combos.';
      if (btnComplete) btnComplete.classList.add('hidden');
    } else if (this.tutorialStep === 3) {
      if (stepText) stepText.textContent = 'STEP 3 OF 3';
      if (titleText) titleText.textContent = '⚡ TACTICAL PLANETARY ABILITIES';
      if (promptText) promptText.textContent = 'Use [Q] Ion Beam, [W] EMP Shockwave, and [E] Aegis Overdrive at the bottom deck when swarmed—and shoot glowing cyan Supply Pods for instant buffs!';
      if (btnComplete) btnComplete.classList.remove('hidden');
    }
  }

  // ==========================================
  // v2.8 TACTICAL COMBAT MASTERY SYSTEMS
  // ==========================================

  hasPerk(perkId) {
    return this.activeDraftPerks && this.activeDraftPerks.some(p => p.id === perkId);
  }

  triggerPhaseParry() {
    if (this.state !== 'PLAYING') return false;
    if (this.parryCooldownTimer > 0) return false;

    this.parryCooldownTimer = this.parryCooldown;
    this.parryTimer = 0.38;

    const turretAngle = this.turret ? this.turret.angle : -Math.PI * 0.5;
    const halfArc = (110 * Math.PI) / 360; // 55° (110° total arc)
    const knockbackDist = (this.planet.shieldRadius || 97) + 35;

    // Close-Range Alien Knockback: Blasted backward 90px, stunned 1.8s, takes 45 shock damage
    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const a = this.aliens[i];
      if (!a.alive) continue;
      const d = Math.hypot(a.x - this.planet.x, a.y - this.planet.y);
      const aAng = Math.atan2(a.y - this.planet.y, a.x - this.planet.x);
      let diff = Math.abs(aAng - turretAngle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

      if (d <= knockbackDist && diff <= halfArc) {
        a.x += Math.cos(aAng) * 90;
        a.y += Math.sin(aAng) * 90;
        a.freeze(1.8);

        // Unlatch any latched Leech Pods
        if (a.isLeech && a.latched) {
          a.latched = false;
          this.particles.addFloater(a.x, a.y, 'LEECH DETACHED!', '#ffd700', 14);
        }

        const destroyed = a.takeDamage(45, a.x, a.y, true);
        this.particles.spawnDebris(a.x, a.y, '#00e5ff', 8);
        if (destroyed) {
          this.onAlienDestroyed(a);
        }
      }
    }

    // v2.8 Explosive Aegis Parry Draft Perk: Trigger 120px concussive shockwave dealing 60 damage
    if (this.hasPerk('explosiveParry')) {
      const parryX = this.planet.x + Math.cos(turretAngle) * (this.planet.shieldRadius + 8);
      const parryY = this.planet.y + Math.sin(turretAngle) * (this.planet.shieldRadius + 8);
      this.particles.spawnNovaRing(parryX, parryY, '#ffd700', 120);
      for (let i = this.aliens.length - 1; i >= 0; i--) {
        const a = this.aliens[i];
        if (!a.alive) continue;
        if (Math.hypot(a.x - parryX, a.y - parryY) <= 120) {
          const k = a.takeDamage(60, parryX, parryY, true);
          if (k) this.onAlienDestroyed(a);
        }
      }
    }

    this.particles.spawnNovaRing(this.planet.x, this.planet.y, '#00e5ff', this.planet.shieldRadius + 14);
    audio.playParry();
    this.updateParryUI();
    return true;
  }

  onPerfectParry(torpX, torpY, torpDmg = 15) {
    // Cooldown reduced to 0.5s on successful Perfect Parry!
    this.parryCooldownTimer = Math.min(this.parryCooldownTimer, 0.5);

    // Reflected back as friendly Homing Super-Missile
    let target = null;
    let minDist = 99999;
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const d = Math.hypot(a.x - torpX, a.y - torpY);
      if (d < minDist) {
        minDist = d;
        target = a;
      }
    }

    const refAngle = target ? Math.atan2(target.y - torpY, target.x - torpX) : (this.turret ? this.turret.angle : -Math.PI * 0.5);
    this.projectiles.addPlasmaBolt({
      x: torpX,
      y: torpY,
      angle: refAngle,
      speed: 480,
      damage: 85 * (this.novaMultiplier || 1.0),
      color: '#ffd700',
      isReflectedMissile: true,
      isRocket: true,
      splashRadius: 65,
      isDirectPierce: true,
      source: 'parry'
    });

    // Award floating combat text, micro hit-stop flash, +20% Nova, +8% Cataclysm, +5% Shield
    this.particles.addFloater(torpX, torpY - 20, '⚡ PERFECT PARRY! +20% NOVA', '#ffd700', 16);
    this.hitStopTimer = 0.08;
    this.timeScale = 0.4;
    audio.playParry();

    this.novaProgress += 0.20;
    if (this.novaProgress >= 1.0 && this.novaCharges < this.maxNovaCharges) {
      this.novaCharges++;
      this.novaProgress -= 1.0;
    }

    this.coreCharge = Math.min(100, this.coreCharge + 8.0);
    this.planet.shield = Math.min(this.planet.maxShield, this.planet.shield + Math.round(this.planet.maxShield * 0.05));

    // v2.9 Frenzy Overdrive: +18% on Perfect Parry
    this.addFrenzy(18.0);

    // Explosive Aegis Parry Perk check
    if (this.hasPerk('explosiveParry')) {
      this.particles.spawnNovaRing(torpX, torpY, '#ffd700', 120);
      for (let i = this.aliens.length - 1; i >= 0; i--) {
        const a = this.aliens[i];
        if (!a.alive) continue;
        if (Math.hypot(a.x - torpX, a.y - torpY) <= 120) {
          const k = a.takeDamage(60, torpX, torpY, true);
          if (k) this.onAlienDestroyed(a);
        }
      }
    }

    // v2.9 Supernova Counter-Matrix Synergy: 360° Mini-EMP (220px) + 3 Golden Homing Counter-Missiles
    if (this.hasPerk('supernovaCounterMatrix')) {
      this.particles.spawnNova(this.planet.x, this.planet.y, 220, '#ffd700', 50, true);
      this.particles.addFloater(this.planet.x, this.planet.y - 30, '🪞 SUPERNOVA COUNTER-MATRIX!', '#ffd700', 20);
      for (const a of this.aliens) {
        if (!a.alive) continue;
        const dist = Math.hypot(a.x - this.planet.x, a.y - this.planet.y);
        if (dist <= 220) {
          a.freeze(1.5);
          const pushAng = Math.atan2(a.y - this.planet.y, a.x - this.planet.x);
          a.x += Math.cos(pushAng) * 60;
          a.y += Math.sin(pushAng) * 60;
          const destroyed = a.takeDamage(50, this.planet.x, this.planet.y, true);
          if (destroyed) this.onAlienDestroyed(a);
        }
      }
      const aliveAliens = this.aliens.filter(a => a.alive).sort((a, b) => b.hp - a.hp);
      for (let i = 0; i < 3; i++) {
        let missileAng = (i / 3) * Math.PI * 2;
        if (aliveAliens.length > 0) {
          const threat = aliveAliens[i % aliveAliens.length];
          missileAng = Math.atan2(threat.y - torpY, threat.x - torpX) + (i - 1) * 0.15;
        }
        this.projectiles.addPlasmaBolt({
          x: torpX,
          y: torpY,
          angle: missileAng,
          speed: 480,
          damage: 85 * (this.novaMultiplier || 1.0),
          color: '#ffd700',
          isReflectedMissile: true,
          isRocket: true,
          splashRadius: 65,
          isDirectPierce: true,
          source: 'parry'
        });
      }
    }

    this.updateParryUI();
  }

  triggerOverchargeLance() {
    if (this.state !== 'PLAYING') return false;
    if (this.chargeProgress < 0.50) {
      this.chargeProgress = 0;
      this.isChargingOvercharge = false;
      return false;
    }

    const baseDmg = (this.turret ? (this.turret.damage || 20) : 20);
    const dmg = Math.round(baseDmg * (1.0 + this.chargeProgress * 2.2));

    const nozzleDist = this.planet.planetRadius + 14;
    const nozzleX = this.planet.x + Math.cos(this.turret.angle) * nozzleDist;
    const nozzleY = this.planet.y + Math.sin(this.turret.angle) * nozzleDist;

    this.projectiles.addPlasmaBolt({
      x: nozzleX,
      y: nozzleY,
      angle: this.turret.angle,
      speed: 820,
      damage: dmg,
      color: '#00e5ff',
      pierce: 5,
      isOverchargeLance: true,
      isDirectPierce: true,
      source: 'overcharge'
    });

    // v2.9 Hyper-Velocity Plasma Rail-Wall Synergy: 2.5s laser firewall line across space (90 dmg/s, 60% slow)
    if (this.hasPerk('hyperVelocityRailWall')) {
      const angle = this.turret.angle;
      const x1 = nozzleX;
      const y1 = nozzleY;
      const x2 = nozzleX + Math.cos(angle) * 750;
      const y2 = nozzleY + Math.sin(angle) * 750;
      this.laserFirewalls.push({
        x1, y1, x2, y2, angle,
        life: 2.5,
        maxLife: 2.5,
        dps: 90
      });
      this.particles.addFloater(nozzleX + Math.cos(angle) * 120, nozzleY + Math.sin(angle) * 120, '☄️ LASER FIREWALL ENGAGED!', '#f97316', 16);
    }

    this.turretRecoil = 14;
    this.addScreenShake(8, 0.2);
    audio.playOverchargeFire();

    this.chargeProgress = 0;
    this.isChargingOvercharge = false;
    return true;
  }

  onCritBreach(alien) {
    this.spawnSparks(alien.x, alien.y, 2);
    this.particles.addFloater(alien.x, alien.y - 25, '💥 CRITICAL BREACH! x2.5', '#ff9100', 17);
    this.hitStopTimer = 0.08;
    audio.playCritBreach();
    // v2.9 Frenzy Overdrive: +15% on Critical Weak-Spot Breach
    this.addFrenzy(15.0);
  }

  getEligibleSynergyEvolutions() {
    const eligible = [];
    const currentChassis = this.turret ? this.turret.chassis : 'standard';

    for (const syn of SYNERGY_EVOLUTIONS) {
      if (this.hasPerk(syn.id)) continue;

      let canEvolve = false;
      if (syn.id === 'thunderstormSingularity') {
        canEvolve = currentChassis === 'tesla' || this.hasPerk('splitNova') || this.hasRelic('overchargedCoil');
      } else if (syn.id === 'supernovaCounterMatrix') {
        canEvolve = this.hasPerk('explosiveParry') || this.hasRelic('aegisMirror') || currentChassis === 'striker';
      } else if (syn.id === 'hyperVelocityRailWall') {
        canEvolve = currentChassis === 'railgun' || this.hasPerk('overclockedBarrels') || this.hasPerk('chainMomentum');
      } else if (syn.id === 'absoluteZeroShatterCore') {
        canEvolve = this.hasPerk('cryoShrapnel') || this.hasRelic('chronoStasisPrism');
      } else if (syn.id === 'omegaDroneSwarm') {
        canEvolve = this.hasPerk('wingmanOverdrive') || this.hasRelic('twinWingman');
      }

      if (canEvolve) {
        eligible.push(syn);
      }
    }
    return eligible;
  }

  triggerWaveDraft() {
    this.waveDraftPending = true;

    // Synergy Evolution guarantee check (starting from Wave 2+, or Titan Protocol / Endless)
    const eligibleSynergies = this.getEligibleSynergyEvolutions();
    let guaranteedSynergy = null;
    if (eligibleSynergies.length > 0) {
      guaranteedSynergy = eligibleSynergies[Math.floor(Math.random() * eligibleSynergies.length)];
    }

    // Pick remaining from unpicked standard perks
    const unpicked = TACTICAL_DRAFT_PERKS.filter(p => !this.activeDraftPerks.some(ap => ap.id === p.id));
    const pool = unpicked.length >= 3 ? unpicked : TACTICAL_DRAFT_PERKS;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    if (guaranteedSynergy) {
      this.currentDraftOptions = [
        guaranteedSynergy,
        shuffled[0],
        shuffled[1]
      ].sort(() => Math.random() - 0.5);
    } else {
      this.currentDraftOptions = shuffled.slice(0, 3);
    }

    if (this.onShowWaveDraftModal) {
      this.onShowWaveDraftModal(this.currentDraftOptions, this.currentWave + 1);
    }
  }

  selectDraftPerk(perkIndex) {
    if (!this.waveDraftPending || !this.currentDraftOptions || !this.currentDraftOptions[perkIndex]) return;
    const perk = this.currentDraftOptions[perkIndex];
    this.activeDraftPerks.push(perk);

    if (perk.id === 'overclockedBarrels') {
      this.turret.fireIntervalMultiplier = (this.turret.fireIntervalMultiplier || 1.0) * 0.65;
    }
    if (perk.id === 'omegaDroneSwarm') {
      this.omegaDrones = [];
    }

    const floaterColor = perk.isSynergy ? '#ffd700' : '#00e5ff';
    const floaterPrefix = perk.isSynergy ? '🌟 SYNERGY EVOLVED: ' : 'REINFORCEMENT: ';
    this.particles.addFloater(this.planet.x, this.planet.y - 90, `${floaterPrefix}${perk.name}`, floaterColor, 22);
    audio.playDraftSelect();
    this.waveDraftPending = false;

    if (this.onUpdateDraftBadges) {
      this.onUpdateDraftBadges(this.activeDraftPerks);
    }
    if (this.onHideWaveDraftModal) {
      this.onHideWaveDraftModal();
    }

    if (this.isTitanProtocolMode) {
      // Inter-wave Tactical Pit-Stop (4s)
      this.isTitanPitStop = true;
      this.titanPitStopTimer = TITAN_PROTOCOL_CONFIG.pitStop.duration;
      const p = this.planet;
      const shieldHeal = Math.round(p.maxShield * TITAN_PROTOCOL_CONFIG.pitStop.shieldRestorePct);
      const coreHeal = Math.round(p.maxCoreHp * TITAN_PROTOCOL_CONFIG.pitStop.coreRestorePct);
      p.shield = Math.min(p.maxShield, p.shield + shieldHeal);
      p.coreHp = Math.min(p.maxCoreHp, p.coreHp + coreHeal);
      this.novaCharges = Math.min(this.maxNovaCharges, this.novaCharges + TITAN_PROTOCOL_CONFIG.pitStop.novaChargesBonus);
      this.particles.addFloater(this.planet.x, this.planet.y - 140, '👑 TITAN NEUTRALIZED!', '#ffd700', 30);
      this.particles.addFloater(this.planet.x, this.planet.y - 105, `ORBITAL REPAIR: +${shieldHeal} SHIELD, +${coreHeal} CORE`, '#00e676', 20);
      this.showToast(TITAN_PROTOCOL_CONFIG.pitStop.bannerText, '#ffd700');
      audio.playVictory();
    } else {
      this.currentWave++;
      this.particles.addFloater(this.planet.x, this.planet.y - 120, `WAVE ${this.currentWave}!`, '#ffd700', 32);
      this.setupWaveSpawns();
    }
  }

  triggerEliteAmbush(originX, originY) {
    this.particles.spawnNova(originX, originY, 140, '#a855f7', 0, false);
    this.particles.addFloater(originX, originY - 30, '⚠️ ELITE AMBUSH TRIGGERED! 2X SHARDS!', '#a855f7', 22);
    this.addScreenShake(12, 0.35);
    audio.playSkill('W');

    // Spawn 5 elite vanguard + 1 Weaver/Jammer
    const ambushClasses = ['SCOUT', 'INTERCEPTOR', 'SCOUT', 'INTERCEPTOR', 'SCOUT', Math.random() < 0.5 ? 'JAMMER' : 'WEAVER'];
    ambushClasses.forEach((cls, idx) => {
      const ang = (idx / ambushClasses.length) * Math.PI * 2;
      const dist = 280 + Math.random() * 40;
      const ax = this.planet.x + Math.cos(ang) * dist;
      const ay = this.planet.y + Math.sin(ang) * dist;
      const a = new Alien(ax, ay, cls);
      a.engine = this;
      a.isAmbushReward = true;
      this.aliens.push(a);
      this.warpPortals.push({ x: ax, y: ay, timer: 0.6, maxTimer: 0.6, radius: 28, rot: 0, color: '#a855f7' });
    });
  }

  spawnSparks(x, y, count = 2) {
    saveSystem.addShards(count * 5);
    for (let i = 0; i < count; i++) {
      this.particles.spawnCosmicSpark(x + (Math.random() - 0.5) * 12, y + (Math.random() - 0.5) * 12, 1);
    }
    this.particles.addFloater(x, y - 15, `+${count * 5} ✦`, '#ffd700', 14);
  }

  spawnVolatilePlasmaPool(x, y) {
    this.solarEmberZones.push({
      x,
      y,
      radius: 65,
      life: 3.5,
      maxLife: 3.5,
      dps: 45
    });
  }

  updateParryUI() {
    const btn = document.getElementById('btnParry');
    const cdFill = document.getElementById('parryCdFill');
    const cdText = document.getElementById('parryCdText');
    if (!btn) return;

    if (this.parryCooldownTimer > 0) {
      const pct = (this.parryCooldownTimer / this.parryCooldown) * 100;
      if (cdFill) cdFill.style.height = `${pct}%`;
      if (cdText) {
        cdText.classList.remove('hidden');
        cdText.textContent = `${this.parryCooldownTimer.toFixed(1)}s`;
      }
      btn.classList.add('opacity-70');
    } else {
      if (cdFill) cdFill.style.height = '0%';
      if (cdText) cdText.classList.add('hidden');
      btn.classList.remove('opacity-70');
    }
  }

  // v2.9 Frenzy Overdrive Mechanics
  addFrenzy(amount) {
    if (this.frenzyActive) return;
    if (this.frenzyPauseTimer > 0) return;
    this.frenzy = Math.min(100, this.frenzy + amount);
    this.updateFrenzyUI();
    if (this.frenzy >= 100) {
      this.triggerHyperFrenzy();
    }
  }

  triggerHyperFrenzy() {
    this.frenzy = 100;
    this.frenzyActive = true;
    this.frenzyTimer = 8.0;
    audio.setBgmTempoMultiplier(1.15);
    audio.playSkill('Q');
    this.addScreenShake(12, 0.35);
    this.particles.addFloater(this.planet.x, this.planet.y - 75, '🔥 HYPER-FRENZY OVERDRIVE! 🔥', '#ff0055', 26);
    this.showToast('🔥 HYPER-FRENZY OVERDRIVE! +40% FIRE RATE & RAINBOW PLASMA!', '#ff0055');
    this.updateFrenzyUI();
  }

  onCoreDamageTaken() {
    if (this.frenzyActive) {
      this.frenzyTimer = Math.max(0, this.frenzyTimer - 2.8);
    }
    this.frenzy = Math.max(0, this.frenzy - 35.0);
    this.updateFrenzyUI();
  }

  onShieldHit() {
    this.frenzyPauseTimer = 1.5;
  }

  updateFrenzyUI() {
    const frenzyFill = document.getElementById('hudFrenzyFill');
    const frenzyVal = document.getElementById('hudFrenzyVal');
    const frenzyContainer = document.getElementById('hudFrenzy');
    if (frenzyFill) {
      frenzyFill.style.width = `${Math.min(100, Math.round(this.frenzy))}%`;
    }
    if (frenzyVal) {
      if (this.frenzyActive) {
        frenzyVal.textContent = `OVERDRIVE: ${this.frenzyTimer.toFixed(1)}s`;
        frenzyVal.className = 'text-xs font-black tracking-wider text-amber-300 animate-pulse';
      } else {
        frenzyVal.textContent = `${Math.round(this.frenzy)}%`;
        frenzyVal.className = 'text-xs font-bold text-slate-300';
      }
    }
    if (frenzyContainer) {
      if (this.frenzyActive) {
        frenzyContainer.classList.add('ring-2', 'ring-amber-400', 'shadow-[0_0_15px_rgba(251,191,36,0.5)]');
      } else {
        frenzyContainer.classList.remove('ring-2', 'ring-amber-400', 'shadow-[0_0_15px_rgba(251,191,36,0.5)]');
      }
    }
  }

  // v2.9 Space Anomalies: Twin Wormholes
  updateWormholes(dt) {
    if (this.wormholes) {
      this.wormholes.life -= dt;
      this.wormholes.a.rot += dt * 4;
      this.wormholes.b.rot -= dt * 4;
      if (this.wormholes.life <= 0) {
        this.wormholes = null;
        this.wormholeSpawnTimer = 18.0;
      }
    } else {
      this.wormholeSpawnTimer -= dt;
      if (this.wormholeSpawnTimer <= 0) {
        const angA = Math.random() * Math.PI * 2;
        const angB = angA + Math.PI * (0.65 + Math.random() * 0.7);
        const distA = 220 + Math.random() * 80;
        const distB = 220 + Math.random() * 80;
        this.wormholes = {
          life: 14.0,
          maxLife: 14.0,
          a: {
            x: this.planet.x + Math.cos(angA) * distA,
            y: this.planet.y + Math.sin(angA) * distA,
            radius: 28,
            rot: 0,
            label: 'PORTAL α',
            color: '#00e5ff'
          },
          b: {
            x: this.planet.x + Math.cos(angB) * distB,
            y: this.planet.y + Math.sin(angB) * distB,
            radius: 28,
            rot: 0,
            label: 'PORTAL β',
            color: '#e040fb'
          }
        };
        this.particles.addFloater(this.wormholes.a.x, this.wormholes.a.y - 30, '🌀 PORTAL α OPENED', '#00e5ff', 16);
        this.particles.addFloater(this.wormholes.b.x, this.wormholes.b.y - 30, '🌀 PORTAL β OPENED', '#e040fb', 16);
        audio.playSkill('W');
      }
    }
  }

  renderWormholes(ctx) {
    if (!this.wormholes) return;
    const wh = this.wormholes;
    const pulse = 1 + Math.sin(this.gameTime * 6) * 0.12;
    for (const p of [wh.a, wh.b]) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, p.radius * pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const start = (i * Math.PI * 2) / 3;
        ctx.arc(0, 0, p.radius * 0.75, start, start + 1.2);
        ctx.stroke();
      }

      ctx.fillStyle = '#050814';
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.save();
      ctx.font = '700 10px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillText(p.label, p.x, p.y + p.radius + 14);
      ctx.restore();
    }
  }

  // v2.9 Space Anomalies: Volatile Plasma Fuel Barrels
  updatePlasmaBarrels(dt) {
    this.plasmaBarrelSpawnTimer -= dt;
    if (this.plasmaBarrelSpawnTimer <= 0 && this.plasmaBarrels.length < 2) {
      this.plasmaBarrelSpawnTimer = 16.0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 320 + Math.random() * 80;
      const driftAng = angle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;
      const speed = 25 + Math.random() * 15;
      this.plasmaBarrels.push({
        x: this.planet.x + Math.cos(angle) * dist,
        y: this.planet.y + Math.sin(angle) * dist,
        vx: Math.cos(driftAng) * speed,
        vy: Math.sin(driftAng) * speed,
        radius: 14,
        rot: 0,
        vRot: (Math.random() - 0.5) * 1.5,
        life: 25.0,
        hp: 20,
        maxHp: 20,
        alive: true
      });
    }

    for (let i = this.plasmaBarrels.length - 1; i >= 0; i--) {
      const b = this.plasmaBarrels[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vRot * dt;
      b.life -= dt;
      if (b.life <= 0 || !b.alive) {
        this.plasmaBarrels.splice(i, 1);
      }
    }
  }

  renderPlasmaBarrels(ctx) {
    for (const b of this.plasmaBarrels) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);

      const pulse = 0.6 + Math.sin(this.gameTime * 8) * 0.4;
      ctx.fillStyle = `rgba(249, 115, 22, ${0.25 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius + 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-10, -13, 20, 26, 4) : ctx.rect(-10, -13, 20, 26);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-8, -4, 16, 8);

      ctx.font = '900 9px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('☣', 0, 0);

      ctx.restore();
    }
  }

  // v2.9 Thunderstorm Singularity Clouds
  updateStormClouds(dt) {
    for (let i = this.stormClouds.length - 1; i >= 0; i--) {
      const sc = this.stormClouds[i];
      sc.life -= dt;
      sc.zapTimer -= dt;
      if (sc.zapTimer <= 0) {
        sc.zapTimer = 0.4;
        let targets = 0;
        for (const a of this.aliens) {
          if (!a.alive) continue;
          if (Math.hypot(a.x - sc.x, a.y - sc.y) <= sc.radius) {
            const destroyed = a.takeDamage(40, sc.x, sc.y, false);
            this.chainTethers.push({
              x1: sc.x,
              y1: sc.y,
              x2: a.x,
              y2: a.y,
              color: '#00e5ff',
              life: 0.18,
              maxLife: 0.18
            });
            this.damageSources.nova += 40;
            if (destroyed) this.onAlienDestroyed(a, { x: sc.x, y: sc.y });
            targets++;
            if (targets >= 4) break;
          }
        }
      }
      if (sc.life <= 0) {
        this.stormClouds.splice(i, 1);
      }
    }
  }

  renderStormClouds(ctx) {
    for (const sc of this.stormClouds) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const alpha = Math.min(1.0, sc.life / 0.5) * 0.45;
      const grad = ctx.createRadialGradient(sc.x, sc.y, 10, sc.x, sc.y, sc.radius);
      grad.addColorStop(0, `rgba(0, 229, 255, ${alpha * 1.5})`);
      grad.addColorStop(0.6, `rgba(168, 85, 247, ${alpha})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.8;
      for (let k = 0; k < 3; k++) {
        const a1 = Math.random() * Math.PI * 2;
        const r1 = Math.random() * (sc.radius * 0.7);
        const a2 = a1 + (Math.random() - 0.5) * 1.2;
        const r2 = Math.random() * (sc.radius * 0.8);
        ctx.beginPath();
        ctx.moveTo(sc.x + Math.cos(a1) * r1, sc.y + Math.sin(a1) * r1);
        ctx.lineTo(sc.x + Math.cos(a2) * r2, sc.y + Math.sin(a2) * r2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // v2.9 Hyper-Velocity Laser Firewalls
  updateLaserFirewalls(dt) {
    for (let i = this.laserFirewalls.length - 1; i >= 0; i--) {
      const wall = this.laserFirewalls[i];
      wall.life -= dt;

      const dx = wall.x2 - wall.x1;
      const dy = wall.y2 - wall.y1;
      const segLenSq = dx * dx + dy * dy;

      for (const a of this.aliens) {
        if (!a.alive) continue;
        let t = ((a.x - wall.x1) * dx + (a.y - wall.y1) * dy) / (segLenSq || 1);
        t = Math.max(0, Math.min(1, t));
        const projX = wall.x1 + t * dx;
        const projY = wall.y1 + t * dy;
        const dist = Math.hypot(a.x - projX, a.y - projY);

        if (dist <= a.radius + 18) {
          const dmg = wall.dps * dt;
          a.slowTimer = Math.max(a.slowTimer || 0, 0.4);
          const destroyed = a.takeDamage(dmg, projX, projY, false);
          this.damageSources.turret += dmg;
          if (Math.random() < 0.25) {
            this.particles.spawnCosmicSpark(projX, projY, 1);
          }
          if (destroyed) this.onAlienDestroyed(a, { x: projX, y: projY });
        }
      }

      for (let tIdx = this.projectiles.torpedoes.length - 1; tIdx >= 0; tIdx--) {
        const torp = this.projectiles.torpedoes[tIdx];
        if (!torp.alive) continue;
        let t = ((torp.x - wall.x1) * dx + (torp.y - wall.y1) * dy) / (segLenSq || 1);
        t = Math.max(0, Math.min(1, t));
        const projX = wall.x1 + t * dx;
        const projY = wall.y1 + t * dy;
        if (Math.hypot(torp.x - projX, torp.y - projY) <= 20) {
          torp.alive = false;
          this.particles.spawnDebris(projX, projY, '#f97316', 6);
          this.particles.addFloater(projX, projY, 'FIREWALL INTERCEPT!', '#f97316', 13);
        }
      }

      if (wall.life <= 0) {
        this.laserFirewalls.splice(i, 1);
      }
    }
  }

  renderLaserFirewalls(ctx) {
    for (const wall of this.laserFirewalls) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const alpha = Math.min(1.0, wall.life / 0.4);

      ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.7})`;
      ctx.lineWidth = 14 + Math.sin(this.gameTime * 20) * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // v2.9 Omega Drone Swarm
  updateOmegaDrones(dt) {
    if (!this.hasPerk('omegaDroneSwarm')) return;
    if (this.omegaDrones.length === 0) {
      for (let i = 0; i < 4; i++) {
        this.omegaDrones.push({
          angle: (i / 4) * Math.PI * 2,
          orbitRadius: 125,
          orbitSpeed: 0.9,
          fireTimer: 0.28 * i,
          novaTimer: 3.0 + i * 1.5
        });
      }
    }

    const px = this.planet.x;
    const py = this.planet.y;

    for (const drone of this.omegaDrones) {
      drone.angle += drone.orbitSpeed * dt;
      const dx = px + Math.cos(drone.angle) * drone.orbitRadius;
      const dy = py + Math.sin(drone.angle) * drone.orbitRadius;

      drone.fireTimer -= dt;
      if (drone.fireTimer <= 0) {
        drone.fireTimer = 0.28;
        let nearest = null;
        let minDist = 380;
        for (const a of this.aliens) {
          if (!a.alive) continue;
          const d = Math.hypot(a.x - dx, a.y - dy);
          if (d < minDist) {
            minDist = d;
            nearest = a;
          }
        }
        if (nearest) {
          const fireAng = Math.atan2(nearest.y - dy, nearest.x - dx);
          this.projectiles.addPlasmaBolt({
            x: dx,
            y: dy,
            angle: fireAng,
            speed: 550,
            damage: 18,
            color: '#ffd700',
            pierce: 1,
            source: 'wingman'
          });
        }
      }

      drone.novaTimer -= dt;
      if (drone.novaTimer <= 0) {
        drone.novaTimer = 6.0;
        let clusterTarget = null;
        let maxCluster = 0;
        for (const a of this.aliens) {
          if (!a.alive) continue;
          let count = 0;
          for (const o of this.aliens) {
            if (o.alive && Math.hypot(o.x - a.x, o.y - a.y) <= 80) count++;
          }
          if (count > maxCluster) {
            maxCluster = count;
            clusterTarget = a;
          }
        }
        if (clusterTarget) {
          this.particles.spawnNova(clusterTarget.x, clusterTarget.y, 60, '#ffd700', 45, true);
          this.particles.addFloater(clusterTarget.x, clusterTarget.y - 20, '🛸 OMEGA CLUSTER NOVA!', '#ffd700', 14);
        }
      }
    }
  }

  renderOmegaDrones(ctx) {
    if (!this.hasPerk('omegaDroneSwarm')) return;
    const px = this.planet.x;
    const py = this.planet.y;

    for (const drone of this.omegaDrones) {
      const dx = px + Math.cos(drone.angle) * drone.orbitRadius;
      const dy = py + Math.sin(drone.angle) * drone.orbitRadius;

      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(drone.angle + Math.PI * 0.5);

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(-3, 8);
      ctx.lineTo(3, 8);
      ctx.lineTo(0, 14 + Math.sin(this.gameTime * 20) * 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 3);
      ctx.lineTo(0, 8);
      ctx.lineTo(-7, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
