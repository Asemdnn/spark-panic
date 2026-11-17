// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PLANETS, SECTORS, DEFAULT_SETTINGS, getPlanetDisplayName } from '../src/config.js';
import { Planet } from '../src/game/planet.js';

// Binary JPEG dimension extractor for validating raw asset files on disk
function getJpegDimensions(buffer) {
  let offset = 2; // skip SOI (FF D8)
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) continue;
    const len = buffer.readUInt16BE(offset);
    if (
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    offset += len;
  }
  return null;
}

describe('Real Astronomical Planets & Exoplanets Overhaul Suite', () => {
  const expectedRealPlanets = [
    // Sector I: Inner Solar System
    { id: 1, name: 'Earth', classic: 'Aerilon', sector: 1, boss: null },
    { id: 2, name: 'Mars', classic: 'Aquatis', sector: 1, boss: null },
    { id: 3, name: 'Venus', classic: 'Solaria', sector: 1, boss: null },
    { id: 4, name: 'Mercury', classic: 'Verdantia', sector: 1, boss: null },
    { id: 5, name: 'Luna', classic: 'Cryon', sector: 1, boss: 'Dreadnought Vexor' },
    // Sector II: Outer Gas & Ice Giants
    { id: 6, name: 'Jupiter', classic: 'Pyros', sector: 2, boss: null },
    { id: 7, name: 'Saturn', classic: 'Zephyria', sector: 2, boss: null },
    { id: 8, name: 'Uranus', classic: 'Obsidian', sector: 2, boss: null },
    { id: 9, name: 'Neptune', classic: 'Lumina', sector: 2, boss: null },
    { id: 10, name: 'Pluto', classic: 'Vortexia', sector: 2, boss: 'Mothership Kaelen' },
    // Sector III: Deep Moons & Ocean Worlds
    { id: 11, name: 'Europa', classic: 'Aethelgard', sector: 3, boss: null },
    { id: 12, name: 'Titan', classic: 'Chronos', sector: 3, boss: null },
    { id: 13, name: 'Io', classic: 'Mycelia', sector: 3, boss: null },
    { id: 14, name: 'Enceladus', classic: 'Ferrum', sector: 3, boss: null },
    { id: 15, name: 'Ceres', classic: 'Eclipse', sector: 3, boss: 'Void Harbinger' },
    // Sector IV: Real Habitable Exoplanets
    { id: 16, name: 'Proxima Centauri b', classic: 'Hyperion', sector: 4, boss: null },
    { id: 17, name: 'TRAPPIST-1e', classic: 'Astralis', sector: 4, boss: null },
    { id: 18, name: 'Kepler-452b', classic: 'Voidreach', sector: 4, boss: null },
    { id: 19, name: '55 Cancri e', classic: 'Omega Prime', sector: 4, boss: null },
    { id: 20, name: 'Kepler-22b', classic: 'Genesis Core', sector: 4, boss: 'The Apex Leviathan' }
  ];

  describe('1. Astronomical Data & Planetary Integrity', () => {
    it('should define exactly 20 planets spanning Sectors 1 through 4', () => {
      expect(PLANETS.length).toBe(20);
      expect(SECTORS.length).toBe(4);

      SECTORS.forEach((sec, idx) => {
        expect(sec.id).toBe(idx + 1);
        expect(sec.range[1] - sec.range[0] + 1).toBe(5);
      });
    });

    it('should configure all 20 planets with authentic real astronomical data fields', () => {
      PLANETS.forEach((planet, idx) => {
        const expected = expectedRealPlanets[idx];
        expect(planet.id).toBe(expected.id);
        expect(planet.name).toBe(expected.name);
        expect(planet.realName).toBe(expected.name);
        expect(planet.classicName).toBe(expected.classic);
        expect(planet.sector).toBe(expected.sector);

        // Required astronomical metadata
        expect(planet.title).toBeDefined();
        expect(typeof planet.title).toBe('string');
        expect(planet.title.length).toBeGreaterThan(3);

        expect(planet.astronomicalType).toBeDefined();
        expect(typeof planet.astronomicalType).toBe('string');
        expect(planet.astronomicalType.length).toBeGreaterThan(3);

        expect(planet.realDistance).toBeDefined();
        expect(typeof planet.realDistance).toBe('string');
        expect(planet.realDistance.length).toBeGreaterThan(2);

        expect(planet.surfaceGravity).toBeDefined();
        expect(typeof planet.surfaceGravity).toBe('string');
        expect(planet.surfaceGravity).toMatch(/m\/s²|g/);

        expect(planet.realFact).toBeDefined();
        expect(typeof planet.realFact).toBe('string');
        expect(planet.realFact.length).toBeGreaterThan(20);

        expect(planet.desc).toBeDefined();
        expect(typeof planet.desc).toBe('string');
        expect(planet.desc.length).toBeGreaterThan(15);

        // Visual and combat attributes
        expect(planet.color1).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(planet.color2).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(planet.atmo).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(typeof planet.rings).toBe('boolean');
        expect(planet.waves).toBeGreaterThanOrEqual(2);
        expect(planet.baseEnemies).toBeGreaterThanOrEqual(10);
      });
    });

    it('should correctly mark rings for gas/ice giants and special exoplanets', () => {
      const ringedPlanets = PLANETS.filter(p => p.rings).map(p => p.name);
      expect(ringedPlanets).toContain('Jupiter');
      expect(ringedPlanets).toContain('Saturn');
      expect(ringedPlanets).toContain('Uranus');
      expect(ringedPlanets).toContain('Neptune');
      expect(ringedPlanets).toContain('Kepler-22b');

      const nonRinged = PLANETS.filter(p => !p.rings).map(p => p.name);
      expect(nonRinged).toContain('Earth');
      expect(nonRinged).toContain('Mars');
      expect(nonRinged).toContain('Luna');
      expect(nonRinged).toContain('Europa');
    });
  });

  describe('2. Sector Boss Stages Preservation', () => {
    it('should preserve all 4 sector climax boss encounters at exact planet checkpoints', () => {
      // Planet 5: Sector I Climax
      expect(PLANETS[4].id).toBe(5);
      expect(PLANETS[4].name).toBe('Luna');
      expect(PLANETS[4].classicName).toBe('Cryon');
      expect(PLANETS[4].bossName).toBe('Dreadnought Vexor');

      // Planet 10: Sector II Climax
      expect(PLANETS[9].id).toBe(10);
      expect(PLANETS[9].name).toBe('Pluto');
      expect(PLANETS[9].classicName).toBe('Vortexia');
      expect(PLANETS[9].bossName).toBe('Mothership Kaelen');

      // Planet 15: Sector III Climax
      expect(PLANETS[14].id).toBe(15);
      expect(PLANETS[14].name).toBe('Ceres');
      expect(PLANETS[14].classicName).toBe('Eclipse');
      expect(PLANETS[14].bossName).toBe('Void Harbinger');

      // Planet 20: Sector IV Grand Finale
      expect(PLANETS[19].id).toBe(20);
      expect(PLANETS[19].name).toBe('Kepler-22b');
      expect(PLANETS[19].classicName).toBe('Genesis Core');
      expect(PLANETS[19].bossName).toBe('The Apex Leviathan');

      // Verify all non-boss planets have bossName === null
      const nonBosses = PLANETS.filter(p => ![5, 10, 15, 20].includes(p.id));
      expect(nonBosses.length).toBe(16);
      nonBosses.forEach(p => {
        expect(p.bossName).toBeNull();
      });
    });
  });

  describe('3. Celestial System Naming Formatter (real, classic, both)', () => {
    it('should default settings to planetNaming: "real"', () => {
      expect(DEFAULT_SETTINGS.planetNaming).toBe('real');
    });

    it('should format names in "real" mode', () => {
      expect(getPlanetDisplayName(PLANETS[0], 'real')).toBe('Earth');
      expect(getPlanetDisplayName(PLANETS[1], 'real')).toBe('Mars');
      expect(getPlanetDisplayName(PLANETS[5], 'real')).toBe('Jupiter');
      expect(getPlanetDisplayName(PLANETS[19], 'real')).toBe('Kepler-22b');
    });

    it('should format names in "classic" mode', () => {
      expect(getPlanetDisplayName(PLANETS[0], 'classic')).toBe('Aerilon');
      expect(getPlanetDisplayName(PLANETS[1], 'classic')).toBe('Aquatis');
      expect(getPlanetDisplayName(PLANETS[5], 'classic')).toBe('Pyros');
      expect(getPlanetDisplayName(PLANETS[19], 'classic')).toBe('Genesis Core');
    });

    it('should format names in "both" mode with bracketed classic name', () => {
      expect(getPlanetDisplayName(PLANETS[0], 'both')).toBe('Earth [Aerilon]');
      expect(getPlanetDisplayName(PLANETS[1], 'both')).toBe('Mars [Aquatis]');
      expect(getPlanetDisplayName(PLANETS[5], 'both')).toBe('Jupiter [Pyros]');
      expect(getPlanetDisplayName(PLANETS[19], 'both')).toBe('Kepler-22b [Genesis Core]');
    });

    it('should gracefully handle omitted styles and fallback edge cases', () => {
      // Default style is 'real'
      expect(getPlanetDisplayName(PLANETS[0])).toBe('Earth');

      // Null or undefined planet object
      expect(getPlanetDisplayName(null)).toBe('');
      expect(getPlanetDisplayName(undefined)).toBe('');

      // Object without classicName
      expect(getPlanetDisplayName({ name: 'AlphaCentauri' }, 'both')).toBe('AlphaCentauri');
      expect(getPlanetDisplayName({ realName: 'Sol', classicName: 'Sol' }, 'both')).toBe('Sol');
    });
  });

  describe('4. Planet.loadTexture Dual-Naming & Cross-Resolution', () => {
    let mockCanvas;
    let planet;

    beforeEach(() => {
      Planet.clearTextureCache();
      mockCanvas = { width: 800, height: 600 };
      planet = new Planet(mockCanvas);
    });

    it('should resolve texture by real astronomical slugs without error', () => {
      const realSlugs = [
        'earth', 'mars', 'venus', 'mercury', 'luna',
        'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
        'europa', 'titan', 'io', 'enceladus', 'ceres',
        'proxima-b', 'trappist-1e', 'kepler-452b', '55-cancri-e', 'kepler-22b'
      ];

      realSlugs.forEach(slug => {
        const img = planet.loadTexture(slug);
        expect(img).toBeDefined();
        expect(img).not.toBeNull();
      });
    });

    it('should resolve texture by classic legacy slugs without error', () => {
      const classicSlugs = [
        'aerilon', 'aquatis', 'solaria', 'verdantia', 'cryon',
        'pyros', 'zephyria', 'obsidian', 'lumina', 'vortexia',
        'aethelgard', 'chronos', 'mycelia', 'ferrum', 'eclipse',
        'hyperion', 'astralis', 'voidreach', 'omega-prime', 'genesis'
      ];

      classicSlugs.forEach(slug => {
        const img = planet.loadTexture(slug);
        expect(img).toBeDefined();
        expect(img).not.toBeNull();
      });
    });

    it('should resolve texture by numeric planet ID (1..20)', () => {
      for (let id = 1; id <= 20; id++) {
        const img = planet.loadTexture(id);
        expect(img).toBeDefined();
        expect(img).not.toBeNull();
      }
    });

    it('should resolve texture by planet config object and cross-cache aliases', () => {
      PLANETS.forEach(cfg => {
        const img = planet.loadTexture(cfg);
        expect(img).toBeDefined();
        expect(img).not.toBeNull();
      });

      // Confirm cross-caching: loading 'earth' makes 'aerilon' share the same image record
      Planet.clearTextureCache();
      const imgEarth = planet.loadTexture('earth');
      const imgAerilon = planet.loadTexture('aerilon');
      expect(imgEarth).toBe(imgAerilon);
    });

    it('should preload all 20 planets via Planet.preloadAll without throwing', () => {
      Planet.clearTextureCache();
      expect(() => Planet.preloadAll(PLANETS)).not.toThrow();
      expect(Planet.textureCache.size).toBeGreaterThan(0);
    });
  });

  describe('5. Planet Texture Asset Files & 1024x1024 Resolution', () => {
    const realAssetSlugs = [
      'earth', 'mars', 'venus', 'mercury', 'luna',
      'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
      'europa', 'titan', 'io', 'enceladus', 'ceres',
      'proxima-b', 'trappist-1e', 'kepler-452b', '55-cancri-e', 'kepler-22b'
    ];

    const classicAssetSlugs = [
      'aerilon', 'aquatis', 'solaria', 'verdantia', 'cryon',
      'pyros', 'zephyria', 'obsidian', 'lumina', 'vortexia',
      'aethelgard', 'chronos', 'mycelia', 'ferrum', 'eclipse',
      'hyperion', 'astralis', 'voidreach', 'omega-prime', 'genesis'
    ];

    const targetDirs = [
      path.resolve(process.cwd(), 'src/assets/planets'),
      path.resolve(process.cwd(), 'public/assets/planets')
    ];

    targetDirs.forEach(dir => {
      const dirName = path.basename(path.dirname(dir)) + '/' + path.basename(dir);

      it(`should contain all 20 real planet textures in ${dirName} with exact 1024x1024 dimensions`, () => {
        expect(fs.existsSync(dir)).toBe(true);

        realAssetSlugs.forEach(slug => {
          const filePath = path.join(dir, `${slug}.jpg`);
          expect(fs.existsSync(filePath), `Missing asset: ${filePath}`).toBe(true);

          const stat = fs.statSync(filePath);
          expect(stat.size).toBeGreaterThan(20000); // Valid compressed JPEG size > 20KB

          const buffer = fs.readFileSync(filePath);
          const dims = getJpegDimensions(buffer);
          expect(dims, `Could not parse JPEG dimensions for ${slug}.jpg`).not.toBeNull();
          expect(dims.width).toBe(1024);
          expect(dims.height).toBe(1024);
        });
      });

      it(`should contain all 20 classic alias textures in ${dirName} with exact 1024x1024 dimensions`, () => {
        classicAssetSlugs.forEach(slug => {
          const filePath = path.join(dir, `${slug}.jpg`);
          expect(fs.existsSync(filePath), `Missing asset: ${filePath}`).toBe(true);

          const stat = fs.statSync(filePath);
          expect(stat.size).toBeGreaterThan(20000);

          const buffer = fs.readFileSync(filePath);
          const dims = getJpegDimensions(buffer);
          expect(dims, `Could not parse JPEG dimensions for ${slug}.jpg`).not.toBeNull();
          expect(dims.width).toBe(1024);
          expect(dims.height).toBe(1024);
        });
      });
    });
  });
});
