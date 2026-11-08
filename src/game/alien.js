// Spark Panic 2.0 - Invading Alien Armada Entities (7 Classes)

import { ALIEN_CLASSES } from '../config.js';

export class Alien {
  constructor(x, y, classKey, bossCustomName = null) {
    this.x = x;
    this.y = y;
    this.classKey = classKey;
    const cfg = ALIEN_CLASSES[classKey] || ALIEN_CLASSES.SCOUT;

    this.name = bossCustomName || cfg.name;
    this.color = cfg.color;
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.speed = cfg.speed;
    this.radius = cfg.radius;
    this.score = cfg.score;
    this.damage = cfg.damage;
    this.novaRadius = cfg.novaRadius;

    this.alive = true;
    this.frozenTimer = 0;
    this.slowTimer = 0;
    this.speedMultiplier = 1.0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.heading = 0;

    // Boss Multi-Phase Overdrive Mechanics
    this.isBoss = (classKey === 'BOSS');
    this.phase = 1;
    this.isPhase2 = false;
    this.shieldAngle = 0;
    this.shieldHitFlash = 0;

    // v2.9 Multi-Part Destructible Boss Sub-Systems
    if (this.isBoss) {
      const subHp = Math.round(this.maxHp * 0.30);
      this.subsystems = [
        {
          id: 'portTorpedoBattery',
          name: 'Port Torpedo Battery',
          shortName: 'WPN',
          type: 'weapons',
          angleOffset: Math.PI * 0.5,
          dist: this.radius + 18,
          radius: 14,
          hp: subHp,
          maxHp: subHp,
          alive: true,
          destroyed: false,
          hitFlash: 0,
          color: '#ff1744',
          x: x,
          y: y
        },
        {
          id: 'starboardDroneHangar',
          name: 'Starboard Drone Hangar',
          shortName: 'HGR',
          type: 'hangar',
          angleOffset: -Math.PI * 0.5,
          dist: this.radius + 18,
          radius: 14,
          hp: subHp,
          maxHp: subHp,
          alive: true,
          destroyed: false,
          hitFlash: 0,
          color: '#c084fc',
          x: x,
          y: y
        }
      ];
      this.coreExposed = false;
    } else {
      this.subsystems = [];
      this.coreExposed = false;
    }

    // v2.8 Reactor Weak-Spot for Capital and Elite Ships (Boss, Dreadnought, Dropship, Weaver)
    this.hasWeakSpot = ['BOSS', 'DREADNOUGHT', 'DROPSHIP', 'WEAVER'].includes(classKey);
    this.weakSpotRadius = (classKey === 'BOSS') ? 14 : (classKey === 'DREADNOUGHT' ? 12 : 10);
    this.weakSpotAngle = Math.random() * Math.PI * 2;
    this.weakSpotExposedTimer = 0;
    this.lastHitWasCrit = false;

    // v2.8 Leech Pod & Warp Ambush Beacon states
    this.isLeech = (classKey === 'LEECH');
    this.isBeacon = (classKey === 'BEACON');
    this.targetCityIndex = Math.floor(Math.random() * 4);
    this.latched = false;
    this.leechDps = 2.5;
    this.beaconTimer = (classKey === 'BEACON') ? 12.0 : 0;
    this.beaconTriggered = false;

    // Class specific AI timers
    this.torpedoTimer = 1.5 + Math.random() * 2.0;
    this.blinkTimer = 3.4;
    this.spawnTimer = 3.5;
    this.escapeTimer = (classKey === 'GALLEON') ? 9.0 : 0;
    this.orbitDistance = (classKey === 'BEACON') ? 260 : (200 + Math.random() * 80);
    this.orbitAngle = Math.atan2(y, x);
  }

  freeze(duration = 4.5) {
    this.frozenTimer = Math.max(this.frozenTimer, duration);
  }

