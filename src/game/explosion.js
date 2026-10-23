// Spark Panic - Detonation Shockwave & Projectile Mechanics

import { SPARK_CONFIG, SPARK_TYPES } from '../config.js';

export class SplitterDart {
  constructor(x, y, angle, speed = 400, maxDist = 320) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 7;
    this.distanceTraveled = 0;
    this.maxDistance = maxDist;
    this.alive = true;
    this.trail = [];
  }

  update(dt, arenaWidth, arenaHeight) {
    if (!this.alive) return;

    this.trail.push({ x: this.x, y: this.y, alpha: 0.8 });
    if (this.trail.length > 8) this.trail.shift();

    const dx = this.vx * dt;
    const dy = this.vy * dt;
    this.x += dx;
    this.y += dy;
    this.distanceTraveled += Math.hypot(dx, dy);

    if (
      this.distanceTraveled >= this.maxDistance ||
      this.x < 0 || this.x > arenaWidth ||
      this.y < 0 || this.y > arenaHeight
    ) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const alpha = (i / this.trail.length) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.radius * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 0, 170, ${alpha})`;
      ctx.fill();
    }

    // Dart Head
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff00aa';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export class Explosion {
  constructor(x, y, type = SPARK_TYPES.NORMAL, combo = 1) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.combo = combo;

    const config = SPARK_CONFIG[type] || SPARK_CONFIG[SPARK_TYPES.NORMAL];
    this.maxRadius = config.blastRadius;
    this.duration = config.blastDuration;
    this.color = config.color;
    this.glowColor = config.glowColor;

    this.elapsed = 0;
    this.currentRadius = 0;
    this.alpha = 1;
    this.alive = true;

    // Expand phase takes ~35% of total duration
    this.expandTime = this.duration * 0.35;

    // Splitter darts
    this.darts = [];
    if (type === SPARK_TYPES.SPLITTER) {
      const dartCount = config.dartCount || 4;
      const baseAngle = Math.random() * Math.PI;
      for (let i = 0; i < dartCount; i++) {
        const ang = baseAngle + (Math.PI * 2 / dartCount) * i;
        this.darts.push(new SplitterDart(x, y, ang, config.dartSpeed, 350));
      }
    }

    // Secondary wave for Repulsor/Phase sparks
    this.hasSecondaryFired = false;
  }

  update(dt, arenaWidth, arenaHeight, onSecondaryWave = null) {
    if (!this.alive) return;

    this.elapsed += dt;

    // Expanding radius
    if (this.elapsed < this.expandTime) {
      const t = this.elapsed / this.expandTime;
      // easeOutCubic
      const progress = 1 - Math.pow(1 - t, 3);
      this.currentRadius = this.maxRadius * progress;
      this.alpha = 1;
    } else {
      // Hold and fade
      this.currentRadius = this.maxRadius;
      const fadeProgress = (this.elapsed - this.expandTime) / (this.duration - this.expandTime);
      this.alpha = Math.max(0, 1 - fadeProgress);
    }

    if (this.elapsed >= this.duration) {
      this.alive = false;
    }

    // Repulsor secondary delayed shockwave
    if (
      this.type === SPARK_TYPES.REPULSOR &&
      !this.hasSecondaryFired &&
      this.elapsed >= (SPARK_CONFIG[SPARK_TYPES.REPULSOR].secondaryBlastDelay || 0.6)
    ) {
      this.hasSecondaryFired = true;
      if (onSecondaryWave) {
        onSecondaryWave(this.x, this.y, this.combo + 1);
      }
    }

    // Update splitter darts
    for (const dart of this.darts) {
      dart.update(dt, arenaWidth, arenaHeight);
    }
  }

  // Check collision with an orb
  collidesWith(orb) {
    if (!this.alive || !orb.alive) return false;

    // Check main blast wave collision
    const dx = orb.x - this.x;
    const dy = orb.y - this.y;
    const distSq = dx * dx + dy * dy;
    const hitRadius = this.currentRadius + orb.radius;

    if (distSq <= hitRadius * hitRadius) {
      return true;
    }

    // Check splitter dart collisions
    for (const dart of this.darts) {
      if (!dart.alive) continue;
      const ddx = orb.x - dart.x;
      const ddy = orb.y - dart.y;
      const dDistSq = ddx * ddx + ddy * ddy;
      const dHitRad = dart.radius + orb.radius;
      if (dDistSq <= dHitRad * dHitRad) {
        dart.alive = false;
        return true;
      }
    }

    return false;
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Outer shockwave glow
    const grad = ctx.createRadialGradient(
      this.x, this.y, Math.max(0, this.currentRadius * 0.4),
      this.x, this.y, this.currentRadius
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.5, this.glowColor);
    grad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sharp glowing shockwave border ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1.5, 4 * this.alpha);
    ctx.stroke();

    // Center core flash on initial blast
    if (this.elapsed < this.expandTime * 0.5) {
      const flashAlpha = 1 - (this.elapsed / (this.expandTime * 0.5));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentRadius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
      ctx.fill();
    }

    // Render splitter darts
    for (const dart of this.darts) {
      dart.render(ctx);
    }

    ctx.restore();
  }
}
