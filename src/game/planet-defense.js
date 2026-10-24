// Guardian of the Universe - Planet Defense & Atmospheric Planetary Shield System

import { SPARK_TYPES } from '../config.js';
import { audio } from '../engine/audio.js';

export class PlanetDefense {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;

    // Celestial Planet Geometry
    this.x = 360;
    this.y = 1170;
    this.planetRadius = 240;
    this.shieldRadius = 315;

    // Defense status
    this.shieldHp = 100;
    this.maxShieldHp = 100;
    this.empEnergy = 0;
    this.maxEmpEnergy = 100;
    this.rotation = 0;
    this.shieldPulse = 0;

    this.activePlanet = null;
    this.planetImages = {};
    this.loadPlanetImages();

    // Defense subsystems
    this.shieldHits = [];
    this.bombardmentBolts = [];
    this.repairCores = [];
    this.tracerRays = [];
    this.empWave = null;
    this.alarmTimer = 0;

    // Surface Defense Turrets mounted on planetary horizon
    this.turrets = [
      { x: 230, y: 955, angle: -Math.PI / 2, cooldown: 0, target: null },
      { x: 490, y: 955, angle: -Math.PI / 2, cooldown: 0.8, target: null }
    ];

    // Orbital Guardian Sentinel Satellite
    this.satellite = {
      orbitAngle: 0,
      orbitRadius: 360,
      orbitSpeed: 0.35
    };
  }

  loadPlanetImages() {
    if (typeof Image === 'undefined') return;
    const names = [
      'aerilon', 'aquatis', 'solaria', 'vespera', 'cygnus',
      'obsidian', 'astraea', 'singularity', 'glacies', 'tempest',
      'boreas', 'zephyrus', 'chronos', 'hyperion', 'elysium',
      'nebulon', 'voidhaven', 'pulsar', 'supernova', 'genesis'
    ];
    names.forEach((name, idx) => {
      const img = new Image();
      img.src = `./assets/planets/${name}.jpg`;
      this.planetImages[idx + 1] = img;
    });
  }

  reset(planet) {
    this.activePlanet = planet;
    this.shieldHp = 100;
    this.empEnergy = 0;
    this.shieldHits = [];
    this.bombardmentBolts = [];
    this.repairCores = [];
    this.tracerRays = [];
    this.empWave = null;
    this.alarmTimer = 0;
    this.turrets.forEach((t, i) => {
      t.cooldown = i * 0.6;
      t.target = null;
    });
  }

  damageShield(amount, hitX, hitY) {
    this.shieldHp = Math.max(0, this.shieldHp - amount);

    // Spawn expanding ripple ring on the shield dome
    this.shieldHits.push({
      x: hitX,
      y: hitY,
      radius: 12,
      maxRadius: 75,
      alpha: 1.0,
      color: this.shieldHp > 50 ? '#00f0ff' : (this.shieldHp > 25 ? '#ffe600' : '#ff0055')
    });

    audio.init();
    audio.playShieldHit();
    if (this.canvasManager?.addShake) {
      this.canvasManager.addShake(Math.min(18, 5 + amount * 0.8), 0.25);
    }
  }

  repairShield(amount) {
    const prev = this.shieldHp;
    this.shieldHp = Math.min(this.maxShieldHp, this.shieldHp + amount);
    return this.shieldHp - prev;
  }

  chargeEmp(amount) {
    this.empEnergy = Math.min(this.maxEmpEnergy, this.empEnergy + amount);
  }

  isEmpReady() {
    return this.empEnergy >= this.maxEmpEnergy;
  }

  triggerEmp(orbs, particles, floaters) {
    if (this.empEnergy < this.maxEmpEnergy) return false;
    this.empEnergy = 0;

    // EMP Shockwave expanding from planet
    this.empWave = {
      radius: 50,
      speed: 1600,
      maxRadius: 1500,
      alpha: 1.0
    };

    audio.init();
    audio.playEmpBlast();
    if (this.canvasManager?.addShake) {
      this.canvasManager.addShake(15, 0.45);
    }

    // Clear all alien bombardment bolts
    this.bombardmentBolts = [];

    // Freeze and repel all alive alien invaders
    let affected = 0;
    for (const orb of orbs) {
      if (!orb.alive) continue;
      affected++;
      orb.freeze(4.5);
      // Push invaders upward away from planet
      orb.vy = -Math.abs(orb.baseSpeed) * 1.8;
      if (particles) {
        particles.spawnBurst(orb.x, orb.y, '#00f0ff', 12, 200);
      }
    }

    if (floaters) {
      floaters.addMessage(360, 680, 'PLANETARY EMP DETONATED!', '#00f0ff', 26);
    }

    return true;
  }

  spawnRepairCore(x, y, value = 12) {
    this.repairCores.push({
      x,
      y,
      vy: 110,
      value,
      pulse: 0
    });
  }

  update(dt, orbs, explosions, particles, floaters) {
    this.rotation += dt * 0.04;
    this.shieldPulse += dt * 3.5;

    // Low shield warning alarm siren
    if (this.shieldHp <= 25 && this.shieldHp > 0) {
      this.alarmTimer += dt;
      if (this.alarmTimer >= 2.4) {
        this.alarmTimer = 0;
        audio.playShieldAlarm();
      }
    }

    // 1. Advance active shield impact ripples
    for (let i = this.shieldHits.length - 1; i >= 0; i--) {
      const hit = this.shieldHits[i];
      hit.radius += dt * 140;
      hit.alpha = Math.max(0, 1 - (hit.radius / hit.maxRadius));
      if (hit.radius >= hit.maxRadius || hit.alpha <= 0.01) {
        this.shieldHits.splice(i, 1);
      }
    }

    // 2. Advance EMP Shockwave
    if (this.empWave) {
      this.empWave.radius += this.empWave.speed * dt;
      this.empWave.alpha = Math.max(0, 1 - (this.empWave.radius / this.empWave.maxRadius));
      if (this.empWave.radius >= this.empWave.maxRadius || this.empWave.alpha <= 0.01) {
        this.empWave = null;
      }
    }

    // 3. Update Orbital Sentinel Satellite
    this.satellite.orbitAngle += this.satellite.orbitSpeed * dt;

    // 4. Update Repair Cores drifting to shield
    for (let i = this.repairCores.length - 1; i >= 0; i--) {
      const core = this.repairCores[i];
      core.pulse += dt * 6;
      core.y += core.vy * dt;
      // Slight magnetic pull toward planet center
      const dx = this.x - core.x;
      core.x += dx * dt * 0.8;

      const dist = Math.hypot(core.x - this.x, core.y - this.y);
      if (dist <= this.shieldRadius || core.y >= 920) {
        const healed = this.repairShield(core.value);
        audio.init();
        audio.playCoreAbsorbed();
        if (particles) {
          particles.spawnBurst(core.x, core.y, '#00ffa3', 14, 180);
        }
        if (floaters && healed > 0) {
          floaters.addMessage(core.x, core.y - 30, `+${Math.round(healed)}% SHIELD!`, '#00ffa3', 20);
        }
        this.repairCores.splice(i, 1);
      }
    }

    // 5. Update Alien Bombardment Bolts
    for (let i = this.bombardmentBolts.length - 1; i >= 0; i--) {
      const bolt = this.bombardmentBolts[i];
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;

      // Interception: check if player explosion destroys the bolt
      let intercepted = false;
      if (explosions) {
        for (const exp of explosions) {
          if (!exp.alive) continue;
          const distExp = Math.hypot(bolt.x - exp.x, bolt.y - exp.y);
          if (distExp <= exp.currentRadius + 12) {
            intercepted = true;
            if (particles) {
              particles.spawnBurst(bolt.x, bolt.y, bolt.color, 10, 140);
            }
            if (floaters) {
              floaters.addMessage(bolt.x, bolt.y - 15, 'INTERCEPTED!', '#00f0ff', 14);
            }
            break;
          }
        }
      }

      if (intercepted) {
        this.bombardmentBolts.splice(i, 1);
        continue;
      }

      // Check collision with planetary shield dome
      const distShield = Math.hypot(bolt.x - this.x, bolt.y - this.y);
      if (distShield <= this.shieldRadius && bolt.y < this.y) {
        this.damageShield(bolt.damage || 6, bolt.x, bolt.y);
        if (particles) {
          particles.spawnBurst(bolt.x, bolt.y, '#ff0055', 12, 180);
        }
        this.bombardmentBolts.splice(i, 1);
      } else if (bolt.y > 1290 || bolt.x < -40 || bolt.x > 760) {
        this.bombardmentBolts.splice(i, 1);
      }
    }

    // 6. Update Surface Defense Turrets & Tracer Rays
    for (const turret of this.turrets) {
      turret.cooldown -= dt;

      // Find closest alive invader in upper sector
      let closest = null;
      let closestDist = 480;
      for (const orb of orbs) {
        if (!orb.alive) continue;
        const dist = Math.hypot(orb.x - turret.x, orb.y - turret.y);
        if (dist < closestDist && orb.y < turret.y - 40) {
          closestDist = dist;
          closest = orb;
        }
      }

      if (closest) {
        turret.target = closest;
        turret.angle = Math.atan2(closest.y - turret.y, closest.x - turret.x);

        if (turret.cooldown <= 0) {
          turret.cooldown = 1.6 + Math.random() * 0.4;
          audio.init();
          audio.playTurretFire();

          // Spawn tracer ray
          this.tracerRays.push({
            startX: turret.x + Math.cos(turret.angle) * 22,
            startY: turret.y + Math.sin(turret.angle) * 22,
            targetX: closest.x,
            targetY: closest.y,
            timer: 0,
            duration: 0.14,
            targetOrb: closest
          });
        }
      } else {
        turret.target = null;
      }
    }

    // Advance tracer rays
    for (let i = this.tracerRays.length - 1; i >= 0; i--) {
      const ray = this.tracerRays[i];
      ray.timer += dt;
      if (ray.timer >= ray.duration) {
        if (ray.targetOrb && ray.targetOrb.alive) {
          // Slight knockback & deflection
          ray.targetOrb.vy -= 40;
          if (particles) {
            particles.spawnBurst(ray.targetOrb.x, ray.targetOrb.y, '#00f0ff', 6, 90);
          }
        }
        this.tracerRays.splice(i, 1);
      }
    }

    // 7. Check Alien Invasion Proximity & Shield Impact
    for (const orb of orbs) {
      if (!orb.alive) continue;

      const dist = Math.hypot(orb.x - this.x, orb.y - this.y);

      // Alien occasional bombardment projectile firing
      if ((orb.type === SPARK_TYPES.MEGA || orb.type === SPARK_TYPES.SPLITTER) && orb.y < 820) {
        orb.bombardmentTimer = (orb.bombardmentTimer || Math.random() * 3) + dt;
        if (orb.bombardmentTimer >= 4.2) {
          orb.bombardmentTimer = 0;
          const angleToPlanet = Math.atan2(this.y - orb.y, this.x - orb.x) + (Math.random() - 0.5) * 0.35;
          const boltSpeed = 260;
          this.bombardmentBolts.push({
            x: orb.x,
            y: orb.y,
            vx: Math.cos(angleToPlanet) * boltSpeed,
            vy: Math.sin(angleToPlanet) * boltSpeed,
            color: orb.color || '#ffe600',
            damage: orb.type === SPARK_TYPES.MEGA ? 8 : 5
          });
        }
      }

      // Direct alien collision with planetary shield dome
      if (dist <= this.shieldRadius && orb.y < this.y) {
        const impactAngle = Math.atan2(orb.y - this.y, orb.x - this.x);
        const damage = orb.type === SPARK_TYPES.MEGA ? 16 : (orb.type === SPARK_TYPES.SPLITTER ? 10 : 8);

        this.damageShield(damage, orb.x, orb.y);

        if (floaters) {
          floaters.addMessage(orb.x, orb.y - 20, `INVASION HIT -${damage}%!`, '#ff0055', 18);
        }

        // Alien bounces backward with recoil shockwave
        const bounceSpeed = Math.abs(orb.baseSpeed) * 1.5;
        orb.vx = Math.cos(impactAngle) * bounceSpeed;
        orb.vy = Math.sin(impactAngle) * bounceSpeed;
        orb.y = Math.min(orb.y, this.y - this.shieldRadius - 10);

        if (particles) {
          particles.spawnBurst(orb.x, orb.y, '#ff0055', 16, 220);
        }
      }
    }
  }

  render(ctx) {
    const planet = this.activePlanet;
    const shadowColor = planet?.shadowColor || 'rgba(0, 240, 255, 0.65)';

    // 1. Deep Atmospheric Outer Halo
    const haloGrad = ctx.createRadialGradient(
      this.x, this.y, this.planetRadius * 0.9,
      this.x, this.y, this.shieldRadius + 45
    );
    haloGrad.addColorStop(0, shadowColor.replace('0.65', '0.35').replace('0.75', '0.4'));
    haloGrad.addColorStop(0.65, shadowColor.replace('0.65', '0.12').replace('0.75', '0.15'));
    haloGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.shieldRadius + 45, Math.PI, Math.PI * 2);
    ctx.fill();

    // 2. The Celestial Defended Planet Body
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.planetRadius, 0, Math.PI * 2);
    ctx.clip();

    const img = planet && this.planetImages[planet.level];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const dia = this.planetRadius * 2;
      ctx.drawImage(img, -this.planetRadius, -this.planetRadius, dia, dia);
      ctx.restore();
    } else {
      // Procedural planetary sphere with atmospheric gradient
      const baseGrad = ctx.createRadialGradient(
        this.x - 60, this.y - 120, 40,
        this.x, this.y, this.planetRadius
      );
      baseGrad.addColorStop(0, '#56ccf2');
      baseGrad.addColorStop(0.6, '#2f80ed');
      baseGrad.addColorStop(1, '#0c1b40');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(this.x - this.planetRadius, this.y - this.planetRadius, this.planetRadius * 2, this.planetRadius * 2);

      // Continental cloud bands
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 14;
      for (let b = -4; b <= 4; b++) {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + b * 45, this.planetRadius * 0.95, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 3D Spherical Day/Night terminator shadow
    const shadowGrad = ctx.createRadialGradient(
      this.x, this.y - this.planetRadius * 0.45, this.planetRadius * 0.2,
      this.x, this.y, this.planetRadius
    );
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(0.6, 'rgba(3, 7, 18, 0.45)');
    shadowGrad.addColorStop(1, 'rgba(2, 4, 10, 0.95)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(this.x - this.planetRadius, this.y - this.planetRadius, this.planetRadius * 2, this.planetRadius * 2);

    ctx.restore();

    // Atmospheric Edge Rim
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.planetRadius, Math.PI, Math.PI * 2);
    ctx.strokeStyle = shadowColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Planetary Defense Shield Dome
    const shieldColor = this.shieldHp > 50 ? '#00f0ff' : (this.shieldHp > 25 ? '#ffe600' : '#ff0055');
    const shieldFillAlpha = Math.max(0.06, (this.shieldHp / 100) * 0.22);

    // Shield dome fill
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.shieldRadius, Math.PI * 1.08, Math.PI * 1.92);
    ctx.fillStyle = shieldColor === '#00f0ff'
      ? `rgba(0, 240, 255, ${shieldFillAlpha})`
      : (shieldColor === '#ffe600' ? `rgba(255, 230, 0, ${shieldFillAlpha})` : `rgba(255, 0, 85, ${shieldFillAlpha})`);
    ctx.fill();

    // Shield boundary arc with pulse
    const pulseOffset = Math.sin(this.shieldPulse) * 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.shieldRadius + pulseOffset, Math.PI * 1.08, Math.PI * 1.92);
    ctx.strokeStyle = shieldColor;
    ctx.lineWidth = 2.8;
    ctx.shadowColor = shieldColor;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cyber defense shield node markers
    const totalNodes = 12;
    for (let n = 0; n <= totalNodes; n++) {
      const ang = Math.PI * 1.08 + (Math.PI * 0.84) * (n / totalNodes);
      const nx = this.x + Math.cos(ang) * (this.shieldRadius + pulseOffset);
      const ny = this.y + Math.sin(ang) * (this.shieldRadius + pulseOffset);

      ctx.beginPath();
      ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Shield Impact Ripples
    for (const hit of this.shieldHits) {
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, hit.radius, 0, Math.PI * 2);
      ctx.strokeStyle = hit.color;
      ctx.globalAlpha = hit.alpha;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // 5. EMP Expanding Shockwave
    if (this.empWave) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.empWave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${this.empWave.alpha})`;
      ctx.lineWidth = 5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.empWave.radius * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 230, 0, ${this.empWave.alpha * 0.6})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 6. Surface Defense Turrets
    for (const turret of this.turrets) {
      ctx.save();
      ctx.translate(turret.x, turret.y);

      // Turret base
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating cannon barrel
      ctx.rotate(turret.angle);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -3.5, 18, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(14, -2, 4, 4);

      ctx.restore();
    }

    // 7. Active Interceptor Tracer Rays
    for (const ray of this.tracerRays) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ray.startX, ray.startY);
      ctx.lineTo(ray.targetX, ray.targetY);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // 8. Alien Bombardment Bolts
    for (const bolt of this.bombardmentBolts) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = bolt.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // 9. Floating Repair Cores
    for (const core of this.repairCores) {
      ctx.save();
      ctx.translate(core.x, core.y);
      const pulseSize = 7 + Math.sin(core.pulse) * 2;

      // Diamond energy core
      ctx.beginPath();
      ctx.moveTo(0, -pulseSize);
      ctx.lineTo(pulseSize, 0);
      ctx.lineTo(0, pulseSize);
      ctx.lineTo(-pulseSize, 0);
      ctx.closePath();
      ctx.fillStyle = '#00ffa3';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00ffa3';
      ctx.shadowBlur = 14;
      ctx.stroke();

      ctx.restore();
    }

    // 10. Orbital Guardian Sentinel Satellite
    const satX = this.x + Math.cos(this.satellite.orbitAngle) * this.satellite.orbitRadius;
    const satY = this.y + Math.sin(this.satellite.orbitAngle) * (this.satellite.orbitRadius * 0.45);
    if (satY < this.y) {
      ctx.save();
      ctx.translate(satX, satY);
      ctx.beginPath();
      ctx.rect(-5, -5, 10, 10);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Solar sails
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.fillRect(-14, -2.5, 7, 5);
      ctx.fillRect(7, -2.5, 7, 5);

      // Blinking beacon
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = Math.sin(this.shieldPulse * 2) > 0 ? '#ffe600' : '#00f0ff';
      ctx.fill();

      ctx.restore();
    }
  }
}