  damageSubsystem(subId, amount, engine = null) {
    if (!this.subsystems) return false;
    const sub = this.subsystems.find(s => s.id === subId);
    if (!sub || !sub.alive) return false;

    sub.hp -= amount;
    sub.hitFlash = 0.22;

    if (sub.hp <= 0) {
      sub.alive = false;
      sub.destroyed = true;
      sub.hp = 0;

      // 12% bonus bleed damage to Boss hull
      const bleedDmg = Math.round(this.maxHp * 0.12);
      this.hp = Math.max(0, this.hp - bleedDmg);

      if (engine) {
        // Massive 110px chain Nova explosion
        engine.particles.spawnNova(sub.x, sub.y, 110, sub.color, 65, true);
        engine.particles.spawnDebris(sub.x, sub.y, sub.color, 16);
        engine.addScreenShake(10, 0.25);

        if (sub.type === 'weapons') {
          engine.particles.addFloater(sub.x, sub.y - 25, '💥 BOSS WEAPONS CRIPPLED! (-65% TORPEDOES)', '#ff1744', 18);
        } else if (sub.type === 'hangar') {
          engine.particles.addFloater(sub.x, sub.y - 25, '💥 BOSS HANGAR DESTROYED! (NO MORE REINFORCEMENTS)', '#c084fc', 18);
          // Drops 2 instant Orbital Supply Pods
          if (engine.supplyPods) {
            engine.supplyPods.spawnPod(sub.x - 24, sub.y, this.radius);
            engine.supplyPods.spawnPod(sub.x + 24, sub.y, this.radius);
          }
        }

        // Check if both subsystems are destroyed -> Core Exposed Mode!
        const allDestroyed = this.subsystems.every(s => !s.alive);
        if (allDestroyed && !this.coreExposed) {
          this.coreExposed = true;
          engine.particles.addFloater(this.x, this.y - 50, '💥 ARMOR STRIPPED — +50% CORE DAMAGE!', '#ffd700', 24);
          engine.addScreenShake(14, 0.35);
        }
      }
      return true; // Subsystem was destroyed
    }
    return false;
  }

