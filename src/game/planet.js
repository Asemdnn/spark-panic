// Spark Panic 2.0 - Central Living Planet & Aegis Energy Shield

import { audio } from '../engine/audio.js';

export class Planet {
  constructor(canvasOrWidth, maybeHeight, maybeConfig) {
    if (typeof canvasOrWidth === 'number') {
      this.canvas = { width: canvasOrWidth, height: maybeHeight || 600 };
      this.x = canvasOrWidth * 0.5;
      this.y = (maybeHeight || 600) * 0.53;
      if (maybeConfig) this.data = maybeConfig;
    } else {
      this.canvas = canvasOrWidth;
      const w = canvasOrWidth && canvasOrWidth.width ? canvasOrWidth.width : 800;
      const h = canvasOrWidth && canvasOrWidth.height ? canvasOrWidth.height : 600;
      this.x = w * 0.5;
      this.y = h * 0.53;
    }
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
    this.surfaceCities = [];
    this.cityDistressTimer = 0;
    this.cityParticles = [];
    this.fireworks = [];
    this.initCities();
    this.initContinents();
  }

  initCities() {
    this.surfaceCities = [];
    for (let i = 0; i < 4; i++) {
      this.surfaceCities.push({
        index: i,
        angle: i * Math.PI * 0.5,
        spires: [
          { width: 5, height: 3, offset: -6 },
          { width: 8, height: 4, offset: -2 },
          { width: 3, height: 1.2, offset: -0.6 },
          { width: 5, height: 3, offset: 3 }
        ]
      });
    }
  }

