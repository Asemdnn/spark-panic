// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ALIEN_CLASSES, TACTICAL_DRAFT_PERKS } from '../src/config.js';
import { Alien } from '../src/game/alien.js';
import { GameEngine } from '../src/game/engine.js';
import { BattleCardGenerator } from '../src/ui/battle-card.js';
import { saveSystem } from '../src/engine/storage.js';

describe('v2.8 Tactical Combat Mastery Suite', () => {
  let canvas;
  let engine;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <div id="btnParry"><div id="parryCdFill"></div><div id="parryCdText" class="hidden"></div></div>
      <div id="hudDraftPerks"></div>
      <div id="modalWaveDraft" class="hidden"><div id="draftCardsContainer"></div><span id="draftWaveNum"></span></div>
      <div id="hudShieldText"></div>
      <div id="hudShieldBar"></div>
      <div id="hudCoreText"></div>
      <div id="hudCoreBar"></div>
      <div id="cataclysmPercent"></div>
      <div id="cataclysmFill"></div>
      <div id="cataclysmReadyGlow"></div>
      <button id="btnCataclysm"></button>
    `;

    canvas = document.getElementById('gameCanvas');
    engine = new GameEngine(canvas);
    engine.planet.resize(800, 600);
    saveSystem.resetAll();
  });

  describe('1. Active Aegis Phase-Parry Deflection System', () => {
    it('triggerPhaseParry should initiate 0.38s active parry window and 2.2s cooldown', () => {
      engine.state = 'PLAYING';
      expect(engine.parryTimer).toBe(0);
      expect(engine.parryCooldownTimer).toBe(0);

      const triggered = engine.triggerPhaseParry();
      expect(triggered).toBe(true);
      expect(engine.parryTimer).toBeCloseTo(0.38, 2);
      expect(engine.parryCooldownTimer).toBeCloseTo(2.2, 2);

      // Cannot re-trigger while on cooldown
      const secondTrigger = engine.triggerPhaseParry();
      expect(secondTrigger).toBe(false);
    });

    it('triggerPhaseParry should knock back, stun for 1.8s and damage close-range enemies in 110° arc', () => {
      engine.state = 'PLAYING';
      engine.turret.angle = 0; // Facing East (+X)

      // Alien East inside arc and close to shield
      const closeAlien = new Alien(engine.planet.x + engine.planet.shieldRadius + 15, engine.planet.y, 'SCOUT');
      const startX = closeAlien.x;
      engine.aliens.push(closeAlien);

      // Alien West outside arc
      const farAlien = new Alien(engine.planet.x - 200, engine.planet.y, 'SCOUT');
      engine.aliens.push(farAlien);

      engine.triggerPhaseParry();

      // East alien was knocked back by 90px
      expect(closeAlien.x).toBeGreaterThan(startX + 80);
      // East alien was frozen / stunned
      expect(closeAlien.frozenTimer).toBeGreaterThanOrEqual(1.7);

      // West alien was unaffected
      expect(farAlien.x).toBe(engine.planet.x - 200);
    });

    it('onPerfectParry should reduce cooldown to 0.5s, spawn homing super-missile, and restore resources', () => {
      engine.state = 'PLAYING';
      engine.triggerPhaseParry();
      expect(engine.parryCooldownTimer).toBeCloseTo(2.2, 2);

      engine.novaCharges = 1;
      engine.maxNovaCharges = 3;
      engine.novaProgress = 0.1;
      engine.coreCharge = 10;
      engine.planet.shield = 50;
      engine.planet.maxShield = 100;

      // Add hostile alien for missile to lock onto
      const enemy = new Alien(engine.planet.x + 200, engine.planet.y, 'INTERCEPTOR');
      engine.aliens.push(enemy);

      engine.onPerfectParry(engine.planet.x + 100, engine.planet.y, 20);

      // Cooldown reduced to 0.5s
      expect(engine.parryCooldownTimer).toBeCloseTo(0.5, 2);

      // Super-missile spawned in projectiles
      const missile = engine.projectiles.bolts.find(b => b.isReflectedMissile);
      expect(missile).toBeDefined();
      expect(missile.damage).toBe(85);
      expect(missile.speed).toBe(480);
      expect(missile.splashRadius).toBe(65);
      expect(missile.color).toBe('#ffd700');

      // Resources restored: +20% Nova, +8% Cataclysm, +5% Shield
      expect(engine.novaProgress).toBeCloseTo(0.3, 2);
      expect(engine.coreCharge).toBeCloseTo(18, 2);
      expect(engine.planet.shield).toBe(55);
    });

    it('Explosive Aegis Parry perk should trigger 120px concussive shockwave on parry', () => {
      engine.state = 'PLAYING';
      engine.activeDraftPerks = [{ id: 'explosiveParry', name: 'Explosive Aegis Parry' }];
      engine.turret.angle = 0;

      const target = new Alien(engine.planet.x + engine.planet.shieldRadius + 20, engine.planet.y, 'DREADNOUGHT');
      const startHp = target.hp;
      engine.aliens.push(target);

      engine.triggerPhaseParry();

      // Target took base parry damage (45) + explosive shockwave damage (60)
      expect(target.hp).toBeLessThan(startHp - 50);
    });
  });

  describe('2. Hold-to-Charge Overcharge Shot & Glowing Reactor Weak-Spot Crits', () => {
    it('triggerOverchargeLance should fire high-velocity piercing bolt with scaled damage when charged', () => {
      engine.state = 'PLAYING';
      engine.turret.angle = 0;
      engine.chargeProgress = 1.0; // 100% full charge
      engine.isChargingOvercharge = true;

      const fired = engine.triggerOverchargeLance();
      expect(fired).toBe(true);

      const bolt = engine.projectiles.bolts.find(b => b.isOverchargeLance);
      expect(bolt).toBeDefined();
      expect(bolt.speed).toBe(820);
      expect(bolt.pierce).toBe(5);
      expect(bolt.isDirectPierce).toBe(true);
      // Scaled up to ~3.2x base damage
      expect(bolt.damage).toBeGreaterThanOrEqual(50);
      expect(engine.isChargingOvercharge).toBe(false);
    });

    it('triggerOverchargeLance should reject firing if charge is under 50%', () => {
      engine.state = 'PLAYING';
      engine.chargeProgress = 0.35;
      engine.isChargingOvercharge = true;

      const fired = engine.triggerOverchargeLance();
      expect(fired).toBe(false);
      expect(engine.projectiles.bolts.length).toBe(0);
    });

    it('Overcharge Lance isDirectPierce should pierce Jammer frontal barrier directly', () => {
      const jammer = new Alien(400, 300, 'JAMMER');
      jammer.heading = Math.PI; // Heading West toward planet (Front facing West)
      const frontHitX = 350; // Hitting front barrier
      const frontHitY = 300;

      // Normal laser deflected
      const resNormal = jammer.takeDamage(30, frontHitX, frontHitY, false);
      expect(resNormal).toBe(false);
      expect(jammer.hp).toBe(90);

      // Overcharge Lance shatters barrier in one hit!
      jammer.takeDamage(40, frontHitX, frontHitY, true);
      expect(jammer.hp).toBe(50);
    });

    it('Capital & Elite ships should have rotating weak-spots that trigger 2.5x Critical Breach', () => {
      const boss = new Alien(400, 300, 'BOSS');
      const dread = new Alien(400, 300, 'DREADNOUGHT');
      const scout = new Alien(400, 300, 'SCOUT');

      expect(boss.hasWeakSpot).toBe(true);
      expect(dread.hasWeakSpot).toBe(true);
      expect(scout.hasWeakSpot).toBe(false);

      // Direct hit on weak-spot coordinates
      boss.weakSpotAngle = 0;
      boss.heading = 0;
      const wsDist = boss.radius * 0.85;
      const wsX = boss.x + wsDist;
      const wsY = boss.y;

      const startHp = boss.hp;
      // Overcharge Lance / Reflected Super-Missile hits weak-spot (canTriggerCrit = true)
      boss.takeDamage(100, wsX, wsY, true, null, true);

      // 100 * 2.5 = 250 damage taken!
      expect(boss.hp).toBe(startHp - 250);
      expect(boss.lastHitWasCrit).toBe(true);
      expect(boss.frozenTimer).toBeGreaterThanOrEqual(1.4); // 1.5s EMP stun
    });
  });

  describe('3. Mid-Mission Roguelike Tactical Command Draft', () => {
    it('TACTICAL_DRAFT_PERKS should contain 10 distinct perks with id, name, icon, desc', () => {
      expect(TACTICAL_DRAFT_PERKS.length).toBe(10);
      const expectedIds = [
        'splitNova', 'explosiveParry', 'overclockedBarrels', 'gravityWell',
        'cryoRounds', 'naniteSurge', 'wingmanOverdrive', 'chainMomentum',
        'volatileCores', 'bountyProtocol'
      ];
      expectedIds.forEach(id => {
        const perk = TACTICAL_DRAFT_PERKS.find(p => p.id === id);
        expect(perk).toBeDefined();
        expect(perk.name).toBeTruthy();
        expect(perk.icon).toBeTruthy();
        expect(perk.desc).toBeTruthy();
      });
    });

    it('triggerWaveDraft should pause wave and select 3 unique draft options', () => {
      engine.state = 'PLAYING';
      let modalCalled = false;
      let presentedOptions = null;
      let targetWave = 0;

      engine.onShowWaveDraftModal = (options, nextWave) => {
        modalCalled = true;
        presentedOptions = options;
        targetWave = nextWave;
      };

      engine.currentWave = 1;
      engine.triggerWaveDraft();

      expect(engine.waveDraftPending).toBe(true);
      expect(modalCalled).toBe(true);
      expect(presentedOptions.length).toBe(3);
      expect(targetWave).toBe(2);

      // Verify uniqueness
      const ids = presentedOptions.map(p => p.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('selectDraftPerk should add chosen perk and advance wave', () => {
      engine.state = 'PLAYING';
      engine.currentWave = 1;
      engine.totalWaves = 2;
      engine.triggerWaveDraft();

      const chosen = engine.currentDraftOptions[0];
      engine.selectDraftPerk(0);

      expect(engine.hasPerk(chosen.id)).toBe(true);
      expect(engine.waveDraftPending).toBe(false);
      expect(engine.currentWave).toBe(2);
    });

    it('Split-Nova perk should split into 4 homing mini-plasmas on nova launch', () => {
      engine.state = 'PLAYING';
      engine.novaCharges = 2;
      engine.activeDraftPerks = [{ id: 'splitNova', name: 'Split-Nova Catalyst' }];

      engine.triggerSparkNova(400, 200);

      const splitBolts = engine.projectiles.bolts.filter(b => b.source === 'nova');
      expect(splitBolts.length).toBe(4);
      expect(splitBolts[0].damage).toBe(45);
    });

    it('Emergency Nanite Surge perk should restore 40% Core HP & Shield on shield break', () => {
      engine.state = 'PLAYING';
      engine.activeDraftPerks = [{ id: 'naniteSurge', name: 'Emergency Nanite Surge' }];
      engine.planet.maxShield = 100;
      engine.planet.shield = 10;
      engine.planet.maxCoreHp = 100;
      engine.planet.coreHp = 20;

      // Break shield
      engine.planet.damage(25, 400, 300);

      expect(engine.naniteSurgeTriggered).toBe(true);
      expect(engine.planet.shield).toBe(40);
      expect(engine.planet.coreHp).toBe(45); // 20 + 40 - 15 (hit overflow)
    });
  });

  describe('4. Invasion Leech Pods & Warp Ambush Beacons', () => {
    it('ALIEN_CLASSES should define LEECH and BEACON with correct stats', () => {
      expect(ALIEN_CLASSES.LEECH).toBeDefined();
      expect(ALIEN_CLASSES.LEECH.speed).toBe(210);
      expect(ALIEN_CLASSES.LEECH.hp).toBe(45);

      expect(ALIEN_CLASSES.BEACON).toBeDefined();
      expect(ALIEN_CLASSES.BEACON.hp).toBe(85);
    });

    it('Leech Pod should fly toward surface cities, latch, and siphon Core HP directly', () => {
      const leech = new Alien(engine.planet.x + 120, engine.planet.y, 'LEECH');
      expect(leech.isLeech).toBe(true);
      expect(leech.latched).toBe(false);

      engine.planet.coreHp = 100;

      // Simulate movement until latched
      for (let i = 0; i < 60; i++) {
        leech.update(0.016, engine.planet.x, engine.planet.y, engine.planet.shieldRadius, null, null, engine.planet);
      }

      expect(leech.latched).toBe(true);
      // Siphoning Core HP directly
      expect(engine.planet.coreHp).toBeLessThan(100);
    });

    it('Warp Ambush Beacon defeat should trigger Elite Ambush Squadron with 2x rewards', () => {
      engine.state = 'PLAYING';
      const beacon = new Alien(engine.planet.x + 260, engine.planet.y, 'BEACON');
      engine.aliens.push(beacon);

      // Player destroys beacon
      beacon.takeDamage(100, beacon.x, beacon.y, true);
      engine.onAlienDestroyed(beacon);

      // Elite ambush squadron spawned
      const ambushShips = engine.aliens.filter(a => a.isAmbushReward);
      expect(ambushShips.length).toBeGreaterThanOrEqual(5);

      // Defeating ambush ship grants +30% Cataclysm (+ standard 3.5 base per kill)
      engine.coreCharge = 10;
      const ambushOne = ambushShips[0];
      ambushOne.takeDamage(100, ambushOne.x, ambushOne.y, true);
      engine.onAlienDestroyed(ambushOne);

      expect(engine.coreCharge).toBeCloseTo(43.5, 1);
    });
  });

  describe('5. Version Strings & UI Assets', () => {
    it('index.html should contain v2.8 Tactical Mastery badge and required HUD buttons', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toMatch(/⚡ v2\.[89] (TACTICAL MASTERY|SYNERGY OVERDRIVE) EDITION/);
      expect(html).toContain('id="btnParry"');
      expect(html).toContain('id="hudDraftPerks"');
      expect(html).toContain('id="modalWaveDraft"');
    });

    it('Battle Card should render v2.8 Tactical Mastery Edition badge', () => {
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
        const vBadge = fillTextCalls.find(c => c.text === "⚡ v2.8 TACTICAL MASTERY EDITION" || c.text === "⚡ v2.9 SYNERGY OVERDRIVE EDITION");
        expect(vBadge).toBeDefined();
        expect(vBadge.x).toBe(48);
        expect(vBadge.y).toBe(76);
      } finally {
        document.createElement = originalCreateElement;
      }
    });
  });
});
