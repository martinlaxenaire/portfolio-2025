import type { ColorPalette } from "@martinlaxenaire/color-palette-generator";

export interface SceneParams {
  container: HTMLElement;
  progress?: number;
  palette?: ColorPalette;
  colors?: ColorModelBase[];
}

export class Scene {
  #progress: number;
  container: HTMLElement;
  colors: ColorModelBase[];
  isVisible: boolean;

  constructor({ container, progress = 0, colors = [] }: SceneParams) {
    this.container = container;
    this.colors = colors;
    this.#progress = progress;
    this.isVisible = true;
  }

  onResize() {}

  onRender() {}

  setSceneVisibility(isVisible: boolean = true) {
    this.isVisible = isVisible;
  }

  setColors(colors: ColorModelBase[]) {
    this.colors = colors;
  }

  get progress(): number {
    return this.#progress;
  }

  set progress(value: number) {
    this.#progress = isNaN(value) ? 0 : value;
    this.onProgress();
  }

  forceProgressUpdate(progress: number = 0) {
    this.progress = progress;
  }

  lerp(start = 0, end = 1, amount = 0.1) {
    return (1 - amount) * start + amount * end;
  }

  onProgress() {}

  destroy() {}
}
