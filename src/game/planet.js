// Spark Panic 2.0 - Central Living Planet & Aegis Energy Shield

import { audio } from '../engine/audio.js';

export class Planet {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = canvas.width * 0.5;
    this.y = canvas.height * 0.53;
    this.planetRadius = 75;
    this.shieldRadius = 97;

    this.maxShield = 100;
    this.shield = 100;
    this.maxCoreHp = 100;
    this.coreHp = 100;

    this.outOfCombatTimer = 0;
    this.shieldRegenRate = 18; // HP/sec
    this.rotation = 0;
    this.pulsePhase = 0;

    this.data = null;
    this.shieldRipples = [];
    this.craters = [];
    this.continents = [];
    this.initContinents();
  }

  initContinents() {
    this.continents = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      this.continents.push({
        angle: (i / count) * Math.PI * 2,
        dist: 0.2 + Math.random() * 0.5,
        radius: 0.2 + Math.random() * 0.25,
        tilt: (Math.random() - 0.5) * 0.8
      });
    }
  }

  resize(width, height) {
    this.x = width * 0.5;
    this.y = height * 0.53;
    this.planetRadius = Math.max(68, Math.min(width, height) * 0.115);
    this.shieldRadius = this.planetRadius + 22;
  }

  setPlanet(planetConfig, shieldGridLvl = 0) {
    this.data = planetConfig;
    const bonusPct = shieldGridLvl * 0.22;
    this.maxShield = Math.round(100 * (1 + bonusPct));
    this.shield = this.maxShield;
    this.maxCoreHp = Math.round(100 * (1 + bonusPct));
    this.coreHp = this.maxCoreHp;

    this.outOfCombatTimer = 0;
    this.shieldRegenRate = 18 * (1 + shieldGridLvl * 0.2);
    this.shieldRipples = [];
    this.craters = [];
    this.initContinents();
  }

  damage(amount, hitX, hitY) {
    this.outOfCombatTimer = 0;
    const angle = Math.atan2(hitY - this.y, hitX - this.x);

    // Directional shield ripple
    this.shieldRipples.push({
      angle,
      radius: 6,
      maxRadius: 36,
      alpha: 1.0
    });

    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        audio.playShieldHit();
      } else {
        const overflow = amount - this.shield;
        this.shield = 0;
        this.coreHp = Math.max(0, this.coreHp - overflow);
        this.addCrater(angle);
        audio.playShieldHit();
      }
    } else {
      this.coreHp = Math.max(0, this.coreHp - amount);
      this.addCrater(angle);
      audio.playShieldHit();
    }
  }

  restoreShield(amount) {
    const prev = this.shield;
    this.shield = Math.min(this.maxShield, this.shield + amount);
    return this.shield - prev;
  }

  addCrater(angle) {
    const r = this.planetRadius * (0.4 + Math.random() * 0.45);
    this.craters.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      size: 6 + Math.random() * 6,
      alpha: 1.0
    });
    if (this.craters.length > 12) this.craters.shift();
  }

  update(dt, isOverdrive = false) {
    this.rotation += dt * 0.18;
    this.pulsePhase += dt * (isOverdrive ? 6 : 3);
    this.outOfCombatTimer += dt;

    // Shield Regen after 3.5s delay
    if (this.outOfCombatTimer >= 3.5 && this.shield < this.maxShield && this.coreHp > 0) {
      this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * dt);
    }

    // Update shield ripples
    for (let i = this.shieldRipples.length - 1; i >= 0; i--) {
      const rip = this.shieldRipples[i];
      rip.radius += dt * 75;
      rip.alpha = Math.max(0, 1 - (rip.radius / rip.maxRadius));
      if (rip.radius >= rip.maxRadius || rip.alpha <= 0.01) {
        this.shieldRipples.splice(i, 1);
      }
    }
  }

  // Draw background ring half before planet body
  renderBackRing(ctx) {
    if (!this.data || !this.data.rings) return;
    const r = this.planetRadius;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-0.35);

    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.85, r * 0.55, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = `${this.data.atmo}88`;
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.72, r * 0.50, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  render(ctx, isOverdrive = false) {
    if (!this.data) return;
    const r = this.planetRadius;
    const sr = this.shieldRadius;
    const atmo = this.data.atmo || '#00e5ff';
    const c1 = this.data.color1 || '#0ea5e9';
    const c2 = this.data.color2 || '#10b981';

    // 1. Atmospheric Outer Halo
    const halo = ctx.createRadialGradient(this.x, this.y, r * 0.8, this.x, this.y, sr + 24);
    halo.addColorStop(0, `${atmo}44`);
    halo.addColorStop(0.7, `${atmo}18`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(this.x, this.y, sr + 24, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rotating Celestial Planet Body
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.clip();

    // Base color
    ctx.fillStyle = c1;
    ctx.fillRect(this.x - r, this.y - r, r * 2, r * 2);

    // Rotating Continents & Biome Swirls
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = c2;
    for (const cont of this.continents) {
      const cx = Math.cos(cont.angle) * (r * cont.dist);
      const cy = Math.sin(cont.angle) * (r * cont.dist);
      const cr = r * cont.radius;

      ctx.beginPath();
      ctx.ellipse(cx, cy, cr * 1.3, cr * 0.9, cont.tilt, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact Craters on surface
    for (const cr of this.craters) {
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, cr.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
      ctx.fill();
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();

    // 3D Spherical Night-Side Terminator Shadow
    const shadow = ctx.createRadialGradient(
      this.x - r * 0.45, this.y - r * 0.45, r * 0.2,
      this.x, this.y, r * 1.05
    );
    shadow.addColorStop(0, 'rgba(0,0,0,0)');
    shadow.addColorStop(0.55, 'rgba(3,7,18,0.4)');
    shadow.addColorStop(1, 'rgba(1,3,10,0.92)');
    ctx.fillStyle = shadow;
    ctx.fillRect(this.x - r, this.y - r, r * 2, r * 2);

    ctx.restore();

    // Atmospheric Edge Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = atmo;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = atmo;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Draw Foreground Ring Half
    if (this.data.rings) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(-0.35);

      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.85, r * 0.55, 0, 0, Math.PI);
      ctx.strokeStyle = `${atmo}aa`;
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.72, r * 0.50, 0, 0, Math.PI);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }

    // 4. Aegis Energy Shield
    if (this.shield > 0) {
      const shieldPct = this.shield / this.maxShield;
      const pulse = Math.sin(this.pulsePhase) * 1.5;
      const curSr = sr + pulse;
      const shieldColor = isOverdrive ? '#ffd700' : (shieldPct > 0.4 ? '#00e5ff' : '#ff3366');

      // Translucent energy dome
      ctx.beginPath();
      ctx.arc(this.x, this.y, curSr, 0, Math.PI * 2);
      ctx.fillStyle = isOverdrive
        ? 'rgba(255, 215, 0, 0.16)'
        : (shieldPct > 0.4 ? 'rgba(0, 229, 255, 0.14)' : 'rgba(255, 51, 102, 0.18)');
      ctx.fill();

      // Outer boundary ring
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = isOverdrive ? 3 : 2;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = isOverdrive ? 18 : 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Hexagonal Lattice Defense Nodes
      const nodeCount = 16;
      for (let i = 0; i < nodeCount; i++) {
        const ang = (i / nodeCount) * Math.PI * 2 + (this.pulsePhase * 0.1);
        const nx = this.x + Math.cos(ang) * curSr;
        const ny = this.y + Math.sin(ang) * curSr;

        ctx.beginPath();
        ctx.arc(nx, ny, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = shieldColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Directional Hit Ripples
      for (const rip of this.shieldRipples) {
        const hx = this.x + Math.cos(rip.angle) * curSr;
        const hy = this.y + Math.sin(rip.angle) * curSr;

        ctx.beginPath();
        ctx.arc(hx, hy, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isOverdrive ? '#ffd700' : '#00e5ff';
        ctx.globalAlpha = rip.alpha;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }
  }
}
