// Spark Panic: Planetary Invasion Defense 2.0 - Configuration & Universe Data

export const SECTORS = [
  {
    id: 1,
    name: 'SECTOR I: INNER SANCTUARIES (SOL SYSTEM)',
    shortName: 'SECTOR I',
    themeColor: '#00e5ff',
    range: [1, 5],
    bossStage: 5
  },
  {
    id: 2,
    name: 'SECTOR II: NEBULA FRONTIER (GAS GIANTS)',
    shortName: 'SECTOR II',
    themeColor: '#e040fb',
    range: [6, 10],
    bossStage: 10
  },
  {
    id: 3,
    name: 'SECTOR III: DARK RIFT (DEEP MOONS)',
    shortName: 'SECTOR III',
    themeColor: '#ffd700',
    range: [11, 15],
    bossStage: 15
  },
  {
    id: 4,
    name: 'SECTOR IV: SOL GENESIS (EXOPLANETS)',
    shortName: 'SECTOR IV',
    themeColor: '#ff3366',
    range: [16, 20],
    bossStage: 20
  }
];

export const PLANETS = [
  // SECTOR I: INNER SANCTUARIES (SOL SYSTEM)
  {
    id: 1,
    name: 'Earth',
    realName: 'Earth',
    classicName: 'Aerilon',
    title: 'Cradle of Humanity',
    sector: 1,
    color1: '#0ea5e9',
    color2: '#10b981',
    atmo: '#38bdf8',
    rings: false,
    waves: 2,
    baseEnemies: 12,
    bossName: null,
    astronomicalType: 'Terrestrial Habitable Planet',
    realDistance: '1.00 AU (149.6M km)',
    surfaceGravity: '9.81 m/s² (1.00g)',
    realFact: 'The only celestial body known to harbor active water-based life, shielded by a geomagnetic dynamo and nitrogen-oxygen atmosphere.',
    desc: 'Lush terrestrial cradle under attack by Vanguard Recon Scout fleets.'
  },
  {
    id: 2,
    name: 'Mars',
    realName: 'Mars',
    classicName: 'Aquatis',
    title: 'Rust Dunes & Olympus Mons',
    sector: 1,
    color1: '#dc2626',
    color2: '#f97316',
    atmo: '#fb923c',
    rings: false,
    waves: 2,
    baseEnemies: 15,
    bossName: null,
    astronomicalType: 'Terrestrial Desert Planet',
    realDistance: '1.52 AU (227.9M km)',
    surfaceGravity: '3.72 m/s² (0.38g)',
    realFact: 'Hosts the solar system’s tallest volcano, Olympus Mons (21.9 km), and the gargantuan Valles Marineris canyon network.',
    desc: 'Rust dunes and ancient river valleys under siege by mid-range Trident Interceptors.'
  },
  {
    id: 3,
    name: 'Venus',
    realName: 'Venus',
    classicName: 'Solaria',
    title: 'Super-Greenhouse Veil',
    sector: 1,
    color1: '#d97706',
    color2: '#f59e0b',
    atmo: '#fbbf24',
    rings: false,
    waves: 3,
    baseEnemies: 18,
    bossName: null,
    astronomicalType: 'Infernal Greenhouse Planet',
    realDistance: '0.72 AU (108.2M km)',
    surfaceGravity: '8.87 m/s² (0.90g)',
    realFact: 'A runaway greenhouse effect generates crushing 92 bar atmospheric pressure and blistering surface heat of 465°C.',
    desc: 'Super-heated sulfuric acid storm veil besieged by heavy armored siege dropships.'
  },
  {
    id: 4,
    name: 'Mercury',
    realName: 'Mercury',
    classicName: 'Verdantia',
    title: 'Scorched Caloris Basin',
    sector: 1,
    color1: '#475569',
    color2: '#64748b',
    atmo: '#94a3b8',
    rings: false,
    waves: 3,
    baseEnemies: 22,
    bossName: null,
    astronomicalType: 'Airless Rocky Planet',
    realDistance: '0.39 AU (57.9M km)',
    surfaceGravity: '3.70 m/s² (0.38g)',
    realFact: 'Experiences wild surface temperature swings from -180°C at night to 430°C in direct solar glare, with an enormous metallic iron core.',
    desc: 'Scorched impact basins and lobate scarps facing multi-vector swarm incursions.'
  },
  {
    id: 5,
    name: 'Luna',
    realName: 'Luna',
    classicName: 'Cryon',
    title: 'Lunar Stronghold',
    sector: 1,
    color1: '#334155',
    color2: '#e2e8f0',
    atmo: '#94a3b8',
    rings: false,
    waves: 3,
    baseEnemies: 26,
    bossName: 'Dreadnought Vexor',
    astronomicalType: 'Major Planetary Natural Satellite',
    realDistance: '0.00257 AU (384,400 km from Earth)',
    surfaceGravity: '1.62 m/s² (0.17g)',
    realFact: 'Tidally locked to Earth with dark basaltic mare plains and deep water-ice traps in shadowed polar craters.',
    desc: 'Lunar orbital bastion and regolith stronghold defended against Flagship Dreadnought Vexor!'
  },

  // SECTOR II: NEBULA FRONTIER (GAS GIANTS)
  {
    id: 6,
    name: 'Jupiter',
    realName: 'Jupiter',
    classicName: 'Pyros',
    title: 'Great Red Spot & Storm Belts',
    sector: 2,
    color1: '#d97706',
    color2: '#ea580c',
    atmo: '#fed7aa',
    rings: true,
    waves: 3,
    baseEnemies: 24,
    bossName: null,
    astronomicalType: 'Gas Giant (Jovian Planet)',
    realDistance: '5.20 AU (778.5M km)',
    surfaceGravity: '24.79 m/s² (2.53g)',
    realFact: 'Contains more mass than all other solar system planets combined, harboring an anticyclonic storm raging for centuries.',
    desc: 'Massive atmospheric belts and swirling cyclonic storms under relentless alien assault.'
  },
  {
    id: 7,
    name: 'Saturn',
    realName: 'Saturn',
    classicName: 'Zephyria',
    title: 'Majestic Ring System',
    sector: 2,
    color1: '#ca8a04',
    color2: '#eab308',
    atmo: '#fef08a',
    rings: true,
    waves: 3,
    baseEnemies: 28,
    bossName: null,
    astronomicalType: 'Gas Giant (Ringed Jovian)',
    realDistance: '9.58 AU (1.43B km)',
    surfaceGravity: '10.44 m/s² (1.06g)',
    realFact: 'Encircled by an intricate 282,000 km wide ring system of 99% pure water ice, with a unique hexagonal storm at its north pole.',
    desc: 'Majestic ring system and golden cloud belts encircled by crystalline particle rings.'
  },
  {
    id: 8,
    name: 'Uranus',
    realName: 'Uranus',
    classicName: 'Obsidian',
    title: 'Aquamarine Methane Cryo-Sphere',
    sector: 2,
    color1: '#0891b2',
    color2: '#06b6d4',
    atmo: '#67e8f9',
    rings: true,
    waves: 3,
    baseEnemies: 30,
    bossName: null,
    astronomicalType: 'Ice Giant',
    realDistance: '19.22 AU (2.87B km)',
    surfaceGravity: '8.69 m/s² (0.89g)',
    realFact: 'Rotates on its side with an axial tilt of 97.8 degrees, possessing the coldest planetary atmosphere in the Solar System at -224°C.',
    desc: 'Aquamarine methane ice giant where quantum Phase-Shifter ships blink through orbital space.'
  },
  {
    id: 9,
    name: 'Neptune',
    realName: 'Neptune',
    classicName: 'Lumina',
    title: 'Supersonic Wind Realm',
    sector: 2,
    color1: '#1d4ed8',
    color2: '#2563eb',
    atmo: '#60a5fa',
    rings: true,
    waves: 3,
    baseEnemies: 34,
    bossName: null,
    astronomicalType: 'Ice Giant',
    realDistance: '30.05 AU (4.50B km)',
    surfaceGravity: '11.15 m/s² (1.14g)',
    realFact: 'Whips the fastest planetary winds in the solar system, exceeding 2,100 km/h across vivid azure cloud bands.',
    desc: 'Supersonic blue wind realm radiating concentrated planetary storms against alien cruisers.'
  },
  {
    id: 10,
    name: 'Pluto',
    realName: 'Pluto',
    classicName: 'Vortexia',
    title: 'Nitrogen Glacier Heart',
    sector: 2,
    color1: '#7c3aed',
    color2: '#ec4899',
    atmo: '#f472b6',
    rings: false,
    waves: 4,
    baseEnemies: 38,
    bossName: 'Mothership Kaelen',
    astronomicalType: 'Kuiper Belt Dwarf Planet',
    realDistance: '39.48 AU (5.91B km)',
    surfaceGravity: '0.62 m/s² (0.063g)',
    realFact: 'Features a vast nitrogen and carbon-monoxide glacier shaped like a heart (Tombaugh Regio) and rugged water-ice mountain peaks.',
    desc: 'Frozen Kuiper Belt outpost where Sector Mothership Kaelen launches orbital siege attacks.'
  },

  // SECTOR III: DARK RIFT (DEEP MOONS)
  {
    id: 11,
    name: 'Europa',
    realName: 'Europa',
    classicName: 'Aethelgard',
    title: 'Sub-Surface Cryo-Ocean Abyss',
    sector: 3,
    color1: '#0284c7',
    color2: '#38bdf8',
    atmo: '#7dd3fc',
    rings: false,
    waves: 3,
    baseEnemies: 36,
    bossName: null,
    astronomicalType: 'Galilean Ice Moon (Ocean World)',
    realDistance: '5.20 AU (670,900 km from Jupiter)',
    surfaceGravity: '1.315 m/s² (0.134g)',
    realFact: 'Conceals a global salty liquid ocean twice the volume of all Earth’s oceans beneath an outer crust of fractured water ice.',
    desc: 'Sub-surface cryo-ocean abyss with crisscrossing rust fractures besieged by relentless alien fleets.'
  },
  {
    id: 12,
    name: 'Titan',
    realName: 'Titan',
    classicName: 'Chronos',
    title: 'Liquid Methane Lakes & Nitrogen Haze',
    sector: 3,
    color1: '#d97706',
    color2: '#f59e0b',
    atmo: '#fde047',
    rings: false,
    waves: 3,
    baseEnemies: 40,
    bossName: null,
    astronomicalType: 'Major Saturnian Moon (Atmospheric Ocean World)',
    realDistance: '9.58 AU (1.22M km from Saturn)',
    surfaceGravity: '1.352 m/s² (0.138g)',
    realFact: 'The only planetary moon with a dense nitrogen atmosphere and standing lakes and rivers of liquid ethane and methane.',
    desc: 'Liquid hydrocarbon seas wrapped in dense golden nitrogen haze and heavy cruiser assaults.'
  },
  {
    id: 13,
    name: 'Io',
    realName: 'Io',
    classicName: 'Mycelia',
    title: 'Tidal Sulfur Volcanoes',
    sector: 3,
    color1: '#eab308',
    color2: '#ef4444',
    atmo: '#f97316',
    rings: false,
    waves: 4,
    baseEnemies: 44,
    bossName: null,
    astronomicalType: 'Galilean Volcanic Moon',
    realDistance: '5.20 AU (421,700 km from Jupiter)',
    surfaceGravity: '1.796 m/s² (0.183g)',
    realFact: 'The most volcanically active body in the Solar System, driven by intense tidal flexing between Jupiter and neighboring moons.',
    desc: 'Sulfur-yellow volcanic calderas and plasma plumes under siege by fast assault dropships.'
  },
  {
    id: 14,
    name: 'Enceladus',
    realName: 'Enceladus',
    classicName: 'Ferrum',
    title: 'Cryovolcanic Geyser Spire',
    sector: 3,
    color1: '#f8fafc',
    color2: '#0284c7',
    atmo: '#bae6fd',
    rings: false,
    waves: 4,
    baseEnemies: 48,
    bossName: null,
    astronomicalType: 'Saturnian Cryo-Moon',
    realDistance: '9.58 AU (238,000 km from Saturn)',
    surfaceGravity: '0.113 m/s² (0.011g)',
    realFact: 'Blasts towering plumes of water vapor and organic molecules hundreds of kilometers into space through south polar tiger-stripe fissures.',
    desc: 'Brilliant ice world with south polar cryovolcanic spires facing industrial invasion forces.'
  },
  {
    id: 15,
    name: 'Ceres',
    realName: 'Ceres',
    classicName: 'Eclipse',
    title: 'Occator Bright Spots & Salt Domes',
    sector: 3,
    color1: '#1e293b',
    color2: '#cbd5e1',
    atmo: '#94a3b8',
    rings: false,
    waves: 4,
    baseEnemies: 52,
    bossName: 'Void Harbinger',
    astronomicalType: 'Asteroid Belt Dwarf Planet',
    realDistance: '2.77 AU (414M km)',
    surfaceGravity: '0.284 m/s² (0.029g)',
    realFact: 'Largest body in the asteroid belt, containing water-ice mantle and radiant sodium carbonate mineral deposits in Occator Crater.',
    desc: 'Ancient asteroid fortress world where Flagship Void Harbinger reigns.'
  },

  // SECTOR IV: SOL GENESIS (EXOPLANETS)
  {
    id: 16,
    name: 'Proxima Centauri b',
    realName: 'Proxima Centauri b',
    classicName: 'Hyperion',
    title: 'Alpha Centauri Habitable Zone',
    sector: 4,
    color1: '#ea580c',
    color2: '#fde047',
    atmo: '#fef08a',
    rings: false,
    waves: 4,
    baseEnemies: 50,
    bossName: null,
    astronomicalType: 'Exoplanet (Terrestrial Super-Earth)',
    realDistance: '4.246 Light-Years (40.17 Trillion km)',
    surfaceGravity: '10.8 m/s² (1.10g)',
    realFact: 'The closest known exoplanet to Earth, orbiting in the habitable zone of our neighboring red dwarf Proxima Centauri.',
    desc: 'Red-dwarf irradiated frontier world in the habitable zone of Alpha Centauri.'
  },
  {
    id: 17,
    name: 'TRAPPIST-1e',
    realName: 'TRAPPIST-1e',
    classicName: 'Astralis',
    title: 'Ultra-Cool Dwarf Water World',
    sector: 4,
    color1: '#2563eb',
    color2: '#38bdf8',
    atmo: '#93c5fd',
    rings: false,
    waves: 4,
    baseEnemies: 55,
    bossName: null,
    astronomicalType: 'Exoplanet (Temperate Earth-Sized)',
    realDistance: '39.46 Light-Years (373.3 Trillion km)',
    surfaceGravity: '9.12 m/s² (0.93g)',
    realFact: 'One of seven Earth-sized worlds in the TRAPPIST-1 system, considered one of the highest-potential habitable exoplanets discovered.',
    desc: 'Temperate oceanic exoplanet radiating starlight defense grids against deep-space invasion fleets.'
  },
  {
    id: 18,
    name: 'Kepler-452b',
    realName: 'Kepler-452b',
    classicName: 'Voidreach',
    title: 'Super-Earth & Earth Elder Twin',
    sector: 4,
    color1: '#059669',
    color2: '#0284c7',
    atmo: '#34d399',
    rings: false,
    waves: 4,
    baseEnemies: 60,
    bossName: null,
    astronomicalType: 'Exoplanet (Super-Earth)',
    realDistance: '1,799 Light-Years (17.02 Quadrillion km)',
    surfaceGravity: '18.6 m/s² (1.90g)',
    realFact: 'Often called Earth’s older cousin, orbiting a G2-type star remarkably similar to our Sun with a 385-day orbital year.',
    desc: 'Elder super-Earth twin world guarding the approach to the celestial core.'
  },
  {
    id: 19,
    name: '55 Cancri e',
    realName: '55 Cancri e',
    classicName: 'Omega Prime',
    title: 'Molten Lava & Diamond Super-Earth',
    sector: 4,
    color1: '#b91c1c',
    color2: '#f59e0b',
    atmo: '#ef4444',
    rings: false,
    waves: 4,
    baseEnemies: 65,
    bossName: null,
    astronomicalType: 'Exoplanet (Ultra-Hot Lava Super-Earth)',
    realDistance: '41.0 Light-Years (387.9 Trillion km)',
    surfaceGravity: '21.5 m/s² (2.19g)',
    realFact: 'Extreme carbon-rich composition and 2,000°C temperatures suggest its interior may be composed largely of diamond and liquid silicate oceans.',
    desc: 'Ultra-hot carbon super-earth with molten lava seas and diamond crust.'
  },
  {
    id: 20,
    name: 'Kepler-22b',
    realName: 'Kepler-22b',
    classicName: 'Genesis Core',
    title: 'Cradle of Exoplanet Life',
    sector: 4,
    color1: '#00e5ff',
    color2: '#e040fb',
    atmo: '#ffd700',
    rings: true,
    waves: 5,
    baseEnemies: 72,
    bossName: 'The Apex Leviathan',
    astronomicalType: 'Exoplanet (Super-Earth Ocean World)',
    realDistance: '638 Light-Years (6.03 Quadrillion km)',
    surfaceGravity: '14.7 m/s² (1.50g)',
    realFact: 'The first Kepler planet confirmed in the habitable zone of a Sun-like star, likely enveloped in a planetary-scale warm ocean.',
    desc: 'Heart of the Universe. Defend Kepler-22b against The Apex Leviathan to save all reality!'
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
  },
  JAMMER: {
    type: 'JAMMER',
    name: 'Aegis Jammer Frigate',
    color: '#00e5ff',
    hp: 90,
    speed: 38,
    radius: 18,
    score: 90,
    damage: 15,
    novaRadius: 90,
    role: 'Frontal Shield Escort',
    behaviorDesc: 'Projects a curved 90° frontal energy barrier facing the planet that deflects standard lasers. Flank with Novas or pierce with Railgun / Ion Beam.',
    deathPayload: 'Disruptor Pulse Nova'
  },
  WEAVER: {
    type: 'WEAVER',
    name: 'Void Weaver Carrier',
    color: '#d946ef',
    hp: 110,
    speed: 30,
    radius: 20,
    score: 110,
    damage: 16,
    novaRadius: 95,
    role: 'Graviton Web Suppressor',
    behaviorDesc: 'Twin-hulled carrier that tethers a magenta Graviton Web to the player turret, reducing fire rate by 30%. On defeat, refunds 3.0s to all tactical skills!',
    deathPayload: '⚡ OVERCHARGE SURGE! -3.0s Tactical Cooldowns'
  },
  GALLEON: {
    type: 'GALLEON',
    name: 'Astral Treasure Galleon',
    color: '#ffd700',
    hp: 160,
    speed: 58,
    radius: 22,
    score: 300,
    damage: 0,
    novaRadius: 110,
    role: 'Elusive Jackpot Target',
    behaviorDesc: 'Flies a fast tangential outer orbit for 9 seconds before warping away. Does not attack. Destroying it awards +65 Shards, +25% Cataclysm, and 1 Supply Pod!',
    deathPayload: '💎 ASTRAL JACKPOT: +65 ✦ Shards, +25% Cataclysm, +1 Supply Pod!'
  },
  LEECH: {
    type: 'LEECH',
    name: 'Invasion Leech Pod',
    color: '#d946ef',
    hp: 45,
    speed: 210,
    radius: 12,
    score: 80,
    damage: 0,
    novaRadius: 70,
    role: 'Surface City Infiltrator',
    behaviorDesc: 'Bypasses planetary shields to latch onto surface cyber-cities and siphon Core HP directly (2.5 HP/s). Vaporize with Phase-Parry or Overcharge Shot!',
    deathPayload: 'City Liberated (+25 ✦ Shards)'
  },
  BEACON: {
    type: 'BEACON',
    name: 'Warp Ambush Beacon',
    color: '#a855f7',
    hp: 85,
    speed: 15,
    radius: 18,
    score: 150,
    damage: 0,
    novaRadius: 100,
    role: 'Optional Risk/Reward Objective',
    behaviorDesc: 'Outer-rim alien beacon active for 12 seconds. Destroying it summons an Elite Ambush Squadron rewarding 2x Star Shards, 2x Score, and +30% Cataclysm charge!',
    deathPayload: '⚠️ ELITE AMBUSH TRIGGERED!'
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
  },
  {
    id: 'TITAN_CONQUEROR',
    name: 'Titan Protocol Conqueror',
    desc: 'Defeat all 4 Sector Motherships back-to-back in Titan Protocol Boss Rush.',
    icon: '👑',
    reward: 300
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

export const SECTOR_HAZARDS = {
  1: { name: 'ASTEROID DRIFT', icon: '☄️', desc: 'Shoot drifting asteroids for +15 Shards & kinetic shockwaves' },
  2: { name: 'ION NEBULA', icon: '⚡', desc: 'Novas inside Ion Clouds gain +35% radius & +25% damage' },
  3: { name: 'GRAVITY ANOMALY', icon: '🌀', desc: 'Singularity clusters invaders into high-value combo targets' },
  4: { name: 'SOLAR CORONA', icon: '☀️', desc: 'Periodic Solar Flares scorch point-blank invaders & grant +15% Nova energy' }
};

export const DAILY_MUTATORS = [
  {
    id: 'hyperCapacitor',
    name: 'Hyper-Capacitor',
    icon: '⚡',
    color: '#00e5ff',
    desc: 'Spark Nova charges regenerate +60% faster, but turret laser damage is -25%.',
    novaRechargeMult: 1.6,
    turretDmgMult: 0.75
  },
  {
    id: 'swarmBlitz',
    name: 'Swarm Blitz',
    icon: '🛸',
    color: '#e040fb',
    desc: '+50% more Alien Scouts & Interceptors with +20% speed, but every kill grants +35% chain score.',
    swarmCountMult: 1.5,
    swarmSpeedMult: 1.2,
    scoreMult: 1.35
  },
  {
    id: 'supernovaChain',
    name: 'Supernova Chain',
    icon: '💥',
    color: '#ffd700',
    desc: 'All secondary alien death explosions have +35% blast radius.',
    novaRadiusMult: 1.35
  },
  {
    id: 'glassAegis',
    name: 'Glass Aegis',
    icon: '🛡️',
    color: '#00e676',
    desc: 'Planetary Shield is +100% stronger and regenerates 2x faster, but Max Core HP is reduced by 40%.',
    shieldStrengthMult: 2.0,
    shieldRegenMult: 2.0,
    coreHpMult: 0.6
  },
  {
    id: 'meteorStorm',
    name: 'Meteor Storm',
    icon: '☄️',
    color: '#f97316',
    desc: 'Asteroid Clusters & Orbital Supply Pods spawn 2.5x more frequently.',
    spawnFreqMult: 2.5
  },
  {
    id: 'bossRush',
    name: 'Boss Rush',
    icon: '👑',
    color: '#ff3366',
    desc: 'Every wave includes a mini Dreadnought or Mothership escort, and all Turret Chassis deal +30% damage.',
    bossEscort: true,
    turretDmgMult: 1.30
  }
];

export function getDailyAnomalyConfig(dateStr) {
  const dateKey = dateStr || new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) || 123456789;

  let a = seed;
  const rng = () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const planetIndex = Math.floor(rng() * PLANETS.length);
  const planet = PLANETS[planetIndex] || PLANETS[0];
  const hazardSector = 1 + Math.floor(rng() * 4);

  const m1 = Math.floor(rng() * DAILY_MUTATORS.length);
  let m2 = Math.floor(rng() * (DAILY_MUTATORS.length - 1));
  if (m2 >= m1) m2++;

  return {
    dateKey,
    planet,
    hazardSector,
    hazard: SECTOR_HAZARDS[hazardSector],
    mutators: [DAILY_MUTATORS[m1], DAILY_MUTATORS[m2]]
  };
}

// v2.4 Titan Protocol, Wingman AI & Prestige System Configurations

export const TURRET_SKINS = {
  sentinel: {
    id: 'sentinel',
    name: 'Cyan Sentinel',
    reqStars: 0,
    primaryColor: '#00e5ff',
    accentColor: '#38bdf8',
    bulletColor: '#00e5ff',
    glowColor: '#00e5ff',
    desc: 'Standard-issue cyber-cyan titanium orbital chassis with sapphire focus crystals.'
  },
  sovereign: {
    id: 'sovereign',
    name: 'Solar Sovereign',
    reqStars: 20,
    primaryColor: '#ffd700',
    accentColor: '#f59e0b',
    bulletColor: '#ffd700',
    glowColor: '#ffd700',
    desc: 'Forged from Solaria star-metal. Radiates golden solar warmth and amber plasma fire.'
  },
  valkyrie: {
    id: 'valkyrie',
    name: 'Crimson Valkyrie',
    reqStars: 40,
    primaryColor: '#ff3366',
    accentColor: '#fb7185',
    bulletColor: '#ff3366',
    glowColor: '#ff3366',
    desc: 'Aggressive crimson nano-alloy chassis optimized for high-intensity sector liberation.'
  },
  prismatic: {
    id: 'prismatic',
    name: 'Void Prismatic',
    reqStars: 60,
    reqAscension: 1,
    primaryColor: '#e040fb',
    accentColor: '#00e5ff',
    bulletColor: '#a855f7',
    glowColor: '#e040fb',
    desc: 'Quantum-woven polychromatic hull that channels shifting chromatic spectrums across deep space.'
  }
};

export const TITAN_PROTOCOL_CONFIG = {
  name: 'Titan Protocol: 4-Boss Rush',
  totalWaves: 4,
  waves: [
    {
      waveNumber: 1,
      bossName: 'Dreadnought Vexor',
      bossClass: 'BOSS',
      sector: 1,
      hazardSector: 1,
      planetId: 5,
      title: 'SECTOR I TITAN: DREADNOUGHT VEXOR',
      desc: 'Glacial Bastion flagship with twin torpedo arrays and escort recon swarms.',
      escorts: [
        { classKey: 'SCOUT', count: 6 },
        { classKey: 'INTERCEPTOR', count: 4 }
      ],
      bossHp: 850
    },
    {
      waveNumber: 2,
      bossName: 'Mothership Kaelen',
      bossClass: 'BOSS',
      sector: 2,
      hazardSector: 2,
      planetId: 10,
      title: 'SECTOR II TITAN: MOTHERSHIP KAELEN',
      desc: 'Nebula Frontier command carrier firing triple plasma bursts with stasis cruiser escorts.',
      escorts: [
        { classKey: 'CRYO', count: 5 },
        { classKey: 'PHASE', count: 4 }
      ],
      bossHp: 1100
    },
    {
      waveNumber: 3,
      bossName: 'Void Harbinger',
      bossClass: 'BOSS',
      sector: 3,
      hazardSector: 3,
      planetId: 15,
      title: 'SECTOR III TITAN: VOID HARBINGER',
      desc: 'Dark Rift dread-engine wielding rotating void shields and heavy siege drop escorts.',
      escorts: [
        { classKey: 'DROPSHIP', count: 4 },
        { classKey: 'DREADNOUGHT', count: 2 }
      ],
      bossHp: 1400
    },
    {
      waveNumber: 4,
      bossName: 'The Apex Leviathan',
      bossClass: 'BOSS',
      sector: 4,
      hazardSector: 4,
      planetId: 20,
      title: 'SECTOR IV APEX TITAN: THE APEX LEVIATHAN',
      desc: 'Supreme Armada Flagship unleashing 360° torpedo barrages, phase warps, and elite escorts.',
      escorts: [
        { classKey: 'INTERCEPTOR', count: 4 },
        { classKey: 'CRYO', count: 3 },
        { classKey: 'PHASE', count: 3 },
        { classKey: 'DROPSHIP', count: 2 },
        { classKey: 'DREADNOUGHT', count: 2 }
      ],
      bossHp: 1800
    }
  ],
  pitStop: {
    duration: 4.0, // seconds
    shieldRestorePct: 0.35,
    coreRestorePct: 0.15,
    novaChargesBonus: 2,
    bannerText: '👑 TITAN NEUTRALIZED — ORBITAL REPAIR +35% SHIELD!'
  },
  rewards: {
    firstClearShards: 300,
    repeatClearShards: 100,
    trophyId: 'TITAN_CONQUEROR'
  }
};

export const WINGMAN_CONFIG = {
  unlockSatelliteReq: 2,
  unlockCostShards: 200,
  doctrines: {
    aegis: {
      id: 'aegis',
      name: 'Aegis Interceptor',
      icon: '🛡️',
      role: 'Point-Defense Interceptor',
      color: '#00e5ff',
      auraColor: 'rgba(0, 229, 255, 0.4)',
      speed: 190,
      fireRate: 0.35,
      bulletSpeed: 520,
      damage: 14,
      bulletColor: '#00e5ff',
      desc: 'Patrols mid-orbit at high speed (190 px/s), prioritizing incoming red torpedoes and fast Scouts.',
      perkDesc: 'Rapid twin cyan pulse lasers targeting enemy torpedoes and flankers'
    },
    vanguard: {
      id: 'vanguard',
      name: 'Vanguard Striker',
      icon: '⚔️',
      role: 'Anti-Capital Striker',
      color: '#ffd700',
      auraColor: 'rgba(255, 215, 0, 0.4)',
      speed: 165,
      fireRate: 1.6,
      bulletSpeed: 460,
      damage: 38,
      bulletColor: '#ffd700',
      desc: 'Flies aggressively toward highest-HP targets (Bosses, Dreadnoughts) firing heavy armor-piercing rockets.',
      perkDesc: 'Heavy golden plasma rockets dealing +40% armor damage with mini-splash'
    },
    harvester: {
      id: 'harvester',
      name: 'Nova Harvester',
      icon: '🧲',
      role: 'Support & Mine Layer',
      color: '#00e676',
      auraColor: 'rgba(0, 230, 118, 0.4)',
      speed: 175,
      fireRate: 0.8,
      bulletSpeed: 480,
      damage: 18,
      bulletColor: '#00e676',
      desc: 'Sweeps space collecting Sparks & Pods, boosts passive Nova recharge by +20%, and drops Plasma Mines every 5s.',
      perkDesc: '+20% passive Nova recharge & Plasma Proximity Mines (70px chain detonation)'
    }
  }
};

export const ASCENSION_CONFIG = {
  reqStars: 45,
  reqPlanet: 20,
  maxTier: 5,
  shardGainBonusPerTier: 0.25,
  scoreMultBonusPerTier: 0.20,
  enemyHpScalingPerTier: 0.20,
  enemySpeedScalingPerTier: 0.20
};

// ==========================================
// v2.5 COMMANDER'S ULTIMATE EDITION CONFIG
// ==========================================

export const COSMIC_RELICS = {
  chronoStasis: {
    id: 'chronoStasis',
    name: 'Chrono-Stasis Prism',
    icon: '⏳',
    color: '#00e5ff',
    costShards: 250,
    reqSector: 1,
    unlockDesc: 'Clear Sector I or ✦ 250',
    desc: 'Whenever Planetary Shield breaks (0%), automatically triggers a 3.5s 60% Time-Dilation Slow Field across all aliens and missiles on screen (30s cooldown).',
    perkSummary: '3.5s 60% Time-Dilation Slow Field on Shield Break'
  },
  vampiricCore: {
    id: 'vampiricCore',
    name: 'Vampiric Core Matrix',
    icon: '🩸',
    color: '#ff3366',
    costShards: 300,
    reqCombo: 12,
    unlockDesc: 'Reach a x12+ Chain Combo or ✦ 300',
    desc: 'Every time a Chain-Reaction combo reaches x8 or higher, restores +3% Planetary Core HP and +6% Aegis Shield.',
    perkSummary: 'Restores +3% Core HP & +6% Shield on x8+ Combos'
  },
  singularityLens: {
    id: 'singularityLens',
    name: 'Singularity Gravity Lens',
    icon: '🌀',
    color: '#a855f7',
    costShards: 350,
    reqSector: 2,
    unlockDesc: 'Clear Sector II or ✦ 350',
    desc: 'Player-launched Spark Novas create a micro-vortex that pulls nearby aliens within 135px inward toward the blast center for 0.6s.',
    perkSummary: 'Novas pull aliens within 135px inward toward blast center'
  },
  twinWingman: {
    id: 'twinWingman',
    name: 'Twin-Wingman Transponder',
    icon: '✈️',
    color: '#00e676',
    costShards: 450,
    unlockDesc: 'Clear Titan Protocol Wave 2 or ✦ 450',
    desc: 'Deploys a second autonomous AI Wingman Fighter (WING-02) that flies in opposite orbital formation to WING-01 using your active Wingman Doctrine!',
    perkSummary: 'Deploys second autonomous AI Wingman (WING-02)'
  },
  overchargedCoil: {
    id: 'overchargedCoil',
    name: 'Overcharged Capacitor Coil',
    icon: '⚡',
    color: '#ffd700',
    costShards: 300,
    unlockDesc: 'Complete 1 Daily Anomaly or ✦ 300',
    desc: 'Every 4th turret laser shot fires an Overcharged Plasma Bolt (2.2x size & damage) that arcs electricity to 2 nearby targets.',
    perkSummary: 'Every 4th shot is an Overcharged Chain Bolt (2.2x dmg)'
  },
  aegisMirror: {
    id: 'aegisMirror',
    name: 'Aegis Mirror Plating',
    icon: '🛡️',
    color: '#38bdf8',
    costShards: 350,
    unlockDesc: 'Achieve 100% Core HP on any planet or ✦ 350',
    desc: 'When Planetary Shield is above 50%, enemy torpedoes that hit the shield have a 40% chance to ricochet back into space as friendly homing missiles!',
    perkSummary: '40% chance to ricochet torpedoes back as homing missiles'
  },
  starlightSynth: {
    id: 'starlightSynth',
    name: 'Starlight Synthesizer',
    icon: '💎',
    color: '#e040fb',
    costShards: 280,
    reqStars: 25,
    unlockDesc: 'Earn 25 ★ Stars or ✦ 280',
    desc: 'Increases all Star Shard drops by +35% and causes Orbital Supply Pods to grant +1 bonus Spark Nova charge when shot.',
    perkSummary: '+35% Star Shard drops & +1 Nova charge from Supply Pods'
  },
  supernovaEcho: {
    id: 'supernovaEcho',
    name: 'Supernova Echo Core',
    icon: '☀️',
    color: '#f59e0b',
    costShards: 400,
    unlockDesc: 'Defeat any Sector Boss or ✦ 400',
    desc: 'Player-launched Spark Novas leave behind a burning Solar Ember Zone for 2.5 seconds that deals continuous DoT damage (35 dmg/s) to any alien inside.',
    perkSummary: 'Novas leave burning Solar Ember Zones (35 dmg/s DoT for 2.5s)'
  }
};

export const STRUCTURE_CONFIG = {
  cooldown: 16.0,
  duration: 14.0,
  maxActive: 2,
  orbitOffset: 75,
  types: {
    pylon: {
      id: 'pylon',
      name: 'Solar Prism Pylon',
      chassisMatch: 'striker',
      icon: '🔮',
      color: '#00e5ff',
      auraColor: 'rgba(0, 229, 255, 0.35)',
      prismRadius: 28,
      beamBonus: 0.30,
      zapRadius: 85,
      zapDamage: 25,
      zapRate: 0.8,
      desc: 'Refracts turret lasers into 3 superheated beams (+30% dmg) in a 30° fan and zaps nearby missiles.'
    },
    anchor: {
      id: 'anchor',
      name: 'Grav-Well Anchor',
      chassisMatch: 'tesla',
      icon: '🌀',
      color: '#e040fb',
      auraColor: 'rgba(224, 64, 251, 0.35)',
      fieldRadius: 110,
      slowFactor: 0.50,
      chainRate: 1.2,
      chainDamage: 24,
      chainTargets: 3,
      desc: 'Emits a 110px gravity field that slows aliens by 50% and continuously arcs chain-lightning every 1.2s.'
    },
    battery: {
      id: 'battery',
      name: 'Aegis Flak Battery',
      chassisMatch: 'railgun',
      icon: '🚀',
      color: '#ffd700',
      auraColor: 'rgba(255, 215, 0, 0.35)',
      flakRate: 0.45,
      flakRange: 175,
      flakDamage: 20,
      flakSpeed: 520,
      desc: 'Autonomous rotary flak station firing rapid kinetic intercept bursts at incoming torpedoes and armored ships.'
    }
  }
};

export const DEFAULT_SETTINGS = {
  screenShake: 100, // 100 (Full), 50 (Reduced), 0 (Off)
  particleDensity: 'high', // 'high' | 'low'
  threatRings: true, // boolean
  floatingText: 'all', // 'all' | 'combos' | 'off'
  artStyle: 'astral', // 'astral' | 'vector' | 'comic'
  volumetricNebula: true, // boolean (v3.2)
  crtPostProcessing: true, // boolean (v3.2)
  hullDebrisShards: true, // boolean (v3.2)
  autoAim: true, // boolean (Auto-Targeting Lock)
  planetNaming: 'real' // 'real' | 'classic' | 'both'
};

export const TACTICAL_DRAFT_PERKS = [
  {
    id: 'splitNova',
    name: 'Split-Nova Catalyst',
    icon: '💥',
    desc: 'Spark Nova splits into 4 homing mini-plasmas on detonation dealing 45 damage each.'
  },
  {
    id: 'explosiveParry',
    name: 'Explosive Aegis Parry',
    icon: '🛡️',
    desc: 'Perfect Parries trigger an additional 120px concussive shockwave dealing 60 damage.'
  },
  {
    id: 'overclockedBarrels',
    name: 'Overclocked Barrels',
    icon: '⚡',
    desc: 'Orbital Turret fire rate increased by +35% for the rest of the battle.'
  },
  {
    id: 'gravityWell',
    name: 'Orbital Gravity Well',
    icon: '🌀',
    desc: 'Slain enemies pull adjacent aliens 40px closer into nova explosions.'
  },
  {
    id: 'cryoRounds',
    name: 'Cryo-Shrapnel Rounds',
    icon: '❄️',
    desc: 'Plasma bolts apply a 40% chill slow to hit targets for 2.2 seconds.'
  },
  {
    id: 'naniteSurge',
    name: 'Emergency Nanite Surge',
    icon: '💉',
    desc: 'Once per mission, when Shield drops to 0%, instantly restore 40% Core HP & Shield.'
  },
  {
    id: 'wingmanOverdrive',
    name: 'Wingman Squadron Overdrive',
    icon: '🚀',
    desc: 'AI Wingmen gain +50% fire rate and +1 max bullet pierce.'
  },
  {
    id: 'chainMomentum',
    name: 'Chain-Reaction Momentum',
    icon: '🔥',
    desc: 'Killing an alien within 1.0s of another grants +15% damage (stacks up to 5x).'
  },
  {
    id: 'volatileCores',
    name: 'Volatile Plasma Cores',
    icon: '☢️',
    desc: 'Overcharge Shot blast radius doubled with lingering plasma fire pool.'
  },
  {
    id: 'bountyProtocol',
    name: 'Bounty Hunter Protocol',
    icon: '💎',
    desc: 'Elite and heavy enemies drop +100% Star Shards and +500 bonus score.'
  }
];

// v2.9 Golden Synergy Evolution Cards (Vampire Survivors-style evolved god-tier upgrades)
export const SYNERGY_EVOLUTIONS = [
  {
    id: 'thunderstormSingularity',
    name: 'Thunderstorm Singularity',
    icon: '🌩️',
    isSynergy: true,
    badge: '🌟 SYNERGY EVOLUTION',
    synergyWith: 'Tesla Arc Cannon OR Split-Nova Catalyst',
    desc: 'Spark Novas leave a 4.0s Ionized Storm Cloud (115px) continuously zapping up to 4 enemies every 0.4s for 32 chain lightning damage!'
  },
  {
    id: 'supernovaCounterMatrix',
    name: 'Supernova Counter-Matrix',
    icon: '🪞',
    isSynergy: true,
    badge: '🌟 SYNERGY EVOLUTION',
    synergyWith: 'Explosive Aegis Parry OR Aegis Mirror Plating',
    desc: 'Phase Parry triggers a 360° Mini-EMP Shockwave (220px) and launches 3 Golden Homing Counter-Missiles at highest-HP threats!'
  },
  {
    id: 'hyperVelocityRailWall',
    name: 'Hyper-Velocity Plasma Rail-Wall',
    icon: '☄️',
    isSynergy: true,
    badge: '🌟 SYNERGY EVOLUTION',
    synergyWith: 'Railgun Lancer OR Overclocked Barrels',
    desc: 'Overcharge Shot leaves a blazing 2.5s Laser Firewall Line across space—enemies and missiles crossing it take 90 dmg/s and are slowed 60%!'
  },
  {
    id: 'absoluteZeroShatterCore',
    name: 'Absolute Zero Shatter-Core',
    icon: '❄️',
    isSynergy: true,
    badge: '🌟 SYNERGY EVOLUTION',
    synergyWith: 'Cryo-Shrapnel Rounds OR Chrono-Stasis Prism',
    desc: 'Chilled/Stasis enemies take +50% critical damage from all sources and shatter into 6 piercing ice-plasma shards upon defeat!'
  },
  {
    id: 'omegaDroneSwarm',
    name: 'Omega Drone Swarm',
    icon: '🛸',
    isSynergy: true,
    badge: '🌟 SYNERGY EVOLUTION',
    synergyWith: 'Wingman Squadron Overdrive OR Twin-Wingman Transponder',
    desc: 'Spawns 2 additional Autonomous Micro-Interceptor Drones that orbit alongside WING-01 and launch mini Spark Novas at clusters every 6s!'
  }
];

// v3.0 Orbital Shipyard Modular Turret Engineering Parts
export const SHIPYARD_PARTS = {
  barrel: {
    standard: {
      name: 'Precision Twin-Bore',
      icon: '⚙️',
      cost: 0,
      desc: 'Balanced fire rate, tight spread, +10% projectile speed.'
    },
    gatling: {
      name: 'Rotary Gatling Array',
      icon: '🔥',
      cost: 250,
      desc: '+35% fire rate, 2-round staggered burst with ±6° micro-spread (-18% per-bolt damage).'
    },
    siege: {
      name: 'Heavy Siege Fokus-Barrel',
      icon: '🎯',
      cost: 300,
      desc: '-20% fire rate, +45% bolt damage, +1 Pierce, and Overcharge charges 35% faster with wider beam.'
    }
  },
  reactor: {
    balanced: {
      name: 'Harmonic Dynamo',
      icon: '⚡',
      cost: 0,
      desc: '+10% Spark Nova recharge rate and +10% Cataclysm Core charge gain.'
    },
    frenzy: {
      name: 'Frenzy Overclock Core',
      icon: '🔥',
      cost: 280,
      desc: 'FRENZY gauge fills +35% faster and Hyper-Frenzy lasts +3.0s longer.'
    },
    cryo: {
      name: 'Cryo-Capacitor Core',
      icon: '❄️',
      cost: 280,
      desc: 'Spark Novas chill enemies 2.0s (-35% speed) and grant +15% bonus damage against chilled/stunned.'
    }
  },
  shieldMod: {
    hex: {
      name: 'Hex-Aegis Matrix',
      icon: '🛡️',
      cost: 0,
      desc: 'Standard balanced shield capacity and regen.'
    },
    parry: {
      name: 'Phase-Parry Amplifier',
      icon: '🪞',
      cost: 260,
      desc: 'Widens Aegis Phase-Parry arc by +35° and +40% reflected missile damage.'
    },
    thorn: {
      name: 'Electrostatic Thorn Dome',
      icon: '⚡',
      cost: 300,
      desc: 'Discharges 95px Tesla Thorn Arc (55 dmg) zapping attacker and up to 2 nearby enemies when shield is rammed.'
    }
  }
};

/**
 * Format celestial body name according to the active Celestial System naming setting.
 * @param {Object} planet Planet configuration object
 * @param {'real' | 'classic' | 'both'} [style='real']
 * @returns {string} Formatted planet display name
 */
export function getPlanetDisplayName(planet, style = 'real') {
  if (!planet) return '';
  const real = planet.realName || planet.name || '';
  const classic = planet.classicName || planet.name || '';
  if (style === 'classic') {
    return classic;
  }
  if (style === 'both') {
    if (classic && classic !== real) {
      return `${real} [${classic}]`;
    }
    return real;
  }
  return real;
}

