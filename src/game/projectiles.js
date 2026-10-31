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
        isOvercharged: !!b.isOvercharged,
        speed: b.speed || 520,
        chassis: b.chassis || 'striker',
        source: 'turret',
        alive: true
      });
    }
  }

  addPlasmaBolt(config) {
    this.bolts.push({
      x: config.x,
      y: config.y,
      vx: Math.cos(config.angle) * config.speed,
      vy: Math.sin(config.angle) * config.speed,
      angle: config.angle,
      damage: config.damage,
      color: config.color || '#00e5ff',
      pierce: config.pierce || 1,
      isRocket: !!config.isRocket,
      splashRadius: config.splashRadius || 0,
      isOvercharged: !!config.isOvercharged,
      speed: config.speed || 520,
      source: config.source || 'turret',
      alive: true
    });
  }

  spawnTorpedo(x, y, angle, speed, damage, color) {
    this.torpedoes.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      damage,
      color: color || '#ff1744',
      radius: 6.5,
      trail: [],
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

  update(dt, canvasWidth, canvasHeight, aliens, planet, onAlienHitCallback, onTorpedoDestroyedCallback, onBossPhase2Callback = null, hazardManager = null, supplyPodManager = null, speedScale = 1.0, onAsteroidShatterCallback = null, onPodDestroyedCallback = null, structureManager = null) {
    // 1. Update Player Plasma Bolts
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      const prevX = b.x;
      const prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Lingering golden rail-wake line for Railgun Lancer shots
      if (b.isRailgun && b.alive) {
        this.railgunTrails.push({
          x1: prevX,
          y1: prevY,
          x2: b.x,
          y2: b.y,
          timer: 0.18,
          maxTimer: 0.18,
          color: b.color || '#ffd700'
        });
      }

      // Check laser refraction through Solar Prism Pylons
      if (b.alive && structureManager) {
        structureManager.checkRefractPylons(b);
      }

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
            if (b.isOvercharged) {
              // Overcharged Coil: 2.2x primary damage + 2 golden chain arcs
              const destroyed = alien.takeDamage(b.damage, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, b.damage, b.source || 'turret');

              const candidates = [];
              for (const other of aliens) {
                if (other === alien || !other.alive) continue;
                const cDist = Math.hypot(other.x - alien.x, other.y - alien.y);
                if (cDist <= 115) {
                  candidates.push({ alien: other, dist: cDist });
                }
              }
              candidates.sort((a, b) => a.dist - b.dist);

              if (candidates[0]) {
                const target1 = candidates[0].alien;
                const k1 = target1.takeDamage(b.damage * 0.65, target1.x, target1.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target1, k1, target1.x, target1.y, b.damage * 0.65, b.source || 'turret');
                this.teslaArcs.push({
                  x1: alien.x,
                  y1: alien.y,
                  x2: target1.x,
                  y2: target1.y,
                  timer: 0.15,
                  maxTimer: 0.15,
                  color: '#ffd700'
                });
              }

              if (candidates[1]) {
                const target2 = candidates[1].alien;
                const origin = candidates[0] ? candidates[0].alien : alien;
                const k2 = target2.takeDamage(b.damage * 0.45, target2.x, target2.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target2, k2, target2.x, target2.y, b.damage * 0.45, b.source || 'turret');
                this.teslaArcs.push({
                  x1: origin.x,
                  y1: origin.y,
                  x2: target2.x,
                  y2: target2.y,
                  timer: 0.15,
                  maxTimer: 0.15,
                  color: '#00e5ff'
                });
              }
            } else if (b.isRailgun) {
              // Railgun Lancer: +50% bonus dmg against Solar Dreadnoughts & Mothership Bosses, ignores shields
              let hitDmg = b.damage;
              if (alien.classKey === 'DREADNOUGHT' || alien.classKey === 'BOSS') {
                hitDmg *= 1.5;
              }
              const destroyed = alien.takeDamage(hitDmg, b.x, b.y, true, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, hitDmg, b.source || 'turret');

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
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, b.damage, b.source || 'turret');

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
                if (onAlienHitCallback) onAlienHitCallback(target1, k1, target1.x, target1.y, b.damage * 0.65, b.source || 'turret');
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
                if (onAlienHitCallback) onAlienHitCallback(target2, k2, target2.x, target2.y, b.damage * 0.45, b.source || 'turret');
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
                if (onAlienHitCallback) onAlienHitCallback(target3, k3, target3.x, target3.y, b.damage * 0.15, b.source || 'turret');
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
              // Standard Pulse Striker bolt or Wingman Bolt
              const destroyed = alien.takeDamage(b.damage, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, b.damage, b.source || 'turret');

              if (b.isRocket && b.splashRadius > 0) {
                for (const other of aliens) {
                  if (other === alien || !other.alive) continue;
                  const splashDist = Math.hypot(other.x - b.x, other.y - b.y);
                  if (splashDist <= b.splashRadius + (other.radius || 16)) {
                    const k = other.takeDamage(b.damage * 0.5, b.x, b.y, false, onBossPhase2Callback);
                    if (onAlienHitCallback) onAlienHitCallback(other, k, b.x, b.y, b.damage * 0.5, b.source || 'turret');
                  }
                }
              }
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
      if (!torp.trail) torp.trail = [];
      torp.trail.push({ x: torp.x, y: torp.y });
      if (torp.trail.length > 5) torp.trail.shift();

      torp.x += torp.vx * dt * speedScale;
      torp.y += torp.vy * dt * speedScale;

      // Check collision with planet shield/core
      if (planet) {
        const d = Math.hypot(planet.x - torp.x, planet.y - torp.y);
        const hitRadius = planet.shield > 0 ? planet.shieldRadius : planet.planetRadius;
        if (d <= hitRadius) {
          // Check aegisMirror relic: When shield > 50%, 40% chance to ricochet torpedoes back as homing missiles
          const hasAegisMirror = (planet.engine && planet.engine.hasRelic && planet.engine.hasRelic('aegisMirror'));
          const shieldPct = planet.maxShield > 0 ? (planet.shield / planet.maxShield) : 0;
          if (hasAegisMirror && shieldPct > 0.5 && Math.random() < 0.40) {
            torp.alive = false;
            let targetAlien = null;
            let minDist = 99999;
            for (const a of aliens) {
              if (!a.alive) continue;
              const da = Math.hypot(a.x - torp.x, a.y - torp.y);
              if (da < minDist) { minDist = da; targetAlien = a; }
            }
            const ricochetAngle = targetAlien ? Math.atan2(targetAlien.y - torp.y, targetAlien.x - torp.x) : (torp.angle + Math.PI);
            this.addPlasmaBolt({
              x: torp.x,
              y: torp.y,
              angle: ricochetAngle,
              speed: 560,
              damage: torp.damage * 1.5,
              color: '#00e5ff',
              isRocket: true,
              splashRadius: 35,
              source: 'turret'
            });
            if (planet.engine?.particles) {
              planet.engine.particles.spawnNovaRing(torp.x, torp.y, '#00e5ff', 30);
              planet.engine.particles.addFloater(torp.x, torp.y - 12, 'AEGIS RICOCHET!', '#00e5ff', 12);
            }
          } else {
            planet.damage(torp.damage, torp.x, torp.y);
            torp.alive = false;
          }
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

  render(ctx, planetX = 0, planetY = 0, shieldRadius = 85, showThreatRings = true) {
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

    // 4. Render Directional Glowing Plasma Capsules & Railgun Bolts (Additive Blending)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of this.bolts) {
      const angle = (b.vx !== 0 || b.vy !== 0) ? Math.atan2(b.vy, b.vx) : (b.angle || 0);
      const r = b.r || (b.isOvercharged ? 5.5 : (b.isRailgun ? 5.0 : 4.5));
      const trailLen = b.isOvercharged || b.isRailgun ? 26 : (b.isTesla ? 22 : 20);
      const coreLen = 10;
      const boltColor = b.isOvercharged ? '#ffd700' : (b.isRailgun ? '#ffd700' : (b.color || '#00e5ff'));

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      // Outer glowing plasma capsule trail
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.moveTo(-trailLen, 0);
      ctx.lineTo(coreLen * 0.5, 0);
      ctx.strokeStyle = boltColor;
      ctx.lineWidth = r * 2.4;
      ctx.shadowColor = boltColor;
      ctx.shadowBlur = b.isOvercharged ? 20 : 14;
      ctx.stroke();

      // Pure white hot core
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.moveTo(-coreLen, 0);
      ctx.lineTo(coreLen * 0.5, 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = r * 0.9;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.stroke();

      // For Railgun Lancer shots: tiny diamond shock-rings along trajectory
      if (b.isRailgun) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        for (const dx of [-6, -14, -22]) {
          ctx.beginPath();
          ctx.moveTo(dx, -3.5);
          ctx.lineTo(dx + 3, 0);
          ctx.lineTo(dx, 3.5);
          ctx.lineTo(dx - 3, 0);
          ctx.closePath();
          ctx.stroke();
        }
      }

      ctx.restore();
    }
    ctx.restore();

    // 5. Render High-Visibility Enemy Warheads & Close-Orbit Trajectories
    for (const torp of this.torpedoes) {
      const torpAngle = (torp.vx !== 0 || torp.vy !== 0) ? Math.atan2(torp.vy, torp.vx) : torp.angle;

      // 5a. Tapering crimson ribbon trail
      if (torp.trail && torp.trail.length >= 2) {
        ctx.save();
        for (let t = 0; t < torp.trail.length - 1; t++) {
          const p1 = torp.trail[t];
          const p2 = torp.trail[t + 1];
          const pct = (t + 1) / torp.trail.length;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(255, 23, 68, ${pct * 0.85})`;
          ctx.lineWidth = 1.5 + pct * 4.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5b. Close-Orbit Danger Trajectory & Lock-On Reticle
      if (planetX !== undefined && planetY !== undefined && shieldRadius !== undefined) {
        const distToPlanet = Math.hypot(torp.x - planetX, torp.y - planetY);
        if (distToPlanet <= shieldRadius + 130) {
          const angleToPlanet = Math.atan2(planetY - torp.y, planetX - torp.x);
          const impactX = planetX - Math.cos(angleToPlanet) * shieldRadius;
          const impactY = planetY - Math.sin(angleToPlanet) * shieldRadius;

          ctx.save();
          const pulse = 0.5 + Math.sin(Date.now() * 0.012) * 0.3;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(torp.x, torp.y);
          ctx.lineTo(impactX, impactY);
          ctx.strokeStyle = showThreatRings ? `rgba(255, 23, 68, ${pulse * 1.3})` : `rgba(255, 23, 68, ${pulse})`;
          ctx.lineWidth = showThreatRings ? 2.0 : 1.2;
          ctx.stroke();
          ctx.setLineDash([]);

          // Rotating diamond warning reticle around the warhead
          ctx.translate(torp.x, torp.y);
          ctx.rotate(Date.now() * 0.005);
          const rSize = showThreatRings ? 11 : 8.5;
          ctx.strokeStyle = showThreatRings ? '#ff1744' : 'rgba(255, 23, 68, 0.85)';
          ctx.lineWidth = showThreatRings ? 2.0 : 1.4;
          ctx.shadowColor = '#ff1744';
          ctx.shadowBlur = showThreatRings ? 12 : 6;
          ctx.strokeRect(-rSize, -rSize, rSize * 2, rSize * 2);
          ctx.restore();
        }
      }

      // 5c. Pointed crimson-and-white tactical warhead with thruster flame
      ctx.save();
      ctx.translate(torp.x, torp.y);
      ctx.rotate(torpAngle);

      // Flickering orange/amber thruster flame
      const flameLen = 4 + Math.random() * 6;
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.lineTo(-6 - flameLen, 0);
      ctx.lineTo(-6, 3);
      ctx.closePath();
      ctx.fillStyle = '#ff9100';
      ctx.shadowColor = '#ff3d00';
      ctx.shadowBlur = 10;
      ctx.fill();

      // Pointed tactical crimson warhead hull
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fillStyle = torp.color || '#ff1744';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 12;
      ctx.fill();

      // White hot tactical nose cone
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(0, -2.5);
      ctx.lineTo(0, 2.5);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  }
}
