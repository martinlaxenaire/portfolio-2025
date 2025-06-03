import { Scene, type SceneParams } from "../Scene";
import {
  ColorModel,
  type ColorPalette,
} from "@martinlaxenaire/color-palette-generator";
import { gsap } from "gsap";

export interface CanvasSeparatorSceneParams extends SceneParams {
  isReducedMotion?: boolean;
  fillColorRatio?: number;
  theme?: Theme;
  invertColors?: boolean;
}

export class CanvasSeparatorScene extends Scene {
  isReducedMotion: boolean;
  fillColorRatio: number;
  theme: Theme;
  invertColors: boolean;

  orderedPalette!: Array<ColorModel | ColorModelBase>;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  shown: boolean;
  isComplete: boolean;

  timeline: GSAPTimeline | null;

  drawValues: Array<{ value: number }>;

  resizeObserver: ResizeObserver;

  constructor({
    container,
    progress = 0,
    colors = [],
    isReducedMotion = false,
    fillColorRatio = 2,
    theme = "light",
    invertColors = false,
  }: CanvasSeparatorSceneParams) {
    super({ container, progress, colors });

    this.theme = theme;

    this.isReducedMotion = isReducedMotion;
    this.fillColorRatio = fillColorRatio;

    this.invertColors = invertColors;

    this.isVisible = false;
    this.shown = false;
    this.isComplete = false;

    this.canvas = document.createElement("canvas");
    this.container.appendChild(this.canvas);

    this.onResize();

    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.applyColors();
    this.drawValues = Array.from(Array(this.orderedPalette.length)).map(() => {
      return { value: 0 };
    });

    this.timeline = null;

    if (this.isReducedMotion) {
      this.drawValues.forEach((v) => (v.value = 1));
      this.draw();
    } else {
      this.timeline = gsap.timeline({
        paused: true,
        delay: 0.2,
        onUpdate: () => this.draw(),
        onComplete: () => {
          this.isComplete = true;
        },
      });

      this.timeline.to(this.drawValues, {
        value: 1,
        duration: 1.5,
        stagger: 0.1,
        ease: "expo.out",
      });
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();

      if (this.isReducedMotion || this.isComplete) {
        this.draw();
      }
    });

    this.resizeObserver.observe(document.body);
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    this.applyColors();
    this.draw();
  }

  applyColors() {
    const bodyStyles = window.getComputedStyle(document.body);
    const foregroundColor = bodyStyles.getPropertyValue("--foreground-color");
    const foregroundColorModel = new ColorModel(foregroundColor);

    const palette = [...this.colors];
    // const palette = [...this.colors].flatMap((i) => [i, i]);

    if (this.theme === "light") {
      this.orderedPalette = [foregroundColorModel, ...palette];
    } else {
      this.orderedPalette = [foregroundColorModel, ...[...palette].reverse()];
    }

    this.orderedPalette = this.orderedPalette.flatMap((color, i) =>
      i > palette.length * 0.5 ? [color, color] : [color]
    );

    // invert colors on the opposite of the flag
    // since they are drawn in the inverse order after that
    if (!this.invertColors) {
      this.orderedPalette.reverse();
    }

    // duplicate items
    // this.orderedPalette = this.orderedPalette.flatMap((i) => [i, i]);
  }

  setTheme(theme: Theme = "light") {
    this.theme = theme;
    this.applyColors();
    this.draw();
  }

  override onResize() {
    const boundingRect = this.container.getBoundingClientRect();
    this.canvas.width = boundingRect.width;
    this.canvas.height = boundingRect.height;
  }

  override setSceneVisibility(isVisible = false) {
    this.isVisible = isVisible;

    if (this.isVisible && !this.shown) {
      this.timeline?.restart(true);

      this.shown = true;
    }
  }

  draw() {
    // Compute the total number of sections (colored + black)
    const numColorBands = this.orderedPalette.length;
    const numBlackBands = this.fillColorRatio > 0 ? numColorBands - 1 : 0;
    const numBands = numColorBands + numBlackBands;

    // Compute relative height proportions
    const totalUnit =
      this.fillColorRatio > 0
        ? numColorBands * this.fillColorRatio + numBlackBands
        : numColorBands;
    const unitHeight = this.canvas.height / totalUnit;

    // Draw quadrilaterals
    let yOffset = this.invertColors ? this.canvas.height : 0;
    let bandIndex = this.invertColors ? numColorBands - 1 : 0;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < numBands; i++) {
      const colorModulo = this.fillColorRatio > 0 ? 2 : 1;

      const isColor = i % colorModulo === 0;

      const bandRatio = ((2 - 1 / numBands) * (i + 1)) / numBands;

      const bandHeight =
        isColor && this.fillColorRatio > 0
          ? this.fillColorRatio * unitHeight * bandRatio
          : unitHeight * (2 - bandRatio);

      const firstY = yOffset;
      const secondY = this.invertColors
        ? firstY - bandHeight
        : firstY + bandHeight;

      if (isColor) {
        const color = this.invertColors
          ? this.orderedPalette[
              numColorBands - 1 - (Math.floor(i / colorModulo) % numColorBands)
            ].hex
          : this.orderedPalette[Math.floor(i / colorModulo) % numColorBands]
              .hex;

        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.moveTo(-1, firstY);
        this.ctx.lineTo(
          (this.canvas.width + 1) * this.drawValues[bandIndex].value,
          firstY
        );
        this.ctx.lineTo(
          (this.canvas.width + 1) * this.drawValues[bandIndex].value,
          secondY
        );
        this.ctx.lineTo(-1, secondY);
        this.ctx.closePath();
        this.ctx.fill();

        bandIndex = this.invertColors ? bandIndex - 1 : bandIndex + 1;
      }

      yOffset = secondY;
    }
  }

  override destroy() {
    //gsap.ticker.remove(this._renderHandler);
    this.timeline?.kill();
    this.resizeObserver.disconnect();
  }
}
