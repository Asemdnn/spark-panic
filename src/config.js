// Spark Panic - Game Configuration & Balance Tuning

export const CANVAS_VIRTUAL_WIDTH = 720;
export const CANVAS_VIRTUAL_HEIGHT = 1280;

export const SPARK_TYPES = {
  NORMAL: 'NORMAL',
  MEGA: 'MEGA',
  SPLITTER: 'SPLITTER',
  FREEZE: 'FREEZE',
  REPULSOR: 'REPULSOR'
};

export const SPARK_CONFIG = {
  [SPARK_TYPES.NORMAL]: {
    name: 'Spark',
    radius: 14,
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.6)',
    blastRadius: 52,
    blastDuration: 1.6, // seconds
    score: 100,
    speed: 100
  },
  [SPARK_TYPES.MEGA]: {
    name: 'Mega Spark',
    radius: 20,
    color: '#ffe600',
    glowColor: 'rgba(255, 230, 0, 0.7)',
    blastRadius: 95,
    blastDuration: 2.1,
    score: 250,
    speed: 70
  },
  [SPARK_TYPES.SPLITTER]: {
    name: 'Splitter Spark',
    radius: 15,
    color: '#ff00aa',
    glowColor: 'rgba(255, 0, 170, 0.7)',
    blastRadius: 46,
    blastDuration: 1.4,
    score: 200,
    speed: 110,
    dartCount: 4,
    dartSpeed: 380,
    dartRadius: 26
  },
  [SPARK_TYPES.FREEZE]: {
    name: 'Frost Spark',
    radius: 16,
    color: '#00ffa3',
    glowColor: 'rgba(0, 255, 163, 0.7)',
    blastRadius: 65,
    blastDuration: 2.4,
    score: 180,
    speed: 85,
    slowFactor: 0.3,
    slowDuration: 3.5
  },
  [SPARK_TYPES.REPULSOR]: {
    name: 'Phase Spark',
    radius: 15,
    color: '#b55fe6',
    glowColor: 'rgba(181, 95, 230, 0.7)',
    blastRadius: 58,
    blastDuration: 1.8,
    score: 220,
    speed: 120,
    secondaryBlastDelay: 0.6
  }
};

