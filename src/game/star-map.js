// Guardian of the Universe - Interactive Stellar Universe Map
// Renders the living solar system / galaxy where players look at the star and orbiting planets directly in space

import { PLANETS, SECTORS } from '../config.js';
import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';

// Visual color profiles for all 20 celestial worlds
const PLANET_PALETTES = {
  1: { light: '#a0e9fd', mid: '#2f80ed', dark: '#0c3882', halo: 'rgba(47, 128, 237, 0.55)' },
  2: { light: '#99ffe2', mid: '#20e3b2', dark: '#0e7258', halo: 'rgba(32, 227, 178, 0.55)' },
  3: { light: '#ffe29a', mid: '#f5af19', dark: '#680505', halo: 'rgba(245, 175, 25, 0.65)' },
  4: { light: '#f2d5e5', mid: '#654ea3', dark: '#2e1c59', halo: 'rgba(101, 78, 163, 0.55)' },
  5: { light: '#ffd1c4', mid: '#ff0844', dark: '#75001c', halo: 'rgba(255, 8, 68, 0.55)' },
  6: { light: '#b8ffd6', mid: '#11998e', dark: '#074742', halo: 'rgba(56, 239, 125, 0.55)' },
  7: { light: '#d8ffef', mid: '#78ffd6', dark: '#157960', halo: 'rgba(120, 255, 214, 0.55)' },
  8: { light: '#e4f4fd', mid: '#a1c4fd', dark: '#3e68b5', halo: 'rgba(161, 196, 253, 0.55)' },
  9: { light: '#e8bbf9', mid: '#c471ed', dark: '#5d0f14', halo: 'rgba(196, 113, 237, 0.65)' },
  10: { light: '#ffaa80', mid: '#434343', dark: '#110300', halo: 'rgba(255, 69, 0, 0.65)' },
  11: { light: '#98f5f6', mid: '#30cfd0', dark: '#0e0220', halo: 'rgba(48, 207, 208, 0.65)' },
  12: { light: '#ffd4e5', mid: '#ff758c', dark: '#6f1122', halo: 'rgba(255, 117, 140, 0.65)' },
  13: { light: '#b1ffcd', mid: '#0575e6', dark: '#02264c', halo: 'rgba(0, 242, 96, 0.65)' },
  14: { light: '#ffb5b5', mid: '#f857a6', dark: '#680838', halo: 'rgba(255, 88, 88, 0.7)' },
  15: { light: '#c9cbff', mid: '#b224ef', dark: '#3e0559', halo: 'rgba(178, 36, 239, 0.7)' },
  16: { light: '#d1fae7', mid: '#1f4037', dark: '#061510', halo: 'rgba(153, 242, 200, 0.65)' },
  17: { light: '#fff1a8', mid: '#f7971e', dark: '#683605', halo: 'rgba(255, 210, 0, 0.7)' },
  18: { light: '#c4fed0', mid: '#00c9ff', dark: '#034b5e', halo: 'rgba(0, 201, 255, 0.75)' },
  19: { light: '#9cecf4', mid: '#5b247a', dark: '#1e052d', halo: 'rgba(27, 206, 223, 0.75)' },
  20: { light: '#fff6aa', mid: '#ff00cc', dark: '#050529', halo: 'rgba(255, 0, 204, 0.85)' }
};

export class StarMap {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;

    // Camera state in celestial space
    this.cameraX = 0;
    this.cameraY = 0;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.zoom = 1;
    this.targetZoom = 1;

    // Interaction state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cameraStartX = 0;
    this.cameraStartY = 0;
    this.hoveredPlanet = null;
    this.selectedPlanet = null;
    this.onSelectPlanetCallback = null;

    // Background cosmic stars
    this.stars = [];
    this.initCosmicStars();

    // Setup planetary orbital system
    this.planets = [];
    this.initPlanetarySystem();

