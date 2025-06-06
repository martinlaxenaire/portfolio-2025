import { chromeuxreport_v1 } from "googleapis";
import { Scene, type SceneParams } from "../Scene";
import { gsap } from "gsap";
import { ColorModel } from "@martinlaxenaire/color-palette-generator";

export interface CanvasThemeButtonSceneParams extends SceneParams {
  isReducedMotion?: boolean;
  theme?: Theme;
}

export class CanvasThemeButtonScene extends Scene {
  isReducedMotion: boolean;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  bgColor!: string;
  color!: ColorModel;

  boundingRect!: DOMRect;

  resizeObserver: ResizeObserver;
  _renderHandler: () => void;

  tween: GSAPTween | null;
  drawValue: number;

  constructor({
    container,
    progress = 0,
    colors = [],
    isReducedMotion = false,
    theme = "light",
  }: CanvasThemeButtonSceneParams) {
    super({ container, progress, colors });

    this.isReducedMotion = isReducedMotion;

    this.canvas = document.createElement("canvas");
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.tween = null;
    this.drawValue = theme === "light" ? 1 : 0;

    this.setColor();
    this.onResize();

    this._renderHandler = this.onRender.bind(this);

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });

    this.resizeObserver.observe(document.body);
  }

  setColor() {
    this.color = new ColorModel(
      window
        .getComputedStyle(document.body)
        .getPropertyValue("--foreground-color")
    );

    this.bgColor = window
      .getComputedStyle(document.body)
      .getPropertyValue("--background-color");
  }

  override onResize() {
    this.boundingRect = this.container.getBoundingClientRect();
    this.canvas.width = this.boundingRect.width * window.devicePixelRatio;
    this.canvas.height = this.boundingRect.height * window.devicePixelRatio;
    this.canvas.style.width = this.boundingRect.width + "px";
    this.canvas.style.height = this.boundingRect.height + "px";

    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.draw();
  }

  setTheme(theme: Theme = "light") {
    this.setColor();

    if (this.isReducedMotion) {
      this.draw(theme === "light" ? 1 : 0);
      return;
    }

    if (this.tween) {
      this.tween.kill();
    }

    this.tween = gsap.to(this, {
      drawValue: theme === "light" ? 1 : 0,
      duration: 0.35,
      onUpdate: () => this.draw(),
      //ease: theme === "light" ? "expo.in" : "expo.inOut",
      ease: "power3.inOut",
    });
  }

  draw(value = this.drawValue) {
    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.height);

    const lineWidth = 2;

    this.ctx.strokeStyle = this.color.hex;
    this.ctx.fillStyle = this.bgColor;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = "round";

    const cx = this.boundingRect.width * 0.5; // Center x
    const cy = this.boundingRect.height * 0.5; // Center y

    const r = this.lerp(
      this.boundingRect.width * 0.4 - lineWidth * 0.5,
      this.boundingRect.width * 0.3 - lineWidth * 0.5,
      value
    );
    //const r = this.boundingRect.width * 0.3 - lineWidth * 0.5;

    const k = 0.5522847498; // Control point offset

    const c = r * k;

    this.ctx.beginPath();

    // Move to the starting point (rightmost point)
    this.ctx.moveTo(cx + r, cy);

    // Top-right quarter
    // moon/sun morphing
    const cp1x = this.lerp(cx + r * k, cx + r, value);
    const cp1y = this.lerp(cy + c * k, cy - c, value);
    const cp2x = this.lerp(cx - r * k, cx + c, value);
    const cp2y = this.lerp(cy + c * k, cy - r, value);

    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cx, cy - r);

    // Top-left quarter
    this.ctx.bezierCurveTo(cx - c, cy - r, cx - r, cy - c, cx - r, cy);

    // Bottom-left quarter
    this.ctx.bezierCurveTo(cx - r, cy + c, cx - c, cy + r, cx, cy + r);

    // Bottom-right quarter
    this.ctx.bezierCurveTo(cx + c, cy + r, cx + r, cy + c, cx + r, cy);

    this.ctx.fill();
    this.ctx.stroke();

    // sun beams

    const startPos = this.boundingRect.width * 0.5 - lineWidth;

    const nbSunBeams = 8;
    const angles = [...Array(nbSunBeams).keys()].map(
      (v) => (-Math.PI * v) / (nbSunBeams * 0.5)
    );

    const mappedSunBeamsValues = Array(nbSunBeams).fill(0);
    const segmentSize = 1 / nbSunBeams;

    let index = Math.floor(value / segmentSize);
    index = Math.min(index, nbSunBeams - 1); // Clamp to max index

    const localValue = (value - index * segmentSize) / segmentSize;

    // Set full 1.0 to all previous segments
    for (let i = 0; i < index; i++) {
      mappedSunBeamsValues[i] = 1;
    }

    // Set interpolated value to current segment
    mappedSunBeamsValues[index] = localValue;

    this.ctx.beginPath();

    angles.forEach((angle, i) => {
      this.ctx.strokeStyle = `rgba(${this.color.rgb.r}, ${this.color.rgb.g}, ${
        this.color.rgb.b
      }, ${Math.pow(mappedSunBeamsValues[i], 0.1)})`;

      const tickLength = this.lerp(
        0,
        this.boundingRect.width * 0.025 - lineWidth,
        mappedSunBeamsValues[i]
      );

      const x1 = cx + Math.cos(angle) * (startPos - tickLength);
      const y1 = cy + Math.sin(angle) * (startPos - tickLength);
      const x2 = cx + Math.cos(angle) * (startPos + tickLength);
      const y2 = cy + Math.sin(angle) * (startPos + tickLength);

      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
    });

    this.ctx.stroke();
  }

  override destroy(): void {
    super.destroy();

    if (this.tween) {
      this.tween.kill();
    }

    this.resizeObserver.disconnect();
  }
}
