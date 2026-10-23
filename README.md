# Spark Panic (Neon Chain Reaction)
### A Hyper-Casual Game Designed for YouTube Playables

**Spark Panic** is a neon arcade chain reaction game engineered specifically for YouTube Playables, featuring instant loading (< 20 KB gzip), zero external asset dependencies, procedural Web Audio sound synthesis, and adaptive responsive layout for both portrait mobile and landscape desktop screens.

---

## Gameplay Mechanics

- **One-Tap Chain Reaction**: Tap anywhere in the arena to detonate a shockwave.
- **The Domino Effect**: Any spark touching an expanding blast wave detonates into its own explosion.
- **Dynamic Combo Scaler**: Combos climb exponentially ($x1, x2, \dots, x50+$), playing a musical pentatonic scale that turns chain reactions into an escalating harmonic melody.
- **5 Unique Spark Types**:
  - 🔷 **Normal Spark (Cyan)**: Standard explosion with balanced blast radius.
  - 🟡 **Mega Spark (Gold)**: Massive screen-clearing explosion with deep sub-bass drop and screenshake.
  - 🌸 **Splitter Spark (Magenta)**: Launches 4 high-speed darts that ignite distant spark clusters.
  - ❄️ **Frost Spark (Mint)**: Cryogenic burst slowing surrounding sparks by 70%.
  - 🔮 **Phase Spark (Violet)**: Emits a secondary delayed shockwave ring.

---

## Game Modes

1. **Campaign Mode (20 Progressive Levels)**:
   - Varied spark counts, mix of types, and limited taps (1–2 taps).
   - 3-Star rating per level based on percentage cleared.
2. **Endless Arcade**:
   - Progressive waves of sparks.
   - Earn `+1 Extra Tap` for every 12 combo reached!
   - Compete for the global high score.

---

## Controls

- **Touch / Mouse Tap**: Detonate shockwave
- **[Space] or [R]**: Quick restart current level / wave
- **[P] or [Escape]**: Pause / Resume
- **[M]**: Mute / Unmute sound

---

## YouTube Playables Technical Features

- **Ultra-lightweight**: Complete bundled build is ~15 KB gzip with 0 images and 0 audio files to download.
- **Procedural Web Audio API**: Instant sound synthesis with zero network latency.
- **Lifecycle & Audio Suspend**: Listens to `visibilitychange` to gracefully suspend and resume audio when players switch apps or minimize YouTube.
- **Safe Persistence**: LocalStorage with automatic memory fallback for restrictive iframes.
- **HiDPI / Retina Canvas**: Smooth 60 FPS rendering with additive neon bloom and devicePixelRatio scaling.

---

## Development & Building

```bash
# Run local dev server (http://localhost:3000)
npm run dev

# Run automated tests
npm run test

# Build production bundle for YouTube Playables
npm run build

# Preview production build locally
npm run preview
```
