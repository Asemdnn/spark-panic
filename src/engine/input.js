// Spark Panic - Unified Pointer & Keyboard Input Handler

export class InputManager {
  constructor(canvasElement, canvasManager) {
    this.canvas = canvasElement;
    this.canvasManager = canvasManager;
    this.onTapCallback = null;
    this.onRestartCallback = null;
    this.onPauseCallback = null;
    this.onMuteCallback = null;

    this.initListeners();
  }

  initListeners() {
    // Pointerdown handles both touch, mouse click, and stylus seamlessly
    this.canvas.addEventListener('pointerdown', (e) => {
      // Prevent default pinch-zoom or scrolling on touch devices
      e.preventDefault();
      const coords = this.canvasManager.screenToVirtual(e.clientX, e.clientY);
      if (this.onTapCallback) {
        this.onTapCallback(coords);
      }
    }, { passive: false });

    // Keyboard shortcuts for desktop players on YouTube web
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'r') {
        if (this.onRestartCallback) this.onRestartCallback();
      } else if (key === 'p' || key === 'escape') {
        if (this.onPauseCallback) this.onPauseCallback();
      } else if (key === 'm') {
        if (this.onMuteCallback) this.onMuteCallback();
      }
    });
  }

  onTap(callback) {
    this.onTapCallback = callback;
  }

  onRestart(callback) {
    this.onRestartCallback = callback;
  }

  onPause(callback) {
    this.onPauseCallback = callback;
  }

  onMute(callback) {
    this.onMuteCallback = callback;
  }
}
