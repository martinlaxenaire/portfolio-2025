import { Scene, type SceneParams } from "../Scene";
import type { InvoicesData } from "~/server/api/google-sheets";
import { gsap } from "gsap";

export interface CanvasInvoicesSceneParams extends SceneParams {
  isReducedMotion?: boolean;
  invoices?: InvoicesData;
  onStarted?: () => void;
  onAttractionComplete?: () => void;
}

export class CanvasInvoicesScene extends Scene {
  isReducedMotion: boolean;

  invoices: number[];
  circles!: Array<{
    x: number;
    y: number;
    r: number;
    growPowSpeed: number;
    color: string;
    time: number;
    timeScale: number;
  }>;

  onStarted: () => void;
  onAttractionComplete: () => void;

  bgColor!: string;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  boundingRect!: DOMRect;

  hasFirstAttraction: boolean;
  isAttracting: boolean;
  attractionComplete: boolean;
  currentAttraction: number;

  private _pointerDownHandler: (e: PointerEvent | TouchEvent) => void;
  private _pointerUpHandler: (e: PointerEvent | TouchEvent) => void;

  resizeObserver: ResizeObserver;
  _renderHandler: () => void;

  constructor({
    container,
    progress = 0,
    colors = [],
    invoices = [],
    isReducedMotion = false,
    onStarted = () => {},
    onAttractionComplete = () => {},
  }: CanvasInvoicesSceneParams) {
    super({ container, progress, colors });

    this.isReducedMotion = isReducedMotion;

    if (!invoices.length) {
      invoices = Array.from({ length: 150 }, () =>
        Math.floor(Math.random() * 4900 + 100).toString()
      );
    }

    this.invoices = invoices.flat().map((v) => parseInt(v));

    this.onStarted = onStarted;
    this.onAttractionComplete = onAttractionComplete;

    this.hasFirstAttraction = false;
    this.isAttracting = false;
    this.attractionComplete = false;
    this.currentAttraction = this.isReducedMotion ? 1 : 0;

    this.canvas = document.createElement("canvas");
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.setBgColor();
    this.onResize();

    this._renderHandler = this.onRender.bind(this);

    if (this.isReducedMotion) {
      this.draw();
    } else {
      gsap.ticker.add(this._renderHandler);
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });

    this.resizeObserver.observe(document.body);

    this._pointerDownHandler = this.onPointerDown.bind(this);
    this._pointerUpHandler = this.onPointerUp.bind(this);

    this.container.addEventListener("pointerdown", this._pointerDownHandler);
    this.container.addEventListener("touchstart", this._pointerDownHandler);
    this.container.addEventListener("pointerup", this._pointerUpHandler);
    this.container.addEventListener("touchend", this._pointerUpHandler);

