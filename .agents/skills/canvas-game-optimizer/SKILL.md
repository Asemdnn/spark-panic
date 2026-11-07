---
name: canvas-game-optimizer
description: Professional optimization guide and patterns for HTML5 Canvas 2D game loops. Use when designing, debugging, or profiling high-performance 60 FPS / 120 FPS web games, particle systems, object pools, offscreen pre-rendering, and garbage collection avoidance.
metadata:
  origin: Antigravity-GameDev-Suite
---

# Canvas Game Optimizer — 60 FPS HTML5 2D Engine Architecture

## When to Use
- Building or refactoring HTML5 Canvas 2D games, physics simulations, or interactive web apps.
- Diagnosing stuttering, micro-freezes, frame drops, or garbage collection (GC) latency spikes.
- Implementing massive projectile, bullet-hell, particle, or debris rendering systems.
- Designing responsive, high-DPI (Retina) game canvases without performance degradation.

---

## Core Pillars of 60 FPS Canvas Performance

### 1. Zero-Allocation Game Loop (GC Avoidance)
The primary cause of stutter in web games is JavaScript Garbage Collection. Allocating objects inside `update(dt)` or `render(ctx)` triggers periodic GC sweeps that cause 16ms+ frame drops.

#### Rule of Zero Allocation in Hot Paths:
- **Never create `{}` object literals** in hot update/render loops.
- **Never create closures or arrow functions** in inner loops.
- **Never call `.filter()`, `.map()`, `.concat()`, or spread `[...arr]`** per frame.
- **Pre-allocate temporary calculation vectors**:
  ```javascript
  // Fast Vector Scratchpad
  const VEC_SCRATCH = { x: 0, y: 0, dist: 0, angle: 0 };
  ```

### 2. High-Performance Object Pooling Pattern
Pre-allocate fixed-size arrays for high-churn entities (lasers, sparks, particles, damage numbers):

```javascript
export class ObjectPool {
  constructor(factoryFn, initialSize = 500, maxSize = 2000) {
    this.factoryFn = factoryFn;
    this.pool = [];
    this.active = [];
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factoryFn());
    }
  }

  obtain() {
    const item = this.pool.length > 0 ? this.pool.pop() : (this.active.length < this.maxSize ? this.factoryFn() : null);
    if (item) {
      item.alive = true;
      this.active.push(item);
    }
    return item;
  }

  release(index) {
    const item = this.active[index];
    item.alive = false;
    // Swap-with-last for O(1) removal without array shifting
    const last = this.active.pop();
    if (index < this.active.length) {
      this.active[index] = last;
    }
    this.pool.push(item);
  }

  update(dt, updateCallback) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const item = this.active[i];
      updateCallback(item, dt);
      if (!item.alive) {
        this.release(i);
      }
    }
  }
}
```

### 3. Offscreen Canvas Pre-Rendering (Texture & Backdrop Caching)
Expensive canvas operations (complex vector paths, procedural textures, radial gradients, text rendering) should be rasterized **once** to an offscreen canvas and blitted with `drawImage()`:

```javascript
// Pre-render procedural glow texture once:
function createGlowTexture(radius, color) {
  const offscreen = document.createElement('canvas');
  offscreen.width = radius * 2;
  offscreen.height = radius * 2;
  const ctx = offscreen.getContext('2d');

  const grad = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, radius * 2, radius * 2);
  return offscreen;
}

// In render loop (ultra-fast hardware blit):
ctx.drawImage(glowTexture, x - radius, y - radius);
```

### 4. Canvas State Optimization
Changing 2D context state carries GPU pipeline overhead:
- **Batch by Blend Mode**: Group all additive rendering (`ctx.globalCompositeOperation = 'lighter'`) together to minimize state flips.
- **Batch by Color / Style**: Render all particles of the same color in a single `ctx.beginPath()` / `ctx.fill()` path before changing `fillStyle`.
- **Minimize `ctx.save()` and `ctx.restore()`**: Only save/restore when transforms (`translate`, `rotate`, `scale`) or clip regions are strictly necessary.

### 5. High-DPI / DevicePixelRatio Scaling
Scale canvas buffer dimensions while keeping CSS style dimensions responsive:

```javascript
function resizeCanvas(canvas, containerWidth, containerHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 to preserve mobile battery
  canvas.width = Math.round(containerWidth * dpr);
  canvas.height = Math.round(containerHeight * dpr);
  canvas.style.width = `${containerWidth}px`;
  canvas.style.height = `${containerHeight}px`;

  const ctx = canvas.getContext('2d');
  ctx.resetTransform?.() || ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return dpr;
}
```

### 6. Delta-Time & Frame-Rate Independence
Always normalize movement and decay by elapsed seconds (`dt`), never fixed tick increments:
```javascript
// Clamp dt to avoid physics tunnelling after tab switching
const dt = Math.min(rawDt, 0.1);
position += velocity * dt;
decayFactor = Math.pow(dampingRatio, dt * 60); // Frame-rate independent exponential decay
```
