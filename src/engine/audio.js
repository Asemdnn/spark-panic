// Spark Panic 2.2 - Procedural Web Audio API Synthesizer & Synthwave BGM Sequencer

import { PENTATONIC_FREQS } from '../config.js';
import { storage } from './storage.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = storage.isSoundMuted();
    this.isBgmEnabled = storage.isBgmEnabled();
    this.initialized = false;

    // Procedural Synthwave BGM Sequencer state
    this.bgmBpm = 118;
    this.bgmStep = 0;
    this.bgmTimer = null;
    this.nextNoteTime = 0;
    this.isBgmPlaying = false;
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
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
      this.masterGain = this.sfxGain; // Backward compatibility

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isBgmEnabled ? 0.05 : 0, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    storage.setSoundMuted(this.isMuted);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : 0.65, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  toggleBgm() {
    this.isBgmEnabled = !this.isBgmEnabled;
    storage.setBgmEnabled(this.isBgmEnabled);
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(this.isBgmEnabled ? 0.05 : 0, this.ctx.currentTime);
    }
    if (!this.isBgmEnabled) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isBgmEnabled;
  }

  setBgmTempo(bpm = 118) {
    this.bgmBpm = bpm;
  }

  startBgm() {
    if (!this.isBgmEnabled) return;
    this.init();
    if (!this.ctx || this.isBgmPlaying) return;

    this.isBgmPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = setInterval(() => this.scheduleBgm(), 35);
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleBgm() {
    if (!this.ctx || !this.isBgmPlaying || !this.isBgmEnabled) return;

    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playBgmStep(this.bgmStep, this.nextNoteTime);
      const stepDuration = (60 / this.bgmBpm) / 4; // 16th note step
      this.nextNoteTime += stepDuration;
      this.bgmStep = (this.bgmStep + 1) % 64;
    }
  }

  playBgmStep(step, time) {
    if (!this.ctx || !this.bgmGain) return;

    // Driving progression: A1 (55Hz) -> F1 (43.65Hz) -> C2 (65.41Hz) -> G1 (49Hz)
    const chordIndex = Math.floor(step / 16);
    const roots = [55.0, 43.65, 65.41, 49.0];
    const rootFreq = roots[chordIndex % roots.length];

    // 1. Sub-Bass Pulse on 8th notes (steps 0, 2, 4, 6...)
    if (step % 2 === 0) {
      try {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(rootFreq, time);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(260, time);
        bassFilter.Q.setValueAtTime(3.0, time);

        bassGain.gain.setValueAtTime(0.045, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start(time);
        bassOsc.stop(time + 0.15);
      } catch (e) {}
    }

    // 2. Cosmic Arpeggio on 16th notes (A-minor pentatonic)
    const arpNotes = [220, 261.63, 329.63, 392, 440, 523.25, 440, 329.63, 261.63, 329.63, 392, 440, 523.25, 659.25, 523.25, 392];
    const arpFreq = arpNotes[step % arpNotes.length];

    try {
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();

      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(arpFreq, time);

      arpGain.gain.setValueAtTime(0.025, time);
      arpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.095);

      arpOsc.connect(arpGain);
      arpGain.connect(this.bgmGain);

      arpOsc.start(time);
      arpOsc.stop(time + 0.10);
    } catch (e) {}
  }

  playLaser(isOverdrive = false) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isOverdrive ? 'sawtooth' : 'triangle';
    const startFreq = isOverdrive ? 950 : 720;
    const endFreq = isOverdrive ? 260 : 190;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.08);

    gain.gain.setValueAtTime(isOverdrive ? 0.25 : 0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playNovaLaunch() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playChainChime(comboIndex = 1) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;

    const idx = Math.min(PENTATONIC_FREQS.length - 1, Math.max(0, comboIndex - 1));
    const freq = PENTATONIC_FREQS[idx];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.05, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  playShieldHit() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;

    // Sub-bass heavy thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  playSkill(type) {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;

    if (type === 'Q') {
      // Orbital Ion Beam Hum
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(450, t + 0.35);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.62);
    } else if (type === 'W') {
      // Planetary EMP Shockwave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.linearRampToValueAtTime(220, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.55);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.62);
    } else if (type === 'E') {
      // Aegis Overdrive powerup arpeggio
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + i * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.16);
      });
    }
  }

  playShardPickup() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.095);
  }

  playVictory() {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const t = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.28, start);
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
}

export const audio = new AudioEngine();
