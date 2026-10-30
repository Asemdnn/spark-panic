// Spark Panic 2.4 - Autonomous AI Wingman Fighter & Tactical Doctrines

import { WINGMAN_CONFIG } from '../config.js';
import { audio } from '../engine/audio.js';

export class PlasmaProximityMine {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.detonationRadius = 70;
    this.damage = 48;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.alive = true;
    this.armTimer = 0.6; // brief arming delay
    this.life = 25.0; // despawn after 25s if untouched
  }

  update(dt, aliens, onDetonate) {
    this.pulsePhase += dt * 4;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    if (this.armTimer > 0) {
      this.armTimer -= dt;
      return;
    }

    // Proximity check against alien invaders
    for (const alien of aliens) {
      if (!alien.alive) continue;
      const dx = alien.x - this.x;
      const dy = alien.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < (alien.radius || 16) + this.radius + 6) {
        this.alive = false;
        if (onDetonate) {
          onDetonate(this.x, this.y, this.detonationRadius, this.damage);
        }
        break;
      }
    }
  }

  render(ctx) {
    ctx.save();
    const pulse = 0.7 + Math.sin(this.pulsePhase) * 0.3;

    // Outer warning pulse ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (1.2 + pulse * 0.5), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 230, 118, ${0.25 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mine body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#061a12';
    ctx.fill();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Spikes / core diamond
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.pulsePhase * 0.5);
    ctx.fillStyle = '#00e676';
    ctx.fillRect(-2.5, -2.5, 5, 5);
    ctx.restore();

    ctx.restore();
  }
}

export class WingmanFighter {
  constructor(engine, callsign = 'WING-01', angleOffset = 0) {
    this.engine = engine;
    this.callsign = callsign;
    this.angleOffset = angleOffset;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2 + angleOffset;
    this.doctrine = 'aegis'; // 'aegis' | 'vanguard' | 'harvester'

    this.patrolAngle = angleOffset;
    this.patrolRadius = 145;
    this.fireTimer = 0;
    this.mineTimer = 2.0;
    this.mines = [];
    this.trail = [];
    this.target = null;

    // Spawn near planet
    if (engine && engine.planet) {
      this.x = engine.planet.x + Math.cos(-Math.PI / 2 + angleOffset) * (engine.planet.planetRadius + 140);
      this.y = engine.planet.y + Math.sin(-Math.PI / 2 + angleOffset) * (engine.planet.planetRadius + 140);
    }
  }

  setDoctrine(doctrineId) {
    if (WINGMAN_CONFIG.doctrines[doctrineId]) {
      this.doctrine = doctrineId;
      this.fireTimer = 0;
    }
  }

