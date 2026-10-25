// Spark Panic 2.0 - 360° Orbital Guardian Turret

import { audio } from '../engine/audio.js';

export class GuardianTurret {
  constructor() {
    this.angle = -Math.PI / 2;
    this.targetAngle = -Math.PI / 2;
    this.autoFire = true;
    this.isFiring = false;
    this.fireTimer = 0;
    this.baseFireInterval = 0.22; // sec between shots
    this.fireInterval = 0.22;

    this.chassis = 'striker'; // 'striker' | 'tesla' | 'railgun'
    this.level = 0;
    this.muzzleFlash = 0;
    this.setUpgradeLevel(0);
  }

  setChassis(chassisId = 'striker') {
    this.chassis = chassisId;
  }

  setUpgradeLevel(level = 0) {
    this.level = level;
    // Faster fire rate with level: -8% interval per level
    this.fireInterval = Math.max(0.10, this.baseFireInterval * Math.pow(0.92, level));
  }

  getDamage(isOverdrive = false) {
    let baseDmg = 12 + this.level * 4.5;
    if (this.chassis === 'railgun') {
      baseDmg *= 2.2; // 2.2x base damage for hyper-velocity rail-slugs
    }
    return isOverdrive ? baseDmg * 1.5 : baseDmg;
  }

  update(dt, pointerX, pointerY, planetX, planetY, isOverdrive = false, onFireCallback, isOverclock = false) {
    // Smooth aim tracking towards pointer
    this.targetAngle = Math.atan2(pointerY - planetY, pointerX - planetX);
    
    // Smooth angle interpolation
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * Math.min(1, dt * 18);

    if (this.muzzleFlash > 0) {
      this.muzzleFlash -= dt * 10;
    }

    // Fire timer (+35% fire rate when Overclock is active; Railgun is 1.45x interval)
    this.fireTimer += dt;
    let interval = isOverdrive ? this.fireInterval * 0.55 : this.fireInterval;
    if (this.chassis === 'railgun') {
      interval *= 1.45;
    }
    if (isOverclock) {
      interval /= 1.35;
    }

    if ((this.autoFire || this.isFiring) && this.fireTimer >= interval) {
      this.fireTimer = 0;
      this.muzzleFlash = 1.0;
      this.firePlasmaBolts(planetX, planetY, isOverdrive, onFireCallback, isOverclock);
    }
  }

