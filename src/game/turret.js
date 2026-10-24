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

    this.level = 0;
    this.muzzleFlash = 0;
    this.setUpgradeLevel(0);
  }

  setUpgradeLevel(level = 0) {
    this.level = level;
    // Faster fire rate with level: -8% interval per level
    this.fireInterval = Math.max(0.10, this.baseFireInterval * Math.pow(0.92, level));
  }

  getDamage(isOverdrive = false) {
    const baseDmg = 12 + this.level * 4.5;
    return isOverdrive ? baseDmg * 1.5 : baseDmg;
  }

  update(dt, pointerX, pointerY, planetX, planetY, isOverdrive = false, onFireCallback) {
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

    // Fire timer
    this.fireTimer += dt;
    const interval = isOverdrive ? this.fireInterval * 0.55 : this.fireInterval;

    if ((this.autoFire || this.isFiring) && this.fireTimer >= interval) {
      this.fireTimer = 0;
      this.muzzleFlash = 1.0;
      this.firePlasmaBolts(planetX, planetY, isOverdrive, onFireCallback);
    }
  }

  firePlasmaBolts(planetX, planetY, isOverdrive, onFireCallback) {
    audio.playLaser(isOverdrive);
    const speed = 520;
    const dmg = this.getDamage(isOverdrive);
    const color = isOverdrive ? '#ffd700' : '#00e5ff';
    const bolts = [];

    // Barrel count: Lv.1-2 Single, Lv.3-4 Twin, Lv.5-6 Triple
    const barrelTier = this.level >= 5 ? 3 : (this.level >= 3 ? 2 : 1);

    if (barrelTier === 1) {
      bolts.push({
        angle: this.angle,
        speed,
        damage: dmg,
        color,
        pierce: isOverdrive ? 2 : 1
      });
    } else if (barrelTier === 2) {
      bolts.push({
        angle: this.angle - 0.08,
        speed,
        damage: dmg * 0.9,
        color,
        pierce: isOverdrive ? 2 : 1
      });
      bolts.push({
        angle: this.angle + 0.08,
        speed,
        damage: dmg * 0.9,
        color,
        pierce: isOverdrive ? 2 : 1
      });
    } else {
      bolts.push({
        angle: this.angle - 0.14,
        speed,
        damage: dmg * 0.85,
        color,
        pierce: isOverdrive ? 2 : 1
      });
      bolts.push({
        angle: this.angle,
        speed,
        damage: dmg * 0.85,
        color,
        pierce: isOverdrive ? 2 : 1
      });
      bolts.push({
        angle: this.angle + 0.14,
        speed,
        damage: dmg * 0.85,
        color,
        pierce: isOverdrive ? 2 : 1
      });
    }

    if (onFireCallback) {
      onFireCallback(bolts, this.angle);
    }
  }

  renderLaserSight(ctx, planetX, planetY, pointerX, pointerY, isOverdrive = false) {
    // Dotted cyan/gold laser sight line extending outward
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 6]);
    ctx.moveTo(planetX, planetY);
    ctx.lineTo(pointerX, pointerY);
    ctx.strokeStyle = isOverdrive ? 'rgba(255, 215, 0, 0.45)' : 'rgba(0, 229, 255, 0.4)';
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

    const barrelColor = isOverdrive ? '#ffd700' : '#00e5ff';
    const barrelTier = this.level >= 5 ? 3 : (this.level >= 3 ? 2 : 1);

    // Turret Mounting Ring
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = barrelColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Turret Barrels
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

    // Muzzle Flash Spark
    if (this.muzzleFlash > 0.05) {
      ctx.beginPath();
      ctx.arc(22, 0, 8 * this.muzzleFlash, 0, Math.PI * 2);
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
