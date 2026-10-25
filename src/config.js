// Spark Panic: Planetary Invasion Defense 2.0 - Configuration & Universe Data

export const SECTORS = [
  {
    id: 1,
    name: 'SECTOR I: INNER SANCTUARIES',
    shortName: 'SECTOR I',
    themeColor: '#00e5ff',
    range: [1, 5],
    bossStage: 5
  },
  {
    id: 2,
    name: 'SECTOR II: NEBULA FRONTIER',
    shortName: 'SECTOR II',
    themeColor: '#e040fb',
    range: [6, 10],
    bossStage: 10
  },
  {
    id: 3,
    name: 'SECTOR III: DARK RIFT',
    shortName: 'SECTOR III',
    themeColor: '#ffd700',
    range: [11, 15],
    bossStage: 15
  },
  {
    id: 4,
    name: 'SECTOR IV: SOL GENESIS',
    shortName: 'SECTOR IV',
    themeColor: '#ff3366',
    range: [16, 20],
    bossStage: 20
  }
];

export const PLANETS = [
  // SECTOR I: INNER SANCTUARIES
  {
    id: 1,
    name: 'Aerilon',
    title: 'Terran Haven',
    sector: 1,
    color1: '#0ea5e9',
    color2: '#10b981',
    atmo: '#38bdf8',
    rings: false,
    waves: 2,
    baseEnemies: 12,
    bossName: null,
    desc: 'Lush terrestrial cradle under attack by Vanguard Recon Scout fleets.'
  },
  {
    id: 2,
    name: 'Aquatis',
    title: 'Pelagic Sphere',
    sector: 1,
    color1: '#0284c7',
    color2: '#06b6d4',
    atmo: '#00e5ff',
    rings: false,
    waves: 2,
    baseEnemies: 15,
    bossName: null,
    desc: 'Bioluminescent oceanic sanctuary threatened by mid-range Trident Interceptors.'
  },
  {
    id: 3,
    name: 'Solaria',
    title: 'Helios Dunes',
    sector: 1,
    color1: '#d97706',
    color2: '#f59e0b',
    atmo: '#fbbf24',
    rings: true,
    waves: 3,
    baseEnemies: 18,
    bossName: null,
    desc: 'Ringed desert super-forge besieged by heavy armored siege dropships.'
  },
  {
    id: 4,
    name: 'Verdantia',
    title: 'Bio-Jungle',
    sector: 1,
    color1: '#059669',
    color2: '#84cc16',
    atmo: '#34d399',
    rings: false,
    waves: 3,
    baseEnemies: 22,
    bossName: null,
    desc: 'Dense bioluminescent forest world facing multi-vector swarm incursions.'
  },
  {
    id: 5,
    name: 'Cryon',
    title: 'Glacial Bastion',
    sector: 1,
    color1: '#38bdf8',
    color2: '#e0f2fe',
    atmo: '#7dd3fc',
    rings: true,
    waves: 3,
    baseEnemies: 26,
    bossName: 'Dreadnought Vexor',
    desc: 'Frozen outer bastion defended against Flagship Dreadnought Vexor!'
  },

  // SECTOR II: NEBULA FRONTIER
  {
    id: 6,
    name: 'Pyros',
    title: 'Magma Core',
    sector: 2,
    color1: '#dc2626',
    color2: '#f97316',
    atmo: '#fb923c',
    rings: false,
    waves: 3,
    baseEnemies: 24,
    bossName: null,
    desc: 'Volcanic super-heated world with turbulent plasma invasions.'
  },
  {
    id: 7,
    name: 'Zephyria',
    title: 'Aether Giant',
    sector: 2,
    color1: '#0891b2',
    color2: '#a855f7',
    atmo: '#c084fc',
    rings: true,
    waves: 3,
    baseEnemies: 28,
    bossName: null,
    desc: 'Massive swirling gas giant encircled by crystalline particle rings.'
  },
  {
    id: 8,
    name: 'Obsidian',
    title: 'Null Crystal',
    sector: 2,
    color1: '#312e81',
    color2: '#6366f1',
    atmo: '#818cf8',
    rings: false,
    waves: 3,
    baseEnemies: 30,
    bossName: null,
    desc: 'Dark matter crystalline sphere where quantum Phase-Shifter ships blink through space.'
  },
  {
    id: 9,
    name: 'Lumina',
    title: 'Prism Star-World',
    sector: 2,
    color1: '#db2777',
    color2: '#f472b6',
    atmo: '#f9a8d4',
    rings: true,
    waves: 3,
    baseEnemies: 34,
    bossName: null,
    desc: 'Luminous world reflecting stellar radiation through radiant atmospheric halos.'
  },
  {
    id: 10,
    name: 'Vortexia',
    title: 'Gravity Well',
    sector: 2,
    color1: '#7c3aed',
    color2: '#ec4899',
    atmo: '#e879f9',
    rings: true,
    waves: 4,
    baseEnemies: 38,
    bossName: 'Mothership Kaelen',
    desc: 'Gravitational anomaly where Sector Mothership Kaelen launches orbital siege attacks.'
  },

  // SECTOR III: DARK RIFT
  {
    id: 11,
    name: 'Aethelgard',
    title: 'Relic Citadel',
    sector: 3,
    color1: '#ca8a04',
    color2: '#14b8a6',
    atmo: '#fde047',
    rings: true,
    waves: 3,
    baseEnemies: 36,
    bossName: null,
    desc: 'Ancient cosmic monument world besieged by relentless alien fleets.'
  },
  {
    id: 12,
    name: 'Chronos',
    title: 'Temporal Sphere',
    sector: 3,
    color1: '#0d9488',
    color2: '#fbbf24',
    atmo: '#2dd4bf',
    rings: false,
    waves: 3,
    baseEnemies: 40,
    bossName: null,
    desc: 'Anomalous world wrapped in temporal stasis waves and heavy cruiser assaults.'
  },
  {
    id: 13,
    name: 'Mycelia',
    title: 'Spore Nebula',
    sector: 3,
    color1: '#16a34a',
    color2: '#a855f7',
    atmo: '#4ade80',
    rings: false,
    waves: 4,
    baseEnemies: 44,
    bossName: null,
    desc: 'Bio-luminescent spore planet under siege by fast assault dropships.'
  },
  {
    id: 14,
    name: 'Ferrum',
    title: 'Forge Mech-World',
    sector: 3,
    color1: '#475569',
    color2: '#f97316',
    atmo: '#fb923c',
    rings: true,
    waves: 4,
    baseEnemies: 48,
    bossName: null,
    desc: 'Armored titanium fortress world with industrial defense batteries.'
  },
  {
    id: 15,
    name: 'Eclipse',
    title: 'Shadow Corona',
    sector: 3,
    color1: '#1e1b4b',
    color2: '#f43f5e',
    atmo: '#fb7185',
    rings: true,
    waves: 4,
    baseEnemies: 52,
    bossName: 'Void Harbinger',
    desc: 'Tomb world at the edge of the void where Flagship Void Harbinger reigns.'
  },

  // SECTOR IV: SOL GENESIS
  {
    id: 16,
    name: 'Hyperion',
    title: 'Helios Core',
    sector: 4,
    color1: '#ea580c',
    color2: '#fde047',
    atmo: '#fef08a',
    rings: true,
    waves: 4,
    baseEnemies: 50,
    bossName: null,
    desc: 'Blazing solar paradise encircled by coronal energy rings.'
  },
  {
    id: 17,
    name: 'Astralis',
    title: 'Starlight Sanctum',
    sector: 4,
    color1: '#2563eb',
    color2: '#38bdf8',
    atmo: '#93c5fd',
    rings: false,
    waves: 4,
    baseEnemies: 55,
    bossName: null,
    desc: 'Deep cosmic haven radiating concentrated starlight defense grids.'
  },
  {
    id: 18,
    name: 'Voidreach',
    title: 'Outer Bastion',
    sector: 4,
    color1: '#4f46e5',
    color2: '#e11d48',
    atmo: '#f43f5e',
    rings: true,
    waves: 4,
    baseEnemies: 60,
    bossName: null,
    desc: 'Final defense checkpoint before the celestial center of the universe.'
  },
  {
    id: 19,
    name: 'Omega Prime',
    title: 'Dyson Citadel',
    sector: 4,
    color1: '#0284c7',
    color2: '#f59e0b',
    atmo: '#38bdf8',
    rings: true,
    waves: 4,
    baseEnemies: 65,
    bossName: null,
    desc: 'Enormous megastructure world housing the galaxy’s central power archives.'
  },
  {
    id: 20,
    name: 'Genesis Core',
    title: 'Origin World',
    sector: 4,
    color1: '#00e5ff',
    color2: '#e040fb',
    atmo: '#ffd700',
    rings: true,
    waves: 5,
    baseEnemies: 72,
    bossName: 'The Apex Leviathan',
    desc: 'Heart of the Universe. Defend Genesis Core against The Apex Leviathan to save all reality!'
  }
];