  update(dt, engine) {
    if (!engine || !engine.planet) return;
    const cfg = WINGMAN_CONFIG.doctrines[this.doctrine] || WINGMAN_CONFIG.doctrines.aegis;
    const px = engine.planet.x;
    const py = engine.planet.y;
    const pr = engine.planet.planetRadius;

    // 1. Doctrine AI Behavioral Logic & Target Selection
    let targetX = px;
    let targetY = py - (pr + this.patrolRadius);
    let shouldFire = false;

    if (this.doctrine === 'aegis') {
      // AEGIS INTERCEPTOR: Patrols mid-orbit, prioritizes incoming torpedoes and fast Scouts
      this.patrolAngle += (cfg.speed / (pr + this.patrolRadius)) * dt * 0.9;
      const basePatrolX = px + Math.cos(this.patrolAngle) * (pr + this.patrolRadius);
      const basePatrolY = py + Math.sin(this.patrolAngle) * (pr + this.patrolRadius);

      // Prioritize enemy torpedoes nearest to the planet
      let closestThreat = null;
      let minThreatDist = 260;

      if (engine.alienTorpedoes && engine.alienTorpedoes.length > 0) {
        for (const torp of engine.alienTorpedoes) {
          if (!torp.alive) continue;
          const distToPlanet = Math.hypot(torp.x - px, torp.y - py);
          if (distToPlanet < minThreatDist) {
            minThreatDist = distToPlanet;
            closestThreat = torp;
          }
        }
      }

      // If no torpedoes, prioritize closest Scout or Interceptor
      if (!closestThreat && engine.aliens && engine.aliens.length > 0) {
        let minAlienDist = 240;
        for (const alien of engine.aliens) {
          if (!alien.alive) continue;
          const d = Math.hypot(alien.x - px, alien.y - py);
          if (d < minAlienDist) {
            minAlienDist = d;
            closestThreat = alien;
          }
        }
      }

      if (closestThreat) {
        this.target = closestThreat;
        // Fly toward threat with leading intercept
        targetX = closestThreat.x;
        targetY = closestThreat.y;
        const dFighter = Math.hypot(closestThreat.x - this.x, closestThreat.y - this.y);
        if (dFighter < 280) shouldFire = true;
      } else {
        this.target = null;
        targetX = basePatrolX;
        targetY = basePatrolY;
      }

    } else if (this.doctrine === 'vanguard') {
      // VANGUARD STRIKER: Seeks highest-HP targets (Bosses, Dreadnoughts, Dropships)
      let highestHpTarget = null;
      let maxHp = 0;

      if (engine.aliens && engine.aliens.length > 0) {
        for (const alien of engine.aliens) {
          if (!alien.alive) continue;
          const score = (alien.isBoss ? 5000 : 0) + (alien.maxHp || alien.hp || 10);
          if (score > maxHp) {
            maxHp = score;
            highestHpTarget = alien;
          }
        }
      }

      if (highestHpTarget) {
        this.target = highestHpTarget;
        // Maintain a combat stand-off distance of 160-200px
        const ang = Math.atan2(this.y - highestHpTarget.y, this.x - highestHpTarget.x);
        targetX = highestHpTarget.x + Math.cos(ang) * 175;
        targetY = highestHpTarget.y + Math.sin(ang) * 175;
        const d = Math.hypot(highestHpTarget.x - this.x, highestHpTarget.y - this.y);
        if (d < 340) shouldFire = true;
      } else {
        this.target = null;
        this.patrolAngle += (cfg.speed / (pr + 180)) * dt * 0.7;
        targetX = px + Math.cos(this.patrolAngle) * (pr + 180);
        targetY = py + Math.sin(this.patrolAngle) * (pr + 180);
      }

    } else if (this.doctrine === 'harvester') {
      // NOVA HARVESTER: Sweeps space collecting Sparks/Supply Pods & drops proximity mines
      let nearestPickup = null;
      let minPickupDist = 320;

      // Scan supply pods
      if (engine.supplyPods && engine.supplyPods.pods) {
        for (const pod of engine.supplyPods.pods) {
          if (!pod.alive) continue;
          const d = Math.hypot(pod.x - this.x, pod.y - this.y);
          if (d < minPickupDist) {
            minPickupDist = d;
            nearestPickup = pod;
          }
        }
      }

      if (nearestPickup) {
        targetX = nearestPickup.x;
        targetY = nearestPickup.y;
      } else {
        this.patrolAngle += (cfg.speed / (pr + 155)) * dt * 0.8;
        targetX = px + Math.cos(this.patrolAngle) * (pr + 155);
        targetY = py + Math.sin(this.patrolAngle) * (pr + 155);
      }

      // Check for targets to shoot
      if (engine.aliens && engine.aliens.length > 0) {
        let closest = null;
        let cDist = 220;
        for (const alien of engine.aliens) {
          if (!alien.alive) continue;
          const d = Math.hypot(alien.x - this.x, alien.y - this.y);
          if (d < cDist) {
            cDist = d;
            closest = alien;
          }
        }
        if (closest) {
          this.target = closest;
          shouldFire = true;
        } else {
          this.target = null;
        }
      }

      // Drop Plasma Proximity Mines every 5 seconds
      this.mineTimer -= dt;
      if (this.mineTimer <= 0 && this.mines.length < 3) {
        this.mineTimer = 5.0;
        this.mines.push(new PlasmaProximityMine(this.x, this.y));
        engine.particles.addFloater(this.x, this.y - 12, 'MINE ARMED', '#00e676', 11);
      }
    }

    // 2. Flight Movement Physics & Steering
    const toTargetX = targetX - this.x;
    const toTargetY = targetY - this.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);
    const desiredAngle = distToTarget > 8 ? Math.atan2(toTargetY, toTargetX) : this.angle;

    // Smooth turn towards desired angle
    let diff = desiredAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * Math.min(1, dt * 6.5);

    // Apply speed along heading
    const moveSpeed = Math.min(cfg.speed, Math.max(70, distToTarget * 2.5));
    this.vx = Math.cos(this.angle) * moveSpeed;
    this.vy = Math.sin(this.angle) * moveSpeed;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep out of core planet collision
    const dPlanet = Math.hypot(this.x - px, this.y - py);
    const minOrbit = pr + 35;
    if (dPlanet < minOrbit) {
      const pushAng = Math.atan2(this.y - py, this.x - px);
      this.x = px + Math.cos(pushAng) * minOrbit;
      this.y = py + Math.sin(pushAng) * minOrbit;
    }

