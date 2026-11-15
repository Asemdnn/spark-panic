// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEFAULT_SETTINGS as CONFIG_DEFAULT_SETTINGS } from '../src/config.js';
import { saveSystem, DEFAULT_SETTINGS as STORAGE_DEFAULT_SETTINGS } from '../src/engine/storage.js';

describe('Auto-Aim UI, Settings & Controls Suite', () => {
  beforeEach(() => {
    saveSystem.resetAll();
  });

  describe('1. Auto-Aim Settings in DEFAULT_SETTINGS & SaveSystem', () => {
    it('should declare autoAim: true in DEFAULT_SETTINGS across config.js and storage.js', () => {
      expect(CONFIG_DEFAULT_SETTINGS.autoAim).toBe(true);
      expect(STORAGE_DEFAULT_SETTINGS.autoAim).toBe(true);
    });

    it('should return autoAim: true by default from saveSystem.getSettings() and saveSystem.getAutoAim()', () => {
      const s = saveSystem.getSettings();
      expect(s.autoAim).toBe(true);
      expect(saveSystem.getAutoAim()).toBe(true);
    });

    it('should toggle and persist autoAim using setAutoAim() in SaveSystem', () => {
      saveSystem.setAutoAim(false);
      expect(saveSystem.getAutoAim()).toBe(false);
      expect(saveSystem.getSettings().autoAim).toBe(false);

      saveSystem.setAutoAim(true);
      expect(saveSystem.getAutoAim()).toBe(true);
      expect(saveSystem.getSettings().autoAim).toBe(true);
    });
  });

  describe('2. HUD and Settings Modal Controls in index.html', () => {
    let html;

    beforeEach(() => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      html = fs.readFileSync(htmlPath, 'utf-8');
    });

    it('should include #btnAutoAim in index.html with initial text "🎯 AUTO-AIM: ON"', () => {
      expect(html).toContain('id="btnAutoAim"');
      expect(html).toContain('🎯 AUTO-AIM: ON');
    });

    it('should have clean cyan/mint styling on #btnAutoAim', () => {
      const buttonHtmlMatch = html.match(/<button id="btnAutoAim"[^>]*>([\s\S]*?)<\/button>/);
      expect(buttonHtmlMatch).not.toBeNull();
      const buttonTag = buttonHtmlMatch[0];
      // Should have cosmic-cyan or cosmic-mint classes
      expect(buttonTag).toMatch(/cosmic-cyan|cosmic-mint/);
    });

    it('should include Auto-Targeting Lock in #modalSettings with toggle buttons', () => {
      expect(html).toContain('AUTO-TARGETING LOCK');
      expect(html).toContain('id="settingAutoAimBtns"');
      expect(html).toContain('btn-setting-autoaim');
      expect(html).toContain('data-val="true"');
      expect(html).toContain('data-val="false"');
    });
  });

  describe('3. Dynamic UI synchronization logic', () => {
    it('should correctly format button text and classes based on autoAim state', () => {
      document.body.innerHTML = `
        <button id="btnAutoAim">🎯 AUTO-AIM: ON</button>
        <div id="settingAutoAimBtns">
          <button data-val="true" class="btn-setting-autoaim">ON</button>
          <button data-val="false" class="btn-setting-autoaim">OFF</button>
        </div>
      `;

      // Helper function mirroring main.js logic
      function updateAutoAimButton(enabled) {
        const btn = document.getElementById('btnAutoAim');
        if (!btn) return;
        const isAim = enabled !== false;
        btn.textContent = isAim ? '🎯 AUTO-AIM: ON' : '🎯 AUTO-AIM: OFF';
        btn.className = isAim ? 'auto-aim-on text-cosmic-cyan' : 'auto-aim-off text-slate-400';
      }

      function syncSettingsUI() {
        const autoAimActive = saveSystem.getAutoAim();
        document.querySelectorAll('.btn-setting-autoaim').forEach(btn => {
          const val = (btn.getAttribute('data-val') === 'true');
          const active = (autoAimActive === val);
          btn.classList.toggle('active', active);
        });
      }

      // Initial state
      saveSystem.setAutoAim(true);
      updateAutoAimButton(saveSystem.getAutoAim());
      syncSettingsUI();

      expect(document.getElementById('btnAutoAim').textContent).toBe('🎯 AUTO-AIM: ON');
      expect(document.querySelector('.btn-setting-autoaim[data-val="true"]').classList.contains('active')).toBe(true);
      expect(document.querySelector('.btn-setting-autoaim[data-val="false"]').classList.contains('active')).toBe(false);

      // Toggle off
      saveSystem.setAutoAim(false);
      updateAutoAimButton(saveSystem.getAutoAim());
      syncSettingsUI();

      expect(document.getElementById('btnAutoAim').textContent).toBe('🎯 AUTO-AIM: OFF');
      expect(document.querySelector('.btn-setting-autoaim[data-val="true"]').classList.contains('active')).toBe(false);
      expect(document.querySelector('.btn-setting-autoaim[data-val="false"]').classList.contains('active')).toBe(true);
    });
  });
});