export const ALIEN_CLASSES = {
  SCOUT: {
    type: 'SCOUT',
    name: 'Alien Scout',
    color: '#00e5ff',
    hp: 22,
    speed: 62,
    radius: 12,
    score: 25,
    damage: 8,
    novaRadius: 68,
    role: 'Vanguard Ramming Fighter',
    behaviorDesc: 'Fast delta-wing dart fighter that spirals inward to ram the planetary shield.',
    deathPayload: 'Standard Plasma Chain Nova'
  },
  INTERCEPTOR: {
    type: 'INTERCEPTOR',
    name: 'Trident Interceptor',
    color: '#e040fb',
    hp: 40,
    speed: 48,
    radius: 15,
    score: 45,
    damage: 12,
    novaRadius: 74,
    role: 'Mid-Range Torpedo Skirmisher',
    behaviorDesc: 'Orbits at mid-range firing plasma siege torpedoes at the planet.',
    deathPayload: 'QUAD PLASMA BURST! Fires 4 piercing bolts at 45°/135°/225°/315°.'
  },
  CRYO: {
    type: 'CRYO',
    name: 'Cryo-Cruiser',
    color: '#00e676',
    hp: 48,
    speed: 42,
    radius: 16,
    score: 50,
    damage: 10,
    novaRadius: 95,
    role: 'Stasis Suppression Warship',
    behaviorDesc: 'Hexagonal crystalline cruiser advancing steadily toward orbit.',
    deathPayload: 'CRYO STASIS FIELD! Emits a 155px field slowing surrounding aliens by 75% for 4.5s.'
  },
  PHASE: {
    type: 'PHASE',
    name: 'Phase-Shifter',
    color: '#a855f7',
    hp: 38,
    speed: 55,
    radius: 14,
    score: 55,
    damage: 11,
    novaRadius: 82,
    role: 'Quantum Warp Infiltrator',
    behaviorDesc: 'Diamond quantum vessel that blinks 48px closer every 3.4 seconds.',
    deathPayload: 'ECHO WARP NOVA! Triggers a second delayed Echo Nova 220ms after destruction.'
  },
  DROPSHIP: {
    type: 'DROPSHIP',
    name: 'Invasion Dropship',
    color: '#ff3366',
    hp: 75,
    speed: 34,
    radius: 19,
    score: 70,
    damage: 18,
    novaRadius: 88,
    role: 'Heavy Siege Lander',
    behaviorDesc: 'Heavily armored assault lander marching toward the planet, spawning mini Scouts every 4.5s.',
    deathPayload: 'Heavy Shrapnel Cascade'
  },
  DREADNOUGHT: {
    type: 'DREADNOUGHT',
    name: 'Solar Dreadnought',
    color: '#ffd700',
    hp: 135,
    speed: 26,
    radius: 23,
    score: 120,
    damage: 26,
    novaRadius: 135,
    role: 'Capital Siege Battleship',
    behaviorDesc: 'Armored fortress flagship that launches heavy plasma siege torpedoes.',
    deathPayload: '☀️ SOLAR SUPER-NOVA! Colossal screen-shaking 135px blast.'
  },
  BOSS: {
    type: 'BOSS',
    name: 'Sector Mothership',
    color: '#ff1744',
    hp: 950,
    speed: 20,
    radius: 40,
    score: 800,
    damage: 35,
    novaRadius: 210,
    role: 'Armada Command Flagship',
    behaviorDesc: 'Giant command leviathan with top HUD Boss Health Bar, firing 3-torpedo spread salvos.',
    deathPayload: 'Colossal 210px Galaxy Super-Nova!'
  }
};

