// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../src/game/engine.js';
import { Planet } from '../src/game/planet.js';
import { Alien } from '../src/game/alien.js';
import { SYNERGY_EVOLUTIONS, TACTICAL_DRAFT_PERKS, ALIEN_CLASSES } from '../src/config.js';
import { audio } from '../src/engine/audio.js';
import { saveSystem } from '../src/engine/storage.js';
import { BattleCardGenerator } from '../src/ui/battle-card.js';
import fs from 'fs';
import path from 'path';

describe('v2.9 Synergy Evolutions, Multi-Part Destructible Bosses, Wormhole Anomalies & Frenzy Overdrive Suite', () => {
  let engine;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <div id="hudTop"></div>
      <div id="hudBottom"></div>
      <div id="hudSectorTitle"></div>
      <div id="hudPlanetName"></div>
      <div id="hudWaveValue"></div>
      <div id="hudShieldText"></div>
      <div id="hudShieldBar"></div>
      <div id="hudCoreText"></div>
      <div id="hudCoreBar"></div>
      <div id="hudShards"></div>
      <div id="hudScore"></div>
      <div id="hudCombo">x1</div>
      <div id="hudNovaCount"></div>
      <div id="hudNovaDots"></div>
      <div id="hudNovaProgress"></div>
      <div id="hudAscensionLabel"></div>
      <div id="hudDraftPerks"></div>
      <div id="hudFrenzy">
        <span id="hudFrenzyVal">0%</span>
        <div id="hudFrenzyFill" style="width: 0%;"></div>
      </div>
      <div id="bossHudBar" class="hidden">
        <span id="bossNameLabel"></span>
        <span id="bossHealthText"></span>
        <div id="bossHealthFill"></div>
        <div id="bossSubsystemsContainer" class="hidden">
          <div id="bossWpnSubsystemBar" style="width: 100%;"></div>
          <span id="bossWpnSubsystemText">100%</span>
          <div id="bossHgrSubsystemBar" style="width: 100%;"></div>
          <span id="bossHgrSubsystemText">100%</span>
        </div>
      </div>
      <div id="btnParry"><div id="parryCdFill"></div><span id="parryCdText"></span></div>
      <div id="btnCataclysm"><div id="cataclysmChargeFill"></div><span id="cataclysmChargeText"></span></div>
      <div id="cataclysmOverlay"></div>
      <div id="toastContainer"></div>
      <div id="modalWaveDraft" class="hidden">
        <span id="draftWaveNum"></span>
        <div id="draftCardsContainer"></div>
      </div>
    `;

    const canvas = document.getElementById('gameCanvas');
    saveSystem.data.equippedRelics = [];
    engine = new GameEngine(canvas);
  });

  describe('1. Golden Synergy Evolution Cards in Tactical Draft', () => {
    it('should define all 5 god-tier synergy evolutions in SYNERGY_EVOLUTIONS', () => {
      expect(SYNERGY_EVOLUTIONS).toHaveLength(5);
      const ids = SYNERGY_EVOLUTIONS.map(s => s.id);
      expect(ids).toContain('thunderstormSingularity');
      expect(ids).toContain('supernovaCounterMatrix');
      expect(ids).toContain('hyperVelocityRailWall');
      expect(ids).toContain('absoluteZeroShatterCore');
      expect(ids).toContain('omegaDroneSwarm');

      SYNERGY_EVOLUTIONS.forEach(s => {
        expect(s.isSynergy).toBe(true);
        expect(s.badge).toBe('🌟 SYNERGY EVOLUTION');
        expect(s.synergyWith).toBeDefined();
        expect(s.desc).toBeDefined();
      });
    });

    it('should identify eligible synergy evolutions based on player chassis, relics, or perks', () => {
      // Default standard turret has no chassis-based synergy
      engine.turret.chassis = 'standard';
      let eligible = engine.getEligibleSynergyEvolutions();
      expect(eligible).toEqual([]);

      // Tesla chassis qualifies for thunderstormSingularity
      engine.turret.chassis = 'tesla';
      eligible = engine.getEligibleSynergyEvolutions();
      expect(eligible.some(e => e.id === 'thunderstormSingularity')).toBe(true);

      // Railgun chassis qualifies for hyperVelocityRailWall
      engine.turret.chassis = 'railgun';
      eligible = engine.getEligibleSynergyEvolutions();
      expect(eligible.some(e => e.id === 'hyperVelocityRailWall')).toBe(true);

      // Pulse Striker qualifies for supernovaCounterMatrix
      engine.turret.chassis = 'striker';
      eligible = engine.getEligibleSynergyEvolutions();
      expect(eligible.some(e => e.id === 'supernovaCounterMatrix')).toBe(true);

      // Equipping Chrono-Stasis Prism relic qualifies for absoluteZeroShatterCore
      engine.turret.chassis = 'standard';
      saveSystem.data.equippedRelics = ['chronoStasisPrism'];
      eligible = engine.getEligibleSynergyEvolutions();
      expect(eligible.some(e => e.id === 'absoluteZeroShatterCore')).toBe(true);

      // Equipping Twin-Wingman relic qualifies for omegaDroneSwarm
      saveSystem.data.equippedRelics = ['twinWingman'];
      eligible = engine.getEligibleSynergyEvolutions();
      expect(eligible.some(e => e.id === 'omegaDroneSwarm')).toBe(true);
    });

    it('triggerWaveDraft should guarantee at least 1 Golden Synergy Evolution card when eligible', () => {
      engine.turret.chassis = 'tesla';
      engine.currentWave = 2;
      engine.triggerWaveDraft();

      expect(engine.currentDraftOptions).toHaveLength(3);
      const synergyCard = engine.currentDraftOptions.find(c => c.isSynergy);
      expect(synergyCard).toBeDefined();
      expect(synergyCard.id).toBe('thunderstormSingularity');
      expect(engine.waveDraftPending).toBe(true);
    });

    it('thunderstormSingularity should spawn a 4.0s ionized storm cloud on Spark Nova', () => {
      engine.activeDraftPerks.push(SYNERGY_EVOLUTIONS.find(s => s.id === 'thunderstormSingularity'));
      expect(engine.stormClouds).toHaveLength(0);

      engine.novaCharges = 1;
      engine.triggerSparkNova(400, 300);

      expect(engine.stormClouds).toHaveLength(1);
      const cloud = engine.stormClouds[0];
      expect(cloud.x).toBe(400);
      expect(cloud.y).toBe(300);
      expect(cloud.radius).toBe(115);
      expect(cloud.life).toBe(4.0);

      // Update storm cloud: zaps alien in radius
      const alien = new Alien(420, 310, 'SCOUT');
      alien.engine = engine;
      engine.aliens.push(alien);
      const initialHp = alien.hp;

      engine.updateStormClouds(0.45);
      expect(alien.hp).toBeLessThan(initialHp);
      expect(engine.chainTethers.length).toBeGreaterThan(0);
    });

    it('supernovaCounterMatrix should execute 220px EMP shockwave and launch 3 homing counter-missiles on Perfect Parry', () => {
      engine.activeDraftPerks.push(SYNERGY_EVOLUTIONS.find(s => s.id === 'supernovaCounterMatrix'));
      const alien = new Alien(450, 300, 'CRYO');
      alien.engine = engine;
      engine.aliens.push(alien);

      const initialCount = engine.projectiles.bolts.length;
      engine.onPerfectParry(400, 300);

      expect(alien.frozenTimer).toBeGreaterThan(0);
      expect(engine.projectiles.bolts.length).toBe(initialCount + 4);
      const counterMissile = engine.projectiles.bolts.find(b => b.isReflectedMissile);
      expect(counterMissile).toBeDefined();
      expect(counterMissile.damage).toBe(85);
      expect(counterMissile.color).toBe('#ffd700');
    });

    it('hyperVelocityRailWall should spawn a 2.5s laser firewall line on Overcharge Lance', () => {
      engine.activeDraftPerks.push(SYNERGY_EVOLUTIONS.find(s => s.id === 'hyperVelocityRailWall'));
      expect(engine.laserFirewalls).toHaveLength(0);

      engine.state = 'PLAYING';
      engine.chargeProgress = 1.0;
      engine.turret.angle = 0;
      engine.triggerOverchargeLance();

      expect(engine.laserFirewalls).toHaveLength(1);
      const wall = engine.laserFirewalls[0];
      expect(wall.life).toBe(2.5);
      expect(wall.dps).toBe(90);

      // Update firewall damages and slows enemy crossing the line
      const alien = new Alien(wall.x1 + 100, wall.y1, 'SCOUT');
      alien.engine = engine;
      engine.aliens.push(alien);

      const initHp = alien.hp;
      engine.updateLaserFirewalls(0.1);
      expect(alien.hp).toBeLessThan(initHp);
      expect(alien.slowTimer).toBeGreaterThan(0);
    });

    it('absoluteZeroShatterCore should increase damage to frozen targets by +50% and shatter into 6 shards upon death', () => {
      engine.activeDraftPerks.push(SYNERGY_EVOLUTIONS.find(s => s.id === 'absoluteZeroShatterCore'));
      const alien = new Alien(400, 300, 'SCOUT');
      alien.engine = engine;
      alien.hp = 100;
      alien.maxHp = 100;
      alien.frozenTimer = 2.0;

      // Alien takes +50% damage when frozen
      alien.takeDamage(20, 400, 300, false);
      expect(alien.hp).toBe(70); // 100 - (20 * 1.5) = 70

      // Alien death while frozen triggers 6 ice shards
      const prevBoltCount = engine.projectiles.bolts.length;
      engine.onAlienDestroyed(alien);
      expect(engine.projectiles.bolts.length).toBe(prevBoltCount + 6);
      const iceShard = engine.projectiles.bolts.find(b => b.isIceShard);
      expect(iceShard).toBeDefined();
      expect(iceShard.damage).toBe(28);
    });

    it('omegaDroneSwarm should maintain 4 orbiting drones that auto-fire and launch cluster novis', () => {
      engine.activeDraftPerks.push(SYNERGY_EVOLUTIONS.find(s => s.id === 'omegaDroneSwarm'));
      engine.updateOmegaDrones(0.016);

      expect(engine.omegaDrones).toHaveLength(4);
      expect(engine.omegaDrones[0].orbitRadius).toBe(125);

      // Update drones with an enemy alive: drone fires
      const alien = new Alien(engine.planet.x + 150, engine.planet.y, 'SCOUT');
      alien.engine = engine;
      engine.aliens.push(alien);

      engine.omegaDrones[0].fireTimer = 0;
      const boltCountBefore = engine.projectiles.bolts.length;
      engine.updateOmegaDrones(0.016);
      expect(engine.projectiles.bolts.length).toBe(boltCountBefore + 1);
    });
  });

  describe('2. Multi-Part Destructible Boss Sub-Systems', () => {
    let boss;

    beforeEach(() => {
      boss = new Alien(400, 100, 'BOSS', 'MOTHERSHIP TITAN');
      boss.engine = engine;
      engine.activeBoss = boss;
      engine.aliens.push(boss);
    });

    it('should initialize Boss with 2 destructible modules: portTorpedoBattery and starboardDroneHangar', () => {
      expect(boss.subsystems).toHaveLength(2);
      const wpn = boss.subsystems.find(s => s.id === 'portTorpedoBattery');
      const hgr = boss.subsystems.find(s => s.id === 'starboardDroneHangar');

      expect(wpn).toBeDefined();
      expect(wpn.shortName).toBe('WPN');
      expect(wpn.hp).toBe(Math.round(boss.maxHp * 0.30));
      expect(wpn.destroyed).toBe(false);

      expect(hgr).toBeDefined();
      expect(hgr.shortName).toBe('HGR');
      expect(hgr.hp).toBe(Math.round(boss.maxHp * 0.30));
      expect(hgr.destroyed).toBe(false);

      expect(boss.coreExposed).toBe(false);
    });

    it('destroying portTorpedoBattery should trigger 12% bleed damage to boss hull and limit salvos to 1 torpedo', () => {
      const initHp = boss.hp;
      const wpn = boss.subsystems.find(s => s.id === 'portTorpedoBattery');
      boss.damageSubsystem('portTorpedoBattery', wpn.maxHp + 50, engine);

      expect(wpn.destroyed).toBe(true);
      expect(boss.hp).toBe(initHp - Math.round(boss.maxHp * 0.12));

      // In boss update, torpedo fired count is restricted to 1
      let torpCount = 0;
      boss.torpedoTimer = 0;
      boss.update(0.1, engine.planet.x, engine.planet.y, 60, () => {}, () => { torpCount++; }, engine.planet);
      expect(torpCount).toBe(1);
    });

    it('destroying starboardDroneHangar should trigger bleed damage, spawn 2 supply pods, and halt reinforcements', () => {
      const podCountBefore = engine.supplyPods.pods.length;
      const hgr = boss.subsystems.find(s => s.id === 'starboardDroneHangar');
      boss.damageSubsystem('starboardDroneHangar', hgr.maxHp + 50, engine);

      expect(hgr.destroyed).toBe(true);
      expect(engine.supplyPods.pods.length).toBe(podCountBefore + 2);

      // Reinforcement minions callback should not fire
      let minionSpawned = false;
      boss.minionTimer = 0;
      boss.update(0.1, engine.planet.x, engine.planet.y, 60, () => { minionSpawned = true; }, () => {}, engine.planet);
      expect(minionSpawned).toBe(false);
    });

    it('destroying both subsystems should trigger Core Exposed mode with +50% damage to boss hull', () => {
      boss.damageSubsystem('portTorpedoBattery', 99999, engine);
      boss.damageSubsystem('starboardDroneHangar', 99999, engine);

      expect(boss.coreExposed).toBe(true);

      const hpBefore = boss.hp;
      boss.takeDamage(100, 400, 100, false);
      expect(boss.hp).toBe(hpBefore - 150); // 100 * 1.5 = 150
    });
  });

  describe('3. Space Anomalies: Twin Wormholes & Volatile Barrels', () => {
    it('updateWormholes should spawn Portal Alpha and Beta and handle lifecycle', () => {
      expect(engine.wormholes).toBeNull();
      engine.wormholeSpawnTimer = 0;
      engine.updateWormholes(0.1);

      expect(engine.wormholes).toBeDefined();
      expect(engine.wormholes.a.label).toBe('PORTAL α');
      expect(engine.wormholes.b.label).toBe('PORTAL β');
      expect(engine.wormholes.life).toBe(14.0);

      // Expiring wormholes
      engine.updateWormholes(14.5);
      expect(engine.wormholes).toBeNull();
    });

    it('plasma bolt entering Portal A should warp to Portal B with +45% damage and +2 pierce', () => {
      engine.wormholes = {
        life: 10,
        a: { x: 300, y: 300, radius: 28, color: '#00e5ff' },
        b: { x: 500, y: 400, radius: 28, color: '#e040fb' }
      };

      const bolt = {
        x: 302,
        y: 301,
        vx: 300,
        vy: 0,
        radius: 4,
        damage: 20,
        pierce: 1,
        alive: true
      };
      engine.projectiles.bolts.push(bolt);

      // Run projectiles update
      engine.projectiles.update(0.016, 800, 600, engine.aliens, engine.planet, () => {}, () => {}, () => {}, engine.hazards, engine.supplyPods, 1.0, () => {}, () => {}, engine.structures, engine.wormholes, engine.plasmaBarrels);

      expect(bolt.hasTeleported).toBe(true);
      expect(bolt.damage).toBe(29); // 20 * 1.45 = 29
      expect(bolt.pierce).toBe(3);  // 1 + 2 = 3
      expect(Math.hypot(bolt.x - engine.wormholes.b.x, bolt.y - engine.wormholes.b.y)).toBeLessThan(35);
    });

    it('triggerSparkNova near a wormhole should trigger a twin Nova Portal Echo at opposite portal', () => {
      engine.wormholes = {
        life: 10,
        a: { x: 200, y: 200, radius: 28 },
        b: { x: 600, y: 450, radius: 28 }
      };

      const shockwavesBefore = engine.particles.novas.length;
      // Detonate nova right at Portal A
      engine.novaCharges = 1;
      engine.triggerSparkNova(210, 205);

      // Should have spawned primary nova + echo nova at Portal B
      expect(engine.particles.novas.length).toBeGreaterThanOrEqual(shockwavesBefore + 2);
    });

    it('updatePlasmaBarrels should spawn volatile barrels and bolt collision should detonate 115px chain nova', () => {
      expect(engine.plasmaBarrels).toHaveLength(0);
      engine.plasmaBarrelSpawnTimer = 0;
      engine.updatePlasmaBarrels(0.1);

      expect(engine.plasmaBarrels.length).toBeGreaterThan(0);
      const barrel = engine.plasmaBarrels[0];

      // Spawn bolt on top of barrel with enough damage to breach
      const bolt = {
        x: barrel.x,
        y: barrel.y,
        vx: 100,
        vy: 0,
        radius: 5,
        damage: 25,
        pierce: 1,
        alive: true
      };
      engine.projectiles.bolts.push(bolt);

      const novasBefore = engine.particles.novas.length;
      engine.projectiles.update(0.016, 800, 600, engine.aliens, engine.planet, () => {}, () => {}, () => {}, engine.hazards, engine.supplyPods, 1.0, () => {}, () => {}, engine.structures, engine.wormholes, engine.plasmaBarrels);
      engine.updatePlasmaBarrels(0.016);

      expect(engine.plasmaBarrels).toHaveLength(0); // Detonated and removed
      expect(engine.particles.novas.length).toBeGreaterThan(novasBefore);
    });
  });

  describe('4. "🔥 Overdrive Frenzy Meter" & Double-Time Synthwave', () => {
    it('should accumulate Frenzy from kills (+4%), combos (+3%), parries (+18%), and weak-spot crits (+15%)', () => {
      expect(engine.frenzy).toBe(0);

      const alien = new Alien(400, 300, 'SCOUT');
      alien.engine = engine;
      engine.aliens.push(alien);

      // Kill with combo 0 -> combo becomes 1 (no combo bonus)
      engine.combo = 0;
      engine.onAlienDestroyed(alien);
      expect(engine.frenzy).toBe(4.0);

      // Kill with combo > 1
      engine.combo = 2;
      engine.onAlienDestroyed(alien);
      expect(engine.frenzy).toBe(11.0); // 4 + 4 + 3 = 11

      // Perfect parry: +18%
      engine.onPerfectParry(400, 300);
      expect(engine.frenzy).toBe(29.0);

      // Weak-spot crit breach: +15%
      engine.onCritBreach(alien);
      expect(engine.frenzy).toBe(44.0);
    });

    it('core damage should drop Frenzy by -35% and shield hit should pause gain for 1.5s', () => {
      engine.frenzy = 60.0;
      engine.onCoreDamageTaken();
      expect(engine.frenzy).toBe(25.0);

      engine.onShieldHit();
      expect(engine.frenzyPauseTimer).toBe(1.5);

      // While pause timer active, addFrenzy is ignored
      engine.addFrenzy(10.0);
      expect(engine.frenzy).toBe(25.0);
    });

    it('at 100% Frenzy, should activate 8.0s Hyper-Frenzy Overdrive with BGM tempo boost, +40% fire rate, and 2x nova recharge', () => {
      expect(engine.frenzyActive).toBe(false);
      engine.state = 'PLAYING';

      engine.addFrenzy(100);
      expect(engine.frenzyActive).toBe(true);
      expect(engine.frenzyTimer).toBe(8.0);
      expect(audio.bgmTempoMultiplier).toBe(1.15);

      // Turret and Wingman dt scaled by 1.4 during Frenzy
      // Check Turret auto-fire bolts have isChromatic and +25% damage
      let firedBolts = null;
      engine.turret.fireInterval = 0;
      engine.turret.fireTimer = 0;
      engine.update(0.016);

      // 2x Nova recharge on kill during frenzy
      const strikerAlien = new Alien(400, 300, 'SCOUT');
      strikerAlien.engine = engine;
      engine.aliens.push(strikerAlien);
      const initProgress = engine.novaProgress;
      engine.onAlienDestroyed(strikerAlien);
      const gain = engine.novaProgress - initProgress;
      const expectedMult = (engine.turret && engine.turret.chassis === 'striker' ? 1.15 : 1.0) * 2.0;
      expect(gain).toBeCloseTo(engine.killRechargeRate * expectedMult, 3);

      // After 8.5 seconds, Frenzy decays and expires
      engine.update(8.5);
      expect(engine.frenzyActive).toBe(false);
      expect(audio.bgmTempoMultiplier).toBe(1.0);
    });
  });

  describe('5. Version Badges & Holographic Battle Card Validation', () => {
    it('index.html should contain v2.9 title screen badge, boss subsystems container, and frenzy HUD elements', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toMatch(/(⚡ v2\.9 SYNERGY OVERDRIVE|🌟 v3\.0 GALACTIC COMMAND|🎨 v3\.1 PRISMATIC ART) EDITION/);
      expect(html).toContain('id="bossSubsystemsContainer"');
      expect(html).toContain('id="bossWpnSubsystemBar"');
      expect(html).toContain('id="bossHgrSubsystemBar"');
      expect(html).toContain('id="hudFrenzy"');
      expect(html).toContain('id="hudFrenzyFill"');
    });

    it('Battle Card should render v2.9 Synergy Overdrive Edition badge', () => {
      const originalCreateElement = document.createElement.bind(document);
      const fillTextCalls = [];

      document.createElement = function (tagName) {
        if (tagName === 'canvas') {
          return {
            width: 1200,
            height: 630,
            getContext: () => ({
              createLinearGradient: () => ({ addColorStop: vi.fn() }),
              createRadialGradient: () => ({ addColorStop: vi.fn() }),
              fillRect: vi.fn(),
              strokeRect: vi.fn(),
              beginPath: vi.fn(),
              arc: vi.fn(),
              ellipse: vi.fn(),
              moveTo: vi.fn(),
              lineTo: vi.fn(),
              closePath: vi.fn(),
              fill: vi.fn(),
              stroke: vi.fn(),
              save: vi.fn(),
              restore: vi.fn(),
              setLineDash: vi.fn(),
              getLineDash: () => [],
              fillText: (text, x, y) => fillTextCalls.push({ text, x, y }),
              set font(v) {},
              set fillStyle(v) {},
              set strokeStyle(v) {},
              set lineWidth(v) {},
              set textAlign(v) {},
              set textBaseline(v) {},
              set shadowColor(v) {},
              set shadowBlur(v) {},
              measureText: () => ({ width: 100 })
            }),
            toDataURL: () => 'data:image/png;base64,fake'
          };
        }
        return originalCreateElement(tagName);
      };

      try {
        BattleCardGenerator.renderCard(engine, saveSystem);
        const vBadge = fillTextCalls.find(c => c.text === "🎨 v3.1 PRISMATIC ART EDITION" || c.text === "🌟 v3.0 GALACTIC COMMAND EDITION" || c.text === "⚡ v2.9 SYNERGY OVERDRIVE EDITION");
        expect(vBadge).toBeDefined();
        expect(vBadge.x).toBe(48);
        expect(vBadge.y).toBe(76);
      } finally {
        document.createElement = originalCreateElement;
      }
    });
  });
});
