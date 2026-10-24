// Spark Panic 2.0 - Autonomous Orbital Defense Satellites

export class DefenseSatellite {
  constructor(index, total) {
    this.index = index;
    this.total = total;
    this.angle = (index / Math.max(1, total)) * Math.PI * 2;
    this.fireTimer = 0.4 + index * 0.3;
    this.fireInterval = 0.95; // sec between satellite shots
    this.damage = 18;
    this.range = 380;
  }

  update(dt, planetX, planetY, shieldRadius, aliens, torpedoes, onFireCallback) {
    const orbitSpeed = 0.65 + this.index * 0.12;
    this.angle += orbitSpeed * dt;

    const orbitR = shieldRadius + 24 + this.index * 9;
    this.x = planetX + Math.cos(this.angle) * orbitR;
    this.y = planetY + Math.sin(this.angle) * orbitR;

    this.fireTimer -= dt;

    if (this.fireTimer <= 0) {
      // Find nearest threat (prioritize torpedoes heading to planet, then nearest alien)
      let target = null;
      let closestDist = this.range;

      // 1. Check Torpedoes
      for (const torp of torpedoes) {
        if (!torp.alive) continue;
        const d = Math.hypot(torp.x - this.x, torp.y - this.y);
        if (d < closestDist) {
          closestDist = d;
          target = torp;
        }
      }

      // 2. Check Aliens
      if (!target) {
        for (const alien of aliens) {
          if (!alien.alive) continue;
          const d = Math.hypot(alien.x - this.x, alien.y - this.y);
          if (d < closestDist) {
            closestDist = d;
            target = alien;
          }
        }
      }

      if (target) {
        this.fireTimer = this.fireInterval;
        const aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        if (onFireCallback) {
          onFireCallback(this.x, this.y, target.x, target.y, aimAngle, this.damage);
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    // Satellite Core
    ctx.beginPath();
    ctx.rect(-5, -5, 10, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Green Solar Panels
    ctx.fillStyle = '#00e676';
    ctx.fillRect(-14, -2.5, 7, 5);
    ctx.fillRect(7, -2.5, 7, 5);

    // Flashing Core Sensor
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }
}
