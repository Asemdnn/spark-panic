// Spark Panic - Spark / Orb Entity

import { SPARK_CONFIG, SPARK_TYPES } from '../config.js';

export class Orb {
  constructor(x, y, type = SPARK_TYPES.NORMAL, arenaWidth = 720, arenaHeight = 1280) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    const config = SPARK_CONFIG[type] || SPARK_CONFIG[SPARK_TYPES.NORMAL];
    this.radius = config.radius;
    this.color = config.color;
    this.glowColor = config.glowColor;
    this.score = config.score;
    this.baseSpeed = config.speed;

    // Random velocity angle
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.baseSpeed;
    this.vy = Math.sin(angle) * this.baseSpeed;

    this.alive = true;
    this.frozenTimer = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 3;
  }

  freeze(duration = 3) {
    this.frozenTimer = Math.max(this.frozenTimer, duration);
  }

  update(dt, topPadding = 110, bottomPadding = 40) {
    if (!this.alive) return;

    this.pulsePhase += dt * 4;
    this.rotation += this.rotSpeed * dt;

    let speedMultiplier = 1;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      speedMultiplier = SPARK_CONFIG[SPARK_TYPES.FREEZE].slowFactor || 0.3;
    }

    this.x += this.vx * speedMultiplier * dt;
    this.y += this.vy * speedMultiplier * dt;

    // Bounce off horizontal walls
    if (this.x - this.radius < 4) {
      this.x = this.radius + 4;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius > this.arenaWidth - 4) {
      this.x = this.arenaWidth - 4 - this.radius;
      this.vx = -Math.abs(this.vx);
    }

    // Bounce off vertical walls (respecting HUD header padding)
    if (this.y - this.radius < topPadding) {
      this.y = topPadding + this.radius;
      this.vy = Math.abs(this.vy);
    } else if (this.y + this.radius > this.arenaHeight - bottomPadding) {
      this.y = this.arenaHeight - bottomPadding - this.radius;
      this.vy = -Math.abs(this.vy);
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(this.pulsePhase) * 2;
    const currentRadius = this.radius + pulse;

    // Frozen frosty aura indicator
    if (this.frozenTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 163, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 163, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Outer glow
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, currentRadius * 1.8);
    grad.addColorStop(0, this.color);
    grad.addColorStop(0.6, this.glowColor);
    grad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(0, 0, currentRadius * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Solid inner core
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Center bright highlight
    ctx.beginPath();
    ctx.arc(-currentRadius * 0.25, -currentRadius * 0.25, currentRadius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Type-specific decoration glyphs
    ctx.rotate(this.rotation);
    if (this.type === SPARK_TYPES.MEGA) {
      // Golden dual orbiting spikes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius + 5, 0, Math.PI * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius + 5, Math.PI, Math.PI * 1.6);
      ctx.stroke();
    } else if (this.type === SPARK_TYPES.SPLITTER) {
      // 4 orbital micro dots
      ctx.fillStyle = '#ffffff';
      const orbitDist = currentRadius + 5;
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * orbitDist, Math.sin(ang) * orbitDist, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === SPARK_TYPES.FREEZE) {
      // Hexagonal snowflake crystal lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const ang = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (currentRadius * 0.7), Math.sin(ang) * (currentRadius * 0.7));
        ctx.lineTo(-Math.cos(ang) * (currentRadius * 0.7), -Math.sin(ang) * (currentRadius * 0.7));
        ctx.stroke();
      }
    } else if (this.type === SPARK_TYPES.REPULSOR) {
      // Concentric pulsed ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
