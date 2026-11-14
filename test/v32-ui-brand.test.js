// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_SETTINGS as CONFIG_DEFAULT_SETTINGS } from '../src/config.js';
import { saveSystem, DEFAULT_SETTINGS as STORAGE_DEFAULT_SETTINGS } from '../src/engine/storage.js';
import { BattleCardGenerator } from '../src/ui/battle-card.js';

describe('Spark Panic v3.2: UI, Settings & Branding Suite', () => {
  beforeEach(() => {
    saveSystem.resetAll();
  });

  describe('1. Graphics Settings Toggles in DEFAULT_SETTINGS & Storage', () => {
    it('should declare volumetricNebula, crtPostProcessing, and hullDebrisShards in DEFAULT_SETTINGS with default true', () => {
      // In src/config.js
      expect(CONFIG_DEFAULT_SETTINGS.volumetricNebula).toBe(true);
      expect(CONFIG_DEFAULT_SETTINGS.crtPostProcessing).toBe(true);
      expect(CONFIG_DEFAULT_SETTINGS.hullDebrisShards).toBe(true);

      // In src/engine/storage.js
      expect(STORAGE_DEFAULT_SETTINGS.volumetricNebula).toBe(true);
      expect(STORAGE_DEFAULT_SETTINGS.crtPostProcessing).toBe(true);
      expect(STORAGE_DEFAULT_SETTINGS.hullDebrisShards).toBe(true);
    });

    it('should load default graphics settings from saveSystem.getSettings()', () => {
      const s = saveSystem.getSettings();
      expect(s.volumetricNebula).toBe(true);
      expect(s.crtPostProcessing).toBe(true);
      expect(s.hullDebrisShards).toBe(true);
    });

    it('should allow toggling and persisting graphics settings in saveSystem', () => {
      saveSystem.updateSettings({ volumetricNebula: false });
      expect(saveSystem.getSettings().volumetricNebula).toBe(false);
      expect(saveSystem.getVolumetricNebula()).toBe(false);

      saveSystem.setVolumetricNebula(true);
      expect(saveSystem.getVolumetricNebula()).toBe(true);

      saveSystem.setCrtPostProcessing(false);
      expect(saveSystem.getCrtPostProcessing()).toBe(false);
      expect(saveSystem.getSettings().crtPostProcessing).toBe(false);

      saveSystem.setHullDebrisShards(false);
      expect(saveSystem.getHullDebrisShards()).toBe(false);
      expect(saveSystem.getSettings().hullDebrisShards).toBe(false);
    });
  });

  describe('2. Mecha-Cockpit Visor HUD, Typography & Settings Modal in index.html', () => {
    let html;

    beforeEach(() => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      html = fs.readFileSync(htmlPath, 'utf-8');
    });

    it('should declare page title and version badges for v3.2 Hyper-VFX & Nebula Shader Edition', () => {
      expect(html).toContain('Spark Panic: Planetary Invasion Defense — ✨ v3.2 Hyper-VFX & Nebula Shader Edition');
      expect(html).toContain('✨ v3.2 HYPER-VFX & NEBULA SHADER EDITION');
    });

    it('should contain glowing SVG corner brackets and tactical status readouts in cockpit visor reticle', () => {
      expect(html).toContain('id="cockpitVisorReticle"');
      expect(html).toContain('pointer-events-none');
      expect(html).toContain('hud-svg-corner');
      expect(html).toContain('visor-status-readout');

      // Calibration degree ticks
      expect(html).toContain('000°');
      expect(html).toContain('045°');
      expect(html).toContain('090°');
      expect(html).toContain('180°');
      expect(html).toContain('225°');
      expect(html).toContain('270°');

      // Tactical status readouts
      expect(html).toContain('OPTIC.V32');
      expect(html).toContain('NEBULA-SHADER');
      expect(html).toContain('TARGET.MATRIX');
      expect(html).toContain('AEGIS.PRISM');
      expect(html).toContain('SHARDS-ACTIVE');
      expect(html).toContain('RASTER-CURVATURE');
    });

    it('should define combat floater text and typography glow styles in CSS', () => {
      expect(html).toContain('.combat-floater-text');
      expect(html).toContain('.visor-status-readout');
      expect(html).toContain('.hud-svg-corner');
      expect(html).toContain('.text-glow-crimson');
      expect(html).toContain('.text-glow-mint');
      expect(html).toContain('.text-glow-purple');
      expect(html).toContain('.text-glow-amber');
    });

    it('should declare settings toggle controls for volumetricNebula, crtPostProcessing, and hullDebrisShards in #modalSettings', () => {
      expect(html).toContain('id="modalSettings"');
      expect(html).toContain('id="settingNebulaBtns"');
      expect(html).toContain('btn-setting-nebula');
      expect(html).toContain('VOLUMETRIC COSMIC NEBULAE');

      expect(html).toContain('id="settingCrtBtns"');
      expect(html).toContain('btn-setting-crt');
      expect(html).toContain('CRT & CINEMATIC SHADERS');

      expect(html).toContain('id="settingDebrisBtns"');
      expect(html).toContain('btn-setting-debris');
      expect(html).toContain('HULL DEBRIS FRAGMENTATION');
    });
  });

  describe('3. Shareable Battle Card v3.2 Branding', () => {
    it('should declare v3.2 Hyper-VFX & Nebula Shader Edition header and share text in battle-card.js', () => {
      const cardPath = path.resolve(__dirname, '../src/ui/battle-card.js');
      const cardSrc = fs.readFileSync(cardPath, 'utf-8');

      expect(cardSrc).toContain('✨ v3.2 HYPER-VFX & NEBULA SHADER EDITION');
    });
  });

  describe('4. README.md Documentation', () => {
    it('should document v3.2 graphics upgrades, volumetric nebulae, and shader features in README.md', () => {
      const readmePath = path.resolve(__dirname, '../README.md');
      const readmeSrc = fs.readFileSync(readmePath, 'utf-8');

      expect(readmeSrc).toContain('✨ v3.2 Hyper-VFX & Nebula Shader Edition');
      expect(readmeSrc).toContain('What\'s New in v3.2: Hyper-VFX & Nebula Shader Edition');
      expect(readmeSrc).toContain('Multi-Octave Volumetric Cosmic Nebulae');
      expect(readmeSrc).toContain('Planetary Atmospheric Weather Shaders & Dynamic Rayleigh Glow');
      expect(readmeSrc).toContain('Polygonal Hull Fragmentation Physics & Shard Ricochets');
      expect(readmeSrc).toContain('Multi-Layer Weapon Core VFX & Projectile Shaders');
      expect(readmeSrc).toContain('Enhanced Cinematic Post-Processing & CRT Shaders');
      expect(readmeSrc).toContain('Granular Graphics Settings & Chamfered Mecha-Cockpit Visor Polish');
    });
  });
});
