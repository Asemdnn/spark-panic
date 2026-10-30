// Spark Panic 2.5 - Deployable Orbital Defense Structures System

import { STRUCTURE_CONFIG } from '../config.js';
import { audio } from '../engine/audio.js';

export class DeployableStructure {
  constructor(type, x, y, angle, engine) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.engine = engine;
    this.cfg = STRUCTURE_CONFIG.types[type] || STRUCTURE_CONFIG.types.pylon;
    this.life = STRUCTURE_CONFIG.duration;
    this.maxLife = STRUCTURE_CONFIG.duration;
    this.alive = true;
    this.pulseTimer = 0;
    this.actionTimer = 0;
    this.flakAngle = angle;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.pulseTimer += dt * 3.5;
    this.actionTimer += dt;

    if (this.type === 'pylon') {
      this.updatePylon(dt);
    } else if (this.type === 'anchor') {
      this.updateAnchor(dt);
    } else if (this.type === 'battery') {
      this.updateBattery(dt);
    }
  }

  updatePylon(dt) {
    // 1. Point-defense zap against enemy torpedoes within zapRadius (85px)
    if (this.actionTimer >= this.cfg.zapRate) {
      this.actionTimer = 0;
      const zapRadius = this.cfg.zapRadius || 85;
      const torpedoes = this.engine?.projectiles?.torpedoes || [];
      for (const torp of torpedoes) {
        if (!torp.alive) continue;
        const d = Math.hypot(torp.x - this.x, torp.y - this.y);
        if (d <= zapRadius) {
          torp.alive = false;
          if (this.engine.particles) {
            this.engine.particles.spawnDebris(torp.x, torp.y, '#00e5ff', 8);
            this.engine.particles.addFloater(torp.x, torp.y, 'PYLON INTERCEPT!', '#00e5ff', 12);
          }
          if (this.engine.damageSources) {
            this.engine.damageSources.wingman += 15;
          }
          break;
        }
      }
    }
  }

  updateAnchor(dt) {
    const fieldRadius = this.cfg.fieldRadius || 110;
    const aliens = this.engine?.aliens || [];

    // Continuous 50% slow field on all aliens within radius
    for (const alien of aliens) {
      if (!alien.alive) continue;
      const d = Math.hypot(alien.x - this.x, alien.y - this.y);
      if (d <= fieldRadius) {
        alien.speedMultiplier = Math.min(alien.speedMultiplier || 1.0, this.cfg.slowFactor || 0.5);
      }
    }

    // Periodic chain lightning every 1.2s
    if (this.actionTimer >= this.cfg.chainRate) {
      this.actionTimer = 0;
      let hitCount = 0;
      for (const alien of aliens) {
        if (!alien.alive) continue;
        const d = Math.hypot(alien.x - this.x, alien.y - this.y);
        if (d <= fieldRadius) {
          const dmg = this.cfg.chainDamage || 24;
          const destroyed = alien.takeDamage(dmg);
          if (this.engine.particles) {
            this.engine.particles.spawnDebris(alien.x, alien.y, '#e040fb', 6);
            this.engine.particles.addFloater(alien.x, alien.y - 10, `-${dmg}`, '#e040fb', 11);
          }
          if (this.engine.damageSources) {
            this.engine.damageSources.wingman += dmg;
          }
          if (destroyed && this.engine.onAlienDestroyed) {
            this.engine.onAlienDestroyed(alien, { x: alien.x, y: alien.y });
          }
          hitCount++;
          if (hitCount >= (this.cfg.chainTargets || 3)) break;
        }
      }
    }
  }

  updateBattery(dt) {
    if (this.actionTimer >= this.cfg.flakRate) {
      this.actionTimer = 0;
      const flakRange = this.cfg.flakRange || 175;
      const aliens = this.engine?.aliens || [];
      const torpedoes = this.engine?.projectiles?.torpedoes || [];

      // Prioritize torpedoes, then capital ships (Boss, Dreadnought, Dropship), then closest alien
      let target = null;
      let minTorpDist = flakRange;
      for (const torp of torpedoes) {
        if (!torp.alive) continue;
        const d = Math.hypot(torp.x - this.x, torp.y - this.y);
        if (d < minTorpDist) {
          minTorpDist = d;
          target = torp;
        }
      }

      if (!target) {
        let minAlienDist = flakRange;
        for (const alien of aliens) {
          if (!alien.alive) continue;
          const d = Math.hypot(alien.x - this.x, alien.y - this.y);
          if (d <= minAlienDist) {
            // Prioritize higher HP targets
            if (!target || (alien.maxHp || 10) > (target.maxHp || 10) || d < minAlienDist * 0.7) {
              minAlienDist = d;
              target = alien;
            }
          }
        }
      }

      if (target) {
        const fireAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.flakAngle = fireAngle;
        if (this.engine?.projectiles?.addPlasmaBolt) {
          this.engine.projectiles.addPlasmaBolt({
            x: this.x,
            y: this.y,
            angle: fireAngle,
            speed: this.cfg.flakSpeed || 520,
            color: '#ffd700',
            damage: this.cfg.flakDamage || 20,
            radius: 5,
            source: 'wingman',
            splashRadius: 28
          });
          if (this.engine.particles) {
            this.engine.particles.spawnDebris(this.x, this.y, '#ffd700', 4);
          }
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    const lifeRatio = Math.max(0, this.life / this.maxLife);
    const pulse = 0.8 + Math.sin(this.pulseTimer) * 0.2;

    // 1. Structure Aura / Range Indicator
    ctx.beginPath();
    const range = this.type === 'pylon' ? 45 : (this.type === 'anchor' ? 110 : 80);
    ctx.arc(this.x, this.y, range * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = this.cfg.auraColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Base Mounting Ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#050814';
    ctx.fill();
    ctx.strokeStyle = this.cfg.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.cfg.color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Structure Specific Core Graphics
    if (this.type === 'pylon') {
      // Rotating diamond prism crystal
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.pulseTimer * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    } else if (this.type === 'anchor') {
      // Pulsing violet graviton coil
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(-this.pulseTimer * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'battery') {
      // Rotating twin flak barrels
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.flakAngle);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, -4, 16, 3);
      ctx.fillRect(0, 1, 16, 3);
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // 4. Overhead Duration Countdown Bar
    const barW = 24;
    const barH = 3;
    const barX = this.x - barW / 2;
    const barY = this.y - 20;
    ctx.fillStyle = 'rgba(5, 8, 20, 0.75)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = this.cfg.color;
    ctx.fillRect(barX, barY, barW * lifeRatio, barH);

    ctx.restore();
  }
}

export class StructureManager {
  constructor(engine) {
    this.engine = engine;
    this.structures = [];
    this.cooldownTimer = 0;
  }

  getCooldownMax() {
    const cdReduction = (this.engine?.skills?.cooldownReduction || 0);
    return Math.max(8.0, STRUCTURE_CONFIG.cooldown * (1 - cdReduction));
  }

  canDeploy() {
    return this.cooldownTimer <= 0;
  }

  getCooldownRatio() {
    const max = this.getCooldownMax();
    return Math.min(1.0, Math.max(0.0, this.cooldownTimer / max));
  }

  deploy(angle) {
    if (!this.canDeploy()) return null;
    const planet = this.engine?.planet;
    if (!planet) return null;

    // Determine structure type from equipped chassis
    const chassis = this.engine?.turret?.chassisId || 'striker';
    let type = 'pylon';
    if (chassis === 'tesla') type = 'anchor';
    else if (chassis === 'railgun') type = 'battery';

    const dist = (planet.shieldRadius || 85) + (STRUCTURE_CONFIG.orbitOffset || 75);
    const x = planet.x + Math.cos(angle) * dist;
    const y = planet.y + Math.sin(angle) * dist;

    // If max active reached, remove oldest
    if (this.structures.length >= (STRUCTURE_CONFIG.maxActive || 2)) {
      this.structures.shift();
    }

    const structure = new DeployableStructure(type, x, y, angle, this.engine);
    this.structures.push(structure);
    this.cooldownTimer = this.getCooldownMax();

    if (this.engine.particles) {
      this.engine.particles.spawnNovaRing(x, y, structure.cfg.color, 45);
      this.engine.particles.addFloater(x, y - 25, `${structure.cfg.icon} ${structure.cfg.name.toUpperCase()} DEPLOYED!`, structure.cfg.color, 12);
    }
    if (audio && audio.playNovaLaunch) {
      audio.playNovaLaunch();
    }

    return structure;
  }

  checkRefractPylons(bullet) {
    if (!bullet || bullet.refracted) return;
    for (const struct of this.structures) {
      if (struct.type !== 'pylon' || !struct.alive) continue;
      const d = Math.hypot(bullet.x - struct.x, bullet.y - struct.y);
      if (d <= (struct.cfg.prismRadius || 28)) {
        bullet.refracted = true;
        bullet.damage = Math.round(bullet.damage * (1 + (struct.cfg.beamBonus || 0.30)));
        bullet.color = '#ffffff';

        // Spawn 2 refracted fan beams (+/- 16 degrees)
        if (this.engine?.projectiles?.addPlasmaBolt) {
          const spreadAngles = [bullet.angle - 0.28, bullet.angle + 0.28];
          for (const a of spreadAngles) {
            this.engine.projectiles.addPlasmaBolt({
              x: struct.x,
              y: struct.y,
              angle: a,
              speed: bullet.speed || 520,
              color: '#00e5ff',
              damage: Math.round(bullet.damage * 0.9),
              radius: (bullet.radius || 4),
              source: 'turret'
            });
          }
        }
        if (this.engine.particles) {
          this.engine.particles.spawnNovaRing(struct.x, struct.y, '#00e5ff', 35);
          this.engine.particles.addFloater(struct.x, struct.y - 15, 'PRISM REFRACT +30%!', '#00e5ff', 12);
        }
        break;
      }
    }
  }

  update(dt) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }
    for (let i = this.structures.length - 1; i >= 0; i--) {
      const s = this.structures[i];
      s.update(dt);
      if (!s.alive) {
        if (this.engine.particles) {
          this.engine.particles.spawnDebris(s.x, s.y, s.cfg.color, 8);
        }
        this.structures.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const s of this.structures) {
      s.render(ctx);
    }
  }

  reset() {
    this.structures = [];
    this.cooldownTimer = 0;
  }
}
