# Spark Panic: Planetary Invasion Defense — Guardian of the Universe (2.0 Planetary Invasion Edition)

[![Deploy to GitHub Pages](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play_Live-GitHub_Pages-00e5ff?style=flat&logo=github)](https://asemdnn.github.io/spark-panic/)

**Spark Panic 2.0** is a massively upgraded, self-contained HTML5 Canvas + Tailwind CSS arcade strategy/action planetary defense game. You are the **Orbital Guardian**, defending living celestial worlds at the center of the screen against 360° incoming waves of relentless alien invasion fleets.

- 🎮 **Play Online**: [https://asemdnn.github.io/spark-panic/](https://asemdnn.github.io/spark-panic/)
- 📦 **GitHub Repository**: [https://github.com/Asemdnn/spark-panic](https://github.com/Asemdnn/spark-panic)

---

## 🌌 Key Features & Mechanics

### 1. 360° Living Central Planet & Aegis Shield
- **Living Planet**: Multi-stop radial atmospheric halo, clipped rotating biome continents, night-side terminator shadow, optional celestial rings, and dynamic surface impact craters upon hull damage.
- **Aegis Energy Shield**: Absorbs all incoming damage first, displaying directional ripples upon impact. Automatically regenerates after a 3.5s delay out of combat.
- **Core Planetary HP**: If the Aegis shield falls, impacts damage the planetary core. If core HP reaches 0%, planetary defenses fail.

### 2. 360° Orbital Guardian Turret
- Orbits the planetary perimeter and smoothly rotates toward pointer/cursor position.
- Features a dotted cyan laser targeting sight and fires high-velocity plasma bolts (`520 px/s`).
- Supports **Auto-Fire Toggle (`[T]`)** and manual fire, capable of shooting down both alien ships and enemy siege torpedoes.
- Upgrades to **Twin Barrels** at Level 3 and **Triple Barrels** at Level 5.

### 3. Cascading Spark Nova Chain Reactions
- Tapping/clicking in orbital space or pressing `[Space]` triggers a high-yield **Spark Nova**, vaporizing enemy missiles and damaging aliens.
- **Chain Reactions**: When an alien ship is destroyed, it detonates in its own class-specific secondary Nova shockwave, triggering harmonic ascending pentatonic chimes, magnetic Cosmic Sparks, combo multipliers (`x2` ... `x20+`), and +14% Spark Nova energy recharge.

### 4. Autonomous Orbital Defense Satellites
- Up to 4 autonomous laser defense satellites orbit outside the planetary shield, prioritizing incoming torpedoes and nearest alien threats.

### 5. Three Active Tactical Planetary Skills
- **`[Q]` or `[1]` Orbital Ion Beam** (`9s` cooldown): Fires a piercing laser beam along the turret aim vector, dealing continuous piercing damage to all ships and torpedoes in its path.
- **`[W]` or `[2]` Planetary EMP Shockwave** (`12s` cooldown): Unleashes a 360° expanding EMP ring that vaporizes all active enemy missiles, pushes non-boss aliens outward by 75px, stuns all aliens for 3.0s, and deals damage.
- **`[E]` or `[3]` Aegis Overdrive** (`14s` cooldown): Restores 55% planetary shield, grants +1 Spark Nova charge, and overclocks turret & satellite fire rates (~1.8x speed, +50% golden plasma damage) for 6.0s.

---

## 🗺️ Universe Campaign: 4 Sectors & 20 Unique Planets

1. **Sector I: Inner Sanctuaries** (Cyan)
   - Aerilon *(Terran Haven)*
   - Aquatis *(Pelagic Sphere)*
   - Solaria *(Helios Dunes)*
   - Verdantia *(Bio-Jungle)*
   - Cryon *(Glacial Bastion)* — **BOSS: Dreadnought Vexor**
2. **Sector II: Nebula Frontier** (Magenta)
   - Pyros *(Magma Core)*
   - Zephyria *(Aether Giant)*
   - Obsidian *(Null Crystal)*
   - Lumina *(Prism Star-World)*
   - Vortexia *(Gravity Well)* — **BOSS: Mothership Kaelen**
3. **Sector III: Dark Rift** (Gold)
   - Aethelgard *(Relic Citadel)*
   - Chronos *(Temporal Sphere)*
   - Mycelia *(Spore Nebula)*
   - Ferrum *(Forge Mech-World)*
   - Eclipse *(Shadow Corona)* — **BOSS: Void Harbinger**
4. **Sector IV: Sol Genesis** (Crimson)
   - Hyperion *(Helios Core)*
   - Astralis *(Starlight Sanctum)*
   - Voidreach *(Outer Bastion)*
   - Omega Prime *(Dyson Citadel)*
   - Genesis Core *(Origin World)* — **BOSS: The Apex Leviathan**
5. **Endless Cosmic Siege**: Infinitely scaling survival mode featuring a Sector Mothership boss every 5th wave.

---

## 👾 Invading Alien Armada Classes & Death Payloads

| Class | Color | HP | Speed | Role | Death Payload |
|---|---|---|---|---|---|
| **Alien Scout** | Cyan | 22 | 62 | Inward Spiral Ramming | Standard Plasma Chain Nova |
| **Trident Interceptor** | Magenta | 40 | 48 | Mid-Range Torpedo Skirmisher | **Quad Plasma Burst** (45°/135°/225°/315°) |
| **Cryo-Cruiser** | Mint | 48 | 42 | Stasis Warship | **Cryo Stasis Field** (slows aliens by 75% for 4.5s) |
| **Phase-Shifter** | Purple | 38 | 55 | Quantum Warp Infiltrator | **Echo Warp Nova** (delayed second blast) |
| **Invasion Dropship** | Crimson | 75 | 34 | Heavy Siege Lander | Heavy Shrapnel Cascade + spawns Scouts |
| **Solar Dreadnought** | Gold | 135 | 26 | Capital Battleship | **Solar Super-Nova** (massive 135px blast) |
| **Sector Mothership** | Red | 950 | 20 | Armada Command Flagship | **Galaxy Super-Nova** (210px screen blast) |

---

## 🛠️ Guardian Armory (Tech Tree)

- **Pulse Cannon Firepower**: +4.5 dmg/lvl, unlocks Twin Barrels (Lv.3) & Triple Barrels (Lv.5).
- **Spark Nova Catalyst**: +14% blast radius and damage per level.
- **Nova Capacitor Core**: +1 max Nova charge per level (up to 7 max charges) & faster kill recharge.
- **Planetary Aegis Shield**: +22% shield and Core HP per level + faster shield regen.
- **Orbital Defense Satellites**: Deploys up to 4 autonomous interceptor laser satellites.
- **Tactical Core Reactor**: Reduces Q, W, E skill cooldowns by 12% per level.
- **100% Refund**: Reset tech tree anytime and recover 100% of invested Star Shards (`✦`).

---

## ⌨️ Controls

- **Mouse / Pointer**: Aim 360° Orbital Guardian Turret
- **Left Click (Space)**: Detonate Spark Nova Shockwave at cursor
- **[Q] or [1]**: Tactical Skill: Orbital Ion Beam
- **[W] or [2]**: Tactical Skill: Planetary EMP Shockwave
- **[E] or [3]**: Tactical Skill: Aegis Overdrive
- **[T]**: Toggle Turret Auto-Fire (ON / OFF)
- **[P] or [Esc]**: Tactical Pause / Resume
- **[R]**: Restart Mission
- **[M]**: Sound Mute Toggle

---

## 🏗️ Development & Verification

```bash
# Install dependencies
npm install

# Run automated tests (Vitest)
npm run test

# Run local Vite development server
npm run dev

# Build production bundle for GitHub Pages
npm run build
```

---

## 📄 License
MIT License.
