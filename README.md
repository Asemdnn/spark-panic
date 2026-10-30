# Spark Panic: Planetary Invasion Defense — Guardian of the Universe (v2.5 Commander's Ultimate Edition)

[![Deploy to GitHub Pages](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play_Live-GitHub_Pages-00e5ff?style=flat&logo=github)](https://asemdnn.github.io/spark-panic/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00e676?style=flat&logo=pwa)](https://asemdnn.github.io/spark-panic/)

**Spark Panic 2.5 ("Commander's Ultimate Edition")** is a high-octane, self-contained HTML5 Canvas + Tailwind CSS arcade strategy and action planetary defense game. You are the **Orbital Guardian**, defending living celestial worlds and their cyber-cities against 360° incoming waves of relentless alien invasion fleets.

- 🎮 **Play Online**: [https://asemdnn.github.io/spark-panic/](https://asemdnn.github.io/spark-panic/)
- 📦 **GitHub Repository**: [https://github.com/Asemdnn/spark-panic](https://github.com/Asemdnn/spark-panic)

---

## 🌟 What's New in v2.5: Commander's Ultimate Edition

1. **🏺 Ancient Cosmic Relics (8 Artifacts & 3-Slot Passive Loadout)**:
   - Deep RPG theorycrafting layer equipped in the **Guardian Armory (`#modalArmory`)**.
   - Equip up to **3 active Relics** simultaneously:
     - ⏳ **Chrono-Stasis Prism**: Triggers a 4.0s 65% Time-Dilation Slow Field across all aliens when Aegis Shield breaks.
     - 🩸 **Vampiric Core Matrix**: Restores +15 Core HP and +25 Shield whenever a combo reaches x8 or higher.
     - 🌀 **Singularity Gravity Lens**: Spark Novas pull aliens within 320px inward toward the blast center by 135px.
     - ✈️ **Twin-Wingman Transponder**: Deploys a second autonomous fighter (**`WING-02`**) in opposite orbital formation.
     - ⚡ **Overcharged Capacitor Coil**: Every 4th turret shot fires an Overcharged Plasma Bolt (2.2x dmg + 2 chain arcs).
     - 🛡️ **Aegis Mirror Plating**: When Shield > 50%, 40% chance to ricochet torpedoes back as friendly homing missiles!
     - 💎 **Starlight Synthesizer**: +35% Star Shard drops and Supply Pods grant +1 bonus Spark Nova charge.
     - ☀️ **Supernova Echo Core**: Novas leave a 2.5s burning Solar Ember Zone dealing 35 dmg/s DoT.
   - **Guaranteed Relic Drops**: Defeating any Sector Boss, completing Daily Anomaly, or clearing Titan Protocol awards a guaranteed unowned Relic!

2. **🛰️ Deployable Orbital Defense Structures (`[R]` / `[4]` / HUD Button)**:
   - Deploy tactical defensive stations into mid-orbit (`shieldRadius + 75px`) for 14.0s (16s base cooldown, scales with reactor upgrades, max 2 active).
   - Adapts to equipped Turret Chassis:
     - **Solar Prism Pylon** (Pulse Striker): Refracts incoming turret lasers into 3 superheated fan beams (+30% dmg) and point-defense zaps torpedoes.
     - **Grav-Well Anchor** (Tesla Cannon): Generates a continuous 110px 50% slow aura and emits chain lightning every 1.2s.
     - **Aegis Flak Battery** (Railgun Lancer): Rotary dual-flak turret firing rapid kinetic intercept bursts at torpedoes and capital ships.

3. **📸 Shareable Holographic "Commander Battle Card" Generator**:
   - High-resolution **1200×630 offscreen canvas** export in Victory, Defeat, and Codex modals.
   - Renders deep-space starfield, cybernetic frame, Commander rank, star badges, telemetry sparkline, and active loadout (Chassis, Wingman, Skin, and 3 Relics).
   - Instant **`💾 Download PNG Card`** and **`📋 Copy Image / Stats to Clipboard`** with Discord/social text fallback.

4. **🎮 Full HTML5 Gamepad / Controller Support & ⚙️ Tactical Settings**:
   - **Twin-Stick Gamepad Loop**: Left stick aims turret, Right stick moves glowing tactical reticle, RT/A detonates Spark Nova, LT fires cannon, X/Y/B/RB trigger Q/W/E/R skills, Start pauses.
   - **Tactical Settings Modal (`[O]` / ⚙️)**: Screen Shake (100% / 50% / Off), Particle Density (High / Low), High-Contrast Threat Rings (On / Off), Damage Numbers & Floating Text (All / Combos Only / Off).
   - **Title UI Polish**: Fixed duplicate crown glyph on `👑 TITAN PROTOCOL GAUNTLET` button.

---

## 🌟 Previous Update Highlights

- **👑 Titan Protocol (4-Boss Rush Gauntlet Mode)**: Back-to-back mothership encounters with 4-second orbital repair pit-stops.
- **🤖 Autonomous AI Wingman Fighter (`WING-01`) & 3 Doctrines**: Interceptor, Vanguard, and Harvester doctrines.
- **🌌 Galactic Prestige ("Hyperdrive Ascension")**: Ascend up to Tier V for permanent shard & score multipliers with custom turret skins.
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
