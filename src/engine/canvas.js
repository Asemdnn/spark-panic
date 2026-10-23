// Spark Panic - Responsive HiDPI Canvas Manager & Screen Shake Engine

export class CanvasManager {
  constructor(canvasElement, virtualWidth = 720, virtualHeight = 1280) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.displayWidth = virtualWidth;
    this.displayHeight = virtualHeight;

    // Screen Shake state
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // cap at 2.5 for mobile performance
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate scaling to fit within viewport while preserving aspect ratio
    const scaleX = windowWidth / this.virtualWidth;
    const scaleY = windowHeight / this.virtualHeight;
    this.scale = Math.min(scaleX, scaleY);

    this.displayWidth = Math.floor(this.virtualWidth * this.scale);
    this.displayHeight = Math.floor(this.virtualHeight * this.scale);

    this.offsetX = Math.floor((windowWidth - this.displayWidth) / 2);
    this.offsetY = Math.floor((windowHeight - this.displayHeight) / 2);

    // Apply HiDPI canvas buffer size
    this.canvas.width = Math.floor(windowWidth * dpr);
    this.canvas.height = Math.floor(windowHeight * dpr);

    // Set CSS display style
    this.canvas.style.width = `${windowWidth}px`;
    this.canvas.style.height = `${windowHeight}px`;

    this.dpr = dpr;
  }

  // Convert screen (client/touch) coordinates into virtual game coordinates
  screenToVirtual(clientX, clientY) {
    const rawX = clientX - this.offsetX;
    const rawY = clientY - this.offsetY;

    const x = rawX / this.scale;
    const y = rawY / this.scale;

    // Clamp coordinates so any click in the window triggers inside the arena
    const clampedX = Math.max(25, Math.min(this.virtualWidth - 25, x));
    const clampedY = Math.max(120, Math.min(this.virtualHeight - 40, y));

    return {
      x: clampedX,
      y: clampedY,
      isInside: true
    };
  }

  addShake(intensity = 8, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
        this.shakeTimer = 0;
      }
    }
  }

  beginRender() {
    const ctx = this.ctx;
    ctx.save();

    // Scale for device pixel ratio
    ctx.scale(this.dpr, this.dpr);

    // Clear full canvas buffer
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Position and clip to active game arena
    ctx.translate(this.offsetX, this.offsetY);

    // Apply screen shake
    if (this.shakeTimer > 0) {
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      const shakeX = (Math.random() * 2 - 1) * currentIntensity;
      const shakeY = (Math.random() * 2 - 1) * currentIntensity;
      ctx.translate(shakeX, shakeY);
    }

    ctx.scale(this.scale, this.scale);

    // Draw arena background & glowing cyber boundary
    this.drawArenaBounds(ctx);
  }

  drawArenaBounds(ctx) {
    // Semi-translucent arena backdrop exposing deep space nebula
    const grad = ctx.createRadialGradient(
      this.virtualWidth / 2, this.virtualHeight / 2, 80,
      this.virtualWidth / 2, this.virtualHeight / 2, this.virtualHeight * 0.7
    );
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
    grad.addColorStop(1, 'rgba(7, 9, 19, 0.92)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // Subtle cyber grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    ctx.beginPath();
    for (let x = gridSize; x < this.virtualWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.virtualHeight);
    }
    for (let y = gridSize; y < this.virtualHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.virtualWidth, y);
    }
    ctx.stroke();

    // Arena glowing border
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, this.virtualWidth - 3, this.virtualHeight - 3);
  }

  endRender() {
    this.ctx.restore();
  }
}
