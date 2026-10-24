// Spark Panic 2.0 - Particle Engine, Chain Nova Shockwaves & Floating Combat Callouts

import { audio } from '../engine/audio.js';

export class ParticleEngine {
  constructor() {
    this.novas = [];
    this.debris = [];
    this.sparks = [];
    this.floaters = [];
  }

  clear() {
    this.novas = [];
    this.debris = [];
    this.sparks = [];
    this.floaters = [];
  }

  spawnNova(x, y, maxRadius, color, damage = 35, isPlayer = false) {
    this.novas.push({
      x,
      y,
      radius: 8,
      maxRadius,
      speed: 380,
      color,
      damage,
      isPlayer,
      alpha: 1.0,
      hitAliens: new Set()
    });
  }

  spawnDebris(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.debris.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        decay: 1.2 + Math.random() * 1.5
      });
    }
  }

  spawnCosmicSpark(x, y, value = 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    this.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      value,
      pulse: Math.random() * Math.PI * 2,
      alive: true
    });
  }

  addFloater(x, y, text, color = '#ffd700', size = 16) {
    this.floaters.push({
      x,
      y,
      text,
      color,
      size,
      vy: -45,
      alpha: 1.0,
      life: 0.95
    });
  }

  update(dt, planetX, planetY, turretRadius, aliens, onNovaHitCallback, onSparkCollectedCallback, onBossPhase2Callback = null, hazardManager = null, supplyPodManager = null, onAsteroidShatterCallback = null, onPodDestroyedCallback = null) {
    // 1. Update Chain Nova Shockwaves
    for (let i = this.novas.length - 1; i >= 0; i--) {
      const n = this.novas[i];
      n.radius += n.speed * dt;
      n.alpha = Math.max(0, 1 - (n.radius / n.maxRadius));

      // Damage aliens within expanding shockwave ring (Novas pierce boss shield)
      for (const alien of aliens) {
        if (!alien.alive || n.hitAliens.has(alien)) continue;
        const d = Math.hypot(alien.x - n.x, alien.y - n.y);
        if (Math.abs(d - n.radius) < 32 || d <= n.radius) {
          n.hitAliens.add(alien);
          const destroyed = alien.takeDamage(n.damage, null, null, true, onBossPhase2Callback);
          if (onNovaHitCallback) {
            onNovaHitCallback(alien, destroyed, n);
          }
        }
      }

      // Check Nova impact on Drifting Asteroids (Sector I)
      if (hazardManager) {
        hazardManager.checkHitAsteroids(n.x, n.y, n.radius, n.damage, onAsteroidShatterCallback);
      }

      // Check Nova impact on Orbital Supply Pods
      if (supplyPodManager) {
        supplyPodManager.checkHit(n.x, n.y, n.radius, n.damage, onPodDestroyedCallback);
      }

      if (n.radius >= n.maxRadius || n.alpha <= 0.01) {
        this.novas.splice(i, 1);
      }
    }

    // 2. Update Debris Sparks
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const p = this.debris[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * p.decay;
      if (p.alpha <= 0.01) {
        this.debris.splice(i, 1);
      }
    }

    // 3. Update Collectible Cosmic Sparks (Magnetic pull toward planet/turret)
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.pulse += dt * 8;

      // Magnetic acceleration toward planet
      const dx = planetX - s.x;
      const dy = planetY - s.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 350) {
        const pullSpeed = 240 + (350 - dist) * 1.5;
        s.vx = (dx / dist) * pullSpeed;
        s.vy = (dy / dist) * pullSpeed;
      }

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Collection near planet/turret
      if (dist <= turretRadius + 18) {
        s.alive = false;
        audio.playShardPickup();
        if (onSparkCollectedCallback) {
          onSparkCollectedCallback(s.value);
        }
        this.sparks.splice(i, 1);
      }
    }

    // 4. Update Floating Callouts
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.y += f.vy * dt;
      f.life -= dt;
      f.alpha = Math.max(0, f.life / 0.95);
      if (f.life <= 0) {
        this.floaters.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // 1. Render Novas
    for (const n of this.novas) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = n.alpha;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Inner chromatic ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(0, n.radius * 0.75), 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 2. Render Debris
    for (const p of this.debris) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Magnetic Cosmic Sparks
    for (const s of this.sparks) {
      ctx.save();
      ctx.translate(s.x, s.y);
      const pulseSize = 4 + Math.sin(s.pulse) * 1.5;

      ctx.beginPath();
      ctx.moveTo(0, -pulseSize);
      ctx.lineTo(pulseSize, 0);
      ctx.lineTo(0, pulseSize);
      ctx.lineTo(-pulseSize, 0);
      ctx.closePath();
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.restore();
    }

    // 4. Render Floating Text
    for (const f of this.floaters) {
      ctx.save();
      ctx.font = `bold ${f.size}px Orbitron, sans-serif`;
      ctx.fillStyle = f.color;
      ctx.globalAlpha = f.alpha;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }
}
