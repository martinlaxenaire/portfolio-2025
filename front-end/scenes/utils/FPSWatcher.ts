export interface FPSWatcherParams {
  updateDelay?: number;
  onWatch?: (averageFPS: number) => void;
}

export default class FPSWatcher {
  updateDelay: number;
  onWatch: (averageFPS: number) => void;

  frames: number[];
  lastTs: number;
  elapsedTime: number;
  average: number;

  constructor({
    updateDelay = 1000, // ms
    onWatch = () => {}, // callback called every ${updateDelay}ms
  }: FPSWatcherParams = {}) {
    this.updateDelay = updateDelay;
    this.onWatch = onWatch;

    this.frames = [];

    this.lastTs = performance.now();
    this.elapsedTime = 0;

    this.average = 0;
  }

  restart() {
    this.frames = [];
    this.elapsedTime = 0;
    this.lastTs = performance.now();
  }

  update() {
    const delta = performance.now() - this.lastTs;
    this.lastTs = performance.now();
    this.elapsedTime += delta;

    this.frames.push(delta);

    if (this.elapsedTime > this.updateDelay) {
      const framesTotal = this.frames.reduce((a, b) => a + b, 0);

      this.average = (this.frames.length * 1000) / framesTotal;

      this.frames = [];
      this.elapsedTime = 0;

      this.onWatch(this.average);
    }
  }
}
