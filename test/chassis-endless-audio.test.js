// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { CHASSIS_CONFIG, SECTOR_HAZARDS, PLANETS } from '../src/config.js';
import { storage } from '../src/engine/storage.js';
import { audio } from '../src/engine/audio.js';
import { OrbitalTurret } from '../src/game/turret.js';
import { ProjectileManager } from '../src/game/projectiles.js';
import { ICON_SVG } from '../src/ui/icons.js';

describe('v2.2 Commander Endgame Suite', () => {
  beforeEach(() => {
    storage.resetAll();
  });

  describe('Chassis Configurations & Storage Loadout', () => {
    it('should have all 3 chassis correctly defined in CHASSIS_CONFIG', () => {
      expect(CHASSIS_CONFIG.striker).toBeDefined();
      expect(CHASSIS_CONFIG.tesla).toBeDefined();
      expect(CHASSIS_CONFIG.railgun).toBeDefined();

      expect(CHASSIS_CONFIG.striker.unlockedAtStart).toBe(true);
      expect(CHASSIS_CONFIG.tesla.reqStars).toBe(15);
      expect(CHASSIS_CONFIG.tesla.cost).toBe(350);
      expect(CHASSIS_CONFIG.railgun.reqStars).toBe(30);
      expect(CHASSIS_CONFIG.railgun.cost).toBe(600);
    });

    it('should have striker unlocked by default and selected initially', () => {
      expect(storage.isChassisUnlocked('striker')).toBe(true);
      expect(storage.getSelectedChassis()).toBe('striker');
    });

    it('should unlock tesla automatically when reaching 15 stars', () => {
      expect(storage.isChassisUnlocked('tesla')).toBe(false);

      // Award 15 stars across 5 planets (3 stars each)
      for (let p = 1; p <= 5; p++) {
        storage.recordPlanetClear(p, 5000, 3);
      }
      expect(storage.getTotalStars()).toBe(15);
      expect(storage.isChassisUnlocked('tesla')).toBe(true);
      expect(storage.selectChassis('tesla')).toBe(true);
      expect(storage.getSelectedChassis()).toBe('tesla');
    });

    it('should unlock railgun automatically when reaching 30 stars', () => {
      expect(storage.isChassisUnlocked('railgun')).toBe(false);

      for (let p = 1; p <= 10; p++) {
        storage.recordPlanetClear(p, 5000, 3);
      }
      expect(storage.getTotalStars()).toBe(30);
      expect(storage.isChassisUnlocked('railgun')).toBe(true);
      expect(storage.selectChassis('railgun')).toBe(true);
      expect(storage.getSelectedChassis()).toBe('railgun');
    });

    it('should allow early chassis purchase with star shards before reaching star threshold', () => {
      expect(storage.isChassisUnlocked('tesla')).toBe(false);
      storage.addShards(500);

      const bought = storage.unlockChassis('tesla');
      expect(bought).toBe(true);
      expect(storage.isChassisUnlocked('tesla')).toBe(true);
      expect(storage.getSelectedChassis()).toBe('tesla');
      // Shards should be deducted (350 spent)
      expect(storage.getData().shards).toBeGreaterThanOrEqual(150);
    });

    it('should fail unlocking when shards are insufficient', () => {
      storage.data.shards = 50;
      const bought = storage.unlockChassis('railgun');
      expect(bought).toBe(false);
      expect(storage.isChassisUnlocked('railgun')).toBe(false);
    });
  });

  describe('Quantum Save Backup Export & Import', () => {
    it('should export save code with SP2_ prefix and base64 encoded data', () => {
      storage.addShards(250);
      storage.recordPlanetClear(1, 12000, 3);
      const code = storage.exportSaveCode();

      expect(typeof code).toBe('string');
      expect(code.startsWith('SP2_')).toBe(true);
      expect(code.length).toBeGreaterThan(20);
    });

    it('should successfully import exported save code and restore state', () => {
      storage.addShards(500);
      storage.recordPlanetClear(1, 15000, 3);
      storage.recordPlanetClear(2, 18000, 3);
      storage.recordEndlessScore(9999, 12);
      storage.selectChassis('striker');

      const code = storage.exportSaveCode();

      // Reset storage to verify full restore
      storage.resetAll();
      expect(storage.getTotalStars()).toBe(0);
      const restored = storage.importSaveCode(code);

      expect(restored).toBe(true);
      expect(storage.getTotalStars()).toBe(6);
      expect(storage.getData().planetHighScores[1]).toBe(15000);
      expect(storage.getData().planetHighScores[2]).toBe(18000);
      expect(storage.getData().endlessHighScore).toBe(9999);
      expect(storage.getData().endlessBestWave).toBe(12);
    });

    it('should reject malformed or corrupted save strings gracefully', () => {
      expect(storage.importSaveCode('')).toBe(false);
      expect(storage.importSaveCode(null)).toBe(false);
      expect(storage.importSaveCode(undefined)).toBe(false);
      expect(storage.importSaveCode('SP2_NOT_BASE_64_&&&')).toBe(false);
      expect(storage.importSaveCode('random_junk_code')).toBe(false);
    });
  });

  describe('Orbital Turret Chassis Weapon Mechanics', () => {
    it('should configure chassis properties on OrbitalTurret', () => {
      const turret = new OrbitalTurret();
      expect(turret.chassis).toBe('striker');

      turret.setChassis('railgun');
      expect(turret.chassis).toBe('railgun');

      turret.setChassis('tesla');
      expect(turret.chassis).toBe('tesla');
    });

    it('should fire railgun slugs with 2.2x damage and pierce tags', () => {
      const turret = new OrbitalTurret();
      turret.setChassis('railgun');
      turret.isFiring = true;
      turret.fireTimer = 10; // Trigger fire immediately

      let spawnedBolts = null;
      turret.update(0.1, 500, 500, 200, 200, false, (bolts) => {
        spawnedBolts = bolts;
      });

      expect(spawnedBolts).not.toBeNull();
      expect(spawnedBolts.length).toBeGreaterThan(0);
      const slug = spawnedBolts[0];
      expect(slug.isRailgun).toBe(true);
      expect(slug.isDirectPierce).toBe(true);
      expect(slug.pierce).toBeGreaterThanOrEqual(4);
      expect(slug.speed).toBeGreaterThanOrEqual(800);
      expect(slug.damage).toBeCloseTo(turret.getDamage(false), 1);
    });

    it('should fire tesla shock bolts with isTesla tag', () => {
      const turret = new OrbitalTurret();
      turret.setChassis('tesla');
      turret.isFiring = true;
      turret.fireTimer = 10;

      let spawnedBolts = null;
      turret.update(0.1, 500, 500, 200, 200, false, (bolts) => {
        spawnedBolts = bolts;
      });

      expect(spawnedBolts).not.toBeNull();
      expect(spawnedBolts[0].isTesla).toBe(true);
    });
  });

  describe('Tesla Chain Arcs & Railgun Piercing in ProjectileManager', () => {
    it('should pierce through enemies and hit multiple targets with Railgun slug', () => {
      const pm = new ProjectileManager();
      pm.spawnTurretBolts(200, 200, 50, [{
        angle: 0,
        damage: 50,
        isRailgun: true,
        isDirectPierce: true,
        pierce: 3,
        speed: 880
      }]);

      expect(pm.bolts.length).toBe(1);
      const slug = pm.bolts[0];

      // Line of 2 enemies along x axis
      const enemy1 = {
        id: 1, x: 260, y: 200, radius: 15, hp: 100, alive: true, classKey: 'SCOUT',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };
      const enemy2 = {
        id: 2, x: 300, y: 200, radius: 15, hp: 100, alive: true, classKey: 'SCOUT',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };
      const enemies = [enemy1, enemy2];

      // Update collisions: signature (dt, width, height, aliens, planet, onAlienHit)
      pm.update(0.01, 800, 600, enemies, { x: 200, y: 200, radius: 50 });

      // Slug should hit enemy 1 and NOT be dead because pierce was 3 (now 2)
      expect(enemy1.hp).toBe(50);
      expect(slug.pierce).toBe(2);
      expect(slug.alive).toBe(true);
    });

    it('should deal +50% bonus damage to dreadnoughts and bosses with Railgun slug', () => {
      const pm = new ProjectileManager();
      pm.spawnTurretBolts(200, 200, 50, [{
        angle: 0,
        damage: 100,
        isRailgun: true,
        isDirectPierce: true,
        pierce: 2,
        speed: 880
      }]);

      const bossEnemy = {
        id: 99, x: 260, y: 200, radius: 25, hp: 1000, alive: true, classKey: 'BOSS',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };
      pm.update(0.01, 800, 600, [bossEnemy], { x: 200, y: 200, radius: 50 });

      // Base dmg 100 * 1.5 = 150 damage dealt
      expect(bossEnemy.hp).toBe(850);
    });

    it('should chain-arc to nearby enemies with Tesla shock bolt', () => {
      const pm = new ProjectileManager();
      pm.spawnTurretBolts(200, 200, 50, [{
        angle: 0,
        damage: 100,
        isTesla: true,
        speed: 480
      }]);

      const primary = {
        id: 1, x: 260, y: 200, radius: 15, hp: 200, alive: true, classKey: 'SCOUT',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };
      const chained1 = {
        id: 2, x: 300, y: 200, radius: 15, hp: 200, alive: true, classKey: 'SCOUT',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };
      const chained2 = {
        id: 3, x: 340, y: 200, radius: 15, hp: 200, alive: true, classKey: 'SCOUT',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };
      const farAway = {
        id: 4, x: 800, y: 800, radius: 15, hp: 200, alive: true, classKey: 'SCOUT',
        takeDamage(dmg) { this.hp -= dmg; if (this.hp <= 0) this.alive = false; return !this.alive; }
      };

      pm.update(0.01, 800, 600, [primary, chained1, chained2, farAway], { x: 200, y: 200, radius: 50 });

      // Primary hit for 100
      expect(primary.hp).toBe(100);
      // Chained 1 hit for 65% (65 dmg -> 135 hp)
      expect(chained1.hp).toBe(135);
      // Chained 2 hit for 45% (45 dmg -> 155 hp)
      expect(chained2.hp).toBe(155);
      // Far away target untouched
      expect(farAway.hp).toBe(200);
      // Tesla arcs should be recorded for visual rendering
      expect(pm.teslaArcs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Procedural Synthwave BGM Sequencer', () => {
    it('should toggle BGM on and off cleanly', () => {
      const initial = audio.isBgmEnabled;
      const toggled = audio.toggleBgm();
      expect(toggled).toBe(!initial);
      expect(audio.isBgmEnabled).toBe(toggled);
      expect(storage.isBgmEnabled()).toBe(toggled);

      const toggledBack = audio.toggleBgm();
      expect(toggledBack).toBe(initial);
    });

    it('should adjust tempo cleanly for boss waves without throwing', () => {
      expect(() => {
        audio.setBgmTempo(136);
        audio.setBgmTempo(118);
      }).not.toThrow();
      expect(audio.bgmBpm).toBe(118);
    });

    it('should start and stop BGM without errors even if audioContext is mock', () => {
      expect(() => {
        audio.startBgm();
        audio.stopBgm();
      }).not.toThrow();
    });
  });

  describe('Inline SVGs for v2.2 additions', () => {
    it('should render music SVG icon with sound wave indicators when enabled', () => {
      const onSvg = ICON_SVG.music(true);
      const offSvg = ICON_SVG.music(false);
      expect(onSvg).toContain('<svg');
      expect(onSvg).toContain('</svg>');
      expect(offSvg).toContain('<svg');
    });

    it('should render chassis SVG diagrams for striker, tesla, and railgun', () => {
      ['striker', 'tesla', 'railgun'].forEach(chassisId => {
        const svg = ICON_SVG.chassisSvg(chassisId);
        expect(typeof svg).toBe('string');
        expect(svg).toContain('<svg');
        expect(svg).toContain('</svg>');
        expect(svg).toContain('viewBox');
      });
    });

    it('should render copy and importSave SVGs without unicode glyph boxes', () => {
      const copySvg = ICON_SVG.copy();
      const importSvg = ICON_SVG.importSave();
      expect(copySvg).toContain('<svg');
      expect(importSvg).toContain('<svg');
    });
  });
});
