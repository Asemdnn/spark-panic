// Spark Panic 2.1 - Sector Environmental Hazards (4 Distinct Cosmic Biomes)

export class HazardManager {
  constructor() {
    this.sector = 1;
    this.planetRadius = 75;

    // Sector 1: Drifting Asteroids
    this.asteroids = [];
    this.asteroidTimer = 9.0;

    // Sector 2: Ionized Nebula Storm Clouds
    this.nebulaClouds = [];

    // Sector 3: Gravity Well Singularity
    this.gravityWell = null;

    // Sector 4: Solar Corona Eruptions
    this.solarFlareTimer = 14.0;
    this.activeSolarFlare = null;
  }

  get singularity() {
    return this.gravityWell;
  }

  reset(sector = 1, planetX = 400, planetY = 300, planetRadius = 75) {
    this.initSector(sector, planetX, planetY, planetRadius);
  }

  initSector(sector, planetX, planetY, planetRadius) {
    this.sector = sector;
    this.planetRadius = planetRadius || 75;

    // Reset all hazards
    this.asteroids = [];
    this.asteroidTimer = 6.0; // First asteroid arrives in 6s

    // Sector 2: 2 drifting ionized clouds
    if (sector === 2) {
      this.nebulaClouds = [
        { angle: 0.8, dist: this.planetRadius + 140, radius: 90, speed: 0.18, color: '#e040fb', x: 0, y: 0 },
        { angle: 3.5, dist: this.planetRadius + 160, radius: 105, speed: -0.14, color: '#00e5ff', x: 0, y: 0 }
      ];
      this.updateClouds(planetX, planetY);
    } else {
      this.nebulaClouds = [];
    }

    // Sector 3: Gravity Well Singularity
    if (sector === 3) {
      this.gravityWell = {
        angle: 1.2,
        dist: this.planetRadius + 190,
        pullRadius: 260,
        pullForce: 42,
        rotation: 0,
        x: 0,
        y: 0
      };
      this.updateGravityWell(planetX, planetY);
    } else {
      this.gravityWell = null;
    }

    // Sector 4: Solar Flare Pulse
    this.solarFlareTimer = 14.0;
    this.activeSolarFlare = null;
  }

  updateClouds(planetX, planetY) {
    for (const c of this.nebulaClouds) {
      c.x = planetX + Math.cos(c.angle) * c.dist;
      c.y = planetY + Math.sin(c.angle) * c.dist;
    }
  }

  updateGravityWell(planetX, planetY) {
    if (!this.gravityWell) return;
    this.gravityWell.x = planetX + Math.cos(this.gravityWell.angle) * this.gravityWell.dist;
    this.gravityWell.y = planetY + Math.sin(this.gravityWell.angle) * this.gravityWell.dist;
  }

  getHazardInfo() {
    switch (this.sector) {
      case 1:
        return { name: 'ASTEROID DRIFT', icon: '☄️', desc: 'Shoot drifting asteroids for +15 Shards & kinetic shockwaves' };
      case 2:
        return { name: 'ION NEBULA', icon: '⚡', desc: 'Novas inside Ion Clouds gain +35% radius & +25% damage' };
      case 3:
        return { name: 'GRAVITY ANOMALY', icon: '🌀', desc: 'Singularity clusters invaders into high-value combo targets' };
      case 4:
        return { name: 'SOLAR CORONA', icon: '☀️', desc: 'Periodic Solar Flares scorch point-blank invaders & grant +15% Nova energy' };
      default:
        return { name: 'COSMIC DEFENSE', icon: '🛡️', desc: 'Active defense grid' };
    }
  }

  update(dt, planetX, planetY, planetRadius, aliens, onAsteroidShatter, onSolarFlarePulse) {
    this.planetRadius = planetRadius;

    // 1. Sector I: Asteroid Drift
    if (this.sector === 1) {
      this.asteroidTimer -= dt;
      if (this.asteroidTimer <= 0) {
        this.asteroidTimer = 9.0 + Math.random() * 3.0; // every 9-12s
        const angle = Math.random() * Math.PI * 2;
        const dist = planetRadius + 180 + Math.random() * 80;
        const speed = 28 + Math.random() * 18;
        const driftAngle = angle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.4;

        this.asteroids.push({
          x: planetX + Math.cos(angle) * dist,
          y: planetY + Math.sin(angle) * dist,
          vx: Math.cos(driftAngle) * speed,
          vy: Math.sin(driftAngle) * speed,
          radius: 17 + Math.random() * 5,
          hp: 20,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 1.5,
          alive: true
        });
      }

      // Update asteroids
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const ast = this.asteroids[i];
        ast.x += ast.vx * dt;
        ast.y += ast.vy * dt;
        ast.rotation += ast.rotSpeed * dt;

        // Despawn if drifted too far
        const distToPlanet = Math.hypot(ast.x - planetX, ast.y - planetY);
        if (distToPlanet > Math.max(planetX, planetY) * 1.8) {
          this.asteroids.splice(i, 1);
        }
      }
    }

    // 2. Sector II: Ionized Nebula Storm Clouds
    if (this.sector === 2) {
      for (const c of this.nebulaClouds) {
        c.angle += c.speed * dt;
      }
      this.updateClouds(planetX, planetY);
    }

