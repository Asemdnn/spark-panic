# Spark Panic: Planetary Invasion Defense — Guardian of the Universe (v2.3 Galactic Operations Edition)

[![Deploy to GitHub Pages](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play_Live-GitHub_Pages-00e5ff?style=flat&logo=github)](https://asemdnn.github.io/spark-panic/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00e676?style=flat&logo=pwa)](https://asemdnn.github.io/spark-panic/)

**Spark Panic 2.3** is a high-octane, self-contained HTML5 Canvas + Tailwind CSS arcade strategy and action planetary defense game. You are the **Orbital Guardian**, defending living celestial worlds and their cyber-cities against 360° incoming waves of relentless alien invasion fleets.

- 🎮 **Play Online**: [https://asemdnn.github.io/spark-panic/](https://asemdnn.github.io/spark-panic/)
- 📦 **GitHub Repository**: [https://github.com/Asemdnn/spark-panic](https://github.com/Asemdnn/spark-panic)

---

## 🌟 What's New in v2.3: Galactic Operations & Polish

1. **Interactive 3-Step Holographic Commander Tutorial**:
   - First-time commanders on Planet 1 (Aerilon) receive instant tactical guidance.
   - Step 1: 360° Orbital Turret Aiming.
   - Step 2: Cascading Spark Nova Detonation & Alien Target Reticle.
   - Step 3: Tactical Planetary Abilities & Orbital Supply Pods.
   - Grants a **`+50 ✦`** Star Shards bonus on completion.
   - Replay anytime using the **`🎓 Tutorial`** HUD pill or by pressing **`[H]`**.

2. **Living Planetary Surface Cyber-Cities & Victory Fireworks**:
   - Four procedural surface settlements anchored at 0°, 90°, 180°, and 270° with spires, energy cupolas, and dynamic window grids.
   - **Dynamic City States**:
     - *Normal (>70% Core HP)*: Cyan/gold rooftop beacons with gentle breathing pulses.
     - *Damaged (35–70% Core HP)*: Warning amber flickers and billows of black smoke.
     - *Critical (<35% Core HP)*: Rapid crimson emergency strobes, blackened structures, and crackling electrical arcs.
   - **Celebratory Fireworks**: Conquering a planet launches orbital fireworks from surviving surface cities in celebratory bursts.

3. **⚡ Daily Cosmic Anomaly Mode**:
   - Deterministic worldwide daily challenge generated via seeded PRNG (`mulberry32` from `YYYY-MM-DD`).
   - Pairs a unique celestial world and sector hazard with **2 Tactical Mutators** (e.g. *Hyper-Capacitor, Swarm Blitz, Supernova Chain, Glass Aegis, Meteor Storm, Boss Rush*).
   - High score tracking and a **`+150 ✦`** Star Shards first-clear bonus each calendar day.

4. **Progressive Web App (PWA) Offline & Mobile Support**:
   - Installable on Android, iOS, Windows, and macOS via `manifest.json`.
   - Lightweight Service Worker (`sw.js`) with a network-first strategy ensuring instantaneous updates from GitHub Pages while caching full offline playability.

---

## 🌌 Core Gameplay Systems

### 1. 360° Living Central Planet & Aegis Shield
- **Living Planet**: Multi-stop radial atmospheric halo, clipped rotating biome continents, night-side terminator shadow, optional celestial rings, and surface impact craters upon hull damage.
- **Aegis Energy Shield**: Absorbs all incoming damage first, displaying directional ripples upon impact. Automatically regenerates after a 3.5s delay out of combat.
- **Surface Cyber-Cities**: Visual representation of the planet's vitality with dynamic beacons, warning smoke, and critical emergency arcs.

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

## 🗺️ Campaign: 4 Sectors, 20 Planets & Endless Mode

1. **Sector I: Inner Sanctuaries** (Cyan)
   - Aerilon, Aquatis, Solaria, Verdantia, Cryon — **BOSS: Dreadnought Vexor**
2. **Sector II: Nebula Frontier** (Magenta)
   - Pyros, Zephyria, Obsidian, Lumina, Vortexia — **BOSS: Mothership Kaelen**
3. **Sector III: Dark Rift** (Gold)
   - Aethelgard, Chronos, Mycelia, Ferrum, Eclipse — **BOSS: Void Harbinger**
4. **Sector IV: Sol Genesis** (Crimson)
   - Hyperion, Astralis, Voidreach, Omega Prime, Genesis Core — **BOSS: The Apex Leviathan**
5. **Endless Cosmic Siege (`WAVE X / ∞`)**:
   - Infinitely scaling survival siege with 3-wave dynamic biome and sector hazard rotation and personal best wave tracking.

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
| **Sector Mothership** | Red | 950 | 20 px/s | Armada Command Flagship | **Galaxy Super-Nova** (210px screen blast) |

---

## 🎹 Procedural Web Audio Synthwave BGM

- Dynamic multi-track procedural synth engine using Web Audio API (`OscillatorNode`, `BiquadFilterNode`, and `GainNode`).
- Features driving 80s synth basslines, atmospheric neon chord pads, four-on-the-floor kick and hi-hat percussion.
- Automatically boosts tempo (`+25 BPM`) and adds high-tempo arpeggiator sixteenth notes during Sector Boss encounters.
- Toggle anytime via top HUD button or **`[B]`** hotkey.

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

# Run automated test suite (Vitest)
npm run test

# Start local Vite development server
npm run dev

# Build production bundle for GitHub Pages
npm run build
```

---

## 📄 License
MIT License.
