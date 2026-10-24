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

    // Deep space background & arena stars
    this.spaceStars = [];
    for (let i = 0; i < 75; i++) {
      this.spaceStars.push({
        x: Math.random() * virtualWidth,
        y: Math.random() * virtualHeight,
        size: Math.random() * 2 + 0.6,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 3 + 1,
        phase: Math.random() * Math.PI * 2
      });
    }

    if (typeof Image !== 'undefined') {
      this.bgImage = new Image();
      this.bgImage.src = './assets/space-background.jpg';
    }

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
    // 1. Deep space void gradient
    const grad = ctx.createRadialGradient(
      this.virtualWidth / 2, this.virtualHeight / 2, 80,
      this.virtualWidth / 2, this.virtualHeight / 2, this.virtualHeight * 0.75
    );
    grad.addColorStop(0, '#090d24');
    grad.addColorStop(0.6, '#050714');
    grad.addColorStop(1, '#020308');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 2. High-res Deep space nebula artwork
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.drawImage(this.bgImage, 0, 0, this.virtualWidth, this.virtualHeight);
      ctx.restore();
    }

    // 3. Twinkling cosmic arena stars
    if (this.spaceStars) {
      ctx.save();
      for (const s of this.spaceStars) {
        s.phase = (s.phase || 0) + 0.03;
        const alpha = Math.max(0.15, Math.min(1, s.alpha * (0.6 + Math.sin(s.phase) * 0.4)));
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Subtle cyber planetary defense radar grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 80;
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

    // 5. Arena glowing cyber border & corner brackets
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1.5, 1.5, this.virtualWidth - 3, this.virtualHeight - 3);

    // Tactical corner brackets
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.5;
    const cSize = 24;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(3, cSize); ctx.lineTo(3, 3); ctx.lineTo(cSize, 3);
    // Top-Right
    ctx.moveTo(this.virtualWidth - cSize, 3); ctx.lineTo(this.virtualWidth - 3, 3); ctx.lineTo(this.virtualWidth - 3, cSize);
    // Bottom-Left
    ctx.moveTo(3, this.virtualHeight - cSize); ctx.lineTo(3, this.virtualHeight - 3); ctx.lineTo(cSize, this.virtualHeight - 3);
    // Bottom-Right
    ctx.moveTo(this.virtualWidth - cSize, this.virtualHeight - 3); ctx.lineTo(this.virtualWidth - 3, this.virtualHeight - 3); ctx.lineTo(this.virtualWidth - 3, this.virtualHeight - cSize);
    ctx.stroke();
  }

  endRender() {
    this.ctx.restore();
  }
}