    // 3. Sector III: Gravity Well Anomaly
    if (this.sector === 3 && this.gravityWell) {
      this.gravityWell.rotation += dt * 1.6;
      this.gravityWell.angle += dt * 0.08;
      this.updateGravityWell(planetX, planetY);

      const gw = this.gravityWell;
      for (const alien of aliens) {
        if (!alien.alive) continue;
        const dx = gw.x - alien.x;
        const dy = gw.y - alien.y;
        const dist = Math.hypot(dx, dy);

        if (dist < gw.pullRadius && dist > 15) {
          const force = (1 - (dist / gw.pullRadius)) * gw.pullForce * dt;
          alien.x += (dx / dist) * force;
          alien.y += (dy / dist) * force;
        }
      }
    }

    // 4. Sector IV: Solar Corona Eruption
    if (this.sector === 4) {
      this.solarFlareTimer -= dt;
      if (this.solarFlareTimer <= 0) {
        this.solarFlareTimer = 14.0;
        const maxFlareRadius = planetRadius + 75;
        this.activeSolarFlare = {
          radius: planetRadius,
          maxRadius: maxFlareRadius,
          alpha: 1.0
        };

        if (onSolarFlarePulse) {
          onSolarFlarePulse(planetX, planetY, maxFlareRadius);
        }
      }

      // Update active solar flare
      if (this.activeSolarFlare) {
        const flare = this.activeSolarFlare;
        flare.radius += dt * 260;
        flare.alpha = Math.max(0, 1 - (flare.radius - planetRadius) / (flare.maxRadius - planetRadius));
        if (flare.radius >= flare.maxRadius) {
          this.activeSolarFlare = null;
        }
      }
    }
  }

  // Check if a point is inside an Ion Nebula Cloud (for supercharged Novas)
  isInsideNebula(x, y) {
    if (this.sector !== 2) return false;
    for (const c of this.nebulaClouds) {
      if (Math.hypot(x - c.x, y - c.y) <= c.radius) {
        return true;
      }
    }
    return false;
  }

  // Check collision of player laser or nova with asteroids
  checkHitAsteroids(x, y, radius, damage = 20, onShatterCallback) {
    if (this.sector !== 1) return false;
    let hitAny = false;

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      if (!ast.alive) continue;
      const d = Math.hypot(ast.x - x, ast.y - y);
      if (d <= ast.radius + radius) {
        ast.hp -= damage;
        hitAny = true;
        if (ast.hp <= 0) {
          ast.alive = false;
          this.asteroids.splice(i, 1);
          if (onShatterCallback) {
            onShatterCallback(ast.x, ast.y);
          }
        }
        break;
      }
    }
    return hitAny;
  }

  render(ctx, planetX, planetY) {
    // 1. Render Sector II: Ionized Nebula Storm Clouds (drawn behind ships)
    if (this.sector === 2) {
      for (const c of this.nebulaClouds) {
        ctx.save();
        const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.1, c.x, c.y, c.radius);
        grad.addColorStop(0, c.color === '#e040fb' ? 'rgba(224, 64, 251, 0.28)' : 'rgba(0, 229, 255, 0.28)');
        grad.addColorStop(0.6, c.color === '#e040fb' ? 'rgba(168, 85, 247, 0.14)' : 'rgba(14, 165, 233, 0.14)');
        grad.addColorStop(1, 'rgba(5, 8, 20, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle electric lightning arc inside cloud
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.45 + Math.sin(Date.now() * 0.008) * 0.3;
        ctx.beginPath();
        const segs = 5;
        let lx = c.x - c.radius * 0.5;
        let ly = c.y;
        ctx.moveTo(lx, ly);
        for (let s = 1; s <= segs; s++) {
          lx += (c.radius / segs);
          ly += (Math.random() - 0.5) * 22;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Render Sector III: Gravity Well Singularity
    if (this.sector === 3 && this.gravityWell) {
      const gw = this.gravityWell;
      ctx.save();
      ctx.translate(gw.x, gw.y);
      ctx.rotate(gw.rotation);

      // Outer gravity pull boundary
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, gw.pullRadius * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Swirling purple-gold spiral arms
      for (let arm = 0; arm < 3; arm++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let a = 0; a < Math.PI * 1.5; a += 0.2) {
          const r = a * 14;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.strokeStyle = arm === 0 ? '#ffd700' : '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Event horizon core
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#050814';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 3. Render Sector I: Drifting Asteroids
    if (this.sector === 1) {
      for (const ast of this.asteroids) {
        if (!ast.alive) continue;
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rotation);

        ctx.beginPath();
        const r = ast.radius;
        const pts = 7;
        for (let p = 0; p < pts; p++) {
          const ang = (p / pts) * Math.PI * 2;
          const dist = r * (0.8 + 0.3 * Math.sin(p * 2.5));
          const px = Math.cos(ang) * dist;
          const py = Math.sin(ang) * dist;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        // Shading
        const aGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        aGrad.addColorStop(0, '#64748b');
        aGrad.addColorStop(0.7, '#334155');
        aGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = aGrad;
        ctx.fill();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small crater details
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.arc(-r * 0.2, r * 0.2, r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // 4. Render Sector IV: Solar Corona Flare
    if (this.sector === 4 && this.activeSolarFlare) {
      const flare = this.activeSolarFlare;
      ctx.save();
      ctx.beginPath();
      ctx.arc(planetX, planetY, flare.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(254, 240, 138, ${flare.alpha * 0.85})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 24;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(planetX, planetY, flare.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(234, 88, 12, ${flare.alpha * 0.55})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    }
  }
}
