// Spark Panic - Main Game Bootstrap & Loop

import { CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT } from './config.js';
import { CanvasManager } from './engine/canvas.js';
import { InputManager } from './engine/input.js';
import { audio } from './engine/audio.js';
import { GameState, GAME_STATES } from './game/state.js';
import { UIController } from './ui/hud.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvasElement = document.getElementById('game-canvas');
  const uiContainer = document.getElementById('ui-layer');

  // Initialize Canvas & Coordinate Engine
  const canvasManager = new CanvasManager(canvasElement, CANVAS_VIRTUAL_WIDTH, CANVAS_VIRTUAL_HEIGHT);

  // Initialize Game State & Simulation
  const gameState = new GameState(canvasManager);

  // Initialize UI & Overlays
  const uiController = new UIController(uiContainer, gameState);

  // Initialize Unified Input
  const inputManager = new InputManager(canvasElement, canvasManager);

  inputManager.onTap((coords) => {
    if (gameState.currentState === GAME_STATES.PLAYING) {
      gameState.handleTap(coords);
    }
  });

  inputManager.onPointerDown((clientX, clientY) => {
    if (gameState.currentState === GAME_STATES.LEVEL_SELECT) {
      gameState.starMap.handlePointerDown(clientX, clientY);
    }
  });

  inputManager.onPointerMove((clientX, clientY) => {
    if (gameState.currentState === GAME_STATES.LEVEL_SELECT) {
      gameState.starMap.handlePointerMove(clientX, clientY);
    }
  });

  inputManager.onPointerUp((clientX, clientY) => {
    if (gameState.currentState === GAME_STATES.LEVEL_SELECT) {
      const selected = gameState.starMap.handlePointerUp(clientX, clientY);
      if (selected && gameState.starMap.selectedPlanet) {
        audio.init();
        audio.playTap();
        uiController.openPlanetBriefing(gameState.starMap.selectedPlanet);
      }
    }
  });

  inputManager.onWheel((deltaY) => {
    if (gameState.currentState === GAME_STATES.LEVEL_SELECT) {
      gameState.starMap.handleWheel(deltaY);
    }
  });

  inputManager.onRestart(() => {
    if (gameState.currentState === GAME_STATES.PLAYING) {
      gameState.restartCurrent();
    }
  });

  inputManager.onPause(() => {
    if (gameState.currentState === GAME_STATES.PLAYING || gameState.currentState === GAME_STATES.PAUSED) {
      gameState.togglePause();
    }
  });

  inputManager.onMute(() => {
    const isMuted = audio.toggleMute();
    const soundBtn = document.getElementById('btn-sound-toggle');
    if (soundBtn) soundBtn.textContent = isMuted ? '🔇' : '🔊';
  });

  // Start at Main Menu
  uiController.showMainMenu();

  // Notify YouTube Playables SDK if running inside YouTube container
  try {
    if (typeof window !== 'undefined' && window.ytgame?.game) {
      window.ytgame.game.firstFrameReady?.();
      window.ytgame.game.gameReady?.();
    }
  } catch (e) {
    console.debug('YouTube Playables SDK hook notice:', e);
  }

  // Core Game Loop
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Simulation & Physics
    gameState.update(dt);
    canvasManager.update(dt);

    // Render Canvas
    if (gameState.currentState === GAME_STATES.LEVEL_SELECT) {
      gameState.starMap.render(canvasManager.ctx);
    } else if (gameState.currentState === GAME_STATES.MENU) {
      gameState.starMap.renderAmbientBackground(canvasManager.ctx);
    } else {
      canvasManager.beginRender();
      gameState.render(canvasManager.ctx);
      canvasManager.endRender();
    }

    // Sync HUD & DOM Overlays
    uiController.updateHUD();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
