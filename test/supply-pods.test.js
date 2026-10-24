// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupplyPodManager } from '../src/game/supply-pods.js';

describe('Mid-Battle Orbital Supply Pods (v2.1)', () => {
  let supplyPods;

  beforeEach(() => {
    supplyPods = new SupplyPodManager();
  });

  it('should initialize empty with inactive buffs', () => {
    expect(supplyPods.pods.length).toBe(0);
    expect(supplyPods.isQuadPulseActive()).toBe(false);
    expect(supplyPods.isCryoTimeWarpActive()).toBe(false);
    expect(supplyPods.getSpeedScale()).toBe(1.0);
  });

  it('should spawn drifting supply pods when spawn timer elapses', () => {
    supplyPods.spawnTimer = 0.05;
    supplyPods.update(0.1, 400, 300, 75);

    expect(supplyPods.pods.length).toBe(1);
    const pod = supplyPods.pods[0];
    expect(pod.radius).toBe(16);
    expect(pod.hp).toBe(15);
    expect(pod.alive).toBe(true);
  });

  it('should activate buffs and trigger callback upon destroying a supply pod', () => {
    supplyPods.pods.push({
      x: 200,
      y: 200,
      vx: 10,
      vy: 10,
      radius: 16,
      hp: 15,
      maxHp: 15,
      rotation: 0,
      beaconPhase: 0,
      alive: true
    });

    const onPodDestroyed = vi.fn();
    const hit = supplyPods.checkHit(200, 200, 20, 25, onPodDestroyed);

    expect(hit).toBe(true);
    expect(onPodDestroyed).toHaveBeenCalled();
    const [hitX, hitY, buffType] = onPodDestroyed.mock.calls[0];
    expect(hitX).toBe(200);
    expect(hitY).toBe(200);
    expect(['QUAD_PULSE', 'CRYO_TIMEWARP', 'NOVA_SURGE']).toContain(buffType);
    expect(supplyPods.pods.length).toBe(0);
  });

  it('should activate Quad-Pulse Overclock (8s) and tick down timer', () => {
    supplyPods.quadPulseTimer = 8.0;
    expect(supplyPods.isQuadPulseActive()).toBe(true);

    supplyPods.update(2.0, 400, 300, 75);
    expect(supplyPods.quadPulseTimer).toBeCloseTo(6.0);
    expect(supplyPods.isQuadPulseActive()).toBe(true);

    supplyPods.update(6.1, 400, 300, 75);
    expect(supplyPods.quadPulseTimer).toBe(0);
    expect(supplyPods.isQuadPulseActive()).toBe(false);
  });

  it('should activate Cryo Time-Warp (6s) and reduce enemy speed scale to 0.4', () => {
    supplyPods.cryoTimeWarpTimer = 6.0;
    expect(supplyPods.isCryoTimeWarpActive()).toBe(true);
    expect(supplyPods.getSpeedScale()).toBe(0.40);

    supplyPods.update(3.0, 400, 300, 75);
    expect(supplyPods.cryoTimeWarpTimer).toBeCloseTo(3.0);
    expect(supplyPods.getSpeedScale()).toBe(0.40);

    supplyPods.update(3.1, 400, 300, 75);
    expect(supplyPods.isCryoTimeWarpActive()).toBe(false);
    expect(supplyPods.getSpeedScale()).toBe(1.0);
  });
});
