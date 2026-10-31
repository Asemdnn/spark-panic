// Spark Panic 2.0 - Active Tactical Planetary Skills System

import { audio } from '../engine/audio.js';

export class TacticalSkills {
  constructor() {
    this.baseCdQ = 9.0;
    this.baseCdW = 12.0;
    this.baseCdE = 14.0;

    this.timerQ = 0;
    this.timerW = 0;
    this.timerE = 0;

    // Active state
    this.ionBeamActive = false;
    this.ionBeamTimer = 0;
    this.ionBeamAngle = 0;

    this.empActive = false;
    this.empRadius = 0;
    this.empMaxRadius = 1200;
    this.empStunDuration = 3.0;

    this.overdriveActive = false;
    this.overdriveTimer = 0;
    this.overdriveDuration = 6.0;

    this.cdMultiplier = 1.0;
  }

  setCooldownReduction(level = 0) {
    this.cdMultiplier = Math.max(0.4, 1.0 - level * 0.12);
  }

  canUseQ() { return this.timerQ <= 0; }
  canUseW() { return this.timerW <= 0; }
  canUseE() { return this.timerE <= 0; }

  useSkillQ(aimAngle) {
    if (!this.canUseQ()) return false;
    this.timerQ = this.baseCdQ * this.cdMultiplier;
    this.ionBeamActive = true;
    this.ionBeamTimer = 0.75;
    this.ionBeamAngle = aimAngle;
    audio.playSkill('Q');
    return true;
  }

  useSkillW(planetX, planetY, cdMult = 1.0, stunDuration = 3.0) {
    if (!this.canUseW()) return false;
    this.timerW = this.baseCdW * this.cdMultiplier * cdMult;
    this.empActive = true;
    this.empRadius = 20;
    this.empOriginX = planetX;
    this.empOriginY = planetY;
    this.empStunDuration = stunDuration;
    audio.playSkill('W');
    return true;
  }

  useSkillE(planet, onGainNovaChargeCallback) {
    if (!this.canUseE()) return false;
    this.timerE = this.baseCdE * this.cdMultiplier;
    this.overdriveActive = true;
    this.overdriveTimer = this.overdriveDuration;

    // Restore 55% of max shield
    if (planet) {
      planet.restoreShield(Math.round(planet.maxShield * 0.55));
    }
    if (onGainNovaChargeCallback) {
      onGainNovaChargeCallback(1);
    }

    audio.playSkill('E');
    return true;
  }