    // 3. Thruster Trail Record
    this.trail.push({ x: this.x, y: this.y, alpha: 1.0 });
    if (this.trail.length > 14) this.trail.shift();
    for (const t of this.trail) t.alpha -= dt * 2.2;

    // 4. Weapons Fire Execution
    this.fireTimer += dt;
    if (shouldFire && this.target && this.fireTimer >= cfg.fireRate) {
      this.fireTimer = 0;
      this.fireWeapons(engine, cfg);
    }

    // 5. Update Mines
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      mine.update(dt, engine.aliens, (mx, my, radius, dmg) => {
        // Mine Detonation Shockwave
        audio.playNovaLaunch();
        engine.particles.addNovaBurst(mx, my, radius, '#00e676');
        engine.addScreenShake(6, 0.2);

        // Damage all aliens in blast radius
        for (const alien of engine.aliens) {
          if (!alien.alive) continue;
          const dist = Math.hypot(alien.x - mx, alien.y - my);
          if (dist <= radius + (alien.radius || 16)) {
            const killed = alien.takeDamage(dmg, mx, my, false);
            if (killed) {
              engine.onAlienDestroyed(alien, mx, my);
            }
          }
        }
      });

      if (!mine.alive) {
        this.mines.splice(i, 1);
      }
    }
  }

  fireWeapons(engine, cfg) {
    if (!this.target) return;
    const aimAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

    if (this.doctrine === 'aegis') {
      // Rapid Twin Pulse Lasers
      audio.playLaser(false);
      const perpAngle = aimAngle + Math.PI * 0.5;
      const wingOffset = 6;

      [-wingOffset, wingOffset].forEach(offset => {
        engine.projectiles.addPlasmaBolt({
          x: this.x + Math.cos(perpAngle) * offset,
          y: this.y + Math.sin(perpAngle) * offset,
          angle: aimAngle,
          speed: cfg.bulletSpeed,
          damage: cfg.damage,
          color: cfg.bulletColor,
          source: 'wingman'
        });
      });
    } else if (this.doctrine === 'vanguard') {
      // Heavy Golden Plasma Rocket with Mini-Splash
      audio.playSkill('Q');
      engine.projectiles.addPlasmaBolt({
        x: this.x,
        y: this.y,
        angle: aimAngle,
        speed: cfg.bulletSpeed,
        damage: cfg.damage * 1.4, // +40% armor-piercing damage
        color: cfg.bulletColor,
        isRocket: true,
        splashRadius: 42,
        source: 'wingman'
      });
    } else if (this.doctrine === 'harvester') {
      // Support Plasma Bolt
      audio.playLaser(false);
      engine.projectiles.addPlasmaBolt({
        x: this.x,
        y: this.y,
        angle: aimAngle,
        speed: cfg.bulletSpeed,
        damage: cfg.damage,
        color: cfg.bulletColor,
        source: 'wingman'
      });
    }
  }

  render(ctx) {
    // 1. Render active plasma mines
    for (const mine of this.mines) {
      mine.render(ctx);
    }

    const cfg = WINGMAN_CONFIG.doctrines[this.doctrine] || WINGMAN_CONFIG.doctrines.aegis;

    // 2. Render Thruster Trail
    if (this.trail.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = cfg.auraColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Wingman Starfighter
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glowing doctrine aura
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = cfg.auraColor;
    ctx.fill();

    // Sleek Banked Delta-Wing Hull
    ctx.beginPath();
    ctx.moveTo(13, 0); // Nose
    ctx.lineTo(-9, -11); // Left wingtip
    ctx.lineTo(-5, -4);  // Inner wing joint
    ctx.lineTo(-8, 0);   // Engine center
    ctx.lineTo(-5, 4);   // Inner wing joint
    ctx.lineTo(-9, 11);  // Right wingtip
    ctx.closePath();

    ctx.fillStyle = '#0a1128';
    ctx.fill();
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Cockpit Canopy
    ctx.beginPath();
    ctx.ellipse(2, 0, 4, 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = cfg.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Twin Wingtip Pulse Cannons
    ctx.fillStyle = cfg.color;
    ctx.fillRect(-7, -11, 4, 1.5);
    ctx.fillRect(-7, 9.5, 4, 1.5);

    // Thruster Flames
    ctx.beginPath();
    ctx.moveTo(-8, -2.5);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, 2.5);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();

    ctx.restore();

    // 4. Callsign Badge Tag
    ctx.save();
    ctx.font = 'bold 7px Orbitron, sans-serif';
    ctx.fillStyle = cfg.color;
    ctx.textAlign = 'center';
    ctx.fillText(this.callsign, this.x, this.y - 14);
    ctx.restore();
  }
}
