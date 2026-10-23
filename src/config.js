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
    glowColor: 'rgba(0, 240, 255, 0.65)',
    blastRadius: 96,
    blastDuration: 2.8, // seconds
    score: 100,
    speed: 130
  },
  [SPARK_TYPES.MEGA]: {
    name: 'Mega Spark',
    radius: 20,
    color: '#ffe600',
    glowColor: 'rgba(255, 230, 0, 0.75)',
    blastRadius: 180,
    blastDuration: 3.4,
    score: 250,
    speed: 85
  },
  [SPARK_TYPES.SPLITTER]: {
    name: 'Splitter Spark',
    radius: 15,
    color: '#ff00aa',
    glowColor: 'rgba(255, 0, 170, 0.75)',
    blastRadius: 88,
    blastDuration: 2.4,
    score: 200,
    speed: 140,
    dartCount: 4,
    dartSpeed: 450,
    dartRadius: 28,
    dartMaxDist: 480
  },
  [SPARK_TYPES.FREEZE]: {
    name: 'Frost Spark',
    radius: 16,
    color: '#00ffa3',
    glowColor: 'rgba(0, 255, 163, 0.75)',
    blastRadius: 110,
    blastDuration: 3.2,
    score: 180,
    speed: 95,
    slowFactor: 0.25,
    slowDuration: 4.0
  },
  [SPARK_TYPES.REPULSOR]: {
    name: 'Phase Spark',
    radius: 15,
    color: '#b55fe6',
    glowColor: 'rgba(181, 95, 230, 0.75)',
    blastRadius: 105,
    blastDuration: 3.0,
    score: 220,
    speed: 130,
    secondaryBlastDelay: 0.8
  }
};

