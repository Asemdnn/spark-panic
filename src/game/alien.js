// Spark Panic 2.0 - Invading Alien Armada Entities (7 Classes)

import { ALIEN_CLASSES } from '../config.js';

export class Alien {
  constructor(x, y, classKey, bossCustomName = null) {
    this.x = x;
    this.y = y;
    this.classKey = classKey;
    const cfg = ALIEN_CLASSES[classKey] || ALIEN_CLASSES.SCOUT;

    this.name = bossCustomName || cfg.name;
    this.color = cfg.color;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.speed = cfg.speed;
    this.radius = cfg.radius;
    this.score = cfg.score;
    this.damage = cfg.damage;
    this.novaRadius = cfg.novaRadius;

    this.alive = true;
    this.frozenTimer = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.heading = 0;

    // Boss Multi-Phase Overdrive Mechanics
    this.isBoss = (classKey === 'BOSS');
    this.phase = 1;
    this.isPhase2 = false;
    this.shieldAngle = 0;
    this.shieldHitFlash = 0;

    // Class specific AI timers
    this.torpedoTimer = 1.5 + Math.random() * 2.0;
    this.blinkTimer = 3.4;
    this.spawnTimer = 3.5;
    this.orbitDistance = 200 + Math.random() * 80;
    this.orbitAngle = Math.atan2(y, x);
  }

  freeze(duration = 4.5) {
    this.frozenTimer = Math.max(this.frozenTimer, duration);
  }

