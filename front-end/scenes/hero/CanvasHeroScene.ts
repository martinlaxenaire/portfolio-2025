import { Scene, type SceneParams } from "../Scene";
import { gsap } from "gsap";

export interface CanvasHeroSceneParams extends SceneParams {
  isReducedMotion?: boolean;
  onStart?: () => void;
}

export class CanvasHeroScene extends Scene {
  isReducedMotion: boolean;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  boundingRect!: DOMRect;

  bgColor!: string;

  hasBeenVisible: boolean;
  showProgress: number;
  showTl!: GSAPTimeline;
  onStart: () => void;

  time: number;

  resizeObserver: ResizeObserver;
  _renderHandler: () => void;

  constructor({
    container,
    progress = 0,
    colors = [],
    isReducedMotion = false,
    onStart = () => {},
  }: CanvasHeroSceneParams) {
    super({ container, progress, colors });

    this.hasBeenVisible = false;
    this.showProgress = 0;
    this.onStart = onStart;

    this.isReducedMotion = isReducedMotion;

    this.time = 0;

    this.canvas = document.createElement("canvas");
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.onResize();
    this.setBgColor();

    this._renderHandler = this.onRender.bind(this);

    if (this.isReducedMotion) {
      this.draw();
      this.onStart();
    } else {
      gsap.ticker.add(this._renderHandler);
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });

    this.resizeObserver.observe(document.body);

    this.setShowTl();
  }

  setBgColor() {
    this.bgColor = window
      .getComputedStyle(document.body)
      .getPropertyValue("--background-color");

    if (this.isReducedMotion) {
      this.draw();
    }
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

    this.setClipPath();

    if (this.isReducedMotion) {
      this.draw();
    }
  }

  setShowTl() {
    if (this.isReducedMotion) {
      this.showProgress = 1;
      this.progress = 1;
      this.draw();
    }

    this.showTl = gsap
      .timeline({
        paused: true,
        delay: 0.2,
        onStart: () => this.onStart(),
      })
      .to(this, {
        showProgress: 1,
        duration: 1.5,
        ease: "expo.out",
        onUpdate: this.setClipPath.bind(this),
      });
  }

  override setSceneVisibility(isVisible = false) {
    if (!this.hasBeenVisible && isVisible) {
      this.hasBeenVisible = true;
      this.showTl.restart(true);
    }

    super.setSceneVisibility(isVisible);
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    if (this.isReducedMotion) {
      this.draw();
    }
  }

  override onRender() {
    if (!this.isVisible) return;

    this.draw();
  }

  override onProgress(): void {
    super.onProgress();

    this.setClipPath();
  }

  setClipPath() {
    if (!this.boundingRect) return;

    const { left, width, height } = this.boundingRect;
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    const progress = this.showProgress * 0.75 + this.progress * 0.25;

    this.container.style.clipPath = `rect(${halfHeight * (1 - progress)}px ${
      halfWidth + halfWidth * progress
    }px ${halfHeight + halfHeight * progress}px ${
      halfWidth * (1 - progress)
    }px round ${left}px)`;
  }

  draw() {
    if (!this.ctx) return;

    const speed = 0.005;

    const numTriangles = 3; // Number of times to repeat the color set

    const centerX = this.boundingRect.width * 0.5;
    const centerY = this.boundingRect.height * 0.5;

    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.height);

    const size =
      Math.hypot(
        this.boundingRect.right - this.boundingRect.left,
        this.boundingRect.bottom - this.boundingRect.top
      ) * 0.5;

    //const radius = size * progress; // Fit within canvas

    let angle = -Math.PI - this.time * speed; // Start from -PI like WGSL

    const fillColorRatio = 5;
    const nbColors = this.colors.length;
    const totalGroups = numTriangles * nbColors; // Number of color+white groups
    const segmentSize = (Math.PI * 2) / (totalGroups * fillColorRatio); // Base unit size

    for (let i = 0; i < totalGroups; i++) {
      let colorIndex = i % nbColors;
      let startAngle = angle;
      let endAngle = angle + segmentSize * (fillColorRatio - 1); // Large colored triangle

      // **Draw colored triangle**
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, size, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = this.colors[colorIndex].hex;
      this.ctx.fill();

      angle = endAngle; // Move angle forward

      // **Draw thin white triangle**
      startAngle = angle;
      endAngle = angle + segmentSize; // Small white triangle

      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, size, startAngle, endAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = this.bgColor;
      this.ctx.fill();

      angle = endAngle; // Move angle forward
    }

    if (!this.isReducedMotion) {
      this.time++;
    }
  }

  override destroy() {
    super.destroy();
    this.showTl?.kill();
    gsap.ticker.remove(this._renderHandler);
    this.resizeObserver.disconnect();
  }
}
