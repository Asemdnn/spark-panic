// Spark Panic 2.0 - Projectile Systems (Plasma Bolts, Siege Torpedoes, Quad Bursts)

export class ProjectileManager {
  constructor() {
    this.bolts = [];
    this.torpedoes = [];
    this.satelliteLasers = [];
    this.teslaArcs = [];
    this.railgunTrails = [];
    this.parryFlashes = [];
  }

  clear() {
    this.bolts = [];
    this.torpedoes = [];
    this.satelliteLasers = [];
    this.teslaArcs = [];
    this.railgunTrails = [];
    this.parryFlashes = [];
  }

  spawnParryShieldFlash(x, y, angle = 0) {
    const holographicColors = ['#00e5ff', '#ffd700', '#e040fb', '#ffffff', '#38bdf8', '#00ffcc'];
    const sparks = [];
    const sparkCount = 24;
    for (let i = 0; i < sparkCount; i++) {
      const spAng = angle + (Math.random() - 0.5) * 2.2;
      const spSpd = 120 + Math.random() * 260;
      sparks.push({
        x,
        y,
        vx: Math.cos(spAng) * spSpd,
        vy: Math.sin(spAng) * spSpd,
        color: holographicColors[Math.floor(Math.random() * holographicColors.length)],
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 2.0 + Math.random() * 3.0,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 16
      });
    }

    this.parryFlashes.push({
      x,
      y,
      angle,
      timer: 0.35,
      maxTimer: 0.35,
      radius: 38,
      sparks
    });
  }