  firePlasmaBolts(planetX, planetY, isOverdrive, onFireCallback, isOverclock = false) {
    audio.playLaser(isOverdrive);
    const dmg = this.getDamage(isOverdrive);
    const bolts = [];

    // Barrel count: Lv.1-2 Single, Lv.3-4 Twin, Lv.5-6 Triple (+2 extra barrels during Overclock)
    let barrelTier = this.level >= 5 ? 3 : (this.level >= 3 ? 2 : 1);
    if (isOverclock) {
      barrelTier += 2;
    }

    if (this.chassis === 'railgun') {
      // Railgun Lancer: Hyper-velocity golden rail-slugs (880 px/s, ignores shield, pierces 4+)
      const speed = 880;
      const color = isOverdrive ? '#ffffff' : '#ffd700';
      const railPierce = (isOverdrive ? 6 : 4) + Math.floor(this.level / 2);

      bolts.push({
        angle: this.angle,
        speed,
        damage: dmg,
        color,
        pierce: railPierce,
        isRailgun: true,
        isDirectPierce: true,
        chassis: 'railgun'
      });

      if (barrelTier >= 3) {
        bolts.push({
          angle: this.angle - 0.06,
          speed,
          damage: dmg * 0.7,
          color,
          pierce: railPierce,
          isRailgun: true,
          isDirectPierce: true,
          chassis: 'railgun'
        });
        bolts.push({
          angle: this.angle + 0.06,
          speed,
          damage: dmg * 0.7,
          color,
          pierce: railPierce,
          isRailgun: true,
          isDirectPierce: true,
          chassis: 'railgun'
        });
      }
    } else if (this.chassis === 'tesla') {
      // Tesla Arc Cannon: High-voltage shock bolts (480 px/s, chain-arcs to up to 2-3 targets)
      const speed = 480;
      const color = isOverdrive ? '#ffd700' : '#e040fb';

      if (barrelTier === 1) {
        bolts.push({
          angle: this.angle,
          speed,
          damage: dmg,
          color,
          pierce: isOverdrive ? 2 : 1,
          isTesla: true,
          turretLevel: this.level,
          chassis: 'tesla'
        });
      } else if (barrelTier === 2) {
        bolts.push({
          angle: this.angle - 0.08,
          speed,
          damage: dmg * 0.9,
          color,
          pierce: isOverdrive ? 2 : 1,
          isTesla: true,
          turretLevel: this.level,
          chassis: 'tesla'
        });
        bolts.push({
          angle: this.angle + 0.08,
          speed,
          damage: dmg * 0.9,
          color,
          pierce: isOverdrive ? 2 : 1,
          isTesla: true,
          turretLevel: this.level,
          chassis: 'tesla'
        });
      } else {
        const spread = barrelTier === 3 ? [-0.14, 0, 0.14] : (barrelTier === 4 ? [-0.15, -0.05, 0.05, 0.15] : [-0.22, -0.11, 0, 0.11, 0.22]);
        for (const offset of spread) {
          bolts.push({
            angle: this.angle + offset,
            speed,
            damage: dmg * 0.85,
            color,
            pierce: isOverdrive ? 2 : 1,
            isTesla: true,
            turretLevel: this.level,
            chassis: 'tesla'
          });
        }
      }
    } else {
      // Default: Pulse Striker (520 px/s rapid plasma cannon)
      const speed = 520;
      const color = isOverdrive ? '#ffd700' : (isOverclock ? '#38bdf8' : '#00e5ff');

      if (barrelTier === 1) {
        bolts.push({
          angle: this.angle,
          speed,
          damage: dmg,
          color,
          pierce: isOverdrive ? 2 : 1,
          chassis: 'striker'
        });
      } else if (barrelTier === 2) {
        bolts.push({
          angle: this.angle - 0.08,
          speed,
          damage: dmg * 0.9,
          color,
          pierce: isOverdrive ? 2 : 1,
          chassis: 'striker'
        });
        bolts.push({
          angle: this.angle + 0.08,
          speed,
          damage: dmg * 0.9,
          color,
          pierce: isOverdrive ? 2 : 1,
          chassis: 'striker'
        });
      } else if (barrelTier === 3) {
        bolts.push({
          angle: this.angle - 0.14,
          speed,
          damage: dmg * 0.85,
          color,
          pierce: isOverdrive ? 2 : 1,
          chassis: 'striker'
        });
        bolts.push({
          angle: this.angle,
          speed,
          damage: dmg * 0.85,
          color,
          pierce: isOverdrive ? 2 : 1,
          chassis: 'striker'
        });
        bolts.push({
          angle: this.angle + 0.14,
          speed,
          damage: dmg * 0.85,
          color,
          pierce: isOverdrive ? 2 : 1,
          chassis: 'striker'
        });
      } else if (barrelTier === 4) {
        const spread = [-0.15, -0.05, 0.05, 0.15];
        for (const offset of spread) {
          bolts.push({
            angle: this.angle + offset,
            speed,
            damage: dmg * 0.8,
            color,
            pierce: isOverdrive ? 2 : 1,
            chassis: 'striker'
          });
        }
      } else {
        // 5+ Barrels
        const spread = [-0.22, -0.11, 0, 0.11, 0.22];
        for (const offset of spread) {
          bolts.push({
            angle: this.angle + offset,
            speed,
            damage: dmg * 0.75,
            color,
            pierce: isOverdrive ? 2 : 1,
            chassis: 'striker'
          });
        }
      }
    }

    if (onFireCallback) {
      onFireCallback(bolts, this.angle);
    }
  }

