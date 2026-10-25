// Spark Panic 2.0 - Projectile Systems (Plasma Bolts, Siege Torpedoes, Quad Bursts)

export class ProjectileManager {
  constructor() {
    this.bolts = [];
    this.torpedoes = [];
    this.satelliteLasers = [];
    this.teslaArcs = [];
    this.railgunTrails = [];
  }

  clear() {
    this.bolts = [];
    this.torpedoes = [];
    this.satelliteLasers = [];
    this.teslaArcs = [];
    this.railgunTrails = [];
  }

  spawnTurretBolts(planetX, planetY, turretRadius, boltConfigs) {
    for (const b of boltConfigs) {
      const startX = planetX + Math.cos(b.angle) * (turretRadius + 6);
      const startY = planetY + Math.sin(b.angle) * (turretRadius + 6);
      this.bolts.push({
        x: startX,
        y: startY,
        vx: Math.cos(b.angle) * b.speed,
        vy: Math.sin(b.angle) * b.speed,
        angle: b.angle,
        damage: b.damage,
        color: b.color,
        pierce: b.pierce || 1,
        isTesla: !!b.isTesla,
        turretLevel: b.turretLevel || 0,
        isRailgun: !!b.isRailgun,
        isDirectPierce: !!b.isDirectPierce,
        chassis: b.chassis || 'striker',
        alive: true
      });
    }
  }

