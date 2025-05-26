import type { FPSWatcherParams } from "./FPSWatcher";
import FPSWatcher from "./FPSWatcher";

export interface QualityManagerParams {
  label?: string;
  updateDelay?: FPSWatcherParams["updateDelay"];
  targetFPS?: number;
  onQualityChange?: (newQuality: number) => void;
}

export class QualityManager {
  label: string;
  fpsWatcher: FPSWatcher;
  targetFPS: number;
  #lastFPS: number | null;
  #active: boolean;
  onQualityChange: (newQuality: number) => void;

  quality: {
    current: number;
    min: number;
    max: number;
  };

  constructor({
    label = "Quality manager",
    updateDelay = 1000,
    targetFPS = 60,
    onQualityChange = (newQuality) => {},
  }: QualityManagerParams = {}) {
    this.label = label;
    this.onQualityChange = onQualityChange;

    this.quality = {
      min: 0,
      max: 10,
      current: 7,
    };

    this.#active = true;

    this.targetFPS = targetFPS;
    this.#lastFPS = null;

    this.fpsWatcher = new FPSWatcher({
      updateDelay,
      onWatch: (averageFPS) => this.onFPSWatcherUpdate(averageFPS),
    });
  }

  get active() {
    return this.#active;
  }

  set active(value: boolean) {
    if (!this.active && value) {
      this.fpsWatcher.restart();
    }

    this.#active = value;
  }

  onFPSWatcherUpdate(averageFPS = 0) {
    const lastFpsRatio = this.#lastFPS
      ? Math.round(averageFPS / this.#lastFPS)
      : 1;
    const fpsRatio = (averageFPS + lastFpsRatio) / this.targetFPS;

    // if fps ratio is over 0.95, we should increase
    // else we decrease
    const boostedFpsRatio = fpsRatio / 0.95;

    // smooth change multiplier avoid huge changes in quality
    // except if we've seen a big change from last FPS values
    const smoothChangeMultiplier = 0.5 * lastFpsRatio;

    // quality difference that should be applied (number with 2 decimals)
    const qualityDiff =
      Math.round((boostedFpsRatio - 1) * 100) * 0.1 * smoothChangeMultiplier;

    if (Math.abs(qualityDiff) > 0.25) {
      const newQuality = Math.min(
        Math.max(
          this.quality.current + Math.round(qualityDiff),
          this.quality.min
        ),
        this.quality.max
      );

      this.setCurrentQuality(newQuality);
    }

    this.#lastFPS = averageFPS;
  }

  setCurrentQuality(newQuality: number) {
    this.quality.current = newQuality;
    this.onQualityChange(this.quality.current);
  }

  update() {
    if (this.active) {
      this.fpsWatcher.update();
    }
  }
}
