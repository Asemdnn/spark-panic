// Spark Panic 2.0 - Particle Engine, Chain Nova Shockwaves & Floating Combat Callouts

import { audio } from '../engine/audio.js';
import { saveSystem } from '../engine/storage.js';

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

  spawnNova(x, y, maxRadius, color, damage = 35, isPlayer = false, combo = 1) {
    this.novas.push({
      x,
      y,
      radius: 8,
      maxRadius,
      speed: 380,
      color,
      damage,
      isPlayer,
      combo: combo || 1,
      rotation: 0,
      alpha: 1.0,
      hitAliens: new Set()
    });
  }

  spawnNovaRing(x, y, color = '#00e5ff', maxRadius = 100, combo = 1) {
    this.novas.push({
      x,
      y,
      radius: 6,
      maxRadius,
      speed: 360,
      color,
      damage: 0,
      isPlayer: false,
      combo: combo || 1,
      rotation: 0,
      alpha: 1.0,
      hitAliens: new Set()
    });
  }

  spawnDebris(x, y, color, count = 12) {
    const settings = saveSystem?.getSettings ? saveSystem.getSettings() : null;
    let actualCount = count;
    if (settings && settings.particleDensity === 'low') {
      actualCount = Math.max(2, Math.round(count * 0.5));
    }
    for (let i = 0; i < actualCount; i++) {
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
    const settings = saveSystem?.getSettings ? saveSystem.getSettings() : null;
    if (settings) {
      if (settings.floatingText === 'off') return;
      if (settings.floatingText === 'combos') {
        const str = String(text);
        const isPriority = str.includes('CHAIN') || str.includes('CRIT') || str.includes('BOSS') || str.includes('TITAN') || str.includes('RELIC') || str.includes('SAVED') || size >= 18;
        if (!isPriority) return;
      }
    }
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
      n.rotation = (n.rotation || 0) + dt * 2.8;
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

  render(ctx, artStyle = 'astral') {
    // 1. Render Multi-Ring Supernova Shockwaves with Geometric Mandalas, Halftone Dots & Chromatic Aberration
    for (const n of this.novas) {
      ctx.save();

      // Chromatic RGB ghost rings (offset cyan at x - 2.5, magenta at x + 2.5) for x5+ combo Novas
      if ((n.combo && n.combo >= 5) || n.chromatic || artStyle === 'astral' && (n.combo && n.combo >= 5)) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Offset Cyan Ring (x - 2.5)
        ctx.beginPath();
        ctx.arc(n.x - 2.5, n.y, n.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = n.alpha * 0.75;
        ctx.stroke();

        // Offset Magenta Ring (x + 2.5)
        ctx.beginPath();
        ctx.arc(n.x + 2.5, n.y, n.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#e040fb';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = n.alpha * 0.75;
        ctx.stroke();
        ctx.restore();
      }

      // Outer fast-expanding distortion ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.strokeStyle = (artStyle === 'comic') ? '#000000' : n.color;
      ctx.lineWidth = (artStyle === 'comic') ? 3.5 : 3.5;
      ctx.globalAlpha = n.alpha;
      if (artStyle !== 'comic') {
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 18;
      }
      ctx.stroke();

      // Inner bright plasma ring with additive lighter glow
      ctx.globalCompositeOperation = (artStyle === 'comic') ? 'source-over' : 'lighter';
      ctx.beginPath();
      ctx.arc(n.x, n.y, Math.max(0, n.radius * 0.72), 0, Math.PI * 2);
      ctx.strokeStyle = (artStyle === 'comic') ? n.color : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = n.alpha * 0.9;
      if (artStyle !== 'comic') {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
      }
      ctx.stroke();

      // Rotating 12-point star / octagonal fracture ring expanding with Nova
      const starRot = n.rotation || (n.radius * 0.05);
      const points = 12;
      const outerR = n.radius * 0.88;
      const innerR = n.radius * 0.62;
      ctx.beginPath();
      for (let p = 0; p < points * 2; p++) {
        const ang = (p / (points * 2)) * Math.PI * 2 + starRot;
        const r = p % 2 === 0 ? outerR : innerR;
        const px = n.x + Math.cos(ang) * r;
        const py = n.y + Math.sin(ang) * r;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 2.0;
      ctx.globalAlpha = n.alpha * 0.7;
      ctx.stroke();

      // Octagonal fracture ring chords
      ctx.beginPath();
      for (let oct = 0; oct < 8; oct++) {
        const ang = (oct / 8) * Math.PI * 2 - starRot * 0.8;
        const ox = n.x + Math.cos(ang) * (n.radius * 0.78);
        const oy = n.y + Math.sin(ang) * (n.radius * 0.78);
        if (oct === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
      }
      ctx.closePath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = n.alpha * 0.55;
      ctx.stroke();

      // Ring of procedural halftone energy dots along blast perimeter
      const dotCount = 24;
      ctx.fillStyle = (artStyle === 'comic') ? '#000000' : '#ffffff';
      for (let d = 0; d < dotCount; d++) {
        const dotAng = (d / dotCount) * Math.PI * 2 + starRot * 0.3;
        const dotX = n.x + Math.cos(dotAng) * n.radius;
        const dotY = n.y + Math.sin(dotAng) * n.radius;
        const dotSize = 1.5 + Math.sin(dotAng * 4 + starRot) * 1.2;
        if (dotSize > 0.5) {
          ctx.beginPath();
          ctx.arc(dotX, dotY, Math.max(0.8, dotSize), 0, Math.PI * 2);
          ctx.globalAlpha = n.alpha * 0.85;
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // 2. Render Debris (Batched state execution without per-particle save/restore)
    if (this.debris.length > 0) {
      ctx.save();
      for (const p of this.debris) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Render Magnetic Cosmic Sparks (Direct coordinates without translate overhead)
    if (this.sparks.length > 0) {
      ctx.save();
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      for (const s of this.sparks) {
        const pulseSize = 4 + Math.sin(s.pulse) * 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - pulseSize);
        ctx.lineTo(s.x + pulseSize, s.y);
        ctx.lineTo(s.x, s.y + pulseSize);
        ctx.lineTo(s.x - pulseSize, s.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Render Floating Text (Batched text alignment)
    if (this.floaters.length > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      for (const f of this.floaters) {
        // Comic action bubbles for floaters in comic mode
        if (artStyle === 'comic') {
          ctx.save();
          ctx.font = `bold ${f.size}px Orbitron, sans-serif`;
          const textMetrics = ctx.measureText(f.text);
          const tw = (textMetrics.width || 60) + 16;
          const th = f.size + 10;
          ctx.globalAlpha = f.alpha * 0.9;
          ctx.fillStyle = '#fff9c4'; // vibrant comic bubble yellow
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.rect(f.x - tw / 2, f.y - th / 2 - 2, tw, th);
          ctx.fill();
          ctx.stroke();

          // Bubble pointer
          ctx.beginPath();
          ctx.moveTo(f.x - 4, f.y + th / 2 - 2);
          ctx.lineTo(f.x, f.y + th / 2 + 5);
          ctx.lineTo(f.x + 4, f.y + th / 2 - 2);
          ctx.fillStyle = '#fff9c4';
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.shadowBlur = 0;
          ctx.fillText(f.text, f.x, f.y + (f.size * 0.35));
          ctx.restore();
        } else {
          ctx.font = `bold ${f.size}px Orbitron, sans-serif`;
          ctx.fillStyle = f.color;
          ctx.globalAlpha = f.alpha;
          ctx.shadowColor = f.color;
          ctx.shadowBlur = 8;
          ctx.fillText(f.text, f.x, f.y);
        }
      }
      ctx.restore();
    }
  }
}
