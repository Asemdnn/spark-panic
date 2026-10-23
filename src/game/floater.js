// Spark Panic - Floating Score & Combo Callout System

import { COMBO_TITLES } from '../config.js';

export class Floater {
  constructor(x, y, text, color = '#ffffff', fontSize = 22, isBanner = false) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.isBanner = isBanner;

    this.life = isBanner ? 1.4 : 0.85;
    this.maxLife = this.life;
    this.vy = isBanner ? -40 : -65;
    this.scale = isBanner ? 0.3 : 0.6;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    this.y += this.vy * dt;
    this.vy *= 0.94;

    // Pop scale animation
    const progress = 1 - (this.life / this.maxLife);
    if (progress < 0.2) {
      this.scale = 0.5 + (progress / 0.2) * (this.isBanner ? 0.8 : 0.6); // overshoot
    } else {
      this.scale = (this.isBanner ? 1.3 : 1.1) - (progress - 0.2) * 0.2;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    const alpha = Math.min(1, (this.life / this.maxLife) * 1.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctx.font = `900 ${this.fontSize}px 'Montserrat', 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow stroke
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.isBanner ? 6 : 4;
    ctx.strokeText(this.text, 0, 0);

    // Inner bright text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}

export class FloaterManager {
  constructor() {
    this.floaters = [];
  }

  addScore(x, y, score, combo) {
    const text = combo > 1 ? `+${score} (x${combo})` : `+${score}`;
    const color = combo > 15 ? '#ffe600' : (combo > 5 ? '#00ffa3' : '#00f0ff');
    const size = combo > 10 ? 24 : 18;
    this.floaters.push(new Floater(x, y - 10, text, color, size, false));

    // Check for milestone callouts
    for (let i = COMBO_TITLES.length - 1; i >= 0; i--) {
      const title = COMBO_TITLES[i];
      if (combo === title.min) {
        this.floaters.push(new Floater(x, y - 45, title.text, title.color, 32, true));
        break;
      }
    }
  }

  addMessage(x, y, text, color = '#ffe600', size = 28) {
    this.floaters.push(new Floater(x, y, text, color, size, true));
  }

  update(dt) {
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.update(dt);
      if (!f.alive) this.floaters.splice(i, 1);
    }
  }

  render(ctx) {
    for (const f of this.floaters) {
      f.render(ctx);
    }
  }

  clear() {
    this.floaters = [];
  }
}
