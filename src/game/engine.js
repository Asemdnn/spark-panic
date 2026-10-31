// Spark Panic: Planetary Invasion Defense 2.5 - Core Game Engine Coordinator

import { PLANETS, SECTORS, ALIEN_CLASSES, ARMORY_CONFIG, TROPHIES, GUARDIAN_RANKS, getDailyAnomalyConfig, DAILY_MUTATORS, TITAN_PROTOCOL_CONFIG, WINGMAN_CONFIG, ASCENSION_CONFIG, TURRET_SKINS, COSMIC_RELICS, STRUCTURE_CONFIG, DEFAULT_SETTINGS } from '../config.js';
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

      if (this.currentPlanetId >= 2 && roll < 0.28) classKey = 'INTERCEPTOR';
      else if (this.currentPlanetId >= 4 && roll < 0.44) classKey = 'CRYO';
      else if (this.currentPlanetId >= 7 && roll < 0.58) classKey = 'PHASE';
      else if (this.currentPlanetId >= 10 && roll < 0.72) classKey = 'DROPSHIP';
      else if (this.currentPlanetId >= 13 && roll < 0.85) classKey = 'DREADNOUGHT';

      this.waveSpawnQueue.push({ classKey, delay: i * (1.1 - Math.min(0.6, this.currentWave * 0.08)) });
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

    // Vampiric Core Relic: Heal Core HP + Shield on x8+ Combo
    if (this.hasRelic('vampiricCore') && this.combo >= 8) {
      this.planet.coreHp = Math.min(this.planet.maxCoreHp, this.planet.coreHp + 15);
      this.planet.restoreShield(25);
      this.particles.spawnNovaRing(this.planet.x, this.planet.y, '#00e676', 60);
      this.particles.addFloater(this.planet.x, this.planet.y - 25, 'VAMPIRIC DRAIN +HP/SHIELD!', '#00e676', 13);
    }

    // Nova kill recharge energy (+14% per kill, +15% bonus for Pulse Striker)
    const isStriker = this.turret && this.turret.chassis === 'striker';
    this.novaProgress += this.killRechargeRate * (isStriker ? 1.15 : 1.0);
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

    // 2. Update Guardian Turret (+2 barrels & +35% fire rate when Overclock is active)
    const isOverclock = this.supplyPods.isQuadPulseActive();
    this.turret.update(
      dt,
      this.pointerX,
      this.pointerY,
      this.planet.x,
      this.planet.y,
      isOverdrive,
      (bolts, angle) => {
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
      isOverclock
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

    // 3.5. Update Autonomous AI Wingman Fighters (WING-01 & WING-02)
    if (this.wingmanActive && this.wingman) {
      this.wingman.update(dt, this);
    }
    if (this.wingmanActive && this.wingman2 && this.hasRelic('twinWingman')) {
      this.wingman2.update(dt, this);
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
          // Dropship scout spawn callback
          const scout = new Alien(sx, sy, 'SCOUT');
          this.aliens.push(scout);
        },
        (tx, ty, angle, speed, dmg, color) => {
          // Torpedo fire callback
          this.projectiles.spawnTorpedo(tx, ty, angle, speed, dmg, color);
        }
      );

      // Check collision with planet shield/core
      const dist = Math.hypot(this.planet.x - alien.x, this.planet.y - alien.y);
      const hitRadius = this.planet.shield > 0 ? this.planet.shieldRadius : this.planet.planetRadius;

      if (dist <= hitRadius + alien.radius) {
        this.planet.damage(alien.damage, alien.x, alien.y);
        this.addScreenShake(alien.classKey === 'BOSS' ? 18 : 8, 0.25);
        this.particles.spawnDebris(alien.x, alien.y, alien.color, 10);
        alien.alive = false;
        this.aliens.splice(i, 1);
        continue;
      }

      if (!alien.alive) {
        this.aliens.splice(i, 1);
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
      },
      (boss) => this.onBossPhase2(boss),
      this.hazards,
      this.supplyPods,
      (ax, ay) => this.onAsteroidShattered(ax, ay),
      (px, py, bType) => this.onSupplyPodDestroyed(px, py, bType),
      this.structures
    );

    // 9. Wave Progression / Victory Check
    if (this.waveSpawnQueue.length === 0 && this.aliens.length === 0 && this.warpPortals.length === 0 && !this.isTitanPitStop) {
      if (this.currentWave < this.totalWaves) {
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
    this.planet.render(ctx, isOverdrive);

    // 4. Render Orbital Guardian Turret
    this.turret.render(ctx, this.planet.x, this.planet.y, this.planet.planetRadius, isOverdrive);

    // 5. Render Laser Targeting Sight (only during PLAYING state)
    if (this.state === 'PLAYING') {
      this.turret.renderLaserSight(ctx, this.planet.x, this.planet.y, this.pointerX, this.pointerY, isOverdrive);
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

    // 8. Render Aliens
    for (const alien of this.aliens) {
      alien.render(ctx);
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

    // Boss Bar
    const bossHudBar = document.getElementById('bossHudBar');
    if (this.activeBoss && this.activeBoss.alive) {
      bossHudBar.classList.remove('hidden');
      document.getElementById('bossNameLabel').textContent = this.activeBoss.name.toUpperCase();
      const bPct = Math.max(0, Math.round((this.activeBoss.hp / this.activeBoss.maxHp) * 100));
      document.getElementById('bossHealthText').textContent = `${bPct}%`;
      document.getElementById('bossHealthFill').style.width = `${bPct}%`;
    } else {
      bossHudBar.classList.add('hidden');
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
}