  get fireworkParticles() {
    return this.fireworks.filter(f => f.type === 'spark');
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
    this.cityParticles = [];
    this.fireworks = [];
    this.cityDistressTimer = 0;
    this.initCities();
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

    // Update Surface City Distress Signals & Particles
    const hpRatio = this.coreHp / (this.maxCoreHp || 100);
    this.cityDistressTimer += dt;
    if (hpRatio < 0.70 && this.cityDistressTimer >= (hpRatio < 0.35 ? 0.08 : 0.20)) {
      this.cityDistressTimer = 0;
      const r = this.planetRadius;
      const cityIdx = Math.floor(Math.random() * 4);
      const cityAngle = (cityIdx * Math.PI * 0.5) + this.rotation;
      const cx = this.x + Math.cos(cityAngle) * r;
      const cy = this.y + Math.sin(cityAngle) * r;

      if (hpRatio < 0.35) {
        // Critical: Red emergency strobes & electrical distress arcs
        this.cityParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(cityAngle) * (25 + Math.random() * 35) + (Math.random() - 0.5) * 20,
          vy: Math.sin(cityAngle) * (25 + Math.random() * 35) + (Math.random() - 0.5) * 20,
          color: Math.random() > 0.5 ? '#ff3366' : '#ffd700',
          size: 1.8 + Math.random() * 1.5,
          alpha: 1.0,
          life: 0.3 + Math.random() * 0.3,
          maxLife: 0.6,
          isArc: Math.random() > 0.35
        });
      } else {
        // Warning: Orange warning beacons and tiny smoke/sparks
        this.cityParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(cityAngle) * (12 + Math.random() * 18) + (Math.random() - 0.5) * 12,
          vy: Math.sin(cityAngle) * (12 + Math.random() * 18) + (Math.random() - 0.5) * 12,
          color: Math.random() > 0.4 ? '#f97316' : '#94a3b8',
          size: 2.0 + Math.random() * 2.0,
          alpha: 0.8,
          life: 0.4 + Math.random() * 0.4,
          maxLife: 0.8,
          isArc: false
        });
      }
    }

    // Update City Particles
    for (let i = this.cityParticles.length - 1; i >= 0; i--) {
      const p = this.cityParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.cityParticles.splice(i, 1);
      }
    }

    // Update Fireworks (Shells & Exploding Sparks)
    const colors = ['#00e5ff', '#ffd700', '#e040fb', '#00e676', '#ff3366', '#ffffff'];
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      if (fw.type === 'shell') {
        fw.x += fw.vx * dt;
        fw.y += fw.vy * dt;
        fw.vx *= 0.98;
        fw.vy *= 0.98;
        fw.fuse -= dt;

        if (fw.fuse <= 0) {
          this.fireworks.splice(i, 1);
          const sparkCount = 16 + Math.floor(Math.random() * 8);
          for (let s = 0; s < sparkCount; s++) {
            const sAng = (s / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
            const sSpeed = 50 + Math.random() * 110;
            this.fireworks.push({
              type: 'spark',
              x: fw.x,
              y: fw.y,
              vx: Math.cos(sAng) * sSpeed,
              vy: Math.sin(sAng) * sSpeed,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: 2.2 + Math.random() * 1.6,
              alpha: 1.0,
              life: 0.65 + Math.random() * 0.55,
              maxLife: 1.2
            });
          }
        }
      } else if (fw.type === 'spark') {
        fw.x += fw.vx * dt;
        fw.y += fw.vy * dt;
        fw.vx *= 0.94;
        fw.vy *= 0.94;
        fw.life -= dt;
        fw.alpha = Math.max(0, fw.life / fw.maxLife);
        if (fw.life <= 0) {
          this.fireworks.splice(i, 1);
        }
      }
    }
  }

  triggerVictoryFireworks() {
    const colors = ['#00e5ff', '#ffd700', '#e040fb', '#00e676', '#ff3366', '#ffffff'];
    const r = this.planetRadius;

    for (let i = 0; i < 4; i++) {
      const cityAngle = (i * Math.PI * 0.5) + this.rotation;
      for (let s = 0; s < 2; s++) {
        const spread = (Math.random() - 0.5) * 0.45;
        const ang = cityAngle + spread;
        const speed = 120 + Math.random() * 85;
        this.fireworks.push({
          type: 'shell',
          x: this.x + Math.cos(cityAngle) * (r + 4),
          y: this.y + Math.sin(cityAngle) * (r + 4),
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          color: colors[(i * 2 + s) % colors.length],
          fuse: 0.35 + Math.random() * 0.45
        });
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

    // 3.5. Living Planetary Surface Cyber-Cities on Horizon (4 Cities at 0, 90, 180, 270 deg)
    const hpRatio = this.coreHp / (this.maxCoreHp || 100);
    const isCritical = hpRatio < 0.35;
    const isWarning = hpRatio >= 0.35 && hpRatio <= 0.70;

    for (let i = 0; i < 4; i++) {
      const cityAngle = (i * Math.PI * 0.5) + this.rotation;
      const cx = this.x + Math.cos(cityAngle) * r;
      const cy = this.y + Math.sin(cityAngle) * r;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(cityAngle); // +X radially outward, Y tangent to circumference

      // Miniature skyline silhouette
      ctx.fillStyle = '#080d1a';
      // Left building
      ctx.fillRect(0, -6, 5, 3);
      // Center skyscraper spire
      ctx.fillRect(0, -2, 8, 4);
      // Antenna spire
      ctx.fillRect(8, -0.6, 3, 1.2);
      // Right building
      ctx.fillRect(0, 3, 5, 3);

      // Window lights
      let windowColor = '#00e5ff';
      if (isCritical) {
        windowColor = '#ff3366';
      } else if (isWarning) {
        windowColor = (Math.sin(this.pulsePhase * 3 + i) > 0) ? '#f97316' : '#ffd700';
      } else {
        windowColor = (i % 2 === 0) ? '#00e5ff' : '#ffd700';
      }
      ctx.fillStyle = windowColor;
      ctx.fillRect(2, -4.5, 1.2, 1.2);
      ctx.fillRect(4, -1, 1.2, 1.2);
      ctx.fillRect(6, -1, 1.2, 1.2);
      ctx.fillRect(2, 4, 1.2, 1.2);

      // Energy cupola / dome over the city
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 7, 0, -Math.PI * 0.5, Math.PI * 0.5);
      if (isCritical) {
        const strobe = Math.sin(this.pulsePhase * 9 + i * 2) > 0;
        ctx.fillStyle = strobe ? 'rgba(255, 51, 102, 0.35)' : 'rgba(255, 51, 102, 0.08)';
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 1.4;
      } else if (isWarning) {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.16)';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.2;
      } else {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.14)';
        ctx.strokeStyle = (i % 2 === 0) ? '#00e5ff' : '#ffd700';
        ctx.lineWidth = 1.2;
      }
      ctx.fill();
      ctx.stroke();

      // Cyber Beacon Light at Spire Apex
      const beaconX = 11.5;
      ctx.beginPath();
      ctx.arc(beaconX, 0, 1.8, 0, Math.PI * 2);
      if (isCritical) {
        ctx.fillStyle = (Math.sin(this.pulsePhase * 10 + i * 3) > 0) ? '#ff3366' : 'transparent';
      } else if (isWarning) {
        ctx.fillStyle = (Math.sin(this.pulsePhase * 4 + i) > 0) ? '#f97316' : '#ffd700';
      } else {
        const beaconPulse = Math.sin(this.pulsePhase * 2.5 + i);
        ctx.fillStyle = beaconPulse > 0 ? '#00e5ff' : '#ffffff';
      }
      ctx.fill();

      ctx.restore();
    }

    // City Distress Particles & Electrical Arcs
    for (const p of this.cityParticles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();

      if (p.isArc) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (Math.random() - 0.5) * 12, p.y + (Math.random() - 0.5) * 12);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
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

    // 5. Celebratory Orbital Fireworks
    for (const fw of this.fireworks) {
      ctx.save();
      ctx.globalAlpha = fw.alpha !== undefined ? fw.alpha : 1.0;
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, fw.size || 2.4, 0, Math.PI * 2);
      ctx.fillStyle = fw.color;
      ctx.shadowColor = fw.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
  }
}
