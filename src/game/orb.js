// Guardian of the Universe - Alien Invader Entity

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

    // Velocity angle
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.baseSpeed;
    this.vy = Math.sin(angle) * this.baseSpeed;

    this.alive = true;
    this.frozenTimer = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.thrusterPhase = Math.random() * Math.PI * 2;
  }

  freeze(duration = 4.0) {
    this.frozenTimer = Math.max(this.frozenTimer, duration);
  }

  update(dt, topPadding = 110, bottomPadding = 40) {
    if (!this.alive) return;

    this.pulsePhase += dt * 4;
    this.thrusterPhase += dt * 15;

    let speedMultiplier = 1;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      speedMultiplier = SPARK_CONFIG[SPARK_TYPES.FREEZE].slowFactor || 0.25;
    }

    this.x += this.vx * speedMultiplier * dt;
    this.y += this.vy * speedMultiplier * dt;

    // Bounce off horizontal boundaries
    if (this.x - this.radius < 6) {
      this.x = this.radius + 6;
      this.vx = Math.abs(this.vx);
    } else if (this.x + this.radius > this.arenaWidth - 6) {
      this.x = this.arenaWidth - 6 - this.radius;
      this.vx = -Math.abs(this.vx);
    }

    // Bounce off vertical boundaries (respecting top HUD header)
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

    // Rotate facing direction of travel
    const heading = Math.atan2(this.vy, this.vx);
    ctx.rotate(heading);

    const pulse = Math.sin(this.pulsePhase) * 1.5;
    const r = this.radius + pulse;

    // Frozen stasis field indicator
    if (this.frozenTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 163, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 163, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Alien energy shield glow
    const grad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.9);
    grad.addColorStop(0, this.color);
    grad.addColorStop(0.5, this.glowColor);
    grad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Alien ship hull styling by type
    if (this.type === SPARK_TYPES.NORMAL) {
      // Scout Delta-Fighter
      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0);
      ctx.lineTo(-r * 0.9, -r * 0.85);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r * 0.9, r * 0.85);
      ctx.closePath();
      ctx.fillStyle = '#0a1d37';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing plasma cockpit
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.type === SPARK_TYPES.MEGA) {
      // Dreadnought Heavy Mothership (Hexagonal fortress)
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i;
        const px = Math.cos(ang) * (r * 1.25);
        const py = Math.sin(ang) * (r * 1.25);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#2b2005';
      ctx.fill();
      ctx.strokeStyle = '#ffe600';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Dual heavy defense rings
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing core reactor
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe600';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.type === SPARK_TYPES.SPLITTER) {
      // Interceptor Trident Warship
      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0);
      ctx.lineTo(r * 0.2, -r * 1.1);
      ctx.lineTo(-r * 0.8, -r * 0.6);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.lineTo(r * 0.2, r * 1.1);
      ctx.closePath();
      ctx.fillStyle = '#320623';
      ctx.fill();
      ctx.strokeStyle = '#ff00aa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4 orbital micro-drones
      const orbitDist = r + 6;
      for (let i = 0; i < 4; i++) {
        const ang = this.pulsePhase * 2 + (Math.PI / 2) * i;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * orbitDist, Math.sin(ang) * orbitDist, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    } else if (this.type === SPARK_TYPES.FREEZE) {
      // Cryo Diamond Frigate
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(0, -r * 0.9);
      ctx.lineTo(-r * 1.1, 0);
      ctx.lineTo(0, r * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#062d22';
      ctx.fill();
      ctx.strokeStyle = '#00ffa3';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crystalline frost core
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, 0);
      ctx.lineTo(r * 0.5, 0);
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.type === SPARK_TYPES.REPULSOR) {
      // Phase-Shifter Warp Vessel
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = '#220835';
      ctx.fill();
      ctx.strokeStyle = '#b55fe6';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Pulsing phase ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(181, 95, 230, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Engine thruster glow
    const thrusterLength = (0.5 + Math.sin(this.thrusterPhase) * 0.5) * (r * 0.8);
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.25);
    ctx.lineTo(-r * 0.7 - thrusterLength, 0);
    ctx.lineTo(-r * 0.7, r * 0.25);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.restore();
  }
}