export const CHASSIS_CONFIG = {
  striker: {
    id: 'striker',
    name: 'Pulse Striker',
    title: 'Rapid Assault Cannon',
    color: '#00e5ff',
    bulletSpeed: 520,
    fireIntervalMult: 1.0,
    damageMult: 1.0,
    minStars: 0,
    reqStars: 0,
    cost: 0,
    costShards: 0,
    unlockedAtStart: true,
    desc: 'Balanced rapid-fire plasma cannon with +15% faster Spark Nova recharge rate.',
    perk: '+15% Spark Nova passive recharge rate',
    perkDesc: '+15% Spark Nova passive recharge rate',
    role: 'Tactical Assault'
  },
  tesla: {
    id: 'tesla',
    name: 'Tesla Arc Cannon',
    title: 'High-Voltage Chain Driver',
    color: '#e040fb',
    bulletSpeed: 480,
    fireIntervalMult: 1.0,
    damageMult: 1.0,
    minStars: 15,
    reqStars: 15,
    cost: 350,
    costShards: 350,
    unlockedAtStart: false,
    desc: 'High-voltage shock bolts that chain-arc to up to 2 (or 3 at Lv.5+) nearby invaders within 115px. -20% EMP cooldown, +1.0s EMP stun duration.',
    perk: 'Chain-lightning arcs (100% -> 65% -> 45%) • -20% EMP cooldown • +1s EMP stun',
    perkDesc: 'Chain-lightning arcs (100% -> 65% -> 45%) • -20% EMP cooldown • +1s EMP stun',
    role: 'Crowd Suppression'
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun Lancer',
    title: 'Hyper-Velocity Siege Driver',
    color: '#ffd700',
    bulletSpeed: 880,
    fireIntervalMult: 1.45,
    damageMult: 2.2,
    minStars: 30,
    reqStars: 30,
    cost: 600,
    costShards: 600,
    unlockedAtStart: false,
    desc: 'Hyper-velocity golden rail-slugs piercing straight through up to 4 enemies in a line with 2.2x base damage. Ignores Boss Phase 2 directional shields and deals +50% bonus damage to Dreadnoughts & Mothership Bosses.',
    perk: 'Piercing rail-slugs (4+ enemies) • Ignores Boss Phase 2 shields • +50% vs Dreadnoughts/Bosses',
    perkDesc: 'Piercing rail-slugs (4+ enemies) • Ignores Boss Phase 2 shields • +50% vs Dreadnoughts/Bosses',
    role: 'Heavy Anti-Capital'
  }
};

