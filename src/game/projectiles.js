// Spark Panic 2.0 - Projectile Systems (Plasma Bolts, Siege Torpedoes, Quad Bursts)

export class ProjectileManager {
  constructor() {
    this.bolts = [];
    this.torpedoes = [];
    this.satelliteLasers = [];
  }

  clear() {
    this.bolts = [];
    this.torpedoes = [];
    this.satelliteLasers = [];
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

  update(dt, canvasWidth, canvasHeight, aliens, planet, onAlienHitCallback, onTorpedoDestroyedCallback) {
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

      // Check collision with Aliens
      if (b.alive) {
        for (const alien of aliens) {
          if (!alien.alive) continue;
          const d = Math.hypot(alien.x - b.x, alien.y - b.y);
          if (d <= alien.radius + 6) {
            const destroyed = alien.takeDamage(b.damage);
            if (onAlienHitCallback) onAlienHitCallback(alien, destroyed, b.x, b.y);
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

    // 2. Update Enemy Torpedoes
    for (let i = this.torpedoes.length - 1; i >= 0; i--) {
      const torp = this.torpedoes[i];
      torp.x += torp.vx * dt;
      torp.y += torp.vy * dt;

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

    // 2. Render Player Plasma Bolts
    for (const b of this.bolts) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);

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

      ctx.restore();
    }

    // 3. Render Enemy Torpedoes
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
