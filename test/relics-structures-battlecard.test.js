// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { COSMIC_RELICS, STRUCTURE_CONFIG, DEFAULT_SETTINGS } from '../src/config.js';
import { SaveSystem } from '../src/engine/storage.js';
import { DeployableStructure, StructureManager } from '../src/game/structures.js';
import { BattleCardGenerator } from '../src/ui/battle-card.js';

describe('v2.5 Commander\'s Ultimate Edition Suite', () => {
  let save;

  beforeEach(() => {
    localStorage.clear();
    save = new SaveSystem();
  });

  describe('Ancient Cosmic Relics System', () => {
    it('should define all 8 unique cosmic relics in config', () => {
      const keys = Object.keys(COSMIC_RELICS);
      expect(keys.length).toBe(8);
      const expectedRelics = [
        'chronoStasis', 'vampiricCore', 'singularityLens', 'twinWingman',
        'overchargedCoil', 'aegisMirror', 'starlightSynth', 'supernovaEcho'
      ];
      for (const id of expectedRelics) {
        expect(COSMIC_RELICS[id]).toBeDefined();
        expect(COSMIC_RELICS[id].name).toBeTruthy();
        expect(COSMIC_RELICS[id].icon).toBeTruthy();
        expect(COSMIC_RELICS[id].desc).toBeTruthy();
      }
    });

    it('should manage relic unlocks correctly', () => {
      expect(save.isRelicUnlocked('chronoStasis')).toBe(false);
      // Give enough shards to purchase
      save.addShards(500);
      const unlocked = save.unlockRelic('chronoStasis');
      expect(unlocked).toBe(true);
      expect(save.isRelicUnlocked('chronoStasis')).toBe(true);
    });

    it('should enforce 3-slot maximum loadout for equipping relics', () => {
      save.unlockRelic('chronoStasis', true);
      save.unlockRelic('vampiricCore', true);
      save.unlockRelic('singularityLens', true);
      save.unlockRelic('twinWingman', true);

      expect(save.equipRelic('chronoStasis')).toBe(true);
      expect(save.equipRelic('vampiricCore')).toBe(true);
      expect(save.equipRelic('singularityLens')).toBe(true);
      // 4th equip should be rejected
      expect(save.equipRelic('twinWingman')).toBe(false);

      expect(save.getEquippedRelics().length).toBe(3);
      expect(save.isRelicEquipped('chronoStasis')).toBe(true);
      expect(save.isRelicEquipped('twinWingman')).toBe(false);

      // Unequip allows slot opening
      save.unequipRelic('chronoStasis');
      expect(save.getEquippedRelics().length).toBe(2);
      expect(save.equipRelic('twinWingman')).toBe(true);
      expect(save.getEquippedRelics().length).toBe(3);
    });

    it('should unlock a random unowned relic on unlockRandomRelic()', () => {
      // Initially no relics unlocked
      const res1 = save.unlockRandomRelic();
      expect(res1.unlocked).toBe(true);
      expect(res1.relic).toBeDefined();
      expect(save.isRelicUnlocked(res1.relic.id)).toBe(true);

      // Unlock all relics
      for (const id of Object.keys(COSMIC_RELICS)) {
        save.unlockRelic(id, true);
      }
      const resAll = save.unlockRandomRelic();
      expect(resAll.unlocked).toBe(false);
      expect(resAll.allUnlocked).toBe(true);
    });

    it('should persist equipped and unlocked relics through export and import', () => {
      save.unlockRelic('aegisMirror', true);
      save.unlockRelic('overchargedCoil', true);
      save.equipRelic('aegisMirror');
      save.equipRelic('overchargedCoil');

      const code = save.exportSaveCode();
      const newSave = new SaveSystem();
      const success = newSave.importSaveCode(code);

      expect(success).toBe(true);
      expect(newSave.isRelicUnlocked('aegisMirror')).toBe(true);
      expect(newSave.isRelicEquipped('aegisMirror')).toBe(true);
      expect(newSave.isRelicEquipped('overchargedCoil')).toBe(true);
    });
  });

  describe('Deployable Orbital Defense Structures', () => {
    it('should configure deployable structures correctly', () => {
      expect(STRUCTURE_CONFIG.cooldown).toBe(16.0);
      expect(STRUCTURE_CONFIG.duration).toBe(14.0);
      expect(STRUCTURE_CONFIG.maxActive).toBe(2);
      expect(STRUCTURE_CONFIG.types.pylon).toBeDefined();
      expect(STRUCTURE_CONFIG.types.anchor).toBeDefined();
      expect(STRUCTURE_CONFIG.types.battery).toBeDefined();
    });

    it('should adapt deployed structure type based on active turret chassis', () => {
      const mockEngineStriker = {
        planet: { x: 400, y: 300, shieldRadius: 90, planetRadius: 75 },
        turret: { chassisId: 'striker' },
        skills: { cooldownReduction: 0 }
      };
      const smStriker = new StructureManager(mockEngineStriker);
      const s1 = smStriker.deploy(0);
      expect(s1).toBeDefined();
      expect(s1.type).toBe('pylon');

      const mockEngineTesla = {
        planet: { x: 400, y: 300, shieldRadius: 90, planetRadius: 75 },
        turret: { chassisId: 'tesla' },
        skills: { cooldownReduction: 0 }
      };
      const smTesla = new StructureManager(mockEngineTesla);
      const s2 = smTesla.deploy(Math.PI / 2);
      expect(s2).toBeDefined();
      expect(s2.type).toBe('anchor');

      const mockEngineRailgun = {
        planet: { x: 400, y: 300, shieldRadius: 90, planetRadius: 75 },
        turret: { chassisId: 'railgun' },
        skills: { cooldownReduction: 0 }
      };
      const smRailgun = new StructureManager(mockEngineRailgun);
      const s3 = smRailgun.deploy(Math.PI);
      expect(s3).toBeDefined();
      expect(s3.type).toBe('battery');
    });

    it('should enforce structure cooldown and cap at max active structures', () => {
      const mockEngine = {
        planet: { x: 400, y: 300, shieldRadius: 90, planetRadius: 75 },
        turret: { chassisId: 'striker' },
        skills: { cooldownReduction: 0.50 } // Reduces cooldown to 8s (duration is 14s)
      };
      const sm = new StructureManager(mockEngine);
      const s1 = sm.deploy(0);
      expect(s1).toBeDefined();
      expect(sm.canDeploy()).toBe(false);

      // Attempt immediate deployment while on cooldown
      const s2 = sm.deploy(1);
      expect(s2).toBeNull();

      // Fast forward past 8s cooldown while s1 is still alive (life: 14 - 8.5 = 5.5s)
      sm.update(8.5);
      expect(sm.canDeploy()).toBe(true);

      const s3 = sm.deploy(Math.PI);
      expect(s3).toBeDefined();
      expect(sm.structures.length).toBe(2);

      // Deploy another while both are present: should cap at maxActive (2)
      sm.cooldownTimer = 0;
      const s4 = sm.deploy(Math.PI / 2);
      expect(s4).toBeDefined();
      expect(sm.structures.length).toBe(2);
    });

    it('should refract player turret lasers passing through Solar Prism Pylons', () => {
      const mockEngine = {
        planet: { x: 400, y: 300, shieldRadius: 90, planetRadius: 75 },
        turret: { chassisId: 'striker' },
        skills: { cooldownReduction: 0 },
        projectiles: {
          bolts: [],
          addPlasmaBolt: (b) => mockEngine.projectiles.bolts.push(b)
        }
      };
      const sm = new StructureManager(mockEngine);
      const pylon = sm.deploy(0);
      expect(pylon.type).toBe('pylon');

      // Create a bullet passing through pylon's position
      const bullet = {
        x: pylon.x,
        y: pylon.y,
        angle: 0,
        damage: 100,
        speed: 520,
        refracted: false
      };

      sm.checkRefractPylons(bullet);
      expect(bullet.refracted).toBe(true);
      expect(bullet.damage).toBe(130); // +30% damage
      expect(mockEngine.projectiles.bolts.length).toBe(2); // 2 refracted fan beams
    });
  });

  describe('Tactical System Settings', () => {
    it('should load default settings correctly', () => {
      const s = save.getSettings();
      expect(s.screenShake).toBe(100);
      expect(s.particleDensity).toBe('high');
      expect(s.threatRings).toBe(true);
      expect(s.floatingText).toBe('all');
    });

    it('should update settings and persist them', () => {
      save.updateSettings({
        screenShake: 50,
        particleDensity: 'low',
        threatRings: false,
        floatingText: 'combos'
      });
      const updated = save.getSettings();
      expect(updated.screenShake).toBe(50);
      expect(updated.particleDensity).toBe('low');
      expect(updated.threatRings).toBe(false);
      expect(updated.floatingText).toBe('combos');
    });
  });

  describe('Shareable Commander Battle Card Generator', () => {
    it('should render a 1200x630 offscreen battle card canvas', () => {
      const mockEngine = {
        score: 12500,
        maxCombo: 12,
        currentWave: 3,
        currentPlanetId: 1,
        enemiesVaporized: 45,
        missionTimer: 68,
        planet: { coreHp: 100, maxCoreHp: 100, shield: 80, maxShield: 100 },
        turret: { chassisId: 'striker', skinId: 'default' },
        telemetryHistory: [
          { time: 10, wave: 1, combo: 2, integrity: 95 },
          { time: 30, wave: 2, combo: 6, integrity: 88 },
          { time: 60, wave: 3, combo: 12, integrity: 82 }
        ],
        damageSources: { turret: 500, nova: 300, wingman: 200 }
      };

      const canvas = BattleCardGenerator.renderCard(mockEngine, save);
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(630);
    });

    it('should fallback to clipboard text formatting if image blob unavailable', async () => {
      const mockCanvas = {
        toBlob: (cb) => cb(null),
        toDataURL: () => 'data:image/png;base64,mock'
      };
      const mockEngine = {
        score: 9999,
        maxCombo: 10,
        currentWave: 2
      };

      const res = await BattleCardGenerator.copyCardToClipboard(mockCanvas, mockEngine);
      expect(typeof res).toBe('string');
    });
  });
});
