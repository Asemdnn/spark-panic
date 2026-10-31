# Spark Panic: Planetary Invasion Defense — Guardian of the Universe (v2.6 Arcade Spectacle Edition)

[![Deploy to GitHub Pages](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play_Live-GitHub_Pages-00e5ff?style=flat&logo=github)](https://asemdnn.github.io/spark-panic/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00e676?style=flat&logo=pwa)](https://asemdnn.github.io/spark-panic/)

**Spark Panic 2.6 ("Arcade Spectacle Edition")** is a high-octane, self-contained HTML5 Canvas + Tailwind CSS arcade strategy and action planetary defense game. You are the **Orbital Guardian**, defending living celestial worlds and their cyber-cities against 360° incoming waves of relentless alien invasion fleets.

- 🎮 **Play Online**: [https://asemdnn.github.io/spark-panic/](https://asemdnn.github.io/spark-panic/)
- 📦 **GitHub Repository**: [https://github.com/Asemdnn/spark-panic](https://github.com/Asemdnn/spark-panic)

---

## 🌟 What's New in v2.6: Arcade Spectacle Edition

1. **⚡ Directional Plasma Laser Bolts, Barrel Recoil & Helical [Q] Ion Beam**:
   - **Directional Plasma Capsules**: Replaced circular dots with elongated, high-velocity plasma bolts oriented along trajectory vector (`Math.atan2(b.vy, b.vx)`), rendered in additive `'lighter'` blend mode with intense white cores and colored corona glow.
   - **Railgun Lancer Shock-Rings & Wakes**: Diamond shockwave rings and lingering golden wake line trails behind hypersonic kinetic slug strikes.
   - **Turret Barrel Kickback & Muzzle Flash**: Snappy recoil kickback (`5.5px` offset decaying at `38px/s`), brilliant 4-point star-flare muzzle flash, and directional planetary rim-light glow beneath the turret barrel.
   - **Helical [Q] Orbital Ion Beam Overhaul**: Ion beam anchored precisely at turret muzzle (`planetRadius + 20`), featuring a glowing charge-sphere, wide cyan sheath, blazing white core, and high-frequency sine-wave helical energy ribbon (`Math.sin(d * 0.06 - timeSec * 28) * 14`) with counter-helix braid.

2. **🚀 High-Visibility Enemy Warheads, Ribbon Trails & Perimeter Threat Warning Chevrons**:
   - **Pointed Tactical Warheads**: Enemy siege torpedoes rendered as sharp crimson/white missile cones with flickering thruster exhaust flame and a 5-point tapering trailing smoke ribbon.
   - **Close-Orbit Trajectory & Rotating Diamond Reticle**: When warheads breach within `shieldRadius + 130px`, projected danger trajectory dotted lines and rotating red diamond lock-on reticles activate for instant tactical priority.
   - **Perimeter Radar Warning Chevrons**: Flashing offscreen radar chevrons with high-contrast warning text (`⚠️ HEAVY INCURSION`) pointing towards incoming Flagship, Dreadnought, and Dropship incursions.

3. **💥 "Supernova Spectacle": Chain-Lightning Tethers, Hull Shatter Shards & Hit-Stop**:
   - **Chain-Reaction Lightning Tethers**: Jagged 5-segment electric plasma arcs snapping between the epicenter of detonating Novas and newly obliterated alien hulls.
   - **Polygonal Hull Shatter Shards**: 3 to 5 tumbling geometric hull fragments bursting outward with randomized angular spin and fade-out trail.
   - **Concentric Multi-Ring Novas**: Supernovas render dual concentric rings — an outer rapid distortion shockwave plus an inner additive plasma blast ring.
   - **Milestone Combo Hit-Stop & Micro Bullet-Time**: Detonating x8, x12, x16, and x20+ chain combos triggers a brief cinematic hit-stop (`timeScale = 0.35` for 0.14s) accompanied by a subtle cosmic edge-vignette pulse.

4. **🌌 3-Layer Parallax Starfield, Ice Comets & Subspace Warp-Rift Portals**:
   - **3-Layer Parallax Starfield**: Background, midground, and foreground star layers with smooth camera parallax offset tracking turret rotation (`Math.cos(turretAngle) * -14 * layer`).
   - **Distant Background Ice Comets**: Cyan/white comets streaking diagonally across the deep starfield every 8-12 seconds.
   - **Subspace Warp-Rift Portals**: Swirling 55px crimson/violet subspace gateways with rotating lightning spokes and distortion ripples announcing Sector Boss arrivals prior to emergence.
   - **Title & Battle Card Badges**: Updated hero badge to `⚡ v2.6 ARCADE SPECTACLE EDITION`.

---

## 🌟 Previous Update Highlights

- **🏺 Ancient Cosmic Relics (v2.5)**: 8 collectible artifacts and 3-slot passive loadout (Chrono-Stasis, Vampiric Core, Singularity Lens, Twin Wingman, Overcharged Coil, Aegis Mirror, Starlight Synth, Supernova Echo).
- **🛰️ Deployable Orbital Defense Structures (`[R]`, v2.5)**: Solar Prism Pylon, Grav-Well Anchor, and Aegis Flak Battery.
- **📸 Holographic Commander Battle Card (v2.5)**: 1200×630 canvas exporter for social sharing.
- **🎮 Gamepad / Controller Support & Settings (v2.5)**: Dual-stick controls and custom accessibility settings.
- **👑 Titan Protocol (4-Boss Rush Gauntlet Mode, v2.4)**: Back-to-back mothership encounters with 4-second orbital repair pit-stops.
- **🤖 Autonomous AI Wingman Fighter (`WING-01`, v2.4)**: Interceptor, Vanguard, and Harvester doctrines.
- **🌌 Galactic Prestige ("Hyperdrive Ascension", v2.4)**: Ascend up to Tier V for permanent shard & score multipliers with custom turret skins.
- **📊 Post-Battle Tactical Telemetry**: Real-time integrity curve and damage attribution breakdown.
- **⚡ Daily Cosmic Anomaly**: Deterministic daily invasion challenges with unique tactical mutators.
- **🎵 Procedural Synthwave Web Audio BGM**: Dynamic chord progressions, basslines, and boss wave tempo boosts.

---

## 🌌 Core Gameplay Systems

### 1. 360° Living Central Planet & Aegis Shield
- **Living Planet**: Multi-stop radial atmospheric halo, rotating biome continents, night-side terminator shadow, optional celestial rings, and surface impact craters.
- **Aegis Energy Shield**: Absorbs all incoming damage first, displaying directional ripples upon impact. Automatically regenerates after a 3.5s delay out of combat.
- **Surface Cyber-Cities**: Four procedural settlements with dynamic beacon lighting, smoke on damage, and electrical arcs under critical conditions.

### 2. 3 Unlockable Guardian Turret Chassis (Armory Loadouts)
- **Pulse Striker (Default)**: Rapid-fire dual/triple spread cannon (`520 px/s`) with `+15%` faster passive Spark Nova recharge.
- **Tesla Arc Cannon (Unlock: 15 ★ or ✦ 350)**: High-voltage electric shock bolts that chain lightning arcs to up to 2 additional nearby invaders within 115px.
- **Quantum Railgun (Unlock: 35 ★ or ✦ 500)**: Armor-piercing hyper-velocity kinetic slugs (`880 px/s`) penetrating up to 3 alien ships with +65% boss damage.

### 3. Cascading Spark Nova Chain Reactions
- Detonating a Spark Nova vaporizes enemy torpedoes and damages alien ships.
- Destroyed aliens detonate their own class-specific secondary Novas, triggering harmonic ascending pentatonic chimes, magnetic Cosmic Sparks, combo multipliers (`x2` ... `x20+`), and Nova recharge energy.

### 4. Dynamic Sector Environmental Hazards
- **Sector I**: ☄️ *Asteroid Drift* — shoot asteroids for +15 Shards and kinetic shockwaves.
- **Sector II**: ⚡ *Ion Nebula* — Novas inside Ion Clouds gain +35% radius & +25% damage.
- **Sector III**: 🌀 *Gravitational Anomaly* — Singularity clusters invaders into high-value combo targets.
- **Sector IV**: ☀️ *Solar Corona* — Periodic Solar Flares scorch point-blank invaders and grant +15% Nova energy.

### 5. Mid-Battle Orbital Supply Pods
- Glowing tactical pods drift across the battlefield with pulsating parachutes.
- Shoot pods to trigger 1 of 4 instant combat buffs:
  - ⚡ *Overdrive Rapid-Fire (8s)*
  - 🛡️ *Instant Aegis Shield Surge (+65%)*
  - 💥 *Free Mega-Nova (+2 Charges)*
  - ❄️ *Cryo Time-Warp (alien speed reduced by 60% for 6s)*

### 6. Three Active Tactical Planetary Skills
- **`[Q]` or `[1]` Tactical Ion Beam** (`9s` cd): Piercing laser beam along turret aim vector dealing continuous damage.
- **`[W]` or `[2]` Planetary EMP Shockwave** (`12s` cd): Vaporizes all missiles, pushes enemies outward 75px, and stuns for 3.0s.
- **`[E]` or `[3]` Aegis Overdrive** (`14s` cd): Restores 55% shield, grants +1 Nova charge, and overclocks weapon fire rates for 6.0s.

---

## 🗺️ Campaign: 4 Sectors, 20 Planets & Game Modes

1. **Sector I: Inner Sanctuaries** (Cyan): Aerilon, Aquatis, Solaria, Verdantia, Cryon — **BOSS: Dreadnought Vexor**
2. **Sector II: Nebula Frontier** (Magenta): Pyros, Zephyria, Obsidian, Lumina, Vortexia — **BOSS: Mothership Kaelen**
3. **Sector III: Dark Rift** (Gold): Aethelgard, Chronos, Mycelia, Ferrum, Eclipse — **BOSS: Void Harbinger**
4. **Sector IV: Sol Genesis** (Crimson): Hyperion, Astralis, Voidreach, Omega Prime, Genesis Core — **BOSS: The Apex Leviathan**
5. **👑 Titan Protocol**: 4-boss rush gauntlet with inter-wave tactical pit-stops and fast-time records.
6. **Endless Cosmic Siege (`WAVE X / ∞`)**: Infinitely scaling survival siege with 3-wave dynamic biome and sector hazard rotation.
7. **⚡ Daily Cosmic Anomaly**: Procedural worldwide challenge with unique tactical mutators and daily shard rewards.

---

## 👾 Invading Alien Armada Classes

| Class | Color | HP | Speed | Role | Death Payload |
|---|---|---|---|---|---|
| **Alien Scout** | Cyan | 22 | 62 px/s | Inward Spiral Ramming | Standard Plasma Chain Nova |
| **Trident Interceptor** | Magenta | 40 | 48 px/s | Mid-Range Torpedo Skirmisher | **Quad Plasma Burst** (4-way cross) |
| **Cryo-Cruiser** | Mint | 48 | 42 px/s | Stasis Warship | **Cryo Stasis Field** (75% slow for 4.5s) |
| **Phase-Shifter** | Purple | 38 | 55 px/s | Quantum Warp Infiltrator | **Echo Warp Nova** (delayed second blast) |
| **Invasion Dropship** | Crimson | 75 | 34 px/s | Heavy Siege Lander | Heavy Shrapnel Cascade + spawns Scouts |
| **Solar Dreadnought** | Gold | 135 | 26 px/s | Capital Battleship | **Solar Super-Nova** (135px blast) |
| **Sector Mothership** | Red | 950–1800 | 20 px/s | Armada Command Flagship | **Galaxy Super-Nova** (210px screen blast) |

---

## ⌨️ Tactical Controls & Hotkeys

| Action | Control / Hotkey |
|---|---|
| **Aim Orbital Turret** | Move Mouse / Touch Drag |
| **Detonate Spark Nova** | Left Click / Tap Deep Space / `[Space]` |
| **Orbital Ion Beam** | `[Q]` or `[1]` |
| **Planetary EMP Shockwave** | `[W]` or `[2]` |
| **Aegis Overdrive** | `[E]` or `[3]` |
| **Toggle Auto-Fire** | `[T]` |
| **Toggle Synthwave BGM** | `[B]` |
| **Toggle Sound Effects Mute** | `[M]` |
| **Replay Tactical Tutorial** | `[H]` |
| **Tactical Pause / Resume** | `[P]` or `[Escape]` |
| **Quick Restart Mission** | `[R]` |

---

## 💾 Quantum Encrypted Save Backup

- Automatic persistence across browser sessions in `localStorage`.
- Base64 quantum save export & import in the **Guardian Archives & Alien Codex (`#modalCodex`)** modal for cross-device migration.

---

## 🏗️ Development & Automated Testing

```bash
# Install dependencies
npm install

# Run automated test suite (122 tests across 15 suites)
npm test

# Start local Vite development server
npm run dev

# Build production bundle for GitHub Pages
npm run build
```

---

## 📄 License
MIT License.