  update(dt, turretAngle, planetX, planetY, aliens, torpedoes, novaMultiplier = 1, onScreenShake, planetRadius = 75) {
    // Cooldown timers
    if (this.timerQ > 0) this.timerQ = Math.max(0, this.timerQ - dt);
    if (this.timerW > 0) this.timerW = Math.max(0, this.timerW - dt);
    if (this.timerE > 0) this.timerE = Math.max(0, this.timerE - dt);

    // Overdrive duration
    if (this.overdriveActive) {
      this.overdriveTimer -= dt;
      if (this.overdriveTimer <= 0) {
        this.overdriveActive = false;
      }
    }

    // Skill Q: Orbital Ion Beam
    if (this.ionBeamActive) {
      this.ionBeamAngle = turretAngle;
      this.ionBeamTimer -= dt;
      if (onScreenShake) onScreenShake(4, 0.05);

      const originDist = (planetRadius || 75) + 10;
      const beamLength = 1400;
      const beamWidth = 24;
      const dps = 160 * novaMultiplier;
      const dmgThisFrame = dps * dt;

      // Check hits along beam ray starting from turret cannon tip
      for (const alien of aliens) {
        if (!alien.alive) continue;
        const dx = alien.x - planetX;
        const dy = alien.y - planetY;
        const dist = Math.hypot(dx, dy);

        // Project onto beam angle
        const alienAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(alienAngle - this.ionBeamAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

        const perpDist = dist * Math.sin(angleDiff);
        const parDist = dist * Math.cos(angleDiff);

        if (parDist >= originDist && parDist < (originDist + beamLength) && perpDist < (beamWidth / 2 + alien.radius)) {
          alien.takeDamage(dmgThisFrame, null, null, true);
        }
      }

      // Vaporize torpedoes in beam
      for (const torp of torpedoes) {
        if (!torp.alive) continue;
        const dx = torp.x - planetX;
        const dy = torp.y - planetY;
        const dist = Math.hypot(dx, dy);
        const torpAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(torpAngle - this.ionBeamAngle);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
        const parDist = dist * Math.cos(angleDiff);
        if (parDist >= originDist && dist * Math.sin(angleDiff) < (beamWidth / 2 + torp.radius)) {
          torp.alive = false;
        }
      }

      if (this.ionBeamTimer <= 0) {
        this.ionBeamActive = false;
      }
    }

    // Skill W: Planetary EMP Shockwave
    if (this.empActive) {
      this.empRadius += dt * 1400;
      if (onScreenShake) onScreenShake(8, 0.1);

      // Vaporize all torpedoes
      for (const torp of torpedoes) {
        if (!torp.alive) continue;
        const dist = Math.hypot(torp.x - this.empOriginX, torp.y - this.empOriginY);
        if (dist <= this.empRadius + 30) {
          torp.alive = false;
        }
      }

      // Push non-boss aliens outward, stun 3.0s, deal 24 * novaMultiplier damage
      for (const alien of aliens) {
        if (!alien.alive) continue;
        const dist = Math.hypot(alien.x - this.empOriginX, alien.y - this.empOriginY);
        if (Math.abs(dist - this.empRadius) < 60) {
          alien.freeze(this.empStunDuration || 3.0);
          alien.takeDamage(24 * novaMultiplier, null, null, true);
          if (alien.classKey !== 'BOSS') {
            const pushAngle = Math.atan2(alien.y - this.empOriginY, alien.x - this.empOriginX);
            alien.x += Math.cos(pushAngle) * 75;
            alien.y += Math.sin(pushAngle) * 75;
          }
        }
      }

      if (this.empRadius >= this.empMaxRadius) {
        this.empActive = false;
      }
    }
  }

  render(ctx, planetX, planetY, planetRadius = 75, timeSec = 0) {
    // Render Orbital Ion Beam (anchored directly to Turret Cannon Tip)
    if (this.ionBeamActive) {
      const originDist = planetRadius + 20;
      const length = 1500;
      const width = 24;

      ctx.save();
      ctx.translate(planetX, planetY);
      ctx.rotate(this.ionBeamAngle);

      // 1. Glowing energy charge-sphere at turret muzzle
      const pulseR = 12 + Math.sin(timeSec * 25) * 3;
      const muzzleGlow = ctx.createRadialGradient(originDist, 0, 2, originDist, 0, pulseR);
      muzzleGlow.addColorStop(0, '#ffffff');
      muzzleGlow.addColorStop(0.45, '#00e5ff');
      muzzleGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = muzzleGlow;
      ctx.beginPath();
      ctx.arc(originDist, 0, pulseR, 0, Math.PI * 2);
      ctx.fill();

      // 2. Pulsing outer cyan plasma sheath
      ctx.beginPath();
      ctx.rect(originDist, -width, length, width * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.32)';
      ctx.fill();

      // 3. Blazing white hot core
      ctx.beginPath();
      ctx.rect(originDist, -width * 0.35, length, width * 0.7);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Sine-wave helical energy ribbon spiraling down the length of the beam
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      for (let d = 0; d <= length; d += 14) {
        const rx = originDist + d;
        const ry = Math.sin(d * 0.06 - timeSec * 28) * 14;
        if (d === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Intertwined white counter-helix
      ctx.beginPath();
      for (let d = 0; d <= length; d += 14) {
        const rx = originDist + d;
        const ry = -Math.sin(d * 0.06 - timeSec * 28) * 14;
        if (d === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    }

    // Render Planetary EMP Shockwave
    if (this.empActive) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.empOriginX, this.empOriginY, this.empRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#e040fb';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 24;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.empOriginX, this.empOriginY, Math.max(0, this.empRadius - 20), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    }
  }
}
