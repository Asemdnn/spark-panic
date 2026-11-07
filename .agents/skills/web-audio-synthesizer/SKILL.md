---
name: web-audio-synthesizer
description: Procedural Web Audio API sound design and dynamic music sequencer engine. Use when generating synthesized game sound effects (lasers, explosions, chimes, shields), procedural synthwave music, and audio-reactive visual synchronization without external audio asset downloads.
metadata:
  origin: Antigravity-GameDev-Suite
---

# Web Audio Synthesizer — Procedural Game SFX & Dynamic Music Engine

## When to Use
- Synthesizing zero-asset, procedural sound effects (SFX) in web games and interactive canvas apps.
- Creating procedural background music (BGM) with dynamic tempo scaling (e.g., boss battle tempo boosts).
- Implementing audio-reactive visual effects (pulsing shields, beat-synced halos, visualizers).
- Handling browser autoplay policies and audio context unlocking reliably across mobile and desktop.

---

## 1. Robust AudioContext Initialization & Mobile Autoplay Unlocking
Browsers enforce user-gesture activation before allowing audio output.

```javascript
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isBgmEnabled = true;
    this.beatPulse = 0; // 0..1 for visual sync
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) return;
    this.ctx = new AudioCtxClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }
}
```

---

## 2. Procedural Sound Effect (SFX) Recipes

### A. High-Energy Sci-Fi Laser Fire (Chirp)
Combines a high-frequency downward pitch sweep with a snappy exponential volume decay:
```javascript
playLaser(startFreq = 880, endFreq = 110, duration = 0.08) {
  if (!this.ctx || this.isMuted) return;
  const now = this.ctx.currentTime;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(this.masterGain);

  osc.start(now);
  osc.stop(now + duration);
}
```

### B. Cosmic Nova Explosion (Synthesized White Noise & Sub-Bass Thud)
Blends white noise burst through a decaying low-pass filter with a 40Hz sub-bass sine drop:
```javascript
playExplosion(intensity = 1.0) {
  if (!this.ctx || this.isMuted) return;
  const now = this.ctx.currentTime;
  const dur = 0.45 * intensity;

  // 1. Noise Burst (Debris & Shrapnel)
  const bufferSize = this.ctx.sampleRate * dur;
  const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = this.ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = this.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800 * intensity, now);
  filter.frequency.exponentialRampToValueAtTime(50, now + dur);

  const noiseGain = this.ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4 * intensity, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(this.masterGain);

  // 2. Sub-Bass Thump
  const sub = this.ctx.createOscillator();
  const subGain = this.ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(140, now);
  sub.frequency.exponentialRampToValueAtTime(28, now + dur);

  subGain.gain.setValueAtTime(0.6 * intensity, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  sub.connect(subGain);
  subGain.connect(this.masterGain);

  noise.start(now);
  sub.start(now);
  noise.stop(now + dur);
  sub.stop(now + dur);
}
```

### C. Ascending Harmonic Pentatonic Combo Chime
Calculates exact harmonic frequencies using the Japanese Insen or Major Pentatonic scale:
```javascript
// Major Pentatonic Scale: C4, D4, E4, G4, A4, C5, D5...
const PENTATONIC_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

playChainChime(comboCount = 1) {
  if (!this.ctx || this.isMuted) return;
  const now = this.ctx.currentTime;
  const noteIdx = Math.min(comboCount - 1, PENTATONIC_FREQS.length - 1);
  const freq = PENTATONIC_FREQS[noteIdx];

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(this.masterGain);

  osc.start(now);
  osc.stop(now + 0.35);
}
```

---

## 3. Beat-Synced Visual Coupling (`beatPulse`)
Couples audio rhythm steps directly to game rendering:
```javascript
// In Audio Engine step sequencer:
onRhythmStep(step) {
  if (step % 2 === 0) {
    this.beatPulse = 1.0; // Trigger full pulse on downbeat/kick
  }
}

// In Audio Engine update(dt):
update(dt) {
  if (this.beatPulse > 0) {
    // Smooth frame-rate independent decay
    this.beatPulse = Math.max(0, this.beatPulse * Math.pow(0.04, dt));
  }
}

// In Canvas Renderer:
const haloRadius = baseRadius + 8 * audio.beatPulse;
ctx.shadowBlur = 15 + 20 * audio.beatPulse;
```