  renderLaserSight(ctx, planetX, planetY, pointerX, pointerY, isOverdrive = false) {
    // Dotted laser sight line extending outward
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.moveTo(planetX, planetY);
    ctx.lineTo(pointerX, pointerY);

    let sightColor = isOverdrive ? 'rgba(255, 215, 0, 0.45)' : 'rgba(0, 229, 255, 0.4)';
    if (this.chassis === 'tesla' && !isOverdrive) sightColor = 'rgba(224, 64, 251, 0.45)';
    if (this.chassis === 'railgun' && !isOverdrive) sightColor = 'rgba(255, 215, 0, 0.45)';

    ctx.strokeStyle = sightColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  render(ctx, planetX, planetY, planetRadius, isOverdrive = false) {
    const orbitR = planetRadius + 8;
    const tx = planetX + Math.cos(this.angle) * orbitR;
    const ty = planetY + Math.sin(this.angle) * orbitR;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(this.angle);

    const barrelColor = isOverdrive ? '#ffd700' : (this.chassis === 'tesla' ? '#e040fb' : (this.chassis === 'railgun' ? '#ffd700' : '#00e5ff'));
    const barrelTier = this.level >= 5 ? 3 : (this.level >= 3 ? 2 : 1);

    // Turret Mounting Base Ring
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = barrelColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.chassis === 'railgun') {
      // Long-barreled Siege Railgun with Accelerator Induction Rings
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -4, 26, 8);

      // Dual parallel rail guides
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(4, -5, 24, 2);
      ctx.fillRect(4, 3, 24, 2);

      // Induction rings
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(10, -6, 3, 12);
      ctx.fillRect(18, -6, 3, 12);

      // Core glow
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.chassis === 'tesla') {
      // Tesla Arc Cannon with dual forward copper coils & glowing arc prongs
      ctx.fillStyle = '#1e0b36';
      ctx.fillRect(0, -6, 15, 12);

      // Twin arc prongs
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(12, -7);
      ctx.lineTo(20, -7);
      ctx.moveTo(12, 7);
      ctx.lineTo(20, 7);
      ctx.stroke();

      // Prongs emitter nodes
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(20, -7, 2.5, 0, Math.PI * 2);
      ctx.arc(20, 7, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Center Tesla Sphere
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e040fb';
      ctx.shadowColor = '#e040fb';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Pulse Striker: Sleek twin-wing fighter barrels
      if (barrelTier === 1) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, -3.5, 18, 7);
        ctx.fillStyle = barrelColor;
        ctx.fillRect(12, -2.5, 6, 5);
      } else if (barrelTier === 2) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, -7, 18, 4.5);
        ctx.fillRect(0, 2.5, 18, 4.5);
        ctx.fillStyle = barrelColor;
        ctx.fillRect(12, -6, 6, 2.5);
        ctx.fillRect(12, 3.5, 6, 2.5);
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, -8, 18, 3.5);
        ctx.fillRect(0, -1.75, 20, 3.5);
        ctx.fillRect(0, 4.5, 18, 3.5);
        ctx.fillStyle = barrelColor;
        ctx.fillRect(14, -1, 6, 2);
      }

      // Lateral wings
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(4, -15);
      ctx.lineTo(2, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(4, 15);
      ctx.lineTo(2, 6);
      ctx.fill();
    }

    // Muzzle Flash Spark
    if (this.muzzleFlash > 0.05) {
      const flashX = this.chassis === 'railgun' ? 30 : 22;
      ctx.beginPath();
      ctx.arc(flashX, 0, 8 * this.muzzleFlash, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = barrelColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = barrelColor;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

export const OrbitalTurret = GuardianTurret;