  takeDamage(amount, hitX = null, hitY = null, isDirectPierce = false, onBossPhase2 = null) {
    if (!this.alive) return false;

    // Boss Phase 2 Rotating Directional Shield Arc deflection (50% reduction for standard turret fire)
    if (this.isBoss && this.isPhase2 && !isDirectPierce && hitX !== null && hitY !== null) {
      const hitAngle = Math.atan2(hitY - this.y, hitX - this.x);
      let diff = Math.abs(hitAngle - this.shieldAngle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      const halfArc = (110 * Math.PI) / 360; // 55° (110° total arc)
      if (diff <= halfArc) {
        amount *= 0.5; // Deflected by 50%
        this.shieldHitFlash = 0.22;
      }
    }

    this.hp -= amount;

    // Multi-Phase Boss Enrage: Enters Phase 2 at <= 50% HP
    if (this.isBoss && !this.isPhase2 && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
      this.isPhase2 = true;
      this.phase = 2;
      if (onBossPhase2) {
        onBossPhase2(this);
      }
    }

    if (this.hp <= 0) {
      this.alive = false;
      return true; // Destroyed
    }
    return false;
  }

  update(dt, planetX, planetY, shieldRadius, spawnDropshipScoutCallback, fireTorpedoCallback) {
    if (!this.alive) return;

    this.pulsePhase += dt * 4;

    if (this.isBoss && this.isPhase2) {
      this.shieldAngle += dt * 1.8;
      if (this.shieldHitFlash > 0) this.shieldHitFlash -= dt;
    }

    let speedMult = 1.0;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      speedMult = 0.25; // 75% slowed
    }

    const distToPlanet = Math.hypot(planetX - this.x, planetY - this.y);
    const angleToPlanet = Math.atan2(planetY - this.y, planetX - this.x);

    // AI Behaviors by Alien Class
    if (this.classKey === 'SCOUT') {
      // Inward Spiral Ramming Attack
      this.heading = angleToPlanet + 0.35 * Math.sin(this.pulsePhase);
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
    } else if (this.classKey === 'INTERCEPTOR') {
      // Mid-Range Orbit & Torpedo Firing
      if (distToPlanet > this.orbitDistance) {
        this.heading = angleToPlanet;
        this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
        this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
      } else {
        // Orbiting around planet
        this.orbitAngle += (this.speed / this.orbitDistance) * speedMult * dt;
        this.x = planetX + Math.cos(this.orbitAngle) * this.orbitDistance;
        this.y = planetY + Math.sin(this.orbitAngle) * this.orbitDistance;
        this.heading = angleToPlanet;
      }

      this.torpedoTimer -= dt * speedMult;
      if (this.torpedoTimer <= 0) {
        this.torpedoTimer = 3.6 + Math.random() * 1.5;
        if (fireTorpedoCallback) {
          fireTorpedoCallback(this.x, this.y, angleToPlanet, 180, 10, '#e040fb');
        }
      }
    } else if (this.classKey === 'CRYO') {
      // Steady Diamond Advance
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
    } else if (this.classKey === 'PHASE') {
      // Quantum Blink Advance
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.blinkTimer -= dt * speedMult;
      if (this.blinkTimer <= 0) {
        this.blinkTimer = 3.4;
        // Blink 48px closer to planet
        this.x += Math.cos(angleToPlanet) * 48;
        this.y += Math.sin(angleToPlanet) * 48;
      }
    } else if (this.classKey === 'DROPSHIP') {
      // Heavy Lander marching straight, spawning mini scouts
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.spawnTimer -= dt * speedMult;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 4.5;
        if (spawnDropshipScoutCallback) {
          spawnDropshipScoutCallback(this.x, this.y);
        }
      }
    } else if (this.classKey === 'DREADNOUGHT') {
      // Heavy Battleship with Torpedo Launcher
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.torpedoTimer -= dt * speedMult;
      if (this.torpedoTimer <= 0) {
        this.torpedoTimer = 4.2;
        if (fireTorpedoCallback) {
          fireTorpedoCallback(this.x, this.y, angleToPlanet, 160, 20, '#ffd700');
        }
      }
    } else if (this.classKey === 'BOSS') {
      // Sector Mothership with 3-Spread Torpedo Salvo
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.torpedoTimer -= dt * speedMult;
      if (this.torpedoTimer <= 0) {
        this.torpedoTimer = 3.5;
        if (fireTorpedoCallback) {
          fireTorpedoCallback(this.x, this.y, angleToPlanet - 0.22, 175, 18, '#ff1744');
          fireTorpedoCallback(this.x, this.y, angleToPlanet, 190, 22, '#ff1744');
          fireTorpedoCallback(this.x, this.y, angleToPlanet + 0.22, 175, 18, '#ff1744');
        }
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    const r = this.radius;

    // Stasis Freeze Indicator
    if (this.frozenTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 230, 118, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Class Specific Ship Hull Drawing
    if (this.classKey === 'SCOUT') {
      // Delta-Wing Dart Fighter
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(-r * 0.9, -r * 0.85);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r * 0.9, r * 0.85);
      ctx.closePath();
      ctx.fillStyle = '#0a1d37';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing Cockpit
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    } else if (this.classKey === 'INTERCEPTOR') {
      // Trident 3-Prong Warship
      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0);
      ctx.lineTo(r * 0.2, -r * 1.1);
      ctx.lineTo(-r * 0.8, -r * 0.6);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.lineTo(r * 0.2, r * 1.1);
      ctx.closePath();
      ctx.fillStyle = '#2d0628';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Core plasma orb
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'CRYO') {
      // Hexagonal Stasis Cruiser
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const px = Math.cos(ang) * (r * 1.15);
        const py = Math.sin(ang) * (r * 1.15);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#062d1f';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Frost Crystal Core
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0);
      ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.classKey === 'PHASE') {
      // Diamond Quantum Vessel
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(0, -r * 0.9);
      ctx.lineTo(-r * 1.1, 0);
      ctx.lineTo(0, r * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#220835';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Pulsing phase ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'DROPSHIP') {
      // Heavy Armored Lander
      ctx.beginPath();
      ctx.rect(-r * 1.0, -r * 0.8, r * 2.0, r * 1.6);
      ctx.fillStyle = '#300814';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Dual side engines
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(-r * 1.1, -r * 0.9, r * 0.4, r * 0.35);
      ctx.fillRect(-r * 1.1, r * 0.55, r * 0.4, r * 0.35);
    } else if (this.classKey === 'DREADNOUGHT') {
      // Solar Dreadnought Flagship
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(r * 0.6, -r * 1.1);
      ctx.lineTo(-r * 1.2, -r * 0.8);
      ctx.lineTo(-r * 0.7, 0);
      ctx.lineTo(-r * 1.2, r * 0.8);
      ctx.lineTo(r * 0.6, r * 1.1);
      ctx.closePath();
      ctx.fillStyle = '#352504';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Heavy Core Reactor
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'BOSS') {
      // Sector Mothership Apex Flagship
      ctx.beginPath();
      ctx.moveTo(r * 1.8, 0);
      ctx.lineTo(r * 0.8, -r * 1.2);
      ctx.lineTo(-r * 1.4, -r * 1.0);
      ctx.lineTo(-r * 0.8, 0);
      ctx.lineTo(-r * 1.4, r * 1.0);
      ctx.lineTo(r * 0.8, r * 1.2);
      ctx.closePath();
      ctx.fillStyle = '#3a0814';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Heavy Boss Core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#ff1744';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Health Bar for Heavy and Boss ships
    if (this.hp < this.maxHp && this.maxHp > 30 && this.classKey !== 'BOSS') {
      const barW = r * 2.2;
      const barH = 3.5;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-barW / 2, -r - 10, barW, barH);
      ctx.fillStyle = this.color;
      ctx.fillRect(-barW / 2, -r - 10, barW * pct, barH);
    }

    ctx.restore();

    // Phase 2 Rotating 110° Front Energy Shield Arc
    if (this.isBoss && this.isPhase2) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      const halfArc = (110 * Math.PI) / 360; // 55°
      ctx.arc(0, 0, r + 14, this.shieldAngle - halfArc, this.shieldAngle + halfArc);
      ctx.strokeStyle = this.shieldHitFlash > 0 ? '#ffffff' : '#ffd700';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Directional emitter nodes at arc ends
      const end1X = Math.cos(this.shieldAngle - halfArc) * (r + 14);
      const end1Y = Math.sin(this.shieldAngle - halfArc) * (r + 14);
      const end2X = Math.cos(this.shieldAngle + halfArc) * (r + 14);
      const end2Y = Math.sin(this.shieldAngle + halfArc) * (r + 14);
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(end1X, end1Y, 3, 0, Math.PI * 2);
      ctx.arc(end2X, end2Y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
