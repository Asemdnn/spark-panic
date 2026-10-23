// Spark Panic - Visual Neon Particle & Shockwave Ring System

export class Particle {
  constructor(x, y, color = '#00f0ff', speed = 250, size = 4) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.originalSize = size;

    const angle = Math.random() * Math.PI * 2;
    const spd = (0.3 + Math.random() * 0.7) * speed;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;

    this.drag = 0.94;
    this.life = 0.5 + Math.random() * 0.4; // 0.5 - 0.9s
    this.maxLife = this.life;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    this.vx *= this.drag;
    this.vy *= this.drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const progress = this.life / this.maxLife;
    this.size = this.originalSize * progress;
  }

  render(ctx) {
    if (!this.alive) return;
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class ShockwaveRing {
  constructor(x, y, color = '#ffffff', maxRadius = 80, duration = 0.4) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.elapsed = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;
    const progress = this.elapsed / this.duration;
    const radius = this.maxRadius * progress;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class ParticleManager {
  constructor() {
    this.particles = [];
    this.rings = [];
  }

  spawnBurst(x, y, color, count = 18, speed = 260) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, speed, 3 + Math.random() * 3));
    }
    this.rings.push(new ShockwaveRing(x, y, color, 75, 0.35));
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (!p.alive) this.particles.splice(i, 1);
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.update(dt);
      if (!r.alive) this.rings.splice(i, 1);
    }
  }

  render(ctx) {
    for (const r of this.rings) {
      r.render(ctx);
    }
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  clear() {
    this.particles = [];
    this.rings = [];
  }
}