  takeDamage(amount, hitX = null, hitY = null, isDirectPierce = false, onBossPhase2 = null, canTriggerCrit = false) {
    if (!this.alive) return false;

    this.lastHitWasCrit = false;

    // v2.9 Absolute Zero Shatter-Core (+50% critical damage to chilled/stasis enemies)
    if ((this.frozenTimer > 0 || this.slowTimer > 0) && this.engine?.hasPerk && this.engine.hasPerk('absoluteZeroShatterCore')) {
      amount *= 1.5;
    }

    // v2.9 Boss Core Exposed Mode (+50% bonus damage when both subsystems destroyed)
    if (this.isBoss && this.coreExposed) {
      amount *= 1.5;
    }

    // Check Reactor Weak-Spot Hit (from Overcharge Lance or Reflected Parry)
    if (this.hasWeakSpot && canTriggerCrit) {
      let isWeakSpotHit = false;
      if (hitX !== null && hitY !== null) {
        const wsDist = this.radius * 0.85;
        const wsX = this.x + Math.cos(this.heading + this.weakSpotAngle) * wsDist;
        const wsY = this.y + Math.sin(this.heading + this.weakSpotAngle) * wsDist;
        const d = Math.hypot(hitX - wsX, hitY - wsY);
        if (d <= this.weakSpotRadius + 8) {
          isWeakSpotHit = true;
        }
      } else {
        isWeakSpotHit = true;
      }
      if (isWeakSpotHit) {
        this.lastHitWasCrit = true;
        amount *= 2.5; // 💥 CRITICAL BREACH! x2.5
        this.freeze(1.5); // 1.5s EMP Stun
      }
    }

    // Boss Phase 2 Rotating Directional Shield Arc deflection (50% reduction for standard turret fire)
    if (this.isBoss && this.isPhase2 && !isDirectPierce && hitX !== null && hitY !== null) {
      const hitAngle = Math.atan2(hitY - this.y, hitX - this.x);
      let diff = Math.abs(hitAngle - this.shieldAngle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      const halfArc = (110 * Math.PI) / 360; // 55° (110° total arc)
      if (diff <= halfArc) {
        amount *= 0.5; // Deflected by 50%
        this.shieldHitFlash = 0.22;
      }
    }

    // Aegis Jammer Frigate: Curved 90° Frontal Energy Barrier ricochets standard lasers
    if (this.classKey === 'JAMMER' && !isDirectPierce && hitX !== null && hitY !== null) {
      const hitAngle = Math.atan2(hitY - this.y, hitX - this.x);
      let diff = Math.abs(hitAngle - this.heading);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (diff <= Math.PI * 0.25) { // 45° either side of heading = 90° frontal arc
        this.shieldHitFlash = 0.22;
        return false; // Ricochet harmlessly!
      }
    }

    this.hp -= amount;

    // Multi-Phase Boss Enrage: Enters Phase 2 at <= 50% HP
    if (this.isBoss && !this.isPhase2 && this.hp <= this.maxHp * 0.5 && this.hp > 0) {
      this.isPhase2 = true;
      this.phase = 2;
      if (onBossPhase2) {
        onBossPhase2(this);
      }
    }

    if (this.hp <= 0) {
      this.alive = false;
      return true; // Destroyed
    }
    return false;
  }

  update(dt, planetX, planetY, shieldRadius, spawnDropshipScoutCallback, fireTorpedoCallback, planet = null) {
    if (!this.alive) return;

    this.pulsePhase += dt * 4;

    // v2.8 Weak-Spot rotation & exposure cooldown
    if (this.hasWeakSpot) {
      this.weakSpotAngle += dt * 1.5;
      if (this.weakSpotExposedTimer > 0) this.weakSpotExposedTimer -= dt;
    }

    // v2.9 Boss Sub-Systems coordinate updates
    if (this.subsystems && this.subsystems.length > 0) {
      for (const sub of this.subsystems) {
        if (sub.hitFlash > 0) sub.hitFlash -= dt;
        sub.x = this.x + Math.cos(this.heading + sub.angleOffset) * sub.dist;
        sub.y = this.y + Math.sin(this.heading + sub.angleOffset) * sub.dist;
      }
    }

    if (this.isBoss && this.isPhase2) {
      this.shieldAngle += dt * 1.8;
      if (this.shieldHitFlash > 0) this.shieldHitFlash -= dt;
    } else if (this.classKey === 'JAMMER') {
      if (this.shieldHitFlash > 0) this.shieldHitFlash -= dt;
    }

    let speedMult = 1.0;
    if (this.frozenTimer > 0) {
      this.frozenTimer -= dt;
      speedMult = 0.25; // 75% slowed
    }
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      speedMult = Math.min(speedMult, this.speedMultiplier || 0.5);
    }

    const distToPlanet = Math.hypot(planetX - this.x, planetY - this.y);
    const angleToPlanet = Math.atan2(planetY - this.y, planetX - this.x);

    // AI Behaviors by Alien Class
    if (this.classKey === 'SCOUT') {
      // Inward Spiral Ramming Attack
      this.heading = angleToPlanet + 0.35 * Math.sin(this.pulsePhase);
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
    } else if (this.classKey === 'INTERCEPTOR') {
      // Mid-Range Orbit & Torpedo Firing
      if (distToPlanet > this.orbitDistance) {
        this.heading = angleToPlanet;
        this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
        this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
      } else {
        // Orbiting around planet
        this.orbitAngle += (this.speed / this.orbitDistance) * speedMult * dt;
        this.x = planetX + Math.cos(this.orbitAngle) * this.orbitDistance;
        this.y = planetY + Math.sin(this.orbitAngle) * this.orbitDistance;
        this.heading = angleToPlanet;
      }

      this.torpedoTimer -= dt * speedMult;
      if (this.torpedoTimer <= 0) {
        this.torpedoTimer = 3.6 + Math.random() * 1.5;
        if (fireTorpedoCallback) {
          fireTorpedoCallback(this.x, this.y, angleToPlanet, 180, 10, '#e040fb');
        }
      }
    } else if (this.classKey === 'CRYO') {
      // Steady Diamond Advance
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
    } else if (this.classKey === 'PHASE') {
      // Quantum Blink Advance
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.blinkTimer -= dt * speedMult;
      if (this.blinkTimer <= 0) {
        this.blinkTimer = 3.4;
        // Blink 48px closer to planet
        this.x += Math.cos(angleToPlanet) * 48;
        this.y += Math.sin(angleToPlanet) * 48;
      }
    } else if (this.classKey === 'DROPSHIP') {
      // Heavy Lander marching straight, spawning mini scouts / leech pods
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.spawnTimer -= dt * speedMult;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 4.5;
        this.weakSpotExposedTimer = 2.5; // Expose reactor after spawn
        if (spawnDropshipScoutCallback) {
          spawnDropshipScoutCallback(this.x, this.y);
        }
      }
    } else if (this.classKey === 'DREADNOUGHT') {
      // Heavy Battleship with Torpedo Launcher
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.torpedoTimer -= dt * speedMult;
      if (this.torpedoTimer <= 0) {
        this.torpedoTimer = 4.2;
        this.weakSpotExposedTimer = 2.5; // Expose reactor after salvo
        if (fireTorpedoCallback) {
          fireTorpedoCallback(this.x, this.y, angleToPlanet, 160, 20, '#ffd700');
        }
      }
    } else if (this.classKey === 'BOSS') {
      // Sector Mothership with 2 Destructible Sub-Systems
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;

      this.torpedoTimer -= dt * speedMult;
      if (this.torpedoTimer <= 0) {
        this.torpedoTimer = 3.5;
        this.weakSpotExposedTimer = 2.5; // Expose reactor after salvo
        if (fireTorpedoCallback) {
          const wpnBattery = this.subsystems?.find(s => s.type === 'weapons');
          const isWpnIntact = !wpnBattery || wpnBattery.alive;
          if (isWpnIntact) {
            // Full 3-torpedo barrage
            fireTorpedoCallback(this.x, this.y, angleToPlanet - 0.22, 175, 18, '#ff1744');
            fireTorpedoCallback(this.x, this.y, angleToPlanet, 190, 22, '#ff1744');
            fireTorpedoCallback(this.x, this.y, angleToPlanet + 0.22, 175, 18, '#ff1744');
          } else {
            // Crippled: only 1 torpedo (-65% firepower)
            fireTorpedoCallback(this.x, this.y, angleToPlanet, 180, 18, '#ff1744');
          }
        }
      }

      // Minion escort & leech deployment (disabled if Drone Hangar is destroyed)
      this.spawnTimer -= dt * speedMult;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 6.0;
        const hangar = this.subsystems?.find(s => s.type === 'hangar');
        const isHangarIntact = !hangar || hangar.alive;
        if (isHangarIntact && spawnDropshipScoutCallback) {
          spawnDropshipScoutCallback(this.x, this.y);
        }
      }
    } else if (this.classKey === 'JAMMER') {
      // Forward Advance pointing Frontal Barrier directly at planet
      this.heading = angleToPlanet;
      this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
      this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
    } else if (this.classKey === 'WEAVER') {
      // Mid-Range Orbit & Graviton Web Tether
      if (distToPlanet > this.orbitDistance) {
        this.heading = angleToPlanet;
        this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
        this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
      } else {
        this.orbitAngle += (this.speed / this.orbitDistance) * speedMult * dt;
        this.x = planetX + Math.cos(this.orbitAngle) * this.orbitDistance;
        this.y = planetY + Math.sin(this.orbitAngle) * this.orbitDistance;
        this.heading = angleToPlanet;
      }
    } else if (this.classKey === 'GALLEON') {
      // Fast Tangential Outer Orbit & 9-second escape timer
      this.escapeTimer -= dt * speedMult;
      if (this.escapeTimer <= 0) {
        this.alive = false;
        this.escaped = true;
      }
      const tangentAngle = angleToPlanet + Math.PI * 0.52;
      this.heading = tangentAngle;
      this.x += Math.cos(tangentAngle) * (this.speed * speedMult) * dt;
      this.y += Math.sin(tangentAngle) * (this.speed * speedMult) * dt;
    } else if (this.classKey === 'LEECH') {
      // v2.8 Surface City Infiltrator: Bypasses shields, latches onto surface city, drains Core HP directly
      const planetRot = planet ? (planet.rotation || 0) : 0;
      const cityAngle = (this.targetCityIndex * Math.PI * 0.5) + planetRot;
      const planetR = planet ? (planet.planetRadius || 75) : 75;
      const targetX = planetX + Math.cos(cityAngle) * planetR;
      const targetY = planetY + Math.sin(cityAngle) * planetR;

      if (!this.latched) {
        const dCity = Math.hypot(targetX - this.x, targetY - this.y);
        this.heading = Math.atan2(targetY - this.y, targetX - this.x);
        if (dCity <= 12) {
          this.latched = true;
          this.x = targetX;
          this.y = targetY;
        } else {
          this.x += Math.cos(this.heading) * (this.speed * speedMult) * dt;
          this.y += Math.sin(this.heading) * (this.speed * speedMult) * dt;
        }
      } else {
        // Latched onto city: stick to rotating city coordinate and siphon 2.5 Core HP/sec
        this.x = targetX;
        this.y = targetY;
        this.heading = cityAngle;
        if (planet && planet.coreHp !== undefined) {
          planet.coreHp = Math.max(0, planet.coreHp - this.leechDps * dt);
        }
      }
    } else if (this.classKey === 'BEACON') {
      // v2.8 Warp Ambush Beacon: Slow outer orbit with 12s countdown
      this.beaconTimer -= dt;
      if (this.beaconTimer <= 0) {
        this.alive = false;
        this.escaped = true; // Despawns peacefully if unattacked
      }
      this.orbitAngle += (this.speed / (this.orbitDistance || 260)) * dt;
      this.x = planetX + Math.cos(this.orbitAngle) * (this.orbitDistance || 260);
      this.y = planetY + Math.sin(this.orbitAngle) * (this.orbitDistance || 260);
      this.heading = this.orbitAngle + Math.PI * 0.5;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    const r = this.radius;

    // Stasis Freeze Indicator
    if (this.frozenTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 230, 118, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Class Specific Ship Hull Drawing
    if (this.classKey === 'SCOUT') {
      // Delta-Wing Dart Fighter
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(-r * 0.9, -r * 0.85);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r * 0.9, r * 0.85);
      ctx.closePath();
      ctx.fillStyle = '#0a1d37';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing Cockpit
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    } else if (this.classKey === 'INTERCEPTOR') {
      // Trident 3-Prong Warship
      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0);
      ctx.lineTo(r * 0.2, -r * 1.1);
      ctx.lineTo(-r * 0.8, -r * 0.6);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.lineTo(r * 0.2, r * 1.1);
      ctx.closePath();
      ctx.fillStyle = '#2d0628';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Core plasma orb
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'CRYO') {
      // Hexagonal Stasis Cruiser
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const px = Math.cos(ang) * (r * 1.15);
        const py = Math.sin(ang) * (r * 1.15);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#062d1f';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Frost Crystal Core
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0);
      ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.classKey === 'PHASE') {
      // Diamond Quantum Vessel
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(0, -r * 0.9);
      ctx.lineTo(-r * 1.1, 0);
      ctx.lineTo(0, r * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#220835';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Pulsing phase ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'DROPSHIP') {
      // Heavy Armored Lander
      ctx.beginPath();
      ctx.rect(-r * 1.0, -r * 0.8, r * 2.0, r * 1.6);
      ctx.fillStyle = '#300814';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // Dual side engines
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(-r * 1.1, -r * 0.9, r * 0.4, r * 0.35);
      ctx.fillRect(-r * 1.1, r * 0.55, r * 0.4, r * 0.35);
    } else if (this.classKey === 'DREADNOUGHT') {
      // Solar Dreadnought Flagship
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(r * 0.6, -r * 1.1);
      ctx.lineTo(-r * 1.2, -r * 0.8);
      ctx.lineTo(-r * 0.7, 0);
      ctx.lineTo(-r * 1.2, r * 0.8);
      ctx.lineTo(r * 0.6, r * 1.1);
      ctx.closePath();
      ctx.fillStyle = '#352504';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Heavy Core Reactor
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'BOSS') {
      // Sector Mothership Apex Flagship
      ctx.beginPath();
      ctx.moveTo(r * 1.8, 0);
      ctx.lineTo(r * 0.8, -r * 1.2);
      ctx.lineTo(-r * 1.4, -r * 1.0);
      ctx.lineTo(-r * 0.8, 0);
      ctx.lineTo(-r * 1.4, r * 1.0);
      ctx.lineTo(r * 0.8, r * 1.2);
      ctx.closePath();
      ctx.fillStyle = '#3a0814';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Heavy Boss Core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#ff1744';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.classKey === 'JAMMER') {
      // Aegis Jammer Frigate: Armored Hull with Curved 90° Frontal Energy Barrier
      ctx.beginPath();
      ctx.moveTo(r * 1.3, 0);
      ctx.lineTo(r * 0.4, -r * 0.95);
      ctx.lineTo(-r * 0.9, -r * 0.7);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r * 0.9, r * 0.7);
      ctx.lineTo(r * 0.4, r * 0.95);
      ctx.closePath();
      ctx.fillStyle = '#06202c';
      ctx.fill();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Crimson reinforced central armor
      ctx.beginPath();
      ctx.moveTo(r * 0.6, 0);
      ctx.lineTo(0, -r * 0.45);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(0, r * 0.45);
      ctx.closePath();
      ctx.fillStyle = '#ff1744';
      ctx.fill();

      // Curved 90° Frontal Energy Barrier (Facing +X / Heading toward planet)
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 1.15, -Math.PI * 0.25, Math.PI * 0.25);
      ctx.strokeStyle = this.shieldHitFlash > 0 ? '#ffffff' : '#00e5ff';
      ctx.lineWidth = this.shieldHitFlash > 0 ? 4.2 : 2.6;
      ctx.shadowColor = this.shieldHitFlash > 0 ? '#ffffff' : '#00e5ff';
      ctx.shadowBlur = this.shieldHitFlash > 0 ? 18 : 9;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (this.classKey === 'WEAVER') {
      // Void Weaver Carrier: Twin Catamaran Hulls with Graviton Matrix
      ctx.fillStyle = '#220835';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.0;

      // Twin hulls
      ctx.beginPath();
      ctx.rect(-r * 0.9, -r * 0.95, r * 1.8, r * 0.45);
      ctx.rect(-r * 0.9, r * 0.50, r * 1.8, r * 0.45);
      ctx.fill();
      ctx.stroke();

      // Connecting bridge
      ctx.fillRect(-r * 0.2, -r * 0.55, r * 0.4, r * 1.1);
      ctx.strokeRect(-r * 0.2, -r * 0.55, r * 0.4, r * 1.1);

      // Glowing Graviton Core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = '#f0abfc';
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.classKey === 'GALLEON') {
      // Astral Treasure Galleon: Gilded Hull, Solar Sails & Treasure Core
      ctx.beginPath();
      ctx.moveTo(r * 1.5, 0);
      ctx.lineTo(-r * 0.5, -r * 1.4);
      ctx.lineTo(-r * 0.2, 0);
      ctx.lineTo(-r * 0.5, r * 1.4);
      ctx.closePath();
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Gilded Hull
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.8, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Astral Core
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.classKey === 'LEECH') {
      // v2.8 Invasion Leech Pod: Spider-drone hull with 4 animated legs and red ocular core
      ctx.fillStyle = '#2d0536';
      ctx.strokeStyle = '#d946ef';
      ctx.lineWidth = 2.2;

      // 4 animated spider legs
      const legPhase = Math.sin(this.pulsePhase * 3);
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.6); ctx.lineTo(-r * 1.1, -r * 1.2 + legPhase * 2); ctx.lineTo(-r * 1.4, -r * 0.8);
      ctx.moveTo(r * 0.4, -r * 0.6); ctx.lineTo(r * 1.1, -r * 1.2 - legPhase * 2); ctx.lineTo(r * 1.4, -r * 0.8);
      ctx.moveTo(-r * 0.4, r * 0.6); ctx.lineTo(-r * 1.1, r * 1.2 - legPhase * 2); ctx.lineTo(-r * 1.4, r * 0.8);
      ctx.moveTo(r * 0.4, r * 0.6); ctx.lineTo(r * 1.1, r * 1.2 + legPhase * 2); ctx.lineTo(r * 1.4, r * 0.8);
      ctx.stroke();

      // Spider pod body
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.0, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pulsing red ocular core
      ctx.beginPath();
      ctx.arc(r * 0.35, 0, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = this.latched ? '#ff1744' : '#e879f9';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Hot center
      ctx.beginPath();
      ctx.arc(r * 0.35, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Latched siphon tether to planet
      if (this.latched) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-r * 1.8, 0);
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (this.classKey === 'BEACON') {
      // v2.8 Warp Ambush Beacon: Neon purple halo, resonance rings, and 12s countdown timer
      const haloPulse = 1.0 + Math.sin(this.pulsePhase * 2) * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.8 * haloPulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Diamond Beacon Core
      ctx.beginPath();
      ctx.moveTo(r * 1.2, 0);
      ctx.lineTo(0, -r * 1.2);
      ctx.lineTo(-r * 1.2, 0);
      ctx.lineTo(0, r * 1.2);
      ctx.closePath();
      ctx.fillStyle = '#2a0845';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center resonant orb
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e879f9';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Countdown prompt text above beacon
      ctx.save();
      ctx.rotate(-this.heading); // Keep text horizontal
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      const timeLeft = Math.max(0, this.beaconTimer).toFixed(1);
      ctx.fillText(`⚠️ AMBUSH: ${timeLeft}s`, 0, -r - 12);
      ctx.restore();
    }

    // Glowing Enemy Reactor Core Weak-Spot (Boss, Dreadnought, Dropship, Weaver)
    if (this.hasWeakSpot) {
      const wsDist = this.radius * 0.85;
      const wsX = Math.cos(this.weakSpotAngle) * wsDist;
      const wsY = Math.sin(this.weakSpotAngle) * wsDist;
      const isExposed = this.weakSpotExposedTimer > 0;
      const wsR = this.weakSpotRadius * (isExposed ? 1.25 : 1.0);
      const wsPulse = 1.0 + Math.sin(this.pulsePhase * 3) * 0.2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(wsX, wsY, wsR * wsPulse, 0, Math.PI * 2);
      ctx.fillStyle = isExposed ? 'rgba(255, 23, 68, 0.9)' : 'rgba(255, 145, 0, 0.75)';
      ctx.shadowColor = isExposed ? '#ff1744' : '#ffd700';
      ctx.shadowBlur = isExposed ? 16 : 10;
      ctx.fill();

      // Hot center
      ctx.beginPath();
      ctx.arc(wsX, wsY, wsR * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Reticle dashed ring
      ctx.beginPath();
      ctx.arc(wsX, wsY, (wsR + 4) * wsPulse, 0, Math.PI * 2);
      ctx.strokeStyle = isExposed ? '#ff1744' : '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Health Bar for Heavy and Boss ships
    if (this.hp < this.maxHp && this.maxHp > 30 && this.classKey !== 'BOSS') {
      const barW = r * 2.2;
      const barH = 3.5;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-barW / 2, -r - 10, barW, barH);
      ctx.fillStyle = this.color;
      ctx.fillRect(-barW / 2, -r - 10, barW * pct, barH);
    }

    ctx.restore();

    // Phase 2 Rotating 110° Front Energy Shield Arc
    if (this.isBoss && this.isPhase2) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      const halfArc = (110 * Math.PI) / 360; // 55°
      ctx.arc(0, 0, r + 14, this.shieldAngle - halfArc, this.shieldAngle + halfArc);
      ctx.strokeStyle = this.shieldHitFlash > 0 ? '#ffffff' : '#ffd700';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Directional emitter nodes at arc ends
      const end1X = Math.cos(this.shieldAngle - halfArc) * (r + 14);
      const end1Y = Math.sin(this.shieldAngle - halfArc) * (r + 14);
      const end2X = Math.cos(this.shieldAngle + halfArc) * (r + 14);
      const end2Y = Math.sin(this.shieldAngle + halfArc) * (r + 14);
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(end1X, end1Y, 3, 0, Math.PI * 2);
      ctx.arc(end2X, end2Y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // v2.9 Destructible Boss Sub-Systems & Core Exposed Electrical Arcs
    if (this.isBoss && this.subsystems) {
      for (const sub of this.subsystems) {
        ctx.save();
        // Energy tether to boss center
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(sub.x, sub.y);
        ctx.strokeStyle = sub.alive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(100, 116, 139, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.translate(sub.x, sub.y);
        const subR = sub.radius || 14;

        if (sub.alive) {
          ctx.beginPath();
          ctx.arc(0, 0, subR, 0, Math.PI * 2);
          ctx.fillStyle = sub.hitFlash > 0 ? '#ffffff' : (sub.type === 'weapons' ? '#4a0812' : '#31063f');
          ctx.fill();
          ctx.strokeStyle = sub.hitFlash > 0 ? '#ffffff' : sub.color;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = sub.color;
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Inner icon / detail
          if (sub.type === 'weapons') {
            // Crimson Hex-turret with 3 barrels
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(0, 0, subR * 0.45, 0, Math.PI * 2);
            ctx.fill();
            for (let a = -0.4; a <= 0.4; a += 0.4) {
              const bx = Math.cos(this.heading + a) * (subR + 4);
              const by = Math.sin(this.heading + a) * (subR + 4);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(bx, by);
              ctx.strokeStyle = '#ff1744';
              ctx.lineWidth = 2.5;
              ctx.stroke();
            }
          } else {
            // Violet Hangar bay runway
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(-subR * 0.5, -2, subR, 4);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-subR * 0.5, -2, subR, 4);
          }

          // Mini HP ring
          const hpPct = Math.max(0, sub.hp / sub.maxHp);
          ctx.beginPath();
          ctx.arc(0, 0, subR + 4, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * hpPct);
          ctx.strokeStyle = sub.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Ruined smoking hull remnant
          ctx.beginPath();
          ctx.arc(0, 0, subR * 0.75, 0, Math.PI * 2);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // If Core Exposed, render crackling golden electrical arcs across the Mothership hull!
      if (this.coreExposed) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const arcAngle = (this.pulsePhase * 2 + i * Math.PI * 0.5);
          const r1 = r * 0.35;
          const r2 = r * 1.3;
          ctx.moveTo(Math.cos(arcAngle) * r1, Math.sin(arcAngle) * r1);
          ctx.lineTo(Math.cos(arcAngle + 0.3) * (r * 0.8), Math.sin(arcAngle + 0.3) * (r * 0.8));
          ctx.lineTo(Math.cos(arcAngle) * r2, Math.sin(arcAngle) * r2);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