    // Central Cosmic Star animation
    this.solarPhase = 0;
    this.solarFlareWaves = [];
    this.solarFlareTimer = 0;
    this.ambientRotation = 0;
    this.warpTransition = null;

    // Alien armada orbiters
    this.alienDrones = [];
    this.initAlienSwarm();

    // Cosmic nebula backdrop image
    this.backdropImage = null;
    if (typeof Image !== 'undefined') {
      this.backdropImage = new Image();
      this.backdropImage.src = './assets/galaxy-map-backdrop.jpg';
    }

    // Preload planetary artwork textures
    this.planetImages = {};
    if (typeof Image !== 'undefined') {
      for (const p of this.planets) {
        const img = new Image();
        img.src = p.image || `./assets/planets/${p.name.toLowerCase()}.jpg`;
        this.planetImages[p.level] = img;
      }
    }
  }

  initCosmicStars() {
    this.stars = [];
    const count = 380;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 7000,
        y: (Math.random() - 0.5) * 7000,
        size: Math.random() * 2.2 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 3 + 1,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() < 0.2 ? '#00f0ff' : (Math.random() < 0.4 ? '#ff00aa' : (Math.random() < 0.6 ? '#ffe600' : '#ffffff'))
      });
    }
  }

  initPlanetarySystem() {
    this.planets = PLANETS.map((p, idx) => {
      // Progressive orbital radii expanding outward from Sol Genesis
      const orbitRadius = 260 + idx * 125;
      // Staggered orbital starting angles
      const baseAngle = (idx * 1.35) % (Math.PI * 2);
      // Keplerian-style orbital speed (inner planets orbit faster)
      const orbitSpeed = 0.08 / Math.sqrt(idx + 1);
      const palette = PLANET_PALETTES[p.level] || { light: '#ffffff', mid: '#00f0ff', dark: '#0a3266', halo: 'rgba(0, 240, 255, 0.5)' };

      return {
        ...p,
        orbitRadius,
        orbitAngle: baseAngle,
        orbitSpeed,
        planetSize: p.hasRings ? 26 : 22,
        palette,
        trail: [],
        trailTimer: 0,
        au: (orbitRadius / 260).toFixed(1),
        orbitalVelocityKm: Math.round(35 / Math.sqrt(idx + 1)),
        x: Math.cos(baseAngle) * orbitRadius,
        y: Math.sin(baseAngle) * orbitRadius,
        rotation: Math.random() * Math.PI * 2,
        ringTilt: p.hasRings ? (Math.PI / 6) : 0
      };
    });
  }

  initAlienSwarm() {
    this.alienDrones = [];
    // Spawn alien patrol craft buzzing around invaded planetary bodies
    for (let i = 0; i < 45; i++) {
      const pIdx = Math.floor(Math.random() * this.planets.length);
      this.alienDrones.push({
        planetIndex: pIdx,
        dist: 36 + Math.random() * 22,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 1.5 + 0.8) * (Math.random() < 0.5 ? 1 : -1),
        color: i % 2 === 0 ? '#ff00aa' : '#00f0ff'
      });
    }
  }

  onSelectPlanet(callback) {
    this.onSelectPlanetCallback = callback;
  }

  focusPlanet(planetIndex, zoomLevel = 1.15) {
    const p = this.planets[planetIndex - 1];
    if (p) {
      this.targetCameraX = p.x;
      this.targetCameraY = p.y;
      this.targetZoom = zoomLevel;
      this.selectedPlanet = p;
      audio.init();
      audio.playLockOn();
      if (this.onSelectPlanetCallback) {
        this.onSelectPlanetCallback(p);
      }
    }
  }

  focusSector(sectorIndex) {
    this.selectedPlanet = null;
    const sector = SECTORS[sectorIndex - 1];
    if (!sector) return;
    const startPlanet = this.planets[sector.range[0] - 1];
    const endPlanet = this.planets[sector.range[1] - 1];
    if (startPlanet && endPlanet) {
      this.targetCameraX = (startPlanet.x + endPlanet.x) / 2;
      this.targetCameraY = (startPlanet.y + endPlanet.y) / 2;
      this.targetZoom = 0.72;
    }
  }

  focusCore() {
    this.selectedPlanet = null;
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.targetZoom = 0.85;
  }

  focusCurrentObjective() {
    const unlocked = storage.getUnlockedLevel();
    this.focusPlanet(unlocked, 1.15);
  }

  triggerWarp(planet, onComplete) {
    this.focusPlanet(planet.level, 1.35);
    audio.init();
    audio.playWarp();
    this.warpTransition = {
      planet,
      timer: 0,
      duration: 0.35,
      onComplete
    };
  }

  handlePointerDown(clientX, clientY) {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.cameraStartX = this.cameraX;
    this.cameraStartY = this.cameraY;
    // Manual drag releases planet lock
    this.selectedPlanet = null;
  }

  handlePointerMove(clientX, clientY) {
    if (this.isDragging) {
      const dx = (clientX - this.dragStartX) / this.zoom;
      const dy = (clientY - this.dragStartY) / this.zoom;
      this.targetCameraX = this.cameraStartX - dx;
      this.targetCameraY = this.cameraStartY - dy;
      this.cameraX = this.targetCameraX;
      this.cameraY = this.targetCameraY;
    } else {
      // Check hover against planets
      const worldCoords = this.screenToWorld(clientX, clientY);
      let found = null;
      for (const p of this.planets) {
        const dist = Math.hypot(p.x - worldCoords.x, p.y - worldCoords.y);
        if (dist <= p.planetSize + 22) {
          found = p;
          break;
        }
      }
      if (found && found !== this.hoveredPlanet) {
        audio.init();
        audio.playHover();
      }
      this.hoveredPlanet = found;
      if (typeof document !== 'undefined') {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
          canvas.style.cursor = found ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
        }
      }
    }
  }

  handlePointerUp(clientX, clientY) {
    const moved = Math.hypot(clientX - this.dragStartX, clientY - this.dragStartY);
    this.isDragging = false;

    // If tap/click without drag, check hit on planets or central core
    if (moved < 10) {
      const worldCoords = this.screenToWorld(clientX, clientY);

      // Check click on central star Sol Genesis
      const coreDist = Math.hypot(worldCoords.x, worldCoords.y);
      if (coreDist <= 110) {
        this.focusCore();
        return true;
      }

      // Check click on planets
      for (const p of this.planets) {
        const dist = Math.hypot(p.x - worldCoords.x, p.y - worldCoords.y);
        if (dist <= p.planetSize + 22) {
          this.focusPlanet(p.level, 1.15);
          return true;
        }
      }
    }
    return false;
  }

  handleWheel(deltaY) {
    const zoomFactor = deltaY < 0 ? 1.12 : 0.89;
    this.targetZoom = Math.max(0.35, Math.min(1.85, this.targetZoom * zoomFactor));
  }

  screenToWorld(clientX, clientY) {
    const width = typeof window !== 'undefined' ? window.innerWidth : 720;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1280;
    const centerX = width / 2;
    const centerY = height / 2;

    const screenX = clientX - centerX;
    const screenY = clientY - centerY;

    const worldX = (screenX / this.zoom) + this.cameraX;
    const worldY = (screenY / this.zoom) + this.cameraY;

    return { x: worldX, y: worldY };
  }

  update(dt) {
    this.solarPhase += dt * 1.5;

    // Follow selected planet in orbit if active and not dragging
    if (this.selectedPlanet && !this.isDragging) {
      this.targetCameraX = this.selectedPlanet.x;
      this.targetCameraY = this.selectedPlanet.y;
    }

    // Smooth camera glide
    this.cameraX += (this.targetCameraX - this.cameraX) * Math.min(1, dt * 6);
    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 6);
    this.zoom += (this.targetZoom - this.zoom) * Math.min(1, dt * 8);

    // Orbit planetary bodies around Sol Genesis & update stardust trails
    for (const p of this.planets) {
      p.orbitAngle += p.orbitSpeed * dt;
      p.x = Math.cos(p.orbitAngle) * p.orbitRadius;
      p.y = Math.sin(p.orbitAngle) * p.orbitRadius;
      p.rotation += dt * 0.4;

      // Stardust trail update
      p.trailTimer = (p.trailTimer || 0) + dt;
      if (p.trailTimer >= 0.05) {
        p.trailTimer = 0;
        if (!p.trail) p.trail = [];
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 10) p.trail.pop();
      }
    }

    // Update alien swarm patrols
    for (const drone of this.alienDrones) {
      drone.angle += drone.speed * dt;
    }

    // Twinkle cosmic stars
    for (const star of this.stars) {
      star.phase += star.twinkleSpeed * dt;
    }

    // Ambient background rotation
    this.ambientRotation += dt * 0.025;

    // Solar flare shockwave emissions from Sol Genesis
    this.solarFlareTimer += dt;
    if (this.solarFlareTimer >= 3.6) {
      this.solarFlareTimer = 0;
      this.solarFlareWaves.push({
        radius: 110,
        speed: 400,
        maxRadius: 2800,
        alpha: 0.65
      });
    }

    // Advance active solar flare waves
    for (let i = this.solarFlareWaves.length - 1; i >= 0; i--) {
      const wave = this.solarFlareWaves[i];
      wave.radius += wave.speed * dt;
      wave.alpha = Math.max(0, (1 - (wave.radius / wave.maxRadius)) * 0.65);
      if (wave.radius >= wave.maxRadius || wave.alpha <= 0.01) {
        this.solarFlareWaves.splice(i, 1);
      }
    }

    // Warp jump transition sequence
    if (this.warpTransition) {
      this.warpTransition.timer += dt;
      const progress = Math.min(1, this.warpTransition.timer / this.warpTransition.duration);
      this.targetZoom = 1.25 + progress * 0.75;
      if (progress >= 1) {
        const callback = this.warpTransition.onComplete;
        this.warpTransition = null;
        if (callback) callback();
      }
    }
  }

  render(ctx) {
    const width = typeof window !== 'undefined' ? window.innerWidth : 720;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1280;
    const dpr = this.canvasManager.dpr || 1;

    ctx.save();
    ctx.scale(dpr, dpr);
    if (ctx.clearRect) ctx.clearRect(0, 0, width, height);

    // Deep cosmic space void
    const spaceGrad = ctx.createRadialGradient(
      width / 2, height / 2, 100,
      width / 2, height / 2, Math.max(width, height) * 0.8
    );
    spaceGrad.addColorStop(0, '#090d24');
    spaceGrad.addColorStop(0.5, '#050714');
    spaceGrad.addColorStop(1, '#020308');
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, width, height);

    // Parallax Master Universe Star Map Backdrop (Nano Banana Artwork)
    if (this.backdropImage && this.backdropImage.complete && this.backdropImage.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      const bgW = 5200;
      const bgH = 5200;
      const px = (width / 2) - (this.cameraX * 0.15) - (bgW / 2);
      const py = (height / 2) - (this.cameraY * 0.15) - (bgH / 2);
      ctx.drawImage(this.backdropImage, px, py, bgW, bgH);
      ctx.restore();
    }

    // Center camera on universe coordinates
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 1. Render Background Parallax Cosmic Stars
    this.renderStars(ctx);

    // 2. Render Central Cosmic Star: Sol Genesis (Galactic Core)
    this.renderCentralStar(ctx);

    // 2.5. Render Expanding Solar Flare Waves
    this.renderSolarFlareWaves(ctx);

    // 3. Render Orbital Tracks
    this.renderOrbitalTracks(ctx);

    // 4. Render Hyperspace Jump Lanes between planetary systems
    this.renderHyperspaceLanes(ctx);

    // 5. Render Orbiting Planets
    this.renderPlanets(ctx);

    // 6. Render Alien Armada Swarms
    this.renderAlienDrones(ctx);

    // 7. Render Holographic Targeting Reticle
    this.renderTargetingReticle(ctx);

    ctx.restore();

    // 8. Warp Jump Hyperspace Speed Lines
    if (this.warpTransition) {
      const progress = this.warpTransition.timer / this.warpTransition.duration;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(width / 2, height / 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${progress * 0.75})`;
      ctx.lineWidth = 2.5;
      for (let w = 0; w < 36; w++) {
        const ang = (w / 36) * Math.PI * 2 + (progress * 0.5);
        const r1 = 80 + (w % 4) * 40;
        const r2 = r1 + 320 * progress;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  renderSolarFlareWaves(ctx) {
    for (const wave of this.solarFlareWaves) {
      ctx.beginPath();
      ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 200, 60, ${wave.alpha})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  renderAmbientBackground(ctx) {
    const width = typeof window !== 'undefined' ? window.innerWidth : 720;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1280;
    const dpr = this.canvasManager.dpr || 1;

    ctx.save();
    ctx.scale(dpr, dpr);
    if (ctx.clearRect) ctx.clearRect(0, 0, width, height);

    // Deep cosmic space gradient
    const spaceGrad = ctx.createRadialGradient(
      width / 2, height / 2, 100,
      width / 2, height / 2, Math.max(width, height) * 0.8
    );
    spaceGrad.addColorStop(0, '#090d24');
    spaceGrad.addColorStop(0.5, '#050714');
    spaceGrad.addColorStop(1, '#020308');
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, width, height);

    // Slowly rotating parallax nebula backdrop
    if (this.backdropImage && this.backdropImage.complete && this.backdropImage.naturalWidth > 0) {
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(this.ambientRotation * 0.2);
      ctx.globalAlpha = 0.45;
      const bgW = 4800;
      const bgH = 4800;
      ctx.drawImage(this.backdropImage, -bgW / 2, -bgH / 2, bgW, bgH);
      ctx.restore();
    }

    // Drifting twinkling cosmic stars
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(this.ambientRotation * 0.4);
    for (let i = 0; i < Math.min(220, this.stars.length); i++) {
      const star = this.stars[i];
      const alpha = star.alpha * (0.6 + Math.sin(star.phase) * 0.4);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(star.x * 0.35, star.y * 0.35, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();
  }

  renderStars(ctx) {
    for (const star of this.stars) {
      const alpha = star.alpha * (0.6 + Math.sin(star.phase) * 0.4);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  renderCentralStar(ctx) {
    // Sol Genesis - Galactic Core
    const r = 95;
    const pulse = Math.sin(this.solarPhase) * 7;

    // Stellar Corona Rays
    const coronaGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, (r + pulse) * 2.8);
    coronaGrad.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
    coronaGrad.addColorStop(0.35, 'rgba(255, 170, 0, 0.55)');
    coronaGrad.addColorStop(0.7, 'rgba(255, 60, 0, 0.2)');
    coronaGrad.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(0, 0, (r + pulse) * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = coronaGrad;
    ctx.fill();

    // Solid Star Core
    const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    starGrad.addColorStop(0, '#ffffff');
    starGrad.addColorStop(0.3, '#fff4b8');
    starGrad.addColorStop(0.65, '#ff9900');
    starGrad.addColorStop(1, '#ff3300');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = starGrad;
    ctx.fill();

    // Solar Label
    ctx.font = '800 13px Montserrat, sans-serif';
    ctx.fillStyle = 'rgba(255, 240, 180, 0.95)';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText('SOL GENESIS', 0, r + 26);
    ctx.font = '700 9px Montserrat, sans-serif';
    ctx.fillStyle = 'rgba(255, 200, 100, 0.65)';
    ctx.fillText('GALACTIC CORE', 0, r + 38);
    ctx.shadowBlur = 0;
  }

  renderOrbitalTracks(ctx) {
    // Concentric Astronomical Unit Radar Grid Markers
    const radarDistances = [520, 1040, 1560, 2080, 2600];
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.setLineDash([2, 8]);
    for (const dist of radarDistances) {
      ctx.beginPath();
      ctx.arc(0, 0, dist, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '700 8px Montserrat, sans-serif';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.textAlign = 'center';
      ctx.fillText(`${(dist / 260).toFixed(0)} AU`, dist, -8);
    }

    ctx.lineWidth = 1;
    const unlocked = storage.getUnlockedLevel();

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const isUnlocked = p.level <= unlocked;

      ctx.beginPath();
      ctx.arc(0, 0, p.orbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isUnlocked ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)';
      ctx.setLineDash([4, 6]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  renderHyperspaceLanes(ctx) {
    const unlocked = storage.getUnlockedLevel();

    for (let i = 0; i < this.planets.length - 1; i++) {
      const p1 = this.planets[i];
      const p2 = this.planets[i + 1];
      const isLaneUnlocked = p2.level <= unlocked;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      if (isLaneUnlocked) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -this.solarPhase * 15;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([5, 5]);
        ctx.shadowBlur = 0;
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  renderPlanets(ctx) {
    const unlocked = storage.getUnlockedLevel();

    for (const p of this.planets) {
      const isUnlocked = p.level <= unlocked;
      const isTarget = p.level === unlocked;
      const r = p.planetSize;
      const pal = p.palette;

      ctx.save();
      ctx.translate(p.x, p.y);

      // Sunward light angle pointing from Sol Genesis (0, 0)
      const sunAngle = Math.atan2(-p.y, -p.x);

      // 0. Fading Orbital Stardust Trail
      if (p.trail && p.trail.length > 1) {
        ctx.save();
        for (let t = 0; t < p.trail.length; t++) {
          const pt = p.trail[t];
          const trAlpha = (1 - (t / p.trail.length)) * 0.45;
          ctx.beginPath();
          ctx.arc(pt.x - p.x, pt.y - p.y, Math.max(1, (1 - (t / p.trail.length)) * 3), 0, Math.PI * 2);
          ctx.fillStyle = isUnlocked ? `rgba(0, 240, 255, ${trAlpha})` : `rgba(255, 255, 255, ${trAlpha * 0.35})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // 1. Atmosphere Halo
      const haloGrad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.6);
      haloGrad.addColorStop(0, pal.halo);
      haloGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = haloGrad;
      ctx.fill();

      // 2. Planet Sphere (Nano Banana Artwork Texture with 3D Sunward Lighting)
      const lightOffsetX = Math.cos(sunAngle) * (r * 0.45);
      const lightOffsetY = Math.sin(sunAngle) * (r * 0.45);

      const img = this.planetImages && this.planetImages[p.level];
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -r, -r, r * 2, r * 2);

        // Dynamic 3D sunward lighting overlay relative to Sol Genesis
        const shadowGrad = ctx.createRadialGradient(
          lightOffsetX, lightOffsetY, r * 0.15,
          0, 0, r
        );
        shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        shadowGrad.addColorStop(0.5, 'transparent');
        shadowGrad.addColorStop(0.82, 'rgba(3, 8, 20, 0.6)');
        shadowGrad.addColorStop(1, 'rgba(2, 5, 14, 0.92)');

        ctx.fillStyle = shadowGrad;
        ctx.fill();
        ctx.restore();
      } else {
        // Procedural 3D Sphere Fallback
        const sphereGrad = ctx.createRadialGradient(
          lightOffsetX, lightOffsetY, r * 0.1,
          0, 0, r
        );
        sphereGrad.addColorStop(0, isUnlocked ? pal.light : '#94a3b8');
        sphereGrad.addColorStop(0.35, isUnlocked ? pal.mid : '#475569');
        sphereGrad.addColorStop(0.75, isUnlocked ? pal.dark : '#1e293b');
        sphereGrad.addColorStop(1, '#020611');

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.fill();
      }

      // 3. Planetary Rings (for ringed worlds)
      if (p.hasRings) {
        ctx.save();
        ctx.rotate(p.ringTilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.7, r * 0.5, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.ringColor || 'rgba(255, 230, 100, 0.65)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Forcefield Shield for locked worlds
      if (!isUnlocked) {
        ctx.beginPath();
        ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 170, 0.45)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        // Lock icon
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', 0, 0);
      }

      // 5. Guardian Flagship 🛸 Orbiting Current Objective
      if (isTarget) {
        const flagAngle = this.solarPhase * 2;
        const flagDist = r + 22;
        const fx = Math.cos(flagAngle) * flagDist;
        const fy = Math.sin(flagAngle) * flagDist;

        // Sonar Radar Ring
        ctx.beginPath();
        ctx.arc(0, 0, (r + 14) + Math.sin(this.solarPhase * 3) * 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛸', fx, fy);
      }

      // 6. Planet Label
      ctx.font = '900 11px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isUnlocked ? '#ffffff' : '#64748b';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 6;
      ctx.fillText(`LVL ${p.level}: ${p.name.toUpperCase()}`, 0, r + 18);

      const stars = storage.getLevelStars(p.level);
      if (stars > 0) {
        ctx.font = '10px Montserrat, sans-serif';
        ctx.fillStyle = '#ffe600';
        ctx.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 0, r + 30);
      }
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  renderAlienDrones(ctx) {
    const unlocked = storage.getUnlockedLevel();

    for (const drone of this.alienDrones) {
      const p = this.planets[drone.planetIndex];
      if (p.level > unlocked + 2) continue;

      const dx = p.x + Math.cos(drone.angle) * drone.dist;
      const dy = p.y + Math.sin(drone.angle) * drone.dist;

      ctx.fillStyle = drone.color;
      ctx.shadowColor = drone.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(dx, dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  renderTargetingReticle(ctx) {
    const target = this.selectedPlanet || this.hoveredPlanet;
    if (!target) return;

    ctx.save();
    ctx.translate(target.x, target.y);

    const r = target.planetSize + 16;
    const pulse = Math.sin(this.solarPhase * 4) * 2;
    const reticleR = r + pulse;

    // Sci-fi holographic bracket corners
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    const cornerSize = 12;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(-reticleR, -reticleR + cornerSize);
    ctx.lineTo(-reticleR, -reticleR);
    ctx.lineTo(-reticleR + cornerSize, -reticleR);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(reticleR - cornerSize, -reticleR);
    ctx.lineTo(reticleR, -reticleR);
    ctx.lineTo(reticleR, -reticleR + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(-reticleR, reticleR - cornerSize);
    ctx.lineTo(-reticleR, reticleR);
    ctx.lineTo(-reticleR + cornerSize, reticleR);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(reticleR - cornerSize, reticleR);
    ctx.lineTo(reticleR, reticleR);
    ctx.lineTo(reticleR, reticleR - cornerSize);
    ctx.stroke();

    // Reticle Tactical Data HUD Tag
    ctx.font = '800 9px Montserrat, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 6;
    ctx.fillText(`TARGET: ${target.name.toUpperCase()}`, reticleR + 10, -6);
    ctx.font = '700 8px Montserrat, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(`ORBIT: ${target.au} AU • ${target.orbitalVelocityKm} KM/S`, reticleR + 10, 6);
    const isTargetUnlocked = target.level <= storage.getUnlockedLevel();
    const isTargetCleared = storage.getLevelStars(target.level) > 0;
    ctx.fillStyle = isTargetCleared ? '#00ffa3' : (isTargetUnlocked ? '#ffe600' : '#ff00aa');
    ctx.fillText(`STATUS: ${isTargetCleared ? 'LIBERATED ★' : (isTargetUnlocked ? 'UNDER SIEGE ⚠️' : 'BLOCKADED 🔒')}`, reticleR + 10, 18);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