export const ARMORY_CONFIG = {
  turretDmg: {
    id: 'turretDmg',
    name: 'Pulse Cannon Firepower',
    icon: '🔫',
    maxLevel: 6,
    baseCost: 80,
    costFactor: 1.6,
    desc: '+4.5 laser damage/lvl, faster fire rate. Unlocks Twin Barrels at Lv.3 and Triple Barrels at Lv.5.'
  },
  novaRadius: {
    id: 'novaRadius',
    name: 'Spark Nova Catalyst',
    icon: '💥',
    maxLevel: 6,
    baseCost: 90,
    costFactor: 1.6,
    desc: '+14% blast radius and damage per level for player Spark Novas and secondary chain reactions.'
  },
  novaCharges: {
    id: 'novaCharges',
    name: 'Nova Capacitor Core',
    icon: '⚡',
    maxLevel: 5,
    baseCost: 110,
    costFactor: 1.7,
    desc: '+1 max Spark Nova charge per level (starts at 3, up to 7 max charges) and faster kill recharge.'
  },
  shieldGrid: {
    id: 'shieldGrid',
    name: 'Planetary Aegis Shield',
    icon: '🛡️',
    maxLevel: 6,
    baseCost: 85,
    costFactor: 1.6,
    desc: '+22% max Planetary Shield and Core HP per level, plus faster shield regeneration.'
  },
  satellites: {
    id: 'satellites',
    name: 'Orbital Defense Satellites',
    icon: '🛰️',
    maxLevel: 4,
    baseCost: 140,
    costFactor: 1.8,
    desc: 'Deploys 1 autonomous laser defense satellite per level (up to 4 satellites) in orbit.'
  },
  tacticalCd: {
    id: 'tacticalCd',
    name: 'Tactical Core Reactor',
    icon: '⏱️',
    maxLevel: 5,
    baseCost: 95,
    costFactor: 1.6,
    desc: 'Reduces cooldowns of [Q] Ion Beam, [W] EMP Shockwave, and [E] Aegis Overdrive by 12% per level.'
  }
};

