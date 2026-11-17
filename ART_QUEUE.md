# Spark Panic: Planetary Invasion Defense - Art Enhancement Queue

This checklist tracks the batch enhancement of visual assets using Google Nano Banana generative art synthesis.
Each asset is generated to match the cohesive high-octane indie art style (Geometry Wars / Nova Drift / Synthwave / Spider-Verse neon vector aesthetic), verified for exact resolution and aspect ratio, and synced across `src/assets/`, `public/assets/`, and `dist/assets/`.

---

## Batch 1: Hero Art, Core Backgrounds & Cosmic Boss (Assets 1–6)
- [x] **Asset 01**: `src/assets/hero-key-art.jpg` (1024x572) — Key Art Splash & Title Hero Screen
- [x] **Asset 02**: `src/assets/game-cover.jpg` (1376x768) — Main Game Cover Artwork
- [x] **Asset 03**: `src/assets/game-icon.jpg` (1024x1024) — High-Res App Icon & Holographic Crest
- [x] **Asset 04**: `src/assets/space-background.jpg` (1376x768) — Deep Cosmic Void Backdrop & Starlight Dust
- [x] **Asset 05**: `src/assets/galaxy-map-backdrop.jpg` (1376x768) — Interactive Starmap Galactic Nebula Background
- [x] **Asset 06**: `src/assets/cosmic-sectors-boss.jpg` (1024x572) — 4 Sectors Showcase & Apex Mothership Boss

---

## Batch 2: Sector Command Banners & Initial Worlds (Assets 7–12)
- [x] **Asset 07**: `src/assets/sector-1-banner.jpg` (1024x572) — Sector 1: Inner Sanctuaries Banner (Cyan/Teal)
- [x] **Asset 08**: `src/assets/sector-2-banner.jpg` (1024x572) — Sector 2: Nebula Frontier Banner (Magenta/Violet)
- [x] **Asset 09**: `src/assets/sector-3-banner.jpg` (1024x572) — Sector 3: Dark Rift Banner (Amber/Gold)
- [x] **Asset 10**: `src/assets/sector-4-banner.jpg` (1024x572) — Sector 4: Sol Genesis Core Banner (Crimson/Solar)
- [x] **Asset 11**: `src/assets/planets/aerilon.jpg` (1024x1024) — Planet Aerilon (Atmospheric Cloud Sanctuary)
- [x] **Asset 12**: `src/assets/planets/aquatis.jpg` (1024x1024) — Planet Aquatis (Abyssal Oceanic Trench)

---

## Batch 3: Sector 1 & Sector 2 Planetary Biomes (Assets 13–18)
- [x] **Asset 13**: `src/assets/planets/astraea.jpg` (1024x1024) — Planet Astraea (Celestial Eden Biome)
- [x] **Asset 14**: `src/assets/planets/boreas.jpg` (1024x1024) — Planet Boreas (Sub-Zero Polar Ice Sheets)
- [x] **Asset 15**: `src/assets/planets/chronos.jpg` (1024x1024) — Planet Chronos (Temporal Gravitational Distortion)
- [x] **Asset 16**: `src/assets/planets/cygnus.jpg` (1024x1024) — Planet Cygnus (Cyan Stellar Giant with Ring System)
- [x] **Asset 17**: `src/assets/planets/elysium.jpg` (1024x1024) — Planet Elysium (Verdant Utopian Megastructure)
- [x] **Asset 18**: `src/assets/planets/genesis.jpg` (1024x1024) — Planet Genesis (Crystalline Birth World & Azure Energy)

---

## Batch 4: Sector 2 & Sector 3 Planetary Biomes (Assets 19–24)
- [x] **Asset 19**: `src/assets/planets/glacies.jpg` (1024x1024) — Planet Glacies (Translucent Glacial Ice Spires)
- [x] **Asset 20**: `src/assets/planets/hyperion.jpg` (1024x1024) — Planet Hyperion (Radiant Gold Gas Giant)
- [x] **Asset 21**: `src/assets/planets/nebulon.jpg` (1024x1024) — Planet Nebulon (Gaseous Emerald Star Cradle)
- [x] **Asset 22**: `src/assets/planets/obsidian.jpg` (1024x1024) — Planet Obsidian (Volcanic Basalt & Magma Caverns)
- [x] **Asset 23**: `src/assets/planets/pulsar.jpg` (1024x1024) — Planet Pulsar (Magnetized Neutron Star Relativistic Beams)
- [x] **Asset 24**: `src/assets/planets/singularity.jpg` (1024x1024) — Planet Singularity (Accretion Disk Event Horizon)

---

## Batch 5: Sector 3 & Sector 4 Planetary Biomes (Assets 25–30)
- [x] **Asset 25**: `src/assets/planets/solaria.jpg` (1024x1024) — Planet Solaria (Solar Forge Surface Radiance)
- [x] **Asset 26**: `src/assets/planets/supernova.jpg` (1024x1024) — Planet Supernova (Thermonuclear Coronal Flare Inferno)
- [x] **Asset 27**: `src/assets/planets/tempest.jpg` (1024x1024) — Planet Tempest (Hyper-Storm Cyclonic Vortex)
- [x] **Asset 28**: `src/assets/planets/vespera.jpg` (1024x1024) — Planet Vespera (Twilight Bioluminescent Fungi Forest)
- [x] **Asset 29**: `src/assets/planets/voidhaven.jpg` (1024x1024) — Planet Voidhaven (Dark Matter Filament Abyss)
- [x] **Asset 30**: `src/assets/planets/zephyrus.jpg` (1024x1024) — Planet Zephyrus (Pastel Jovian Cloud Bands)

---

## Verification Requirements
For each asset marked `[x]`:
1. File exists at exact target path in `src/assets/` (and mirrored to `public/assets/` & `dist/assets/`).
2. Exact pixel dimensions match requirement (1024x572, 1376x768, or 1024x1024).
3. Visual aesthetics adhere to the cohesive Neon Synthwave / Geometry Wars / Prismatic Indie Art Direction.
4. Build passes (`npm test`, `npm run build`) without asset 404s or scene reference breakages.
