// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { UIController } from '../src/ui/hud.js';
import { GAME_STATES, GameState } from '../src/game/state.js';

describe('UI Overlay Synchronization', () => {
  let mockGameState;
  let container;
  let uiController;

  beforeEach(() => {
    // Setup basic mock DOM
    document.body.innerHTML = '<div id="ui-container"></div>';
    container = document.getElementById('ui-container');

    const mockCanvasManager = {
      virtualWidth: 720,
      virtualHeight: 1280,
      addShake: () => {}
    };
    mockGameState = new GameState(mockCanvasManager);
    uiController = new UIController(container, mockGameState);
  });

  it('should hide all overlays when entering PLAYING state', () => {
    // Start at main menu
    uiController.showMainMenu();
    const menu = document.getElementById('overlay-menu');
    expect(menu.classList.contains('hidden')).toBe(false);

    // Transition to PLAYING
    mockGameState.currentState = GAME_STATES.PLAYING;
    uiController.syncOverlays(GAME_STATES.PLAYING);

    const overlays = [
      'overlay-menu',
      'overlay-level-select',
      'overlay-victory',
      'overlay-defeat',
      'overlay-endless-over',
      'overlay-pause'
    ];

    overlays.forEach(id => {
      const el = document.getElementById(id);
      expect(el.classList.contains('hidden')).toBe(true);
    });
  });

  it('should transition between level select and playing cleanly', () => {
    uiController.showLevelSelect();
    const lvlSelect = document.getElementById('overlay-level-select');
    expect(lvlSelect.classList.contains('hidden')).toBe(false);

    // Verify planetary nodes and hyperspace jump lanes are rendered
    const planets = document.querySelectorAll('.galaxy-planet-node');
    expect(planets.length).toBe(20);

    const lanes = document.querySelectorAll('.hyperspace-lane');
    expect(lanes.length).toBe(19);

    // Start playing
    mockGameState.currentState = GAME_STATES.PLAYING;
    uiController.syncOverlays(GAME_STATES.PLAYING);
    expect(lvlSelect.classList.contains('hidden')).toBe(true);
  });

  it('should display Guardian rank and defense status in main menu', () => {
    uiController.showMainMenu();
    const rankEl = document.getElementById('menu-guardian-rank');
    expect(rankEl).toBeDefined();
    expect(rankEl.textContent).toContain('CADET GUARDIAN');

    const pctEl = document.getElementById('menu-defense-pct');
    expect(pctEl.textContent).toContain('0 / 20 WORLDS');
  });

  it('should populate hostile fleet threat badges in planet briefing', () => {
    const testPlanet = {
      level: 3,
      name: 'Solaria',
      sector: 'SECTOR I',
      sectorName: 'Inner Sanctuaries',
      typeDesc: 'Molten Sunforge Planet',
      target: 14,
      totalSparks: 28,
      taps: 1,
      tip: 'Test tip',
      gradient: 'radial-gradient(#f5af19, #f12711)',
      shadowColor: 'rgba(245, 175, 25, 0.75)',
      types: { NORMAL: 23, MEGA: 5 }
    };

    uiController.openPlanetBriefing(testPlanet);
    const badges = document.querySelectorAll('.threat-badge');
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toContain('Alien Scout');
    expect(badges[1].textContent).toContain('Alien Dreadnought');
  });

  it('should support Quick Jump sector shortcut pills from main menu', () => {
    uiController.showMainMenu();
    const pills = document.querySelectorAll('.shortcut-pill');
    expect(pills.length).toBe(4);

    // Click Sector III pill
    const sec3Pill = Array.from(pills).find(p => p.getAttribute('data-sector') === '3');
    expect(sec3Pill).toBeDefined();

    sec3Pill.click();
    expect(mockGameState.currentState).toBe(GAME_STATES.LEVEL_SELECT);
    expect(document.getElementById('overlay-level-select').classList.contains('hidden')).toBe(false);

    // Verify Sector 3 tab became active in navigation header
    const activeTab = document.querySelector('.sector-tab.active');
    expect(activeTab).toBeDefined();
    expect(activeTab.getAttribute('data-sector')).toBe('sector-3');
  });

  it('should trigger warp sequence when engaging unlocked planet', () => {
    uiController.showLevelSelect();
    const briefingEngage = document.getElementById('btn-briefing-engage');
    expect(briefingEngage).toBeDefined();

    const planet = { level: 1, name: 'Aerilon', sector: 'SECTOR I' };
    uiController.openPlanetBriefing(planet);

    briefingEngage.click();
    // Warp sequence initiated
    expect(mockGameState.starMap.warpTransition).toBeDefined();
    expect(mockGameState.starMap.warpTransition.planet).toBe(planet);

    // Complete warp
    mockGameState.starMap.update(0.4);
    expect(mockGameState.currentState).toBe(GAME_STATES.PLAYING);
  });
});