// 20 progressive handcrafted levels (tuned for realistic cascading fun)
export const LEVELS = [
  {
    level: 1,
    title: 'First Spark',
    totalSparks: 18,
    target: 4,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 18 },
    tip: 'Tap near sparks to kickstart your first chain reaction!'
  },
  {
    level: 2,
    title: 'Chain Beginner',
    totalSparks: 24,
    target: 8,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 24 },
    tip: 'Wait until sparks cluster closely together.'
  },
  {
    level: 3,
    title: 'Golden Dawn',
    totalSparks: 28,
    target: 14,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 23, [SPARK_TYPES.MEGA]: 5 },
    tip: 'Mega Sparks create a massive detonation wave!'
  },
  {
    level: 4,
    title: 'Double Tap',
    totalSparks: 36,
    target: 20,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 30, [SPARK_TYPES.MEGA]: 6 },
    tip: 'You have 2 taps. Use the second to catch stragglers.'
  },
  {
    level: 5,
    title: 'Shatter Star',
    totalSparks: 34,
    target: 18,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 26, [SPARK_TYPES.SPLITTER]: 8 },
    tip: 'Splitter Sparks shoot high-speed homing darts!'
  },
  {
    level: 6,
    title: 'Chain Reaction',
    totalSparks: 42,
    target: 26,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 30, [SPARK_TYPES.MEGA]: 6, [SPARK_TYPES.SPLITTER]: 6 },
    tip: 'Target Mega sparks to kickstart massive combos.'
  },
  {
    level: 7,
    title: 'Deep Freeze',
    totalSparks: 40,
    target: 22,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 30, [SPARK_TYPES.FREEZE]: 10 },
    tip: 'Frost Sparks slow surrounding orbs to trap them.'
  },
  {
    level: 8,
    title: 'Cold Snap',
    totalSparks: 46,
    target: 30,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 28, [SPARK_TYPES.FREEZE]: 10, [SPARK_TYPES.MEGA]: 8 },
    tip: 'Freeze orbs first, then detonate the pack with Mega.'
  },
  {
    level: 9,
    title: 'Phase Shift',
    totalSparks: 44,
    target: 26,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 26, [SPARK_TYPES.REPULSOR]: 10, [SPARK_TYPES.SPLITTER]: 8 },
    tip: 'Phase Sparks trigger a secondary shockwave ring.'
  },
  {
    level: 10,
    title: 'Cascade Protocol',
    totalSparks: 50,
    target: 34,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 26, [SPARK_TYPES.MEGA]: 8, [SPARK_TYPES.SPLITTER]: 8, [SPARK_TYPES.FREEZE]: 8 },
    tip: 'All special sparks unite! Look for high-density clusters.'
  },
  {
    level: 11,
    title: 'Critical Mass',
    totalSparks: 54,
    target: 38,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 28, [SPARK_TYPES.MEGA]: 10, [SPARK_TYPES.SPLITTER]: 10, [SPARK_TYPES.REPULSOR]: 6 },
    tip: 'Aim for high-traffic intersections.'
  },
  {
    level: 12,
    title: 'Needle Thread',
    totalSparks: 48,
    target: 32,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 22, [SPARK_TYPES.SPLITTER]: 16, [SPARK_TYPES.MEGA]: 10 },
    tip: '1 tap only! Splitters will do the heavy lifting.'
  },
  {
    level: 13,
    title: 'Absolute Zero',
    totalSparks: 56,
    target: 40,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 26, [SPARK_TYPES.FREEZE]: 15, [SPARK_TYPES.MEGA]: 15 },
    tip: 'Use freeze waves to bunch sparks together.'
  },
  {
    level: 14,
    title: 'Supernova Surge',
    totalSparks: 62,
    target: 45,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 22, [SPARK_TYPES.MEGA]: 20, [SPARK_TYPES.SPLITTER]: 12, [SPARK_TYPES.REPULSOR]: 8 },
    tip: 'Mega explosions create chain dominos across the screen.'
  },
  {
    level: 15,
    title: 'Quantum Field',
    totalSparks: 66,
    target: 48,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 26, [SPARK_TYPES.MEGA]: 15, [SPARK_TYPES.SPLITTER]: 15, [SPARK_TYPES.FREEZE]: 10 },
    tip: 'Patience is key: let sparks group naturally.'
  },
  {
    level: 16,
    title: 'One Shot Wonder',
    totalSparks: 52,
    target: 38,
    taps: 1,
    types: { [SPARK_TYPES.NORMAL]: 16, [SPARK_TYPES.MEGA]: 16, [SPARK_TYPES.SPLITTER]: 12, [SPARK_TYPES.REPULSOR]: 8 },
    tip: 'Trigger a Mega spark at the center for a massive cascade!'
  },
  {
    level: 17,
    title: 'Storm Chaser',
    totalSparks: 70,
    target: 52,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 25, [SPARK_TYPES.MEGA]: 15, [SPARK_TYPES.SPLITTER]: 15, [SPARK_TYPES.FREEZE]: 15 },
    tip: 'Watch for the freeze slow-motion window.'
  },
  {
    level: 18,
    title: 'Hyper Pulse',
    totalSparks: 75,
    target: 58,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 25, [SPARK_TYPES.MEGA]: 20, [SPARK_TYPES.SPLITTER]: 18, [SPARK_TYPES.REPULSOR]: 12 },
    tip: 'Combos above 30 yield huge bonus points.'
  },
  {
    level: 19,
    title: 'Singularity',
    totalSparks: 80,
    target: 64,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 20, [SPARK_TYPES.MEGA]: 25, [SPARK_TYPES.SPLITTER]: 20, [SPARK_TYPES.FREEZE]: 15 },
    tip: 'Trigger the mega clusters near the center.'
  },
  {
    level: 20,
    title: 'Master of Sparks',
    totalSparks: 90,
    target: 72,
    taps: 2,
    types: { [SPARK_TYPES.NORMAL]: 20, [SPARK_TYPES.MEGA]: 25, [SPARK_TYPES.SPLITTER]: 25, [SPARK_TYPES.FREEZE]: 10, [SPARK_TYPES.REPULSOR]: 10 },
    tip: 'The ultimate chain reaction challenge. Good luck!'
  }
];

export const COMBO_TITLES = [
  { min: 4, text: 'GOOD!', color: '#00f0ff' },
  { min: 8, text: 'GREAT!', color: '#00ffa3' },
  { min: 15, text: 'AWESOME!', color: '#ffe600' },
  { min: 25, text: 'MEGA BLAST!', color: '#ff8800' },
  { min: 38, text: 'SUPERNOVA!', color: '#ff00aa' },
  { min: 50, text: 'GODLIKE CHAIN!', color: '#e040fb' }
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
