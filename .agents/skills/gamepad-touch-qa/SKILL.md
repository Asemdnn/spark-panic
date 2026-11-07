---
name: gamepad-touch-qa
description: Multi-input engineering and mobile touch ergonomics for web games. Use when implementing HTML5 Gamepad API (Xbox/DualSense/Switch controllers), mobile touch controls, responsive canvas viewport scaling, and PWA offline testing.
metadata:
  origin: Antigravity-GameDev-Suite
---

# Gamepad, Touch & PWA QA — Multi-Input Ergonomics & Cross-Device Engineering

## When to Use
- Adding or debugging Gamepad / Controller support via the W3C Gamepad API.
- Designing responsive, zero-latency touch controls for mobile Safari and Chrome.
- Preventing mobile viewport bouncing, double-tap zoom delays, and address bar jumping.
- Verifying PWA offline service workers, web app manifests, and notched screen safe areas.

---

## 1. HTML5 Gamepad API Integration (Xbox, PlayStation, Switch)
Browsers do not fire events for every joystick movement; gamepads must be **polled** every frame inside the game loop:

```javascript
pollGamepad() {
  if (!navigator.getGamepads) return;
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0] || gamepads[1];
  if (!gp || !gp.connected) return;

  // 1. Analog Stick Aiming with Deadzone Threshold (0.20)
  const lx = gp.axes[0] || 0;
  const ly = gp.axes[1] || 0;
  const stickMag = Math.hypot(lx, ly);

  if (stickMag > 0.20) {
    const aimAngle = Math.atan2(ly, lx);
    this.turret.angle = aimAngle;
    this.usingGamepad = true;
  }

  // 2. Standard Mapping Buttons (W3C Standard)
  const btnA = gp.buttons[0]?.pressed;      // Primary Fire / Nova
  const btnB = gp.buttons[1]?.pressed;      // Cancel / Back
  const btnX = gp.buttons[2]?.pressed;      // Skill Q
  const btnY = gp.buttons[3]?.pressed;      // Skill W
  const btnLB = gp.buttons[4]?.pressed;     // Skill E / Overdrive
  const btnRB = gp.buttons[5]?.pressed;     // Skill R / Structure
  const btnLT = gp.buttons[6]?.value > 0.3; // Planetary Cataclysm
  const btnStart = gp.buttons[9]?.pressed;  // Pause / Resume

  // Handle single-trigger edge detection (prevent continuous rapid repeats)
  if (btnA && !this.lastBtnA) {
    this.triggerQuickNova();
  }
  this.lastBtnA = btnA;
}
```

---

## 2. Mobile Touch Ergonomics & Viewport Stabilization

### A. Preventing Mobile Browser Friction:
Ensure canvas parent elements and buttons disable disruptive browser defaults:
```css
/* Prevent pinch-to-zoom, tap delay, and text selection */
canvas, .game-container, button {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

### B. Mobile Touch Coordinate Mapping:
Always convert raw screen touches to internal canvas coordinate space:
```javascript
function getCanvasTouchCoords(canvas, touchEvent) {
  const rect = canvas.getBoundingClientRect();
  const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY,
    clientX: touch.clientX,
    clientY: touch.clientY
  };
}
```

### C. iPhone Notch & Safe Area Insets:
Support notched screens by aligning HUD elements within CSS environment variables:
```css
.hud-safe-top {
  padding-top: max(12px, env(safe-area-inset-top));
}
.hud-safe-bottom {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

---

## 3. PWA Offline Readiness Verification
A rock-solid PWA web game must meet 4 criteria:
1. **Self-Contained Web Manifest**: Embedded JSON or data URI manifest declaring `display: "standalone"`, `orientation: "any"`, and valid SVG maskable icons.
2. **Offline Service Worker (`sw.js`)**: Cache-first strategy for static assets (HTML, JS, CSS, key art images, SVG icons).
3. **Storage Fallbacks**: Graceful fallback to `localStorage` or memory when cookies or IndexedDB are partitioned or blocked.
4. **Instant Standalone Launch**: No white flashes on boot; background matches theme color (`#050814`).