// 20 progressive handcrafted levels
export const LEVELS = [
  {
    level: 1,
    title: 'First Spark',
    totalSparks: 15,
    target: 8,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 15 },
    tip: 'Tap anywhere to trigger a chain reaction!'
  },
  {
    level: 2,
    title: 'Chain Beginner',
    totalSparks: 22,
    target: 14,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 22 },
    tip: 'Wait until sparks cluster closely together.'
  },
  {
    level: 3,
    title: 'Golden Dawn',
    totalSparks: 26,
    target: 18,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 22, [SPARK_TYPES.MEGA]: 4 },
    tip: 'Mega Sparks create a massive detonation wave!'
  },
  {
    level: 4,
    title: 'Double Tap',
    totalSparks: 35,
    target: 25,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 30, [SPARK_TYPES.MEGA]: 5 },
    tip: 'You have 2 taps. Use the second to catch stragglers.'
  },
  {
    level: 5,
    title: 'Shatter Star',
    totalSparks: 32,
    target: 24,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 24, [SPARK_TYPES.SPLITTER]: 8 },
    tip: 'Splitter Sparks shoot high-speed homing darts!'
  },
  {
    level: 6,
    title: 'Chain Reaction',
    totalSparks: 40,
    target: 30,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 28, [SPARK_TYPES.MEGA]: 6, [SPARK_TYPES.SPLITTER]: 6 },
    tip: 'Target the Mega sparks to kickstart massive combos.'
  },
  {
    level: 7,
    title: 'Deep Freeze',
    totalSparks: 38,
    target: 28,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 28, [SPARK_TYPES.FREEZE]: 10 },
    tip: 'Frost Sparks slow surrounding orbs to trap them.'
  },
  {
    level: 8,
    title: 'Cold Snap',
    totalSparks: 45,
    target: 36,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 28, [SPARK_TYPES.FREEZE]: 9, [SPARK_TYPES.MEGA]: 8 },
    tip: 'Freeze orbs first, then detonate the pack with Mega.'
  },
  {
    level: 9,
    title: 'Phase Shift',
    totalSparks: 42,
    target: 32,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 24, [SPARK_TYPES.REPULSOR]: 10, [SPARK_TYPES.SPLITTER]: 8 },
    tip: 'Phase Sparks trigger a secondary shockwave ring.'
  },
  {
    level: 10,
    title: 'Cascade Protocol',
    totalSparks: 50,
    target: 40,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 24, [SPARK_TYPES.MEGA]: 8, [SPARK_TYPES.SPLITTER]: 10, [SPARK_TYPES.FREEZE]: 8 },
    tip: 'All special sparks unite! Look for high-density clusters.'
  },
  {
    level: 11,
    title: 'Critical Mass',
    totalSparks: 52,
    target: 44,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 26, [SPARK_TYPES.MEGA]: 10, [SPARK_TYPES.SPLITTER]: 10, [SPARK_TYPES.REPULSOR]: 6 },
    tip: 'Aim for high-traffic intersections.'
  },
  {
    level: 12,
    title: 'Needle Thread',
    totalSparks: 45,
    target: 38,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 20, [SPARK_TYPES.SPLITTER]: 15, [SPARK_TYPES.MEGA]: 10 },
    tip: '1 tap only! Splitters will do the heavy lifting.'
  },
  {
    level: 13,
    title: 'Absolute Zero',
    totalSparks: 55,
    target: 45,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 25, [SPARK_TYPES.FREEZE]: 15, [SPARK_TYPES.MEGA]: 15 },
    tip: 'Use freeze waves to bunch sparks together.'
  },
  {
    level: 14,
    title: 'Supernova Surge',
    totalSparks: 60,
    target: 50,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 20, [SPARK_TYPES.MEGA]: 20, [SPARK_TYPES.SPLITTER]: 12, [SPARK_TYPES.REPULSOR]: 8 },
    tip: 'Mega explosions create chain dominos across the screen.'
  },
  {
    level: 15,
    title: 'Quantum Field',
    totalSparks: 65,
    target: 55,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 25, [SPARK_TYPES.MEGA]: 15, [SPARK_TYPES.SPLITTER]: 15, [SPARK_TYPES.FREEZE]: 10 },
    tip: 'Patience is key: let sparks group naturally.'
  },
  {
    level: 16,
    title: 'One Shot Wonder',
    totalSparks: 50,
    target: 45,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 15, [SPARK_TYPES.MEGA]: 15, [SPARK_TYPES.SPLITTER]: 12, [SPARK_TYPES.REPULSOR]: 8 },
    tip: 'Almost full screen wipe needed with only 1 tap!'
  },
  {
    level: 17,
    title: 'Storm Chaser',
    totalSparks: 70,
    target: 60,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 25, [SPARK_TYPES.MEGA]: 15, [SPARK_TYPES.SPLITTER]: 15, [SPARK_TYPES.FREEZE]: 15 },
    tip: 'Watch for the freeze slow-motion window.'
  },
  {
    level: 18,
    title: 'Hyper Pulse',
    totalSparks: 75,
    target: 65,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 25, [SPARK_TYPES.MEGA]: 20, [SPARK_TYPES.SPLITTER]: 18, [SPARK_TYPES.REPULSOR]: 12 },
    tip: 'Combos above 30 yield huge bonus points.'
  },
  {
    level: 19,
    title: 'Singularity',
    totalSparks: 80,
    target: 72,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 20, [SPARK_TYPES.MEGA]: 25, [SPARK_TYPES.SPLITTER]: 20, [SPARK_TYPES.FREEZE]: 15 },
    tip: 'Trigger the mega clusters near the center.'
  },
  {
    level: 20,
    title: 'Master of Sparks',
    totalSparks: 90,
    target: 82,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 20, [SPARK_TYPES.MEGA]: 25, [SPARK_TYPES.SPLITTER]: 25, [SPARK_TYPES.FREEZE]: 10, [SPARK_TYPES.REPULSOR]: 10 },
    tip: 'The ultimate chain reaction challenge. Good luck!'
  }
];

export const COMBO_TITLES = [
  { min: 5, text: 'GOOD!', color: '#00f0ff' },
  { min: 10, text: 'GREAT!', color: '#00ffa3' },
  { min: 18, text: 'AWESOME!', color: '#ffe600' },
  { min: 28, text: 'MEGA BLAST!', color: '#ff8800' },
  { min: 40, text: 'SUPERNOVA!', color: '#ff00aa' },
  { min: 55, text: 'GODLIKE CHAIN!', color: '#e040fb' }
];

// Pentatonic scale frequencies for musical combo escalation
export const COMBO_MELODY_FREQS = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.00  // A6
];
