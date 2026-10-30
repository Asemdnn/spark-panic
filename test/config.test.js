import { describe, it, expect } from 'vitest';
import { SECTORS, PLANETS, ALIEN_CLASSES, ARMORY_CONFIG, TROPHIES, GUARDIAN_RANKS, PENTATONIC_FREQS } from '../src/config.js';

describe('Configuration & Universe Data (v2.0)', () => {
  it('should define exactly 4 Cosmic Sectors spanning all 20 planets', () => {
    expect(SECTORS.length).toBe(4);
    expect(SECTORS[0].name).toContain('INNER SANCTUARIES');
    expect(SECTORS[1].name).toContain('NEBULA FRONTIER');
    expect(SECTORS[2].name).toContain('DARK RIFT');
    expect(SECTORS[3].name).toContain('SOL GENESIS');

    expect(SECTORS[0].range).toEqual([1, 5]);
    expect(SECTORS[1].range).toEqual([6, 10]);
    expect(SECTORS[2].range).toEqual([11, 15]);
    expect(SECTORS[3].range).toEqual([16, 20]);
  });

  it('should define all 20 unique planets with required visual attributes and boss stages', () => {
    expect(PLANETS.length).toBe(20);
    const expectedNames = [
      'Aerilon', 'Aquatis', 'Solaria', 'Verdantia', 'Cryon',
      'Pyros', 'Zephyria', 'Obsidian', 'Lumina', 'Vortexia',
      'Aethelgard', 'Chronos', 'Mycelia', 'Ferrum', 'Eclipse',
      'Hyperion', 'Astralis', 'Voidreach', 'Omega Prime', 'Genesis Core'
    ];

    PLANETS.forEach((planet, index) => {
      expect(planet.id).toBe(index + 1);
      expect(planet.name).toBe(expectedNames[index]);
      expect(planet.color1).toBeDefined();
      expect(planet.color2).toBeDefined();
      expect(planet.atmo).toBeDefined();
      expect(typeof planet.rings).toBe('boolean');
      expect(planet.waves).toBeGreaterThanOrEqual(2);
      expect(planet.baseEnemies).toBeGreaterThanOrEqual(10);
    });

    // Sector Boss checks
    expect(PLANETS[4].bossName).toBe('Dreadnought Vexor');
    expect(PLANETS[9].bossName).toBe('Mothership Kaelen');
    expect(PLANETS[14].bossName).toBe('Void Harbinger');
    expect(PLANETS[19].bossName).toBe('The Apex Leviathan');
  });

  it('should define 7 unique Alien Classes with exact combat stats and death payloads', () => {
    const keys = Object.keys(ALIEN_CLASSES);
    expect(keys).toEqual(['SCOUT', 'INTERCEPTOR', 'CRYO', 'PHASE', 'DROPSHIP', 'DREADNOUGHT', 'BOSS']);

    // Scout
    const scout = ALIEN_CLASSES.SCOUT;
    expect(scout.hp).toBe(22);
    expect(scout.speed).toBe(62);
    expect(scout.radius).toBe(12);
    expect(scout.score).toBe(25);
    expect(scout.damage).toBe(8);
    expect(scout.novaRadius).toBe(68);

    // Trident Interceptor
    const inter = ALIEN_CLASSES.INTERCEPTOR;
    expect(inter.hp).toBe(40);
    expect(inter.speed).toBe(48);
    expect(inter.radius).toBe(15);
    expect(inter.score).toBe(45);
    expect(inter.damage).toBe(12);
    expect(inter.deathPayload).toContain('QUAD PLASMA BURST');

    // Cryo-Cruiser
    const cryo = ALIEN_CLASSES.CRYO;
    expect(cryo.hp).toBe(48);
    expect(cryo.speed).toBe(42);
    expect(cryo.novaRadius).toBe(95);
    expect(cryo.deathPayload).toContain('CRYO STASIS FIELD');

    // Phase-Shifter
    const phase = ALIEN_CLASSES.PHASE;
    expect(phase.hp).toBe(38);
    expect(phase.speed).toBe(55);
    expect(phase.deathPayload).toContain('ECHO WARP NOVA');

    // Invasion Dropship
    const drop = ALIEN_CLASSES.DROPSHIP;
    expect(drop.hp).toBe(75);
    expect(drop.speed).toBe(34);
    expect(drop.radius).toBe(19);

    // Solar Dreadnought
    const dread = ALIEN_CLASSES.DREADNOUGHT;
    expect(dread.hp).toBe(135);
    expect(dread.radius).toBe(23);
    expect(dread.deathPayload).toContain('SOLAR SUPER-NOVA');

    // Sector Mothership Boss
    const boss = ALIEN_CLASSES.BOSS;
    expect(boss.hp).toBe(950);
    expect(boss.radius).toBe(40);
    expect(boss.score).toBe(800);
    expect(boss.novaRadius).toBe(210);
  });

  it('should define 6 Guardian Armory Tech Upgrades', () => {
    const keys = Object.keys(ARMORY_CONFIG);
    expect(keys).toEqual(['turretDmg', 'novaRadius', 'novaCharges', 'shieldGrid', 'satellites', 'tacticalCd']);

    keys.forEach(k => {
      const u = ARMORY_CONFIG[k];
      expect(u.name).toBeDefined();
      expect(u.baseCost).toBeGreaterThan(0);
      expect(u.costFactor).toBeGreaterThan(1);
      expect(u.maxLevel).toBeGreaterThanOrEqual(4);
    });
  });

  it('should define 7 Guardian Trophies with rewards', () => {
    expect(TROPHIES.length).toBe(7);
    TROPHIES.forEach(t => {
      expect(t.id).toBeDefined();
      expect(t.name).toBeDefined();
      expect(t.reward).toBeGreaterThanOrEqual(100);
    });
    expect(TROPHIES.some(t => t.id === 'TITAN_CONQUEROR')).toBe(true);
  });

  it('should define 6 Guardian Ranks from Cadet Guardian to Supreme Cosmic Guardian', () => {
    expect(GUARDIAN_RANKS.length).toBe(6);
    expect(GUARDIAN_RANKS[0].title).toBe('CADET GUARDIAN');
    expect(GUARDIAN_RANKS[5].title).toBe('SUPREME COSMIC GUARDIAN');
  });

  it('should define 12 Pentatonic Scale Frequencies for cascading chime reactions', () => {
    expect(PENTATONIC_FREQS.length).toBe(12);
    // Ascending pitch
    for (let i = 1; i < PENTATONIC_FREQS.length; i++) {
      expect(PENTATONIC_FREQS[i]).toBeGreaterThan(PENTATONIC_FREQS[i - 1]);
    }
  });
});