  spawnTorpedo(x, y, angle, speed, damage, color) {
    this.torpedoes.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      damage,
      color,
      radius: 6.5,
      alive: true
    });
  }

  spawnSatelliteLaser(startX, startY, targetX, targetY, angle, damage) {
    this.satelliteLasers.push({
      startX,
      startY,
      targetX,
      targetY,
      angle,
      damage,
      timer: 0,
      duration: 0.12,
      alive: true
    });
  }

  spawnQuadBurst(x, y, damage, color) {
    const angles = [
      Math.PI / 4,
      (3 * Math.PI) / 4,
      (5 * Math.PI) / 4,
      (7 * Math.PI) / 4
    ];
    for (const a of angles) {
      this.bolts.push({
        x,
        y,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        angle: a,
        damage: damage * 0.9,
        color: color || '#e040fb',
        pierce: 2,
        alive: true
      });
    }
  }

  update(dt, canvasWidth, canvasHeight, aliens, planet, onAlienHitCallback, onTorpedoDestroyedCallback, onBossPhase2Callback = null, hazardManager = null, supplyPodManager = null, speedScale = 1.0, onAsteroidShatterCallback = null, onPodDestroyedCallback = null) {
    // 1. Update Player Plasma Bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Check collision with Torpedoes (shoot down torpedoes!)
      for (const torp of this.torpedoes) {
        if (!torp.alive) continue;
        const d = Math.hypot(torp.x - b.x, torp.y - b.y);
        if (d <= torp.radius + 8) {
          torp.alive = false;
          b.pierce--;
          if (onTorpedoDestroyedCallback) onTorpedoDestroyedCallback(torp.x, torp.y);
          if (b.pierce <= 0) {
            b.alive = false;
            break;
          }
        }
      }

      // Check collision with Orbital Supply Pods
      if (b.alive && supplyPodManager) {
        const hitPod = supplyPodManager.checkHit(b.x, b.y, 6, b.damage, onPodDestroyedCallback);
        if (hitPod) {
          b.pierce--;
          if (b.pierce <= 0) {
            b.alive = false;
          }
        }
      }

      // Check collision with Drifting Asteroids (Sector I)
      if (b.alive && hazardManager) {
        const hitAst = hazardManager.checkHitAsteroids(b.x, b.y, 6, b.damage, onAsteroidShatterCallback);
        if (hitAst) {
          b.pierce--;
          if (b.pierce <= 0) {
            b.alive = false;
          }
        }
      }

      // Check collision with Aliens
      if (b.alive) {
        for (const alien of aliens) {
          if (!alien.alive) continue;
          const d = Math.hypot(alien.x - b.x, alien.y - b.y);
          if (d <= alien.radius + 6) {
            if (b.isRailgun) {
              // Railgun Lancer: +50% bonus dmg against Solar Dreadnoughts & Mothership Bosses, ignores shields
              let hitDmg = b.damage;
              if (alien.classKey === 'DREADNOUGHT' || alien.classKey === 'BOSS') {
                hitDmg *= 1.5;
              }
              const destroyed = alien.takeDamage(hitDmg, b.x, b.y, true, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y);

              // Add fading golden laser wake trail
              this.railgunTrails.push({
                x1: b.x - Math.cos(b.angle) * 45,
                y1: b.y - Math.sin(b.angle) * 45,
                x2: b.x + Math.cos(b.angle) * 15,
                y2: b.y + Math.sin(b.angle) * 15,
                timer: 0.16,
                maxTimer: 0.16,
                color: b.color || '#ffd700'
              });
            } else if (b.isTesla) {
              // Tesla Arc Cannon: Chain-lightning to up to 2 (or 3 at Lv.5+) nearby targets within 115px
              const destroyed = alien.takeDamage(b.damage, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y);

              const candidates = [];
              for (const other of aliens) {
                if (other === alien || !other.alive) continue;
                const cDist = Math.hypot(other.x - alien.x, other.y - alien.y);
                if (cDist <= 115) {
                  candidates.push({ alien: other, dist: cDist });
                }
              }
              candidates.sort((a, b) => a.dist - b.dist);

              // 1st arc: 65% damage
              if (candidates[0]) {
                const target1 = candidates[0].alien;
                const k1 = target1.takeDamage(b.damage * 0.65, target1.x, target1.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target1, k1, target1.x, target1.y);
                this.teslaArcs.push({
                  x1: alien.x,
                  y1: alien.y,
                  x2: target1.x,
                  y2: target1.y,
                  timer: 0.12,
                  maxTimer: 0.12,
                  color: '#00e5ff'
                });
              }

              // 2nd arc: 45% damage
              if (candidates[1]) {
                const target2 = candidates[1].alien;
                const origin = candidates[0] ? candidates[0].alien : alien;
                const k2 = target2.takeDamage(b.damage * 0.45, target2.x, target2.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target2, k2, target2.x, target2.y);
                this.teslaArcs.push({
                  x1: origin.x,
                  y1: origin.y,
                  x2: target2.x,
                  y2: target2.y,
                  timer: 0.12,
                  maxTimer: 0.12,
                  color: '#e040fb'
                });
              }

              // 3rd arc: 15% damage (Lv.5+ only)
              if (b.turretLevel >= 5 && candidates[2]) {
                const target3 = candidates[2].alien;
                const origin = candidates[1] ? candidates[1].alien : alien;
                const k3 = target3.takeDamage(b.damage * 0.15, target3.x, target3.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target3, k3, target3.x, target3.y);
                this.teslaArcs.push({
                  x1: origin.x,
                  y1: origin.y,
                  x2: target3.x,
                  y2: target3.y,
                  timer: 0.12,
                  maxTimer: 0.12,
                  color: '#00e5ff'
                });
              }
            } else {
              // Standard Pulse Striker bolt
              const destroyed = alien.takeDamage(b.damage, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y);
            }

            b.pierce--;
            if (b.pierce <= 0) {
              b.alive = false;
              break;
            }
          }
        }
      }

      // Screen boundary check
      if (b.x < -60 || b.x > canvasWidth + 60 || b.y < -60 || b.y > canvasHeight + 60 || !b.alive) {
        this.bolts.splice(i, 1);
      }
    }

    // Update Tesla Arcs
    for (let i = this.teslaArcs.length - 1; i >= 0; i--) {
      const arc = this.teslaArcs[i];
      arc.timer -= dt;
      if (arc.timer <= 0) this.teslaArcs.splice(i, 1);
    }

    // Update Railgun Trails
    for (let i = this.railgunTrails.length - 1; i >= 0; i--) {
      const trail = this.railgunTrails[i];
      trail.timer -= dt;
      if (trail.timer <= 0) this.railgunTrails.splice(i, 1);
    }

    // 2. Update Enemy Torpedoes (affected by Cryo Time-Warp speedScale)
    for (let i = this.torpedoes.length - 1; i >= 0; i--) {
      const torp = this.torpedoes[i];
      torp.x += torp.vx * dt * speedScale;
      torp.y += torp.vy * dt * speedScale;

      // Check collision with planet shield/core
      if (planet) {
        const d = Math.hypot(planet.x - torp.x, planet.y - torp.y);
        const hitRadius = planet.shield > 0 ? planet.shieldRadius : planet.planetRadius;
        if (d <= hitRadius) {
          planet.damage(torp.damage, torp.x, torp.y);
          torp.alive = false;
        }
      }

      if (torp.x < -100 || torp.x > canvasWidth + 100 || torp.y < -100 || torp.y > canvasHeight + 100 || !torp.alive) {
        this.torpedoes.splice(i, 1);
      }
    }

    // 3. Update Satellite Lasers
    for (let i = this.satelliteLasers.length - 1; i >= 0; i--) {
      const sat = this.satelliteLasers[i];
      sat.timer += dt;
      if (sat.timer >= sat.duration) {
        sat.alive = false;
        this.satelliteLasers.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // 1. Render Satellite Lasers
    for (const sat of this.satelliteLasers) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sat.startX, sat.startY);
      ctx.lineTo(sat.targetX, sat.targetY);
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Render Railgun Golden Wake Trails
    for (const tr of this.railgunTrails) {
      const alpha = Math.max(0, tr.timer / tr.maxTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.strokeStyle = tr.color || '#ffd700';
      ctx.lineWidth = 5.0;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Tesla Jagged Chain Lightning Arcs
    for (const arc of this.teslaArcs) {
      const alpha = Math.max(0, arc.timer / arc.maxTimer);
      ctx.save();
      ctx.globalAlpha = alpha;

      const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 18;
      const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 18;

      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      ctx.lineTo(midX, midY);
      ctx.lineTo(arc.x2, arc.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      ctx.lineTo(midX, midY);
      ctx.lineTo(arc.x2, arc.y2);
      ctx.strokeStyle = arc.color || '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = arc.color || '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Player Plasma & Railgun Bolts
    for (const b of this.bolts) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

      if (b.isRailgun) {
        // High-velocity hyper-dense golden slug
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-22, 0);
        ctx.lineTo(22, 0);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;
        ctx.stroke();
      } else if (b.isTesla) {
        // High-voltage shock bolt
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(11, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.strokeStyle = b.color || '#e040fb';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = b.color || '#e040fb';
        ctx.shadowBlur = 14;
        ctx.stroke();
      } else {
        // Standard rapid plasma bolt
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      ctx.restore();
    }

    // 5. Render Enemy Torpedoes
    for (const torp of this.torpedoes) {
      ctx.save();
      ctx.translate(torp.x, torp.y);
      ctx.rotate(torp.angle);

      // Torpedo glow & body
      ctx.beginPath();
      ctx.arc(0, 0, torp.radius, 0, Math.PI * 2);
      ctx.fillStyle = torp.color;
      ctx.shadowColor = torp.color;
      ctx.shadowBlur = 14;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, torp.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Exhaust tail
      ctx.beginPath();
      ctx.moveTo(-torp.radius, 0);
      ctx.lineTo(-torp.radius - 12, 0);
      ctx.strokeStyle = torp.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }
  }
}