    //this.draw();
  }

  setBgColor() {
    this.bgColor = window
      .getComputedStyle(document.body)
      .getPropertyValue("--background-color");
  }

  onPointerDown(e: PointerEvent | TouchEvent) {
    this.isAttracting = true;
  }

  onPointerUp(e: PointerEvent | TouchEvent) {
    this.isAttracting = false;
  }

  override onResize(): void {
    super.onResize();

    const boundingRect = this.container.getBoundingClientRect();

    if (
      this.boundingRect &&
      this.boundingRect.width === boundingRect.width &&
      this.boundingRect.height === boundingRect.height
    ) {
      return;
    }

    this.boundingRect = boundingRect;
    this.canvas.width = this.boundingRect.width * window.devicePixelRatio;
    this.canvas.height = this.boundingRect.height * window.devicePixelRatio;
    this.canvas.style.width = this.boundingRect.width + "px";
    this.canvas.style.height = this.boundingRect.height + "px";

    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const fillRatio = 0.7;

    const usableArea =
      this.boundingRect.width * this.boundingRect.height * fillRatio;
    const normalizedAreas = this.invoices.map((v) => Math.sqrt(v));
    const totalNorm = normalizedAreas.reduce((a, b) => a + b, 0);
    const scale = Math.sqrt(usableArea / (Math.PI * totalNorm));

    const radii = this.invoices.map((v, i) => normalizedAreas[i] * scale);

    this.circles = [];

    const isOverlapping = (x: number, y: number, r: number): boolean => {
      for (const c of this.circles) {
        const dx = x - c.x;
        const dy = y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r + c.r + 1) return true; // +1 padding
      }
      return false;
    };

    this.invoices.forEach((value, i) => {
      // const r = mapValueToRadius(value);
      const r = radii[i] * 0.1;

      let x, y;
      let tries = 0;
      do {
        x = Math.random() * (this.boundingRect.width - 2 * r) + r;
        y = Math.random() * (this.boundingRect.height - 2 * r) + r;
        tries++;
      } while (isOverlapping(x, y, r) && tries < 500);

      if (tries < 500) {
        const color =
          this.colors[Math.ceil(Math.random() * this.colors.length - 1)];
        this.circles.push({
          x,
          y,
          r,
          color: color.hex,
          growPowSpeed: 0.5 + Math.random() * 2,
          time: Math.random() * 3,
          timeScale: 0.001 + Math.random() * 0.015,
        });
      }
    });

    if (this.ctx && this.isReducedMotion) {
      this.draw();
    }
  }

  updateTheme() {
    this.setBgColor();

    if (this.circles.length) {
      this.circles.forEach((c) => {
        const color =
          this.colors[Math.ceil(Math.random() * this.colors.length - 1)];
        c.color = color.hex;
      });
    }

    if (this.isReducedMotion) {
      this.draw();
    }
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    if (this.circles.length) {
      this.circles.forEach((c) => {
        const color =
          this.colors[Math.ceil(Math.random() * this.colors.length - 1)];
        c.color = color.hex;
      });
    }

    if (this.isReducedMotion) {
      this.draw();
    }
  }

  override onRender() {
    if (!this.isVisible) return;

    this.currentAttraction = this.isAttracting
      ? Math.min(1, this.currentAttraction + 0.005)
      : Math.max(0, this.currentAttraction - 0.025);

    if (
      this.isAttracting &&
      !this.hasFirstAttraction &&
      this.currentAttraction > 0.1
    ) {
      this.hasFirstAttraction = true;
      this.onStarted();
    }

    if (
      this.isAttracting &&
      !this.attractionComplete &&
      this.currentAttraction === 1
    ) {
      this.attractionComplete = true;
      this.onAttractionComplete();
    }

    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.height);

    for (const c of this.circles) {
      const attraction = Math.pow(this.currentAttraction, c.growPowSpeed);
      c.time += c.timeScale + c.timeScale * attraction;

      const center = {
        x:
          c.x +
          Math.cos(c.time) * c.r * 0.1 +
          Math.cos(c.time) * c.r * 0.4 * (1.0 - attraction),
        y:
          c.y +
          Math.sin(c.time) * c.r * 0.1 +
          Math.sin(c.time) * c.r * 0.4 * (1.0 - attraction),
      };

      const radius = c.r * 0.5 + c.r * 0.4 * attraction;

      this.ctx.fillStyle = c.color;

      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = this.bgColor;
      this.ctx.font = `${radius * 0.5}px "MonumentExtended Regular", Arial`;

      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";

      this.ctx.fillText("€", center.x, center.y);
    }
  }

  override destroy(): void {
    super.destroy();

    this.container.removeEventListener("pointerdown", this._pointerDownHandler);
    this.container.removeEventListener("touchstart", this._pointerDownHandler);
    this.container.removeEventListener("pointerup", this._pointerUpHandler);
    this.container.removeEventListener("touchend", this._pointerUpHandler);

    gsap.ticker.remove(this._renderHandler);
    this.resizeObserver.disconnect();
  }
}
