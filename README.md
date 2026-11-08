# Spark Panic: Planetary Invasion Defense — Guardian of the Universe (v2.9 Synergy Overdrive Edition)

[![Deploy to GitHub Pages](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asemdnn/spark-panic/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Play_Live-GitHub_Pages-00e5ff?style=flat&logo=github)](https://asemdnn.github.io/spark-panic/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00e676?style=flat&logo=pwa)](https://asemdnn.github.io/spark-panic/)

**Spark Panic 2.9 ("Synergy Overdrive Edition")** is a high-octane, self-contained HTML5 Canvas + Tailwind CSS arcade strategy and action planetary defense game. You are the **Orbital Guardian**, defending living celestial worlds and their cyber-cities against 360° incoming waves of relentless alien invasion fleets.

- 🎮 **Play Online**: [https://asemdnn.github.io/spark-panic/](https://asemdnn.github.io/spark-panic/)
- 📦 **GitHub Repository**: [https://github.com/Asemdnn/spark-panic](https://github.com/Asemdnn/spark-panic)

---

## 🌟 What's New in v2.9: Synergy Overdrive Edition

1. **🌟 Golden "Synergy Evolution Cards" in Tactical Draft (`#modalWaveDraft`)**:
   - **Vampire Survivors-Style Synergies**: Between waves (Wave 2+), the Roguelike Draft guarantees at least 1 god-tier Golden Synergy Card if the player meets chassis, relic, or perk prerequisites:
     - **🌩️ Thunderstorm Singularity** *(Tesla Arc Cannon OR Split-Nova Catalyst)*: Spark Novas leave a 4.0s Ionized Storm Cloud (115px) continuously zapping up to 4 enemies every 0.4s for 40 chain lightning damage!
     - **🪞 Supernova Counter-Matrix** *(Explosive Aegis Parry OR Aegis Mirror Plating OR Pulse Striker)*: Phase-Parry triggers a 360° Mini-EMP Shockwave (220px) and launches 3 Golden Homing Counter-Missiles at highest-HP threats for 85 damage!
     - **☄️ Hyper-Velocity Plasma Rail-Wall** *(Railgun Lancer OR Overclocked Barrels)*: Overcharge Shot leaves a blazing 2.5s Laser Firewall Line across space—enemies and missiles crossing it take 90 dmg/s and are slowed 60%!
     - **❄️ Absolute Zero Shatter-Core** *(Cryo-Shrapnel Rounds OR Chrono-Stasis Prism)*: Chilled/Stasis enemies take +50% critical damage from all sources and shatter into 6 piercing ice-plasma shards upon defeat!
     - **🛸 Omega Drone Swarm** *(Wingman Squadron Overdrive OR Twin-Wingman Transponder)*: Spawns 4 Autonomous Micro-Interceptor Drones in diamond formation orbiting the planet that auto-fire rapid plasma darts (18 dmg, 3.5 rps) and launch cluster mini-novas every 6s!
   - **Holographic Gold UI Cards**: Features glowing amber borders, animated `🌟 SYNERGY` badges, and dedicated `🌟 EVOLVE WEAPON` draft buttons.

2. **⚔️ Multi-Part Destructible Boss Sub-Systems**:
   - **Destructible Boss Modules**: Sector Motherships spawn with 2 destructible subsystems, each with ~30% max HP and individual health bars in the Boss HUD:
     - **🔴 Port Torpedo Battery (`[WPN]`)**: Destroying it triggers a 110px explosion, deals 12% bleed damage to the Boss hull, and permanently reduces salvos from 3 torpedoes to 1!
     - **🟣 Starboard Drone Hangar (`[HGR]`)**: Destroying it triggers a 110px explosion, deals 12% bleed damage to the Boss hull, spawns 2 instant Orbital Supply Pods, and permanently halts reinforcement dropship/leech spawns!
   - **⚠️ Core Exposed Mode**: Destroying both subsystems strips the Mothership's armor, exposing the reactor core with crackling golden electrical arcs and dealing **+50% bonus hull damage** from all incoming attacks!

3. **🌀 Interactive Battlefield Space Anomalies**:
   - **Twin Subspace Wormholes (`PORTAL α` & `PORTAL β`)**: Spawns every 16–20s in outer orbital space and lasts 14.0s. Any player bolt entering Portal A instantly teleports out of Portal B (and vice-versa) with **+45% Warp Damage**, **+2 Pierce**, and auto-angles toward the highest-threat enemy. If an Aegis Jammer Frigate is active, warped bolts automatically angle behind its 90° frontal shield!
   - **🌀 Spark Nova Portal Echo**: Detonating a Spark Nova within 45px of Portal A triggers an instantaneous twin shockwave echo at Portal B!
   - **☣️ Volatile Plasma Fuel Barrels**: Drifting hazard canisters appear in outer lanes. Shooting a barrel breaches it, detonating a free 115px 95-damage chain reaction explosion.

4. **🔥 "Overdrive Frenzy Meter" & Double-Time Synthwave**:
   - **Dynamic Battle Momentum**: Tactical actions fill the top-right Frenzy Gauge: +4% per kill, +3% per chain combo step, +18% on Perfect Parry, and +15% on weak-spot Critical Breaches.
   - **Vulnerability Checks**: Taking Core HP damage drops Frenzy by -35%; shield hits pause gain for 1.5s.
   - **🔥 8.0s Hyper-Frenzy Overdrive**: Reaching 100% unleashes maximum battle intensity:
     - **Double-Time Synthwave Audio**: BGM tempo accelerates +15% dynamically!
     - **+40% Rapid-Fire Boost**: Turret and AI Wingmen fire rate increases by 40%.
     - **🌈 Chromatic Rainbow Plasma Lances**: Bolts fired during Frenzy deal +25% damage with chromatic shifting rainbow hues.
     - **⚡ 2x Nova Recharge Rate**: Doubles nova kill recharge energy (+28% per kill vs 14%).

---

## 🌟 What's New in v2.8: Tactical Combat Mastery Edition

1. **🛡️ Active "Aegis Phase-Parry" Deflection System (`Right-Click` / `[SHIFT]` / `[C]` / `#btnParry`)**:
   - **Precision Timing Deflector Arc**: Activates a blazing golden-cyan 110° curved deflector energy barrier for `0.38s` along the shield perimeter (`shieldRadius + 8px`) facing the current turret aim vector.
   - **Cooldown**: `2.2s` cooldown, dynamically reduced to **`0.5s`** on executing a **Perfect Parry**!
   - **Torpedo Deflection into Homing Super-Missiles**: Incoming enemy torpedoes caught within the deflector arc reflect back as friendly radiant golden-white homing super-missiles (`480 px/s`, 85 damage, 65px nova) targeting the nearest invader.
   - **Perfect Parry Rewards**: Grants `⚡ PERFECT PARRY! +20% NOVA`, a `0.08s` micro hit-stop flash, procedural metallic deflection chimes, +20% Nova energy, +8% Cataclysm charge, and +5% instant shield restoration.
   - **Close-Range Alien Repulsion**: Point-blank invaders inside the 110° arc suffer a 90px concussive knockback, a 1.8s EMP stasis stun, 45 shock damage, and instant unlatching of Leech Pods.

2. **🎯 Manual "Hold-to-Charge Overcharge Shot" & Glowing Reactor Weak-Spot Crits**:
   - **Hold-to-Charge Plasma Lance**: Tapping `< 0.25s` fires standard shots or Spark Novas. Holding `>= 0.25s` (up to `0.65s` for 100% charge) manually steers the turret toward cursor/touch coordinates, projecting a converging cyan-gold energy ring and narrowing twin-line laser sights.
   - **Piercing Overcharge Lance**: Releasing at `>= 50%` charge unleashes a blinding high-velocity piercing bolt (`820 px/s`, `pierce: 5`, up to 3.2x base damage) that shatters Aegis Jammer and Void Weaver frontal shields in one hit (`isDirectPierce = true`).
   - **Glowing Enemy Reactor Core Weak-Spots**: Bosses, Solar Dreadnoughts, Invasion Dropships, and Void Weavers feature rotating crimson/amber reactor cores with pulsating reticle rings. Hitting exposed weak-spots with an Overcharge Lance or Reflected Parry triggers `💥 CRITICAL BREACH! x2.5`, a 1.5s EMP stun, and 2 bonus Star Shards (`✦`).

3. **🃏 Mid-Mission Roguelike "Tactical Command Draft" (Pick 1 of 3 Perks Between Waves)**:
   - **Inter-Wave Command Draft**: Between waves (and every wave in Endless mode), wave spawning pauses to present `#modalWaveDraft` offering 3 random holographic perk cards selectable via hotkeys `[1]`, `[2]`, `[3]` or direct click.
   - **10 Game-Changing Tactical Perks**:
     - `Split-Nova Catalyst`: Spark Novas split into 4 homing mini-plasma charges on detonation.
     - `Explosive Aegis Parry`: Phase-Parry unleashes a 120px concussive shockwave dealing 60 damage.
     - `Overclocked Barrels`: Turret fire rate increased by +35%.
     - `Orbital Gravity Well`: Alien destructions pull adjacent enemies 40px closer.
     - `Cryo-Shrapnel Rounds`: Plasma bolts apply a 40% movement chill for 2.0s.
     - `Emergency Nanite Surge`: First shield break per sector instantly restores 40% Core HP & Shield.
     - `Wingman Squadron Overdrive`: AI Wingmen gain +50% fire rate and +25% flight speed.
     - `Chain-Reaction Momentum`: Rapid alien kills grant stacking +15% damage (up to 5x).
     - `Volatile Plasma Cores`: Overcharge Lance kills spawn lingering corrosive plasma pools.
     - `Bounty Hunter Protocol`: Elite & Boss kills award +100% Star Shards and +500 bonus score.
   - **Dynamic HUD Perks Dock**: Active drafts display compact glowing badge icons in the top HUD `#hudDraftPerks`.

4. **🕷️ City-Latching "Invasion Leech Pods" & Optional Risk/Reward "Warp Ambush Beacons"**:
   - **🕷️ Invasion Leech Pods (`LEECH`)**: Deployed by Dropships and Motherships directly targeting the 4 living surface cities, bypassing outer shields. When latched, they siphon 2.5 Core HP/s directly with crimson energy drains until unlatched by Phase-Parry, Overcharge Lance, EMP, or Nova blast (`+25 ✦ City Saved`).
   - **⚠️ Warp Ambush Beacon (`BEACON`)**: Drifts in outer orbit for 12s with a floating countdown timer. If destroyed by the player, it summons an Elite Ambush Squadron (4–6 ships + Jammer/Weaver) dropping 2x Star Shards, 2x score, and +30% instant Cataclysm charge. If unattacked, it despawns safely.
   - **UI Polish & Badges**: Hero badge updated to `⚡ v2.8 TACTICAL MASTERY EDITION` and Battle Card exporter updated with v2.8 branding.

---

## 🌟 Previous Update Highlights

- **🌋 Planetary Cataclysm Superweapons & Elite Leaders (v2.7)**: Chargeable `[F]` superweapons (Cryo-Tsunami, Magma Meteor, Dyson Cage, Genesis Supernova), Aegis Jammer Frigate (90° barrier), Void Weaver Carrier (graviton web), Astral Treasure Galleon (+65 shards jackpot), sector living biome shaders, and audio-reactive beat-synced halos.
- **⚡ Arcade Juice & Next-Gen VFX (v2.6)**: Directional plasma bolts, turret recoil & muzzle star-flares, helical Ion Beam, pointed tactical warheads with trailing exhaust smoke ribbons, chain-lightning tethers, hull debris shards, 3-layer parallax starfield, and Boss subspace warp rifts.
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
| **Aegis Jammer Frigate** | Emerald | 90 | 38 px/s | 90° Shield Barrier Escort | Kinetic Clink Ricochet |
| **Void Weaver Carrier** | Magenta | 110 | 32 px/s | Graviton Matrix Support | Graviton Web Cooldown Overcharge |
| **Astral Treasure Galleon** | Gold | 160 | 68 px/s | Tangential Outer Orbit | Astral Shard Jackpot & Supply Pod |
| **Invasion Leech Pod** | Purple | 45 | 58 px/s | Surface City Infiltrator | Drains 2.5 Core HP/s directly |
| **Warp Ambush Beacon** | Violet | 85 | 18 px/s | Outer Space Ambush Catalyst | Summons 2x Shard Elite Squadron |

---

## ⌨️ Tactical Controls & Hotkeys

| Action | Control / Hotkey |
|---|---|
| **Aim Orbital Turret** | Move Mouse / Touch Drag |
| **Detonate Spark Nova** | Left Click / Tap Deep Space / `[Space]` |
| **Aegis Phase-Parry** | **Right-Click** / `[SHIFT]` / `[C]` / `#btnParry` |
| **Hold-to-Charge Overcharge Lance** | Hold Click/Touch `>= 0.25s`, Release `>= 50%` |
| **Select Tactical Draft Perk** | `[1]`, `[2]`, `[3]` or Click Perk Card |
| **Orbital Ion Beam** | `[Q]` or `[1]` (outside draft) |
| **Planetary EMP Shockwave** | `[W]` or `[2]` (outside draft) |
| **Aegis Overdrive** | `[E]` or `[3]` (outside draft) |
| **Planetary Cataclysm Superweapon** | `[F]` / Click Planet Core / LB / D-pad Up |
| **Deploy Orbital Structure** | `[R]` (Pylon, Anchor, Flak) |
| **Toggle Auto-Fire** | `[T]` |
| **Toggle Synthwave BGM** | `[B]` |
| **Toggle Sound Effects Mute** | `[M]` |
| **Replay Tactical Tutorial** | `[H]` |
| **Tactical Pause / Resume** | `[P]` or `[Escape]` |

---

## 💾 Quantum Encrypted Save Backup

- Automatic persistence across browser sessions in `localStorage`.
- Base64 quantum save export & import in the **Guardian Archives & Alien Codex (`#modalCodex`)** modal for cross-device migration.

---

## 🏗️ Development & Automated Testing

```bash
# Install dependencies
npm install

# Run automated test suite (198 tests across 20 suites)
npm test

# Start local Vite development server
npm run dev

# Build production bundle for GitHub Pages
npm run build
```

---

## 📄 License
MIT License.