  spawnTurretBolts(planetX, planetY, turretRadius, boltConfigs) {
    for (const b of boltConfigs) {
      if (this.bolts.length >= 250) break;
      const offset = (turretRadius + 6) + (b.staggerOffset || 0);
      const startX = planetX + Math.cos(b.angle) * offset;
      const startY = planetY + Math.sin(b.angle) * offset;
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
        isWiderBeam: !!b.isWiderBeam,
        speed: b.speed || 520,
        chassis: b.chassis || 'striker',
        source: 'turret',
        refracted: !!b.refracted,
        warped: !!b.warped,
        alive: true
      });
    }
  }

  addPlasmaBolt(config) {
    if (this.bolts.length >= 250) return null;
    this.bolts.push({
      speed: 520,
      color: '#00e5ff',
      pierce: 1,
      source: 'turret',
      alive: true,
      refracted: !!config.refracted,
      warped: !!config.warped,
      ...config,
      vx: Math.cos(config.angle) * (config.speed || 520),
      vy: Math.sin(config.angle) * (config.speed || 520)
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
      if (this.bolts.length >= 250) break;
      this.bolts.push({
        x,
        y,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        angle: a,
        damage: damage * 0.9,
        color: color || '#e040fb',
        pierce: 2,
        refracted: true,
        warped: false,
        alive: true
      });
    }
  }

  update(dt, canvasWidth, canvasHeight, aliens, planet, onAlienHitCallback, onTorpedoDestroyedCallback, onBossPhase2Callback = null, hazardManager = null, supplyPodManager = null, speedScale = 1.0, onAsteroidShatterCallback = null, onPodDestroyedCallback = null, structureManager = null) {
    // 1. Update Player Plasma Bolts
    const initialBulletCount = this.bolts.length;
    for (let i = initialBulletCount - 1; i >= 0; i--) {
      if (i >= this.bolts.length) continue;
      const b = this.bolts[i];
      if (!b) continue;
      const prevX = b.x;
      const prevY = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Lingering ionizing laser trail that splinters into secondary prismatic sparks
      if (b.isRailgun && b.alive) {
        const dx = b.x - prevX;
        const dy = b.y - prevY;
        const len = Math.hypot(dx, dy);
        const normX = len > 0 ? -dy / len : 0;
        const normY = len > 0 ? dx / len : 1;

        const sparks = [];
        const sparkCount = 2 + Math.floor(Math.random() * 3);
        const prismaticColors = ['#00e5ff', '#ffd700', '#e040fb', '#ffffff', '#00ffcc'];
        for (let s = 0; s < sparkCount; s++) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const perpSpeed = 40 + Math.random() * 75;
          const alongSpeed = (Math.random() - 0.5) * 35;
          const pct = Math.random();
          sparks.push({
            x: prevX + dx * pct,
            y: prevY + dy * pct,
            vx: normX * side * perpSpeed + (len > 0 ? (dx / len) * alongSpeed : 0),
            vy: normY * side * perpSpeed + (len > 0 ? (dy / len) * alongSpeed : 0),
            color: prismaticColors[Math.floor(Math.random() * prismaticColors.length)],
            life: 0.22,
            maxLife: 0.22,
            size: 1.5 + Math.random() * 1.5
          });
        }

        this.railgunTrails.push({
          x1: prevX,
          y1: prevY,
          x2: b.x,
          y2: b.y,
          timer: 0.22,
          maxTimer: 0.22,
          color: b.color || '#ffd700',
          sparks
        });
      }

      // v2.8 Homing logic for Reflected Parry Super-Missiles
      if (b.isReflectedMissile && b.alive) {
        let nearest = null;
        let minDist = 99999;
        for (const a of aliens) {
          if (!a.alive) continue;
          const da = Math.hypot(a.x - b.x, a.y - b.y);
          if (da < minDist) { minDist = da; nearest = a; }
        }
        if (nearest) {
          const tgtAngle = Math.atan2(nearest.y - b.y, nearest.x - b.x);
          b.vx = Math.cos(tgtAngle) * 480;
          b.vy = Math.sin(tgtAngle) * 480;
          b.angle = tgtAngle;
        }
      }

      // Check laser refraction through Solar Prism Pylons
      if (b.alive && !b.refracted && !b.isSatellite && structureManager) {
        structureManager.checkRefractPylons(b);
      }

      // v2.9 Twin Wormhole Portals Teleportation (+45% Hyper-Warp DMG, +2 Pierce)
      if (b.alive && !b.warped && !b.hasTeleported && planet?.engine?.wormholes) {
        const wh = planet.engine.wormholes;
        const da = Math.hypot(b.x - wh.a.x, b.y - wh.a.y);
        const db = Math.hypot(b.x - wh.b.x, b.y - wh.b.y);
        if (da <= wh.a.radius || db <= wh.b.radius) {
          const fromPort = da <= wh.a.radius ? wh.a : wh.b;
          const toPort = da <= wh.a.radius ? wh.b : wh.a;
          b.x = toPort.x;
          b.y = toPort.y;
          b.warped = true;
          b.hasTeleported = true;
          b.damage = Math.round(b.damage * 1.45);
          b.pierce = (b.pierce || 1) + 2;
          b.color = '#ffd700';

          // Automatically angle towards nearest enemy or behind Jammer frontal barrier
          let bestAngle = (b.angle !== undefined) ? b.angle : ((b.vx || b.vy) ? Math.atan2(b.vy || 0, b.vx || 0) : 0);
          const jammer = aliens && aliens.find ? aliens.find(a => a.alive && a.classKey === 'JAMMER') : null;
          if (jammer) {
            const tx = jammer.x - Math.cos(jammer.heading) * 35;
            const ty = jammer.y - Math.sin(jammer.heading) * 35;
            bestAngle = Math.atan2(ty - b.y, tx - b.x);
          } else if (aliens && aliens.length) {
            let nearestDist = Infinity;
            let targetX = null, targetY = null;
            for (const a of aliens) {
              if (!a.alive) continue;
              const dist = Math.hypot(a.x - toPort.x, a.y - toPort.y);
              if (dist < nearestDist) {
                nearestDist = dist;
                targetX = a.x;
                targetY = a.y;
              }
            }
            if (targetX !== null) {
              bestAngle = Math.atan2(targetY - b.y, targetX - b.x);
            }
          }
          b.angle = bestAngle;
          const spd = b.speed || Math.hypot(b.vx || 0, b.vy || 0) || 520;
          b.vx = Math.cos(bestAngle) * spd;
          b.vy = Math.sin(bestAngle) * spd;

          if (planet?.engine?.particles) {
            planet.engine.particles.spawnNovaRing(toPort.x, toPort.y, toPort.color, 45);
            planet.engine.particles.addFloater(toPort.x, toPort.y - 25, '🌀 HYPER-WARP! +45% DMG & +2 PIERCE', '#ffd700', 14);
          }
        }
      }

      // v2.9 Volatile Plasma Barrels Hit Check
      if (b.alive && planet?.engine?.plasmaBarrels) {
        for (const barrel of planet.engine.plasmaBarrels) {
          if (!barrel.alive) continue;
          const dBar = Math.hypot(b.x - barrel.x, b.y - barrel.y);
          if (dBar <= barrel.radius + 6) {
            barrel.hp -= b.damage;
            if (barrel.hp <= 0 && barrel.alive) {
              barrel.alive = false;
              if (planet?.engine) {
                planet.engine.particles.spawnNova(barrel.x, barrel.y, 115, '#ff3d00', 95, true);
                planet.engine.particles.spawnDebris(barrel.x, barrel.y, '#ff9100', 16);
                planet.engine.particles.addFloater(barrel.x, barrel.y - 25, '🛢️ VOLATILE BARREL EXPLOSION!', '#ff9100', 18);
                planet.engine.addScreenShake(8, 0.2);
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

      // Check collision with Aliens and Boss Sub-Systems
      if (b.alive) {
        for (const alien of aliens) {
          if (!alien.alive) continue;

          // v2.9 Boss Destructible Sub-Systems Check
          if (alien.isBoss && alien.subsystems) {
            for (const sub of alien.subsystems) {
              if (!sub.alive) continue;
              const dSub = Math.hypot(sub.x - b.x, sub.y - b.y);
              if (dSub <= (sub.radius || 14) + 6) {
                alien.damageSubsystem(sub.id, b.damage, planet?.engine);
                b.pierce--;
                if (b.pierce <= 0) {
                  b.alive = false;
                  break;
                }
              }
            }
            if (!b.alive) break;
          }

          const d = Math.hypot(alien.x - b.x, alien.y - b.y);
          const hitR = b.hitRadius || (b.isOverchargeLance ? (b.isWiderBeam ? 18 : 8) : 6);
          if (d <= alien.radius + hitR) {
            const loadout = (planet && planet.engine && planet.engine.getShipyardLoadout) ? planet.engine.getShipyardLoadout() : null;
            const isChilledOrStunned = (alien.slowTimer > 0 || alien.frozenTimer > 0);
            const boltDmg = (loadout && loadout.reactor === 'cryo' && isChilledOrStunned) ? Math.round(b.damage * 1.15) : b.damage;

            if (b.isOvercharged) {
              // Overcharged Coil: 2.2x primary damage + 2 golden chain arcs
              const destroyed = alien.takeDamage(boltDmg, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, boltDmg, b.source || 'turret');

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
                const k1 = target1.takeDamage(boltDmg * 0.65, target1.x, target1.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target1, k1, target1.x, target1.y, boltDmg * 0.65, b.source || 'turret');
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
                const k2 = target2.takeDamage(boltDmg * 0.45, target2.x, target2.y, false, onBossPhase2Callback);
                if (onAlienHitCallback) onAlienHitCallback(target2, k2, target2.x, target2.y, boltDmg * 0.45, b.source || 'turret');
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
              let hitDmg = boltDmg;
              if (alien.classKey === 'DREADNOUGHT' || alien.classKey === 'BOSS') {
                hitDmg *= 1.5;
              }
              const destroyed = alien.takeDamage(hitDmg, b.x, b.y, true, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, hitDmg, b.source || 'turret');

              // Add lingering ionizing laser wake trail that splinters into secondary prismatic sparks
              const hitSparks = [];
              const prismaticColors = ['#00e5ff', '#ffd700', '#e040fb', '#ffffff', '#00ffcc'];
              for (let s = 0; s < 4; s++) {
                const sAng = b.angle + Math.PI + (Math.random() - 0.5) * 1.8;
                const sSpd = 50 + Math.random() * 90;
                hitSparks.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(sAng) * sSpd,
                  vy: Math.sin(sAng) * sSpd,
                  color: prismaticColors[Math.floor(Math.random() * prismaticColors.length)],
                  life: 0.25,
                  maxLife: 0.25,
                  size: 2.0 + Math.random() * 1.5
                });
              }

              this.railgunTrails.push({
                x1: b.x - Math.cos(b.angle) * 45,
                y1: b.y - Math.sin(b.angle) * 45,
                x2: b.x + Math.cos(b.angle) * 15,
                y2: b.y + Math.sin(b.angle) * 15,
                timer: 0.20,
                maxTimer: 0.20,
                color: b.color || '#ffd700',
                sparks: hitSparks
              });
            } else if (b.isTesla) {
              // Tesla Arc Cannon: Chain-lightning to up to 2 (or 3 at Lv.5+) nearby targets within 115px
              const destroyed = alien.takeDamage(boltDmg, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, boltDmg, b.source || 'turret');

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
            } else if (b.isOverchargeLance) {
              // v2.8 Focused Overcharge Plasma Lance: High velocity piercing, shatters Jammer barriers
              const destroyed = alien.takeDamage(boltDmg, b.x, b.y, true, onBossPhase2Callback, true);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, boltDmg, b.source || 'turret');
              if (alien.lastHitWasCrit && planet?.engine) {
                planet.engine.onCritBreach(alien);
              }
              if (planet?.engine?.hasPerk && planet.engine.hasPerk('volatileCores')) {
                planet.engine.spawnVolatilePlasmaPool(b.x, b.y);
              }
              if (planet?.engine?.hasPerk && planet.engine.hasPerk('cryoRounds')) {
                alien.slowTimer = Math.max(alien.slowTimer || 0, 2.2);
                alien.speedMultiplier = 0.60;
              }
            } else if (b.isReflectedMissile) {
              // v2.8 Homing Reflected Super-Missile: 65px micro-nova detonation
              const destroyed = alien.takeDamage(boltDmg, b.x, b.y, true, onBossPhase2Callback, true);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, boltDmg, b.source || 'parry');
              if (alien.lastHitWasCrit && planet?.engine) {
                planet.engine.onCritBreach(alien);
              }
              if (planet?.engine?.particles) {
                planet.engine.particles.spawnNovaRing(b.x, b.y, '#ffd700', 65);
              }
              // Detonate splash damage
              for (const other of aliens) {
                if (other === alien || !other.alive) continue;
                const splashDist = Math.hypot(other.x - b.x, other.y - b.y);
                if (splashDist <= 65 + (other.radius || 16)) {
                  const k = other.takeDamage(boltDmg * 0.6, b.x, b.y, true, onBossPhase2Callback);
                  if (onAlienHitCallback) onAlienHitCallback(other, k, b.x, b.y, boltDmg * 0.6, 'parry');
                }
              }
            } else {
              // Standard Pulse Striker bolt or Wingman Bolt
              const destroyed = alien.takeDamage(boltDmg, b.x, b.y, false, onBossPhase2Callback);
              if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y, boltDmg, b.source || 'turret');

              if (planet?.engine?.hasPerk && planet.engine.hasPerk('cryoRounds')) {
                alien.slowTimer = Math.max(alien.slowTimer || 0, 2.2);
                alien.speedMultiplier = 0.60;
              }

              if (b.isRocket && b.splashRadius > 0) {
                for (const other of aliens) {
                  if (other === alien || !other.alive) continue;
                  const splashDist = Math.hypot(other.x - b.x, other.y - b.y);
                  if (splashDist <= b.splashRadius + (other.radius || 16)) {
                    const k = other.takeDamage(boltDmg * 0.5, b.x, b.y, false, onBossPhase2Callback);
                    if (onAlienHitCallback) onAlienHitCallback(other, k, b.x, b.y, boltDmg * 0.5, b.source || 'turret');
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

    // Update Railgun Trails and splintering prismatic sparks
    for (let i = this.railgunTrails.length - 1; i >= 0; i--) {
      const trail = this.railgunTrails[i];
      trail.timer -= dt;
      if (trail.sparks) {
        for (let s = trail.sparks.length - 1; s >= 0; s--) {
          const sp = trail.sparks[s];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.life -= dt;
          if (sp.life <= 0) trail.sparks.splice(s, 1);
        }
      }
      if (trail.timer <= 0 && (!trail.sparks || trail.sparks.length === 0)) {
        this.railgunTrails.splice(i, 1);
      }
    }

    // Update Aegis Phase-Parry Flashes & Holographic Sparks
    for (let i = this.parryFlashes.length - 1; i >= 0; i--) {
      const pf = this.parryFlashes[i];
      pf.timer -= dt;
      if (pf.sparks) {
        for (let s = pf.sparks.length - 1; s >= 0; s--) {
          const sp = pf.sparks[s];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.rotation += sp.vRot * dt;
          sp.vx *= Math.pow(0.92, dt * 60);
          sp.vy *= Math.pow(0.92, dt * 60);
          sp.life -= dt;
          if (sp.life <= 0) pf.sparks.splice(s, 1);
        }
      }
      if (pf.timer <= 0 && (!pf.sparks || pf.sparks.length === 0)) {
        this.parryFlashes.splice(i, 1);
      }
    }

    // 2. Update Enemy Torpedoes (affected by Cryo Time-Warp speedScale; warm-up + in-place mutation)
    for (let i = this.torpedoes.length - 1; i >= 0; i--) {
      const torp = this.torpedoes[i];
      if (!torp.trail) torp.trail = [];
      if (torp.trail.length < 5) {
        torp.trail.push({ x: torp.x, y: torp.y });
      } else {
        for (let t = 0; t < torp.trail.length - 1; t++) {
          torp.trail[t].x = torp.trail[t + 1].x;
          torp.trail[t].y = torp.trail[t + 1].y;
        }
        torp.trail[torp.trail.length - 1].x = torp.x;
        torp.trail[torp.trail.length - 1].y = torp.y;
      }

      torp.x += torp.vx * dt * speedScale;
      torp.y += torp.vy * dt * speedScale;

      // Check collision with planet shield/core
      if (planet) {
        const d = Math.hypot(planet.x - torp.x, planet.y - torp.y);

        // v2.8 Active Aegis Phase-Parry Deflection Check (110° arc at shield perimeter, 145° with parry amplifier)
        if (planet.engine && planet.engine.parryTimer > 0 && d <= planet.shieldRadius + 24) {
          const tAng = Math.atan2(torp.y - planet.y, torp.x - planet.x);
          const pAng = planet.engine.turret.angle;
          let diff = Math.abs(tAng - pAng);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          const loadout = planet.engine.getShipyardLoadout ? planet.engine.getShipyardLoadout() : null;
          const parryArcDeg = (loadout && loadout.shieldMod === 'parry') ? 145 : 110;
          const halfArc = (parryArcDeg * Math.PI) / 360;
          if (diff <= halfArc) {
            torp.alive = false;
            this.spawnParryShieldFlash(torp.x, torp.y, tAng);
            planet.engine.onPerfectParry(torp.x, torp.y, torp.damage);
            this.torpedoes.splice(i, 1);
            continue;
          }
        }

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

    // 2. Render Railgun Lingering Ionizing Laser Trails & Secondary Prismatic Sparks
    for (const tr of this.railgunTrails) {
      const alpha = Math.max(0, tr.timer / tr.maxTimer);
      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer ionizing cyan corona
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 8.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Golden ionized mid-trail
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.strokeStyle = tr.color || '#ffd700';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Central pure white hyper-penetration line
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Splintering secondary prismatic sparks
      if (tr.sparks && tr.sparks.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const sp of tr.sparks) {
          const spAlpha = Math.max(0, sp.life / sp.maxLife);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fillStyle = sp.color;
          ctx.shadowColor = sp.color;
          ctx.shadowBlur = 8;
          ctx.globalAlpha = spAlpha * alpha;
          ctx.fill();
        }
        ctx.restore();
      }

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
    if (this.bolts.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (const b of this.bolts) {
        const angle = (b.vx !== 0 || b.vy !== 0) ? Math.atan2(b.vy, b.vx) : (b.angle || 0);
        const isWider = b.isWiderBeam || (b.isOverchargeLance && b.isSiege);
        const r = b.r || (b.isOverchargeLance ? (isWider ? 12.0 : 7.0) : (b.isOvercharged ? 5.5 : (b.isRailgun ? 5.0 : 4.5)));
        const trailLen = b.isOverchargeLance ? (isWider ? 48 : 38) : (b.isOvercharged || b.isRailgun ? 26 : (b.isTesla ? 22 : 20));
        const coreLen = b.isOverchargeLance ? (isWider ? 24 : 18) : 10;
        const isChrom = b.isChromatic || b.source === 'frenzy';
        const chromColor = `hsl(${Math.floor((Date.now() / 4) % 360)}, 100%, 65%)`;
        const boltColor = isChrom ? chromColor : (b.isOverchargeLance ? '#00e5ff' : (b.isReflectedMissile ? '#ffd700' : (b.isOvercharged ? '#ffd700' : (b.isRailgun ? '#ffd700' : (b.color || '#00e5ff')))));

        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);

        // Stage 1: Outer glowing plasma capsule trail
        ctx.beginPath();
        ctx.moveTo(-trailLen, 0);
        ctx.lineTo(coreLen * 0.5, 0);
        ctx.strokeStyle = boltColor;
        ctx.lineWidth = r * 2.4;
        ctx.shadowColor = boltColor;
        ctx.shadowBlur = b.isOverchargeLance ? 24 : (b.isOvercharged ? 20 : 14);
        ctx.stroke();

        // Stage 2: Animated intermediate energy corona
        const corePulse = Math.sin(Date.now() * 0.035 + (b.x * 0.05 + b.y * 0.05));
        ctx.beginPath();
        ctx.moveTo(-coreLen * 1.3, 0);
        ctx.lineTo(coreLen * 0.6, 0);
        ctx.strokeStyle = boltColor;
        ctx.lineWidth = r * 1.5 + corePulse * 1.0;
        ctx.shadowColor = boltColor;
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Stage 3: Pure white hot energy core
        ctx.beginPath();
        ctx.moveTo(-coreLen, 0);
        ctx.lineTo(coreLen * 0.5, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = r * 0.9;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // High-frequency oscillating lightning tendril
        ctx.beginPath();
        const tendrilSteps = 5;
        const tendrilLen = trailLen * 0.85;
        const freq = Date.now() * 0.045 + (b.x + b.y) * 0.02;
        for (let s = 0; s <= tendrilSteps; s++) {
          const tx = -tendrilLen + (s / tendrilSteps) * (tendrilLen + coreLen * 0.4);
          const ty = Math.sin(freq + s * 2.3) * (r * 0.75);
          if (s === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Sparkling engine wake
        const wakeSeed = Math.floor(Date.now() / 45);
        for (let w = 1; w <= 3; w++) {
          const wx = -trailLen - (w * 5) - ((wakeSeed * 7 + w * 11) % 7);
          const wy = (((wakeSeed * 13 + w * 17) % 9) - 4) * 0.35 * r;
          const wSize = Math.max(0.7, (2.2 - w * 0.5));
          ctx.beginPath();
          ctx.arc(wx, wy, wSize, 0, Math.PI * 2);
          ctx.fillStyle = (w === 1) ? '#ffffff' : boltColor;
          ctx.fill();
        }

        // For Overcharge Plasma Lance: electric distortion arcs
        if (b.isOverchargeLance) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(-28, (Math.random() - 0.5) * 8);
          ctx.lineTo(-10, (Math.random() - 0.5) * 12);
          ctx.lineTo(10, (Math.random() - 0.5) * 8);
          ctx.stroke();
        }

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
    }

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

    // 6. Render Aegis Phase-Parry Shield: Reflective Crystal Hexagonal Prism Flashes & Holographic Sparks
    for (const pf of this.parryFlashes) {
      if (pf.timer > 0) {
        const tNorm = pf.timer / pf.maxTimer; // 1.0 -> 0.0
        const flashR = pf.radius * (1.6 - tNorm * 0.6);
        ctx.save();
        ctx.translate(pf.x, pf.y);
        ctx.rotate(pf.angle);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.max(0, tNorm);

        // Reflective crystal hexagonal prism facet
        ctx.beginPath();
        for (let h = 0; h < 6; h++) {
          const hAng = (h / 6) * Math.PI * 2;
          const hx = Math.cos(hAng) * flashR;
          const hy = Math.sin(hAng) * flashR;
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 18;
        ctx.stroke();

        // Crystal facet prism refraction chords
        ctx.beginPath();
        for (let h = 0; h < 6; h += 2) {
          const hAng = (h / 6) * Math.PI * 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(hAng) * flashR, Math.sin(hAng) * flashR);
        }
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();
      }

      // Render holographic shattering sparks
      if (pf.sparks && pf.sparks.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const sp of pf.sparks) {
          const spAlpha = Math.max(0, sp.life / sp.maxLife);
          ctx.save();
          ctx.translate(sp.x, sp.y);
          ctx.rotate(sp.rotation);
          ctx.globalAlpha = spAlpha;

          // Diamond crystal holographic shard
          ctx.beginPath();
          ctx.moveTo(0, -sp.size);
          ctx.lineTo(sp.size * 0.6, 0);
          ctx.lineTo(0, sp.size);
          ctx.lineTo(-sp.size * 0.6, 0);
          ctx.closePath();
          ctx.fillStyle = sp.color;
          ctx.shadowColor = sp.color;
          ctx.shadowBlur = 8;
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    }
  }

  renderHelicalIonBeam(ctx, originDist, length, width, timeSec) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // True double-helix intertwining energy coils
    const helixStep = 12;
    const waveFreq = 0.055;
    const waveSpeed = 28;
    const amp = width * 0.85;

    // Twin Helices with 3D Depth Modulation
    for (let h = 0; h < 2; h++) {
      const phaseOffset = h * Math.PI;
      const helixColor = h === 0 ? '#00e5ff' : 'rgba(255, 255, 255, 0.9)';

      ctx.beginPath();
      for (let d = 0; d <= length; d += helixStep) {
        const ang = d * waveFreq - timeSec * waveSpeed + phaseOffset;
        const rx = originDist + d;
        const ry = Math.sin(ang) * amp;
        if (d === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.strokeStyle = helixColor;
      ctx.lineWidth = h === 0 ? 3.5 : 2.0;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.stroke();
    }

    // Procedural lightning arcs leaping between the twin helices
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    for (let d = 40; d < length; d += 65) {
      const ang = d * waveFreq - timeSec * waveSpeed;
      const ryA = Math.sin(ang) * amp;
      const ryB = Math.sin(ang + Math.PI) * amp;
      const jitterT = Math.floor(timeSec * 16 + d * 0.1);
      if ((jitterT + Math.floor(d / 65)) % 3 === 0) {
        const midX = originDist + d + (Math.sin(d + timeSec * 20) * 10);
        const midY = (ryA + ryB) * 0.5 + (Math.cos(d + timeSec * 25) * 8);
        ctx.beginPath();
        ctx.moveTo(originDist + d, ryA);
        ctx.lineTo(midX, midY);
        ctx.lineTo(originDist + d + (Math.sin(d * 2) * 6), ryB);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
