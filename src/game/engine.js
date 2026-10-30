// Spark Panic: Planetary Invasion Defense 2.4 - Core Game Engine Coordinator

import { PLANETS, SECTORS, ALIEN_CLASSES, ARMORY_CONFIG, TROPHIES, GUARDIAN_RANKS, getDailyAnomalyConfig, DAILY_MUTATORS, TITAN_PROTOCOL_CONFIG, WINGMAN_CONFIG, ASCENSION_CONFIG, TURRET_SKINS } from '../config.js';
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
    this.skills = new TacticalSkills();
    this.projectiles = new ProjectileManager();
    this.particles = new ParticleEngine();
    this.hazards = new HazardManager();
    this.supplyPods = new SupplyPodManager();

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

    // Deep Space Starfield
    this.stars = [];
    this.initStars();

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 2.5 + 1
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

    // 7. Tactical Core Cooldowns
    this.skills.setCooldownReduction(up.tacticalCd || 0);
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
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
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
  }

  onAsteroidShattered(x, y) {
    saveSystem.addShards(15);
    audio.playShardPickup();
    this.particles.spawnDebris(x, y, '#94a3b8', 14);
    this.particles.spawnCosmicSpark(x, y, 3);
    this.particles.addFloater(x, y, '+15 SHARDS! ASTEROID SHATTER!', '#ffd700', 16);
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
    // Stars twinkling
    for (const s of this.stars) {
      s.phase += dt * s.speed;
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

    // 3.5. Update Autonomous AI Wingman Fighter (WING-01)
    if (this.wingmanActive && this.wingman) {
      this.wingman.update(dt, this);
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
      (px, py, bType) => this.onSupplyPodDestroyed(px, py, bType)
    );

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
      if (item.classKey === 'BOSS') {
        this.activeBoss = alien;
      }
      this.aliens.push(alien);
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
      (px, py, bType) => this.onSupplyPodDestroyed(px, py, bType)
    );

    // 9. Wave Progression / Victory Check
    if (this.waveSpawnQueue.length === 0 && this.aliens.length === 0 && !this.isTitanPitStop) {
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

    // 1. Render Deep Space Background Void & Twinkling Stars
    const bgGrad = ctx.createRadialGradient(
      this.planet.x, this.planet.y, 80,
      this.planet.x, this.planet.y, Math.max(this.width, this.height) * 0.75
    );
    bgGrad.addColorStop(0, '#0c132c');
    bgGrad.addColorStop(0.5, '#070b1a');
    bgGrad.addColorStop(1, '#03050c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    ctx.save();
    for (const s of this.stars) {
      const a = Math.max(0.15, Math.min(1, s.alpha * (0.6 + Math.sin(s.phase) * 0.4)));
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Render Background Ring Half
    this.planet.renderBackRing(ctx);

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

    // 7. Render Active Tactical Skills (Ion Beam & EMP)
    this.skills.render(ctx, this.planet.x, this.planet.y);

    // Render Sector Environmental Hazards
    this.hazards.render(ctx, this.planet.x, this.planet.y);

    // Render Mid-Battle Orbital Supply Pods
    this.supplyPods.render(ctx);

    // 8. Render Aliens
    for (const alien of this.aliens) {
      alien.render(ctx);
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

    // 9. Render Projectiles (Plasma Bolts, Torpedoes, Lasers)
    this.projectiles.render(ctx);

    // 10. Render Particles, Chain Novas, Sparks, and Floating Combat Callouts
    this.particles.render(ctx);

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
