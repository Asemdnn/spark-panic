// Spark Panic - Procedural Web Audio API Sound Synthesizer
// 100% synthesized sound effects: zero external asset latency, zero downloads

import { COMBO_MELODY_FREQS, SPARK_TYPES } from '../config.js';
import { storage } from './storage.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = storage.isSoundMuted();
    this.initialized = false;

    // Listen to visibility change for YouTube Playables audio policy
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.suspend();
        } else {
          this.resume();
        }
      });
    }
  }

  init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize', e);
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended' && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    storage.setSoundMuted(this.isMuted);

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, t);
    }
    return this.isMuted;
  }

  playPop(combo = 1, sparkType = SPARK_TYPES.NORMAL) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const freqIndex = Math.min(COMBO_MELODY_FREQS.length - 1, combo - 1);
    const baseFreq = COMBO_MELODY_FREQS[freqIndex % COMBO_MELODY_FREQS.length];
    const octaveMultiplier = Math.pow(2, Math.floor((combo - 1) / COMBO_MELODY_FREQS.length) * 0.4);
    const finalFreq = Math.min(2200, baseFreq * octaveMultiplier);

    // Primary Melodic Tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = sparkType === SPARK_TYPES.SPLITTER ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(finalFreq * 1.3, t);
    osc.frequency.exponentialRampToValueAtTime(finalFreq, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(finalFreq * 0.9, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.23);

    // Special sound layering for spark types
    if (sparkType === SPARK_TYPES.MEGA) {
      // Sub-bass heavy explosion
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(140, t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.4);

      subGain.gain.setValueAtTime(0.5, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(t);
      subOsc.stop(t + 0.46);
    } else if (sparkType === SPARK_TYPES.FREEZE) {
      // Shimmering crystalline chime
      const freezeOsc = this.ctx.createOscillator();
      const freezeGain = this.ctx.createGain();
      freezeOsc.type = 'sine';
      freezeOsc.frequency.setValueAtTime(1200, t);
      freezeOsc.frequency.linearRampToValueAtTime(600, t + 0.35);

      freezeGain.gain.setValueAtTime(0.2, t);
      freezeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      freezeOsc.connect(freezeGain);
      freezeGain.connect(this.masterGain);

      freezeOsc.start(t);
      freezeOsc.stop(t + 0.36);
    } else if (sparkType === SPARK_TYPES.REPULSOR) {
      // Resonant harmonic blip
      const pOsc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pOsc.type = 'triangle';
      pOsc.frequency.setValueAtTime(finalFreq * 1.5, t);
      pOsc.frequency.exponentialRampToValueAtTime(finalFreq * 0.75, t + 0.25);

      pGain.gain.setValueAtTime(0.25, t);
      pGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

      pOsc.connect(pGain);
      pGain.connect(this.masterGain);

      pOsc.start(t);
      pOsc.stop(t + 0.27);
    }
  }

  playTap() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  playHover() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.035);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  playLockOn() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    // Dual-tone harmonic targeting ping
    [880, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.08);
    });
  }

  playWarp() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.32);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  playBonusTap() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.19);
    });
  }

  playVictory() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + (idx === notes.length - 1 ? 0.6 : 0.2));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.65);
    });
  }

  playDefeat() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  playShieldHit() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;

    // Sub-bass heavy impact thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.28);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.31);

    // Energy shield fizzle noise
    const noiseOsc = this.ctx.createOscillator();
    const noiseGain = this.ctx.createGain();
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(320, t);
    noiseOsc.frequency.exponentialRampToValueAtTime(70, t + 0.16);

    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noiseOsc.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseOsc.start(t);
    noiseOsc.stop(t + 0.19);
  }

  playShieldAlarm() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    [784, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.08);
    });
  }

  playEmpBlast() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;

    // Deep subterranean rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(65, t);
    sub.frequency.linearRampToValueAtTime(140, t + 0.15);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.65);

    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    sub.connect(subGain);
    subGain.connect(this.masterGain);

    sub.start(t);
    sub.stop(t + 0.72);

    // High shimmer frequency sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(1800, t);
    sweep.frequency.exponentialRampToValueAtTime(220, t + 0.48);

    sweepGain.gain.setValueAtTime(0.25, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    sweep.connect(sweepGain);
    sweepGain.connect(this.masterGain);

    sweep.start(t);
    sweep.stop(t + 0.52);
  }

  playTurretFire() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.06);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  playCoreAbsorbed() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    [659.25, 880, 1174.66, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + 0.13);
    });
  }
}

export const audio = new AudioManager();
