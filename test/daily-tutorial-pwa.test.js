import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getDailyAnomalyConfig, DAILY_MUTATORS, SECTOR_HAZARDS, PLANETS } from '../src/config.js';
import { SaveSystem } from '../src/engine/storage.js';
import { Planet } from '../src/game/planet.js';

describe('v2.3 Galactic Operations & Polish Suite', () => {

  describe('Deterministic Daily Cosmic Anomaly Generator', () => {
    it('should define all 6 tactical daily mutators with required properties', () => {
      expect(DAILY_MUTATORS.length).toBe(6);
      const expectedIds = ['hyperCapacitor', 'swarmBlitz', 'supernovaChain', 'glassAegis', 'meteorStorm', 'bossRush'];
      DAILY_MUTATORS.forEach((m, idx) => {
        expect(m.id).toBe(expectedIds[idx]);
        expect(m.name).toBeDefined();
        expect(m.icon).toBeDefined();
        expect(m.color).toBeDefined();
        expect(m.desc).toBeDefined();
      });
    });

    it('should define 4 sector hazards', () => {
      expect(Object.keys(SECTOR_HAZARDS).length).toBe(4);
      for (let s = 1; s <= 4; s++) {
        expect(SECTOR_HAZARDS[s]).toBeDefined();
        expect(SECTOR_HAZARDS[s].name).toBeDefined();
        expect(SECTOR_HAZARDS[s].icon).toBeDefined();
        expect(SECTOR_HAZARDS[s].desc).toBeDefined();
      }
    });

    it('should produce identical deterministic anomaly config for the same date string', () => {
      const configA = getDailyAnomalyConfig('2026-10-26');
      const configB = getDailyAnomalyConfig('2026-10-26');

      expect(configA.dateKey).toBe('2026-10-26');
      expect(configA.planet.id).toBe(configB.planet.id);
      expect(configA.planet.name).toBe(configB.planet.name);
      expect(configA.hazardSector).toBe(configB.hazardSector);
      expect(configA.hazard.name).toBe(configB.hazard.name);
      expect(configA.mutators.length).toBe(2);
      expect(configA.mutators[0].id).toBe(configB.mutators[0].id);
      expect(configA.mutators[1].id).toBe(configB.mutators[1].id);
      // Ensure the 2 mutators are distinct
      expect(configA.mutators[0].id).not.toBe(configA.mutators[1].id);
    });

    it('should produce valid configs across varied calendar dates', () => {
      const dates = ['2026-01-01', '2026-05-15', '2026-11-20', '2027-02-28'];
      dates.forEach(d => {
        const cfg = getDailyAnomalyConfig(d);
        expect(cfg.dateKey).toBe(d);
        expect(cfg.planet).toBeDefined();
        expect(cfg.planet.id).toBeGreaterThanOrEqual(1);
        expect(cfg.planet.id).toBeLessThanOrEqual(20);
        expect(cfg.hazardSector).toBeGreaterThanOrEqual(1);
        expect(cfg.hazardSector).toBeLessThanOrEqual(4);
        expect(cfg.mutators.length).toBe(2);
        expect(cfg.mutators[0].id).not.toBe(cfg.mutators[1].id);
      });
    });
  });

  describe('Storage Subsystem: Tutorial & Daily Anomaly Persistence', () => {
    let storage;

    beforeEach(() => {
      // Clear localStorage mock
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      storage = new SaveSystem();
    });

    it('should initialize tutorial as uncompleted and award shards on completion', () => {
      expect(storage.isTutorialCompleted()).toBe(false);
      const initialShards = storage.data.shards;

      // Complete tutorial first time
      const rewarded = storage.completeTutorial();
      expect(rewarded).toBe(true);
      expect(storage.isTutorialCompleted()).toBe(true);
      expect(storage.data.shards).toBe(initialShards + 50);

      // Re-completing does not re-award shards
      const rewardedAgain = storage.completeTutorial();
      expect(rewardedAgain).toBe(false);
      expect(storage.data.shards).toBe(initialShards + 50);
    });

    it('should manage daily anomaly scores and first-clear +150 shards bonus', () => {
      const dateKey = '2026-10-26';
      expect(storage.getDailyBest(dateKey)).toBe(0);
      expect(storage.isDailyClaimed(dateKey)).toBe(false);

      const initialShards = storage.data.shards;

      // First clear
      const res1 = storage.recordDailyScore(dateKey, 45000);
      expect(res1.isFirstClearToday).toBe(true);
      expect(res1.bonusAwarded).toBe(150);
      expect(storage.getDailyBest(dateKey)).toBe(45000);
      expect(storage.isDailyClaimed(dateKey)).toBe(true);
      expect(storage.data.shards).toBe(initialShards + 150);

      // Second clear with higher score on same day
      const res2 = storage.recordDailyScore(dateKey, 62000);
      expect(res2.isFirstClearToday).toBe(false);
      expect(res2.bonusAwarded).toBe(0);
      expect(storage.getDailyBest(dateKey)).toBe(62000);
      expect(storage.data.shards).toBe(initialShards + 150);

      // Third clear with lower score
      const res3 = storage.recordDailyScore(dateKey, 30000);
      expect(storage.getDailyBest(dateKey)).toBe(62000);
    });
  });

  describe('Planet: Living Surface Cyber-Cities & Victory Fireworks', () => {
    it('should initialize 4 surface cyber-cities anchored around the planet horizon', () => {
      const planet = new Planet(400, 300, PLANETS[0]);
      expect(planet.surfaceCities).toBeDefined();
      expect(planet.surfaceCities.length).toBe(4);

      // Verify angles around the circle
      expect(planet.surfaceCities[0].angle).toBeCloseTo(0);
      expect(planet.surfaceCities[1].angle).toBeCloseTo(Math.PI * 0.5);
      expect(planet.surfaceCities[2].angle).toBeCloseTo(Math.PI);
      expect(planet.surfaceCities[3].angle).toBeCloseTo(Math.PI * 1.5);

      // Verify building spires
      planet.surfaceCities.forEach(city => {
        expect(city.spires.length).toBeGreaterThanOrEqual(3);
        city.spires.forEach(spire => {
          expect(spire.height).toBeGreaterThan(0);
          expect(spire.width).toBeGreaterThan(0);
        });
      });
    });

    it('should trigger celebratory fireworks and simulate bursts into particles', () => {
      const planet = new Planet(400, 300, PLANETS[0]);
      expect(planet.fireworks.length).toBe(0);

      planet.triggerVictoryFireworks();
      expect(planet.fireworks.length).toBeGreaterThanOrEqual(4);

      // Fast-forward simulation to allow launch shells to reach target and burst into sparks
      for (let i = 0; i < 6; i++) {
        planet.update(0.1);
      }

      // Check if particles have been spawned from bursting shells
      expect(planet.fireworkParticles.length).toBeGreaterThan(0);
    });
  });

  describe('PWA Manifest & Service Worker Structure', () => {
    it('should validate manifest.json format and essential PWA fields', () => {
      const manifestPath = path.resolve(__dirname, '../manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(content.name).toContain('Spark Panic');
      expect(content.short_name).toBe('Spark Panic');
      expect(content.display).toBe('standalone');
      expect(content.theme_color).toBe('#00e5ff');
      expect(content.background_color).toBe('#050814');
      expect(Array.isArray(content.icons)).toBe(true);
      expect(content.icons.length).toBeGreaterThan(0);
    });

    it('should validate sw.js existence and cache listeners', () => {
      const swPath = path.resolve(__dirname, '../sw.js');
      expect(fs.existsSync(swPath)).toBe(true);

      const content = fs.readFileSync(swPath, 'utf8');
      expect(content).toContain('install');
      expect(content).toContain('activate');
      expect(content).toContain('fetch');
      expect(content).toContain('spark-panic-v2.3');
    });

    it('should verify game-icon.jpg exists in assets directory', () => {
      const iconPath = path.resolve(__dirname, '../assets/game-icon.jpg');
      expect(fs.existsSync(iconPath)).toBe(true);
      const stat = fs.statSync(iconPath);
      expect(stat.size).toBeGreaterThan(1000);
    });
  });
});
