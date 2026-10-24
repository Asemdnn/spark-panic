// Spark Panic 2.1 - Mid-Battle Orbital Supply Pods (Shootable Power-Up Drops)

export class SupplyPodManager {
  constructor() {
    this.pods = [];
    this.spawnTimer = 18.0; // First pod spawns around 18s

    // Active Temporary Tactical Buffs
    this.quadPulseTimer = 0;   // QUAD-PULSE OVERCLOCK (8s)
    this.cryoTimeWarpTimer = 0; // CRYO TIME-WARP (6s)
  }

  reset() {
    this.pods = [];
    this.spawnTimer = 18.0;
    this.quadPulseTimer = 0;
    this.cryoTimeWarpTimer = 0;
  }

  isQuadPulseActive() {
    return this.quadPulseTimer > 0;
  }

  isCryoTimeWarpActive() {
    return this.cryoTimeWarpTimer > 0;
  }

  getSpeedScale() {
    return this.isCryoTimeWarpActive() ? 0.40 : 1.0;
  }

  update(dt, planetX, planetY, planetRadius, onBuffGranted) {
    // 1. Buff Timers
    if (this.quadPulseTimer > 0) this.quadPulseTimer = Math.max(0, this.quadPulseTimer - dt);
    if (this.cryoTimeWarpTimer > 0) this.cryoTimeWarpTimer = Math.max(0, this.cryoTimeWarpTimer - dt);

    // 2. Spawn Timer (16–22s)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.pods.length < 2) {
      this.spawnTimer = 16.0 + Math.random() * 6.0;

      const angle = Math.random() * Math.PI * 2;
      const orbitDist = planetRadius + 120 + Math.random() * 70;
      const speed = 32 + Math.random() * 16;
      const tangAngle = angle + (Math.random() < 0.5 ? Math.PI * 0.5 : -Math.PI * 0.5);

      this.pods.push({
        x: planetX + Math.cos(angle) * orbitDist,
        y: planetY + Math.sin(angle) * orbitDist,
        vx: Math.cos(tangAngle) * speed,
        vy: Math.sin(tangAngle) * speed,
        angle,
        orbitDist,
        radius: 16,
        hp: 15,
        maxHp: 15,
        rotation: 0,
        beaconPhase: 0,
        alive: true
      });
    }

    // 3. Update Pods
    for (let i = this.pods.length - 1; i >= 0; i--) {
      const pod = this.pods[i];
      pod.x += pod.vx * dt;
      pod.y += pod.vy * dt;
      pod.rotation += dt * 0.8;
      pod.beaconPhase += dt * 6.0;

      // Despawn if drifted too far
      const dist = Math.hypot(pod.x - planetX, pod.y - planetY);
      if (dist > Math.max(planetX, planetY) * 1.8) {
        this.pods.splice(i, 1);
      }
    }
  }

  checkHit(x, y, radius, damage = 15, onPodDestroyedCallback = null) {
    if (typeof damage === 'function') {
      onPodDestroyedCallback = damage;
      damage = 15;
    }
    let hit = false;
    for (let i = this.pods.length - 1; i >= 0; i--) {
      const pod = this.pods[i];
      if (!pod.alive) continue;
      const d = Math.hypot(pod.x - x, pod.y - y);
      if (d <= pod.radius + radius) {
        pod.hp -= damage;
        hit = true;

        if (pod.hp <= 0) {
          pod.alive = false;
          this.pods.splice(i, 1);

          // Select one of 3 random tactical buffs
          const buffTypes = ['QUAD_PULSE', 'CRYO_TIMEWARP', 'NOVA_SURGE'];
          const chosenBuff = buffTypes[Math.floor(Math.random() * buffTypes.length)];

          if (chosenBuff === 'QUAD_PULSE') {
            this.quadPulseTimer = 8.0;
          } else if (chosenBuff === 'CRYO_TIMEWARP') {
            this.cryoTimeWarpTimer = 6.0;
          }

          if (onPodDestroyedCallback) {
            onPodDestroyedCallback(pod.x, pod.y, chosenBuff);
          }
        }
        break;
      }
    }
    return hit;
  }

  checkHitPods(x, y, radius, damage = 15, onPodDestroyedCallback = null) {
    return this.checkHit(x, y, radius, damage, onPodDestroyedCallback);
  }

  render(ctx) {
    for (const pod of this.pods) {
      if (!pod.alive) continue;
      ctx.save();
      ctx.translate(pod.x, pod.y);
      ctx.rotate(pod.rotation);

      const r = pod.radius;

      // Parachute / Repulsor Beacon Aura
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.fill();

      // Golden-Cyan Hexagonal Cargo Crate
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const ang = (s / 6) * Math.PI * 2;
        const px = Math.cos(ang) * r;
        const py = Math.sin(ang) * r;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner Supply Symbol (+)
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, 0);
      ctx.lineTo(r * 0.45, 0);
      ctx.moveTo(0, -r * 0.45);
      ctx.lineTo(0, r * 0.45);
      ctx.stroke();

      // Blinking Beacon Thruster
      const beaconAlpha = 0.4 + 0.6 * Math.abs(Math.sin(pod.beaconPhase));
      ctx.beginPath();
      ctx.arc(0, -r - 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${beaconAlpha})`;
      ctx.fill();

      ctx.restore();
    }
  }
}