export const TROPHIES = [
  {
    id: 'FIRST_DEFENSE',
    name: 'First Orbital Defense',
    desc: 'Successfully liberate and defend any planetary world.',
    icon: '🛡️',
    reward: 100
  },
  {
    id: 'NOVA_CATALYST',
    name: 'Nova Catalyst x10',
    desc: 'Trigger a x10 Chain Reaction Combo in a single defense mission.',
    icon: '⚡',
    reward: 100
  },
  {
    id: 'SUPERNOVA_ARCHITECT',
    name: 'Supernova Architect x20',
    desc: 'Reach an extraordinary x20 Chain Reaction Nova Combo.',
    icon: '🌟',
    reward: 100
  },
  {
    id: 'MOTHERSHIP_BREAKER',
    name: 'Mothership Breaker',
    desc: 'Vaporize any Sector Mothership or Apex Flagship Boss.',
    icon: '👑',
    reward: 100
  },
  {
    id: 'IMPENETRABLE_AEGIS',
    name: 'Impenetrable Aegis',
    desc: 'Clear a planetary defense mission with 100% Core HP intact.',
    icon: '💎',
    reward: 100
  },
  {
    id: 'SECTOR_ONE_GUARDIAN',
    name: 'Guardian of Sector I',
    desc: 'Clear and defend all 5 planetary systems in Sector I.',
    icon: '🌌',
    reward: 100
  }
];

export const GUARDIAN_RANKS = [
  { minStars: 0, title: 'CADET GUARDIAN', icon: '🛡️', color: '#94a3b8' },
  { minStars: 8, title: 'SYSTEM SENTINEL', icon: '⚔️', color: '#00e676' },
  { minStars: 18, title: 'NEBULA WARDEN', icon: '🌌', color: '#00e5ff' },
  { minStars: 32, title: 'COSMIC ADMIRAL', icon: '⭐', color: '#ffd700' },
  { minStars: 45, title: 'GALACTIC CHAMPION', icon: '👑', color: '#e040fb' },
  { minStars: 55, title: 'SUPREME COSMIC GUARDIAN', icon: '✨', color: '#ff3366' }
];

export const PENTATONIC_FREQS = [
  261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66
];
