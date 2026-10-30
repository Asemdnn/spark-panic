# Spark Panic: Planetary Invasion Defense — Guardian of the Universe (v2.4 Titan Protocol & Wingman AI Edition)

[![Deploy to GitHub Pages](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play_Live-GitHub_Pages-00e5ff?style=flat&logo=github)](https://asemdnn.github.io/spark-panic/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00e676?style=flat&logo=pwa)](https://asemdnn.github.io/spark-panic/)

**Spark Panic 2.4** is a high-octane, self-contained HTML5 Canvas + Tailwind CSS arcade strategy and action planetary defense game. You are the **Orbital Guardian**, defending living celestial worlds and their cyber-cities against 360° incoming waves of relentless alien invasion fleets.

- 🎮 **Play Online**: [https://asemdnn.github.io/spark-panic/](https://asemdnn.github.io/spark-panic/)
- 📦 **GitHub Repository**: [https://github.com/Asemdnn/spark-panic](https://github.com/Asemdnn/spark-panic)

---

## 🌟 What's New in v2.4: Titan Protocol, Wingman AI & Prestige System

1. **👑 Titan Protocol (4-Boss Rush Gauntlet Mode)**:
   - Accessible directly from the **Title Screen** and **Star Map** header.
   - 4 back-to-back supreme flagship encounters:
     - **Wave 1**: *Dreadnought Vexor* (Sector I Flagship) + Scout/Interceptor escort + `Asteroid Drift`.
     - **Wave 2**: *Mothership Kaelen* (Sector II Flagship) + Cryo-Cruiser/Phaser escort + `Ion Nebula`.
     - **Wave 3**: *Void Harbinger* (Sector III Flagship) + Dropship/Dreadnought escort + `Gravity Anomaly`.
     - **Wave 4**: *The Apex Leviathan* (Sector IV Supreme Flagship) + Elite Armada escort + `Solar Corona`.
   - **4-Second Orbital Pit-Stop**: Defeating each boss triggers a tactical intermission restoring **`+35% Planetary Shield`**, **`+15% Core HP`**, and **`+2 Spark Nova Charges`** with repair nanite visuals.
   - **Rewards & Records**: Fast-time completion tracking (`bestBossRushTime`), **`+300 ✦`** first-clear bonus, **`+100 ✦`** repeat clear, and the 7th Guardian Trophy **`👑 Titan Protocol Conqueror`**.

2. **🤖 Autonomous AI Wingman Fighter (`WING-01`) & 3 Tactical Doctrines**:
   - Free-flying delta-wing starfighter patrolling deep orbital space outside the satellite perimeter.
   - Automatically unlocks when **Autonomous Satellites reach Lv.2** or can be unlocked early in the Armory for **`✦ 200`** Star Shards.
   - **3 Selectable Combat Doctrines**:
     - `🛡️ AEGIS INTERCEPTOR`: High-speed patrol (`190 px/s`), prioritizes red alien siege torpedoes and fast Scouts with rapid twin cyan pulse lasers (`520 px/s`, dmg 14).
     - `⚔️ VANGUARD STRIKER`: Seeks out highest-HP capital targets (Bosses, Dreadnoughts), firing heavy golden plasma rockets every 1.6s (`+40%` armor damage + mini-splash).
     - `🧲 NOVA HARVESTER`: Sweeps for Sparks & Supply Pods, boosts passive Nova recharge by `+20%`, and drops floating **Plasma Proximity Mines** every 5.0s (70px chain detonation).

3. **🌌 Galactic Prestige ("Hyperdrive Ascension") & Turret Hull Skins**:
   - **Hyperdrive Ascension (Prestige)**: Unlocked after earning 45+ Campaign Stars or clearing Planet 20. Ascend up to **Tier V** to earn permanent **`+25% Star Shards`** and **`+20% Score`** per tier while aliens gain `+20%` HP and speed. All chassis loadouts, upgrades, wingman doctrines, shards, trophies, and skins are 100% preserved.
   - **Turret Hull Skins & Plasma Trails**:
     - *Cyan Sentinel*: Standard cyber-cyan titanium chassis (Default, 0 ★).
     - *Solar Sovereign*: Golden star-metal hull radiating solar warmth (20 ★).
     - *Crimson Valkyrie*: Aggressive crimson nano-alloy hull (40 ★).
     - *Void Prismatic*: Polychromatic quantum-woven hull (60 ★ or Ascension Tier I+).

4. **📊 Post-Battle Tactical Telemetry Sparkline & Self-Contained PWA**:
   - High-fidelity **280x56px HTML5 Canvas Sparkline Graph** in Victory and Defeat modals plotting the real-time Planetary Integrity curve (`#00e676`) alongside Combo Peak spikes (`#e040fb`).
   - **Damage Attribution Breakdown Bar**: Computes percentage contributions from Turret Cannons vs Spark Novas vs AI Wingman/Satellites.
   - **Zero-404 Data-URI Manifest**: Embedded data-URI `<link rel="manifest">` with inline SVG icons guaranteeing clean launches across all GitHub Pages subpaths.

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
