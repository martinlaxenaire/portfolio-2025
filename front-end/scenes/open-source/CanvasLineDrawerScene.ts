import { ColorModel } from "@martinlaxenaire/color-palette-generator";
import { gsap } from "gsap";
import { Scene, type SceneParams } from "../Scene";

export interface CanvasLineDrawerSceneParams extends SceneParams {
  onStarted?: () => void;
  onSceneComplete?: () => void;
}

interface PointCoords {
  x: number;
  y: number;
}

export class CanvasLineDrawerScene extends Scene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  boundingRect!: DOMRect;

  color!: ColorModel;

  resizeObserver: ResizeObserver;

  isDrawing: boolean;
  hasStarted: boolean;
  firstPoint: PointCoords;
  secondPoint: PointCoords;

  opacity: number;

  onStarted: () => void;
  onSceneComplete: () => void;

  hideTl!: GSAPTimeline;

  private _pointerMoveHandler: (e: MouseEvent | TouchEvent) => void;
  private _pointerDownHandler: (e: PointerEvent | TouchEvent) => void;
  private _pointerUpHandler: (e: PointerEvent | TouchEvent) => void;

  constructor({
    container,
    progress = 0,
    colors = [],
    onStarted = () => {},
    onSceneComplete = () => {},
  }: CanvasLineDrawerSceneParams) {
    super({ container, progress, colors });

    this.firstPoint = {
      x: 0,
      y: 0,
    };

    this.secondPoint = {
      x: 0,
      y: 0,
    };

    this.isDrawing = false;
    this.hasStarted = false;

    this.onStarted = onStarted;
    this.onSceneComplete = onSceneComplete;

    this.canvas = document.createElement("canvas");
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.color = new ColorModel();
    this.opacity = 1;
    this.setColor();

    this.onResize();

    this.setHideTl();

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });

    this.resizeObserver.observe(document.body);

    this._pointerMoveHandler = this.onPointerMove.bind(this);
    this._pointerDownHandler = this.onPointerDown.bind(this);
    this._pointerUpHandler = this.onPointerUp.bind(this);

    window.addEventListener("mousemove", this._pointerMoveHandler);
    window.addEventListener("touchmove", this._pointerMoveHandler);

    this.container.addEventListener("pointerdown", this._pointerDownHandler);
    this.container.addEventListener("touchstart", this._pointerDownHandler, {
      passive: true,
    });
    this.container.addEventListener("pointerup", this._pointerUpHandler);
    this.container.addEventListener("touchend", this._pointerUpHandler);
  }

  setColor() {
    this.color.hex = window
      .getComputedStyle(document.body)
      .getPropertyValue("--foreground-color");
  }

  setTheme() {
    this.setColor();
  }

  setHideTl() {
    this.hideTl = gsap
      .timeline({
        paused: true,
      })
      .to(this, {
        opacity: 0,
        duration: 0.5,
        onUpdate: this.draw.bind(this),
      });
  }

  override onResize() {
    super.onResize();
    const boundingRect = this.container.getBoundingClientRect();

    if (
      this.boundingRect &&
      boundingRect.width === this.boundingRect.width &&
      boundingRect.height === this.boundingRect.height
    ) {
      return;
    }

    this.boundingRect = boundingRect;
    this.canvas.width = this.boundingRect.width * window.devicePixelRatio;
    this.canvas.height = this.boundingRect.height * window.devicePixelRatio;
    this.canvas.style.width = this.boundingRect.width + "px";
    this.canvas.style.height = this.boundingRect.height + "px";

    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  setPointCoords(e: MouseEvent | TouchEvent, point = this.firstPoint) {
    // TODO better?
    const boundingRect = this.container.getBoundingClientRect();

    const { clientX, clientY } =
      "targetTouches" in e && e.targetTouches.length
        ? (e.targetTouches[0] as Touch)
        : (e as MouseEvent);

    point.x = clientX - boundingRect.left;
    point.y = clientY - boundingRect.top;
  }

  get lineLength(): number {
    return Math.hypot(
      this.firstPoint.x - this.secondPoint.x,
      this.firstPoint.y - this.secondPoint.y
    );
  }

  get minSize(): number {
    return Math.min(this.boundingRect.width, this.boundingRect.height);
  }

  get minDrawSize(): number {
    return 20;
  }

  get minCompleteSize(): number {
    return this.minSize * 0.425;
  }

  get minStartSize(): number {
    return Math.min(this.minCompleteSize * 0.5, 150);
  }

  onPointerMove(e: MouseEvent | TouchEvent) {
    if (this.isDrawing) {
      this.setPointCoords(e, this.secondPoint);
      this.draw();

      if (this.lineLength >= this.minDrawSize) {
        this.hideTl.kill();
        this.opacity = 1;
      }

      if (this.lineLength >= this.minStartSize) {
        this.hasStarted = true;
        this.onStarted();
      }
    }
  }

  onPointerDown(e: PointerEvent | TouchEvent) {
    this.isDrawing = true;
    this.setPointCoords(e, this.firstPoint);
    this.onPointerMove(e);
  }

  onPointerUp(e: PointerEvent | TouchEvent) {
    const wasDrawing = this.isDrawing;

    this.isDrawing = false;
    this.hasStarted = false;

    if (wasDrawing) {
      this.onStopDrawing();
    }
  }

  onStopDrawing() {
    if (this.lineLength >= this.minCompleteSize) {
      this.onSceneComplete();
    }

    this.hideTl.restart(true);
  }

  draw() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.height);

    if (this.lineLength < this.minDrawSize) return;

    let opacity = this.opacity * 0.5;

    if (this.lineLength > this.minCompleteSize && this.isDrawing) {
      opacity += 0.5;
    }

    this.ctx.strokeStyle = `rgba(${Math.round(this.color.rgb.r)}, ${Math.round(
      this.color.rgb.g
    )}, ${Math.round(this.color.rgb.b)}, ${opacity.toFixed(2)})`;
    this.ctx.lineCap = "round";
    this.ctx.lineWidth =
      Math.max(this.boundingRect.width, this.boundingRect.height) * 0.005;

    this.ctx.beginPath();
    this.ctx.moveTo(this.firstPoint.x, this.firstPoint.y);
    this.ctx.lineTo(this.secondPoint.x, this.secondPoint.y);
    this.ctx.stroke();
  }

  override destroy(): void {
    super.destroy();
    this.resizeObserver.disconnect();

    this.hideTl.kill();

    window.removeEventListener("mousemove", this._pointerMoveHandler);
    window.removeEventListener("touchmove", this._pointerMoveHandler);

    this.container.removeEventListener("pointerdown", this._pointerDownHandler);
    this.container.removeEventListener("touchstart", this._pointerDownHandler, {
      passive: true,
    } as unknown as EventListenerOptions);
    this.container.removeEventListener("pointerup", this._pointerUpHandler);
    this.container.removeEventListener("touchend", this._pointerUpHandler);
  }
}
