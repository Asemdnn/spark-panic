---
name: arcade-combat-juice
description: Game Juice and combat feel design principles for high-octane 2D action games. Use when engineering screen shake, hit-stop bullet-time, muzzle flashes, recoil kickback, particle burst physics, floating combat text, and threat readability.
metadata:
  origin: Antigravity-GameDev-Suite
---

# Arcade Combat Juice — Visual Punch, Game Feel & Combat Readability

## When to Use
- Elevating a basic 2D action or defense game into a visceral, punchy arcade spectacle.
- Designing responsive visual and physical feedback for weapons, explosions, and impacts.
- Implementing non-linear screen shake, micro hit-stop (frame freeze), and vignette pulsing.
- Ensuring high-speed combat remains readable with clear threat color hierarchies and perimeter indicators.

---

## 1. Trauma-Based Screen Shake System
Linear shake feels jarring and robotic. Trauma-based shaking squares the intensity, giving small hits a subtle rumble and massive hits an explosive, natural tremor:

```javascript
export class ScreenShake {
  constructor() {
    this.trauma = 0; // Range: 0.0 to 1.0
    this.maxTranslation = 24; // Maximum pixel displacement
    this.maxRotation = 0.05;  // Maximum radian rotation (~2.8 degrees)
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt) {
    if (this.trauma > 0) {
      // Linear decay over ~0.6 seconds
      this.trauma = Math.max(0, this.trauma - dt * 1.6);
    }
  }

  apply(ctx, centerX, centerY) {
    if (this.trauma <= 0.01) return;

    // Non-linear shake intensity curve: shake = trauma^2
    const shake = this.trauma * this.trauma;
    const offsetX = (Math.random() * 2 - 1) * this.maxTranslation * shake;
    const offsetY = (Math.random() * 2 - 1) * this.maxTranslation * shake;
    const angle = (Math.random() * 2 - 1) * this.maxRotation * shake;

    ctx.translate(centerX + offsetX, centerY + offsetY);
    ctx.rotate(angle);
    ctx.translate(-centerX, -centerY);
  }
}
```

---

## 2. Hit-Stop / Bullet-Time Micro Slow-Motion
When a critical milestone occurs (e.g., Boss kill, high chain combo, superweapon detonation), pausing or slowing time for 100ms–150ms creates a tactile sensation of immense impact:

```javascript
// Hit-stop state in Game Engine:
triggerHitStop(duration = 0.14, slowScale = 0.35) {
  this.hitStopTimer = duration;
  this.hitStopScale = slowScale;
}

// In Engine update(dt):
let timeScale = 1.0;
if (this.hitStopTimer > 0) {
  this.hitStopTimer = Math.max(0, this.hitStopTimer - dt);
  if (this.hitStopTimer > 0) {
    // Smoothly restore time scale as timer expires
    timeScale = this.hitStopScale + (1 - this.hitStopScale) * (1 - this.hitStopTimer / 0.14);
  }
}

// Scale physics by timeScale, while audio and UI remain independent:
const effectiveDt = dt * timeScale;
```

---

## 3. Weapon Recoil & Directional Muzzle Flash
Every shot fired must visibly affect the firing unit:
- **Mechanical Recoil**: Shift the turret or weapon backwards along its firing angle by `5px–8px`, then spring back rapidly (`Math.max(0, recoil - dt * 38)`).
- **Star-Flare Muzzle Flash**: Render a 4-point diamond cross or bright directional starburst at the barrel tip that decays in `0.06s`.
- **Atmospheric Rim Light**: Cast a soft, colored glow onto nearby surfaces (like the planet's atmosphere or hull) reflecting the weapon's plasma bolt color.

---

## 4. Concentric Dual-Ring Supernovas
Standard expanding circles look flat. High-tier explosions should render two concentric rings:
1. **Outer Distort Shockwave**: A faint, fast-expanding ring (`radius * 1.35`) simulating atmospheric displacement.
2. **Inner Core Plasma Ring**: An intense additive (`globalCompositeOperation = 'lighter'`) glowing shockwave with a colored corona and bright white leading edge.

---

## 5. Combat Readability & Color Hierarchy
High-octane particle effects must never obscure critical gameplay threats:

Role                    | Primary Color       | Visual Cue
:---------------------- | :------------------ | :-------------------------------------------
**Player / Guardian**   | `#00e5ff` (Cyan)    | Sleek, glowing twin bolts, clean vector lines
**Planetary Shield**    | `#00e676` (Emerald) | Hexagonal nodes, smooth harmonic ripples
**Tactical Warheads**   | `#ff1744` (Crimson) | Pointed cones, trailing exhaust smoke, locked reticles
**Combo Chains & EMP**  | `#e040fb` (Magenta) | Crackling lightning tethers, electric sparks
**Rewards & Tech**      | `#ffd700` (Gold)    | Shimmering stars, floating shards, badges

### Perimeter Threat Warning Chevrons:
For offscreen or edge-entering heavy incursions (Dreadnoughts, Motherships), draw a pulsing directional chevron (`⚠️ HEAVY INCURSION`) on the arena perimeter radar circle pointing toward the incoming threat angle.
