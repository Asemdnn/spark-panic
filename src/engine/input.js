// Spark Panic - Unified Pointer & Keyboard Input Handler

export class InputManager {
  constructor(canvasElement, canvasManager) {
    this.canvas = canvasElement;
    this.canvasManager = canvasManager;
    this.onTapCallback = null;
    this.onRestartCallback = null;
    this.onPauseCallback = null;
    this.onMuteCallback = null;

    this.onPointerDownCallback = null;
    this.onPointerMoveCallback = null;
    this.onPointerUpCallback = null;
    this.onWheelCallback = null;

    this.touchPinchStartDist = 0;

    this.initListeners();
  }

  initListeners() {
    // Pointerdown handles touch, mouse click, and stylus seamlessly
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.onPointerDownCallback) {
        this.onPointerDownCallback(e.clientX, e.clientY, e);
      }
      const coords = this.canvasManager.screenToVirtual(e.clientX, e.clientY);
      if (this.onTapCallback) {
        this.onTapCallback(coords, e);
      }
    }, { passive: false });

    window.addEventListener('pointermove', (e) => {
      if (this.onPointerMoveCallback) {
        this.onPointerMoveCallback(e.clientX, e.clientY, e);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (this.onPointerUpCallback) {
        this.onPointerUpCallback(e.clientX, e.clientY, e);
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.onWheelCallback) {
        this.onWheelCallback(e.deltaY, e);
      }
    }, { passive: false });

    // Touch pinch handling for mobile zooming in Star Map
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 2) {
        this.touchPinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length === 2 && this.touchPinchStartDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = this.touchPinchStartDist - currentDist;
        if (Math.abs(diff) > 3 && this.onWheelCallback) {
          this.onWheelCallback(diff * 1.5, e);
          this.touchPinchStartDist = currentDist;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.touchPinchStartDist = 0;
    }, { passive: true });

    // Keyboard shortcuts for desktop players
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

  onPointerDown(callback) {
    this.onPointerDownCallback = callback;
  }

  onPointerMove(callback) {
    this.onPointerMoveCallback = callback;
  }

  onPointerUp(callback) {
    this.onPointerUpCallback = callback;
  }

  onWheel(callback) {
    this.onWheelCallback = callback;
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
