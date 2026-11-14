// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { GameEngine } from '../src/game/engine.js';
import { Alien } from '../src/game/alien.js';
import { ParticleEngine } from '../src/game/particles.js';
import { saveSystem, DEFAULT_SETTINGS } from '../src/engine/storage.js';
import { DEFAULT_SETTINGS as CONFIG_DEFAULT_SETTINGS } from '../src/config.js';

describe('Spark Panic v3.1: Prismatic Art Direction Suite', () => {
  let engine;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      closePath: vi.fn(),
      clip: vi.fn(),
      setLineDash: vi.fn(),
      setTransform: vi.fn(),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      measureText: vi.fn(() => ({ width: 60 }))
    };

    mockCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn(() => mockCtx)
    };

    engine = new GameEngine(mockCanvas);
  });

  describe('1. Reactive Spacetime Gravity Grid (22x14 vertex mesh)', () => {
    it('should initialize a 22x14 vertex lattice with 308 vertices covering viewport', () => {
      expect(engine.spacetimeGrid).toBeDefined();
      expect(engine.spacetimeGrid.cols).toBe(22);
      expect(engine.spacetimeGrid.rows).toBe(14);
      expect(engine.spacetimeGrid.length).toBe(22 * 14);
      expect(engine.spacetimeGrid.vertices.length).toBe(308);

      const first = engine.spacetimeGrid[0];
      expect(first.c).toBe(0);
      expect(first.r).toBe(0);
      expect(first.baseX).toBe(0);
      expect(first.baseY).toBe(0);
      expect(first.x).toBe(0);
      expect(first.y).toBe(0);
      expect(first.vx).toBe(0);
      expect(first.vy).toBe(0);
      expect(first.displacement).toBe(0);

      const last = engine.spacetimeGrid[engine.spacetimeGrid.length - 1];
      expect(last.c).toBe(21);
      expect(last.r).toBe(13);
      expect(last.baseX).toBeCloseTo(engine.width);
      expect(last.baseY).toBeCloseTo(engine.height);
    });

    it('should pull spacetime grid vertices inward toward central Planet gravity funnel', () => {
      const cx = engine.planet.x;
      const cy = engine.planet.y;

      // Find vertex to the right of planet
      const v = engine.spacetimeGrid.find(pt => pt.baseX > cx + 40 && pt.baseX < cx + 160 && Math.abs(pt.baseY - cy) < 40);
      expect(v).toBeDefined();
      const initialDist = Math.hypot(v.x - cx, v.y - cy);

      engine.updateSpacetimeGrid(0.016);

      const newDist = Math.hypot(v.x - cx, v.y - cy);
      // Pulled inward toward center
      expect(newDist).toBeLessThan(initialDist);
      expect(v.displacement).toBeGreaterThan(0);
    });

    it('should deform toward active Bosses, Wormholes, and Grav-Well Anchors', () => {
      // 1. Boss pull
      const boss = new Alien(600, 300, 'BOSS');
      engine.aliens.push(boss);

      const vNearBoss = engine.spacetimeGrid.find(pt => Math.hypot(pt.baseX - 600, pt.baseY - 300) < 80);
      expect(vNearBoss).toBeDefined();
      const initialDistBoss = Math.hypot(vNearBoss.x - 600, vNearBoss.y - 300);

      engine.updateSpacetimeGrid(0.016);
      const newDistBoss = Math.hypot(vNearBoss.x - 600, vNearBoss.y - 300);
      expect(newDistBoss).toBeLessThan(initialDistBoss);

      // 2. Wormhole pull (alpha portal)
      engine.initSpacetimeGrid();
      engine.aliens = [];
      engine.wormholes = {
        life: 15,
        a: { x: 200, y: 150, radius: 28 },
        b: { x: 650, y: 450, radius: 28 }
      };
      const vNearWhA = engine.spacetimeGrid.find(pt => Math.hypot(pt.baseX - 200, pt.baseY - 150) < 60);
      expect(vNearWhA).toBeDefined();
      const initialDistWhA = Math.hypot(vNearWhA.x - 200, vNearWhA.y - 150);

      engine.updateSpacetimeGrid(0.016);
      expect(Math.hypot(vNearWhA.x - 200, vNearWhA.y - 150)).toBeLessThan(initialDistWhA);

      // 3. Grav-Well Anchor pull
      engine.initSpacetimeGrid();
      engine.wormholes = null;
      engine.structures = {
        structures: [
          { alive: true, type: 'anchor', x: 250, y: 450 }
        ]
      };
      const vNearAnchor = engine.spacetimeGrid.find(pt => Math.hypot(pt.baseX - 250, pt.baseY - 450) < 60);
      expect(vNearAnchor).toBeDefined();
      const initialDistAnchor = Math.hypot(vNearAnchor.x - 250, vNearAnchor.y - 450);

      engine.updateSpacetimeGrid(0.016);
      expect(Math.hypot(vNearAnchor.x - 250, vNearAnchor.y - 450)).toBeLessThan(initialDistAnchor);
    });

    it('should push spacetime grid outward from active Novas, EMP, and Cataclysms with restoring spring force', () => {
      // 1. Novas push outward
      engine.particles.spawnNova(300, 300, 100, '#00e5ff', 35, true);
      const nova = engine.particles.novas[0];
      nova.radius = 45;

      const vNearNova = engine.spacetimeGrid.find(pt => {
        const d = Math.hypot(pt.baseX - 300, pt.baseY - 300);
        return Math.abs(d - 45) < 20;
      });
      expect(vNearNova).toBeDefined();

      const initialDist = Math.hypot(vNearNova.x - 300, vNearNova.y - 300);
      engine.updateSpacetimeGrid(0.016);
      const newDist = Math.hypot(vNearNova.x - 300, vNearNova.y - 300);

      // Pushed outward
      expect(newDist).toBeGreaterThan(initialDist);

      // 2. EMP shockwave push outward
      engine.initSpacetimeGrid();
      engine.particles.novas = [];
      engine.skills = { empActive: true, empRadius: 70, empOriginX: 500, empOriginY: 200 };
      const vNearEmp = engine.spacetimeGrid.find(pt => {
        const d = Math.hypot(pt.baseX - 500, pt.baseY - 200);
        return Math.abs(d - 70) < 25;
      });
      expect(vNearEmp).toBeDefined();
      const initialDistEmp = Math.hypot(vNearEmp.x - 500, vNearEmp.y - 200);
      engine.updateSpacetimeGrid(0.016);
      expect(Math.hypot(vNearEmp.x - 500, vNearEmp.y - 200)).toBeGreaterThan(initialDistEmp);

      // 3. Cataclysm shockwave push outward
      engine.initSpacetimeGrid();
      engine.skills.empActive = false;
      const px = engine.planet ? engine.planet.x : engine.width * 0.5;
      const py = engine.planet ? engine.planet.y : engine.height * 0.53;
      engine.cataclysmShockwave = { radius: 90 };
      const vNearCata = engine.spacetimeGrid.find(pt => {
        const d = Math.hypot(pt.baseX - px, pt.baseY - py);
        return Math.abs(d - 90) < 25;
      });
      expect(vNearCata).toBeDefined();
      const initialDistCata = Math.hypot(vNearCata.x - px, vNearCata.y - py);
      engine.updateSpacetimeGrid(0.016);
      expect(Math.hypot(vNearCata.x - px, vNearCata.y - py)).toBeGreaterThan(initialDistCata);

      // 4. Restoring spring force: clear forces and update over multiple frames
      engine.particles.novas = [];
      engine.skills.empActive = false;
      engine.cataclysmShockwave = null;
      for (let i = 0; i < 40; i++) {
        engine.updateSpacetimeGrid(0.016);
      }
      expect(Math.abs(vNearCata.x - vNearCata.baseX)).toBeLessThan(5);
    });

    it('should draw warped spacetime grid lines with tension brightness colors', () => {
      // Artificially give some vertices different displacements to exercise tension coloring
      engine.spacetimeGrid[10].displacement = 2; // low (< 4) -> cyan
      engine.spacetimeGrid[20].displacement = 7; // medium (< 10) -> magenta
      engine.spacetimeGrid[30].displacement = 14; // high (>= 10) -> gold

      engine.drawWarpedSpacetimeGrid(mockCtx);
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('2. Faceted Stained-Glass Planet & Alien Ships (drawPlanetEntity & Ship Hull)', () => {
    it('should render faceted stained-glass planet with glowing seams and 4 cyber-cities', () => {
      expect(typeof engine.drawPlanetEntity).toBe('function');
      expect(typeof engine.planet.drawPlanetEntity).toBe('function');

      engine.drawPlanetEntity(mockCtx);

      // Assertions verifying clipping, tectonic plate fills, glowing seams, terminator, and cyber-city silhouettes
      expect(mockCtx.clip).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.createRadialGradient).toHaveBeenCalled();
    });

    it('should calculate nearest bright light angle toward central planet or active nova', () => {
      const scout = new Alien(600, 300, 'SCOUT');
      const lightAngle = scout.getNearestLightAngle(engine);
      expect(typeof lightAngle).toBe('number');

      // Relative light angle incorporates ship heading
      const relAngle = scout.getRelativeLightAngle(engine);
      expect(typeof relAngle).toBe('number');
      expect(relAngle).toBe(lightAngle - scout.heading);

      // Nearest active nova takes precedence if closer than planet
      engine.particles.spawnNova(590, 300, 80, '#ffd700');
      const novaLightAngle = scout.getNearestLightAngle(engine);
      expect(novaLightAngle).toBeCloseTo(Math.PI, 1); // Nova is to the left (dx < 0)
    });

    it('should calculate 2.5D rim-lighting highlights along forward-facing edges', () => {
      const scout = new Alien(500, 300, 'SCOUT');
      const edges = [
        { x1: 10, y1: -10, x2: 10, y2: 10 },
        { x1: -10, y1: 10, x2: -10, y2: -10 }
      ];
      mockCtx.stroke.mockClear();
      scout.drawRimLighting(mockCtx, edges, 0); // light from right (angle 0)
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should render twin articulated diamond vector exhaust plumes', () => {
      const scout = new Alien(400, 300, 'SCOUT');
      mockCtx.fill.mockClear();
      scout.drawTwinExhaustPlumes(mockCtx, -15, 8, 16, 7, 1.25, '#00e5ff');
      // Plumes render outer diamond and inner white core diamond
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.closePath).toHaveBeenCalled();
    });

    it('should render all 10 alien classes with obsidian chassis and diamond exhaust plumes', () => {
      const classes = ['SCOUT', 'INTERCEPTOR', 'CRYO', 'PHASE', 'DROPSHIP', 'DREADNOUGHT', 'BOSS', 'JAMMER', 'WEAVER', 'GALLEON'];
      classes.forEach(cls => {
        const alien = new Alien(300, 300, cls);
        mockCtx.stroke.mockClear();
        mockCtx.fill.mockClear();
        alien.render(mockCtx, engine, 1.0);
        expect(mockCtx.stroke).toHaveBeenCalled();
        expect(mockCtx.fill).toHaveBeenCalled();
      });
    });

    it('should adapt ship chassis fill and outline according to artStyle (astral, vector, comic)', () => {
      const alien = new Alien(300, 300, 'SCOUT');

      // Astral style
      engine.artStyle = 'astral';
      mockCtx.fill.mockClear();
      alien.render(mockCtx, engine, 1.0);
      expect(mockCtx.fill).toHaveBeenCalled();

      // Vector style (transparent chassis fill)
      engine.artStyle = 'vector';
      mockCtx.stroke.mockClear();
      alien.render(mockCtx, engine, 1.0);
      expect(mockCtx.stroke).toHaveBeenCalled();

      // Comic style
      engine.artStyle = 'comic';
      mockCtx.stroke.mockClear();
      alien.render(mockCtx, engine, 1.0);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('3. Nova Mandalas, Halftone Dots, Chromatic Aberration offset & Impact Frames', () => {
    it('should render expanding Nova mandalas and halftone energy dots', () => {
      const pe = new ParticleEngine();
      pe.spawnNova(400, 300, 100, '#00e5ff', 35, true, 1);
      pe.update(0.016, 400, 300, 80, []);

      expect(pe.novas[0].rotation).toBeGreaterThan(0);

      pe.render(mockCtx, 'astral');
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should render chromatic RGB ghost rings for x5+ combo Novas', () => {
      const pe = new ParticleEngine();
      pe.spawnNova(400, 300, 100, '#00e5ff', 35, true, 6); // combo = 6 >= 5

      pe.render(mockCtx, 'astral');
      // Should have rendered offset cyan and magenta rings (-2.5 and +2.5 px)
      expect(mockCtx.arc).toHaveBeenCalledWith(397.5, 300, expect.any(Number), 0, Math.PI * 2);
      expect(mockCtx.arc).toHaveBeenCalledWith(402.5, 300, expect.any(Number), 0, Math.PI * 2);
    });

    it('should render comic action bubbles for floaters in comic mode', () => {
      const pe = new ParticleEngine();
      pe.addFloater(350, 250, '💥 CRITICAL BREACH!', '#ffd700', 16);
      mockCtx.rect.mockClear();
      pe.render(mockCtx, 'comic');
      expect(mockCtx.rect).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalledWith('💥 CRITICAL BREACH!', 350, expect.any(Number));
    });

    it('should trigger impact flash on Perfect Parry, Crit Breach, and Cataclysm', () => {
      expect(engine.impactFlash).toBe(0);
      expect(engine.battle.impactFlash).toBe(0);

      // 1. Perfect Parry trigger
      engine.onPerfectParry(450, 300, 20);
      expect(engine.impactFlash).toBe(0.035);
      expect(engine.battle.impactFlash).toBe(0.035);

      // Update timer decay
      engine.update(0.02);
      expect(engine.impactFlash).toBeCloseTo(0.015, 3);
      expect(engine.battle.impactFlash).toBeCloseTo(0.015, 3);

      engine.update(0.02);
      expect(engine.impactFlash).toBe(0);

      // 2. Crit Breach trigger
      const mockAlien = { x: 350, y: 250 };
      engine.onCritBreach(mockAlien);
      expect(engine.impactFlash).toBe(0.035);
      expect(engine.impactFlashOrigin.x).toBe(350);
      expect(engine.impactFlashOrigin.y).toBe(250);

      // 3. Cataclysm trigger
      engine.state = 'PLAYING';
      engine.coreCharge = 100;
      engine.triggerPlanetaryCataclysm();
      expect(engine.impactFlash).toBe(0.035);
    });

    it('should render radial speed lines and starburst spikes during impact frames', () => {
      engine.triggerImpactFlash(400, 300);
      expect(engine.impactFlash).toBe(0.035);
      engine.drawImpactFrames(mockCtx);
      expect(mockCtx.fill).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
  });

  describe('4. Visual Art Style Switcher & Persistence Pipeline', () => {
    it('should declare artStyle in DEFAULT_SETTINGS with default value astral', () => {
      expect(DEFAULT_SETTINGS.artStyle).toBe('astral');
      expect(CONFIG_DEFAULT_SETTINGS.artStyle).toBe('astral');
    });

    it('should persist and retrieve artStyle in saveSystem', () => {
      saveSystem.setArtStyle('vector');
      expect(saveSystem.getArtStyle()).toBe('vector');

      saveSystem.setArtStyle('comic');
      expect(saveSystem.getArtStyle()).toBe('comic');

      saveSystem.setArtStyle('astral');
      expect(saveSystem.getArtStyle()).toBe('astral');

      // Invalid input should default to astral
      saveSystem.setArtStyle('invalid_style');
      expect(saveSystem.getArtStyle()).toBe('astral');
    });

    it('should sync engine.artStyle with saveSystem via engine.setArtStyle', () => {
      engine.setArtStyle('vector');
      expect(engine.artStyle).toBe('vector');
      expect(saveSystem.getArtStyle()).toBe('vector');

      engine.setArtStyle('comic');
      expect(engine.artStyle).toBe('comic');
      expect(saveSystem.getArtStyle()).toBe('comic');

      engine.setArtStyle('astral');
      expect(engine.artStyle).toBe('astral');
      expect(saveSystem.getArtStyle()).toBe('astral');
    });

    it('should execute battle scene rendering across all 3 art styles without error', () => {
      ['astral', 'vector', 'comic'].forEach(style => {
        engine.setArtStyle(style);
        expect(() => engine.drawBattleScene(mockCtx)).not.toThrow();
      });
    });
  });

  describe('5. Mecha-Cockpit HUD Chamfer Styles & v3.1 Version Badge DOM Assertions', () => {
    it('index.html should declare .cyber-chamfer polygon clipping style and corner bracket accents', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toContain('.cyber-chamfer');
      expect(html).toContain('clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)');
      expect(html).toContain('.cyber-chamfer::before');
      expect(html).toContain('.cyber-chamfer::after');
    });

    it('index.html should contain Mecha-Cockpit Visor Reticle with tactical degree ticks', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      expect(html).toContain('id="cockpitVisorReticle"');
      expect(html).toContain('pointer-events-none');
      expect(html).toContain('000°');
      expect(html).toContain('045°');
      expect(html).toContain('090°');
      expect(html).toContain('180°');
      expect(html).toContain('225°');
      expect(html).toContain('270°');
    });

    it('index.html should contain #btnArtStyle quick-toggle and settings modal style selectors', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      // Top HUD quick-toggle button
      expect(html).toContain('id="btnArtStyle"');
      expect(html).toContain('STYLE: ASTRAL');

      // Settings Modal selector buttons
      expect(html).toContain('data-val="astral"');
      expect(html).toContain('data-val="vector"');
      expect(html).toContain('data-val="comic"');
      expect(html).toContain('btn-setting-style');
    });

    it('index.html should declare v3.1 Prismatic Art Edition badges in title and title screen', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(htmlPath, 'utf-8');

      // Page Title
      expect(html).toMatch(/(🎨 v3\.1 Prismatic Art|✨ v3\.2 Hyper-VFX & Nebula Shader) Edition/i);

      // Title Screen Badge
      expect(html).toMatch(/(🎨 v3\.1 PRISMATIC ART|✨ v3\.2 HYPER-VFX & NEBULA SHADER) EDITION/);
    });

    it('battle-card.js should declare v3.1 or v3.2 Edition headers and share text', () => {
      const cardPath = path.resolve(__dirname, '../src/ui/battle-card.js');
      const cardSrc = fs.readFileSync(cardPath, 'utf-8');

      expect(cardSrc).toMatch(/(🎨 v3\.1 PRISMATIC ART|✨ v3\.2 HYPER-VFX & NEBULA SHADER) EDITION/);
    });

    it('README.md should document v3.1 Prismatic Art Edition systems and style switcher', () => {
      const readmePath = path.resolve(__dirname, '../README.md');
      const readme = fs.readFileSync(readmePath, 'utf-8');

      expect(readme).toMatch(/(🎨 v3\.1 Prismatic Art|✨ v3\.2 Hyper-VFX & Nebula Shader) Edition/i);
      expect(readme).toContain('Dynamic Spacetime Gravity Grid');
      expect(readme).toContain('22x14 Orbital Vertex Lattice');
      expect(readme).toContain('Faceted Stained-Glass Aesthetic & 2.5D Directional Rim-Lighting');
      expect(readme).toContain('Geometric Nova Mandalas & Halftone Energy Perimeters');
      expect(readme).toContain('Visual Art Style Switcher & Pipeline');
      expect(readme).toContain('ASTRAL');
      expect(readme).toContain('VECTOR');
      expect(readme).toContain('COMIC');
      expect(readme).toContain('Mecha-Cockpit HUD Framing & Visor Reticle');
    });
  });
});
