import type { GithubContribution } from "../../server/api/github";
import { Scene, type SceneParams } from "../Scene";
import { CanvasLineDrawerScene } from "./CanvasLineDrawerScene";
import { gsap } from "gsap";

export interface CanvasOpenSourceSceneParams extends SceneParams {
  isReducedMotion?: boolean;
  contributions?: GithubContribution[];
  onStarted?: () => void;
  onSceneComplete?: () => void;
}

export class CanvasOpenSourceScene extends Scene {
  isReducedMotion: boolean;
  contributions: GithubContribution[];

  instancesCount: number;
  instancesPerContribution: number;
  contributionsCounts: number[];
  activeInstances: boolean[];

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  boundingRect!: DOMRect;
  resizeObserver: ResizeObserver;

  params!: {
    globalRotation: number;
    globalZoom: number;
    nbSinusoids: number;
    nbLines: number;

    turbulenceExp: number;
    turbulenceStrength: {
      x: number;
      y: number;
    };

    maxLineLength: number;
    minLineLength: number;
    lineLengthRatio: number;

    maxLineWidth: number;
    minLineWidth: number;
    lineWidthRatio: number;

    heightRatio: number;

    attenuationCenter: number;
    rotateCanvas: boolean;

    positions: Array<Array<{ x: number; y: number }>>;
  };

  contributionsDrawOrder!: Array<{
    colorIndex: number;
    position: {
      x: number;
      y: number;
    };
  }>;

  lineDrawerScene: CanvasLineDrawerScene | null;

  constructor({
    container,
    progress = 0,
    colors = [],
    isReducedMotion = false,
    contributions = [],
    onStarted = () => {},
    onSceneComplete = () => {},
  }: CanvasOpenSourceSceneParams) {
    super({ container, progress, colors });

    this.isReducedMotion = isReducedMotion;
    this.contributions = contributions;

    this.instancesPerContribution = 5;
    this.instancesCount = this.contributions.reduce(
      (acc, v) => acc + v.count * this.instancesPerContribution,
      0
    );

    this.contributionsCounts = this.contributions.map((c) => c.count);
    this.activeInstances = this.contributions.map((c, i) => true);

    if (!this.instancesCount) {
      this.instancesCount = 5_000;
    }

    this.canvas = document.createElement("canvas");
    this.container.appendChild(this.canvas);

    this.onResize();

    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });

    this.resizeObserver.observe(document.body);

    this.lineDrawerScene = null;
    if (!this.isReducedMotion) {
      this.lineDrawerScene = new CanvasLineDrawerScene({
        container,
        progress,
        colors,
        onStarted,
        onSceneComplete: () => {
          onSceneComplete();
          this.rotateSceneFromLineDraw();
        },
      });
    }

    this.draw();
  }

  override onResize() {
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
    this.canvas.width = this.boundingRect.width;
    this.canvas.height = this.boundingRect.height;

    this.setParams();

    if (this.ctx) {
      this.draw();
    }
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    this.draw();
  }

  setTheme() {
    this.lineDrawerScene?.setTheme();

    this.draw();
  }

  toggleParticleInstance(index = 0) {
    this.activeInstances[index] = !this.activeInstances[index];

    this.draw();
  }

  setParams() {
    const maxLineWidth =
      Math.max(this.boundingRect.width, this.boundingRect.height) / 100;
    const minLineWidth =
      Math.min(this.boundingRect.width, this.boundingRect.height) / 200;

    this.params = {
      // noise / flow field generation
      globalRotation: (Math.random() * Math.PI) / 4 - Math.PI / 8,
      globalZoom: Math.random() * 0.45 + 0.55,
      nbSinusoids: Math.random() * 3.5 + 1.5,
      nbLines: Math.random() * 3 + 5,

      turbulenceExp: Math.round(Math.random() * 3) + 2,
      turbulenceStrength: {
        x: Math.random() * 0.005 + 0.005,
        y: Math.random() * 0.005 + 0.005,
      },

      maxLineLength: this.boundingRect.width / 10,
      minLineLength: this.boundingRect.width / 100,
      lineLengthRatio: Math.random() * 0.65 + 0.25,

      maxLineWidth,
      minLineWidth,
      lineWidthRatio: Math.random() * 0.15 + 0.7,

      heightRatio: Math.random() * 0.25 + 0.7,

      attenuationCenter: Math.random(),
      rotateCanvas: Math.random() > 0.5,

      positions: this.contributionsCounts.map((count) => {
        return Array.from({ length: count }, () => {
          return {
            x:
              Math.random() * (this.boundingRect.width + maxLineWidth * 2) -
              maxLineWidth,
            y:
              Math.random() * (this.boundingRect.height + maxLineWidth * 2) -
              maxLineWidth,
          };
        });
      }),
    };

    this.contributionsDrawOrder = [];

    this.params.positions.forEach((positions, i) => {
      positions.forEach((position, j) => {
        this.contributionsDrawOrder.push({
          colorIndex: i,
          position,
        });
      });
    });

    this.contributionsDrawOrder.sort(
      (a, b) =>
        Math.random() +
        a.colorIndex / this.contributions.length -
        (Math.random() + b.colorIndex / this.contributions.length)
    );
  }

  rotateSceneFromLineDraw() {
    if (this.lineDrawerScene) {
      const { firstPoint, secondPoint } = this.lineDrawerScene;

      const lineDiff = {
        x: firstPoint.x - secondPoint.x,
        y: firstPoint.y - secondPoint.y,
      };

      this.params.globalRotation = Math.atan2(lineDiff.y, lineDiff.x);

      this.params.rotateCanvas =
        this.params.globalRotation <= Math.PI * 0.5 &&
        this.params.globalRotation >= -Math.PI * 0.5;

      this.params.attenuationCenter =
        Math.abs(lineDiff.y) > Math.abs(lineDiff.x) ? 1 : 0;

      this.draw();
    }
  }

  // return distance to horizontal center mapped from 0 to 1
  getDistanceToHorizCenter(xPos = 0) {
    const distanceFromRight =
      (this.boundingRect.width - xPos) / this.boundingRect.width;
    return Math.abs(distanceFromRight - 0.5) * 2;
  }

  // return distance to vertical center mapped from 0 to 1
  getDistanceToVertCenter(yPos = 0) {
    const distanceFromBottom =
      (this.boundingRect.height - yPos) / this.boundingRect.height;
    return Math.abs(distanceFromBottom - 0.5) * 2;
  }

  rotatePoint(
    point = { x: 0, y: 0 },
    center = { x: 0, y: 0 },
    angle = 0
  ): { x: number; y: number } {
    const s = Math.sin(angle);
    const c = Math.cos(angle);

    // translate point back to origin:
    point.x -= center.x;
    point.y -= center.y;

    // rotate point
    const xnew = point.x * c - point.y * s;
    const ynew = point.x * s + point.y * c;

    // translate point back:
    point.x = xnew + center.x;
    point.y = ynew + center.y;
    return point;
  }

  getValue(x = 0, y = 0): number {
    const rotatedPoint = this.rotatePoint(
      { x, y },
      {
        //x: this.params.rotateCanvas ? this.boundingRect.width : 0,
        x: this.boundingRect.width * 0.5,
        y: this.boundingRect.height * 0.5,
      },
      -this.params.globalRotation
    );

    const xRatio = this.params.rotateCanvas
      ? 1 - rotatedPoint.x / this.boundingRect.width
      : rotatedPoint.x / this.boundingRect.width;
    const yRatio = rotatedPoint.y / this.boundingRect.height;

    const sinusoidFromLeftToRight =
      Math.pow(xRatio, 2) *
      this.params.globalRotation *
      this.params.nbSinusoids *
      2;

    const verticalSpreadFromLeft =
      (yRatio * 2 - 1) * 2 * (1 + xRatio * this.params.nbLines) +
      this.params.globalRotation;

    const value =
      (Math.cos(sinusoidFromLeftToRight) + verticalSpreadFromLeft) *
      this.params.globalZoom;

    const rightTurbulences =
      Math.pow(xRatio, this.params.turbulenceExp) *
      (Math.sin(x * this.params.turbulenceStrength.x) +
        Math.cos(y * this.params.turbulenceStrength.y)) *
      2;

    return value + rightTurbulences;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.boundingRect.width, this.boundingRect.height);

    for (let i = 0; i < this.contributionsDrawOrder.length; i++) {
      const confetti = this.contributionsDrawOrder[i];
      const { colorIndex, position } = confetti;

      if (!this.activeInstances[colorIndex]) {
        continue;
      }

      const { x, y } = position;

      const value = this.getValue(x, y);

      const rotation = Math.sin(value) * 0.5;

      this.ctx.save();

      this.ctx.translate(x, y);
      this.ctx.rotate(rotation);

      const xRatio = x / this.boundingRect.width;

      const getEffectStrength = (max = 1, min = 0, rotationDecrease = 1) => {
        let xCenter = 1 - xRatio;

        if (this.params.attenuationCenter > 0.5) {
          xCenter = 1 - this.getDistanceToHorizCenter(x);
        } else if (this.params.rotateCanvas) {
          xCenter = 1 - xCenter;
        }

        const effect =
          max *
            xCenter *
            (1 - this.getDistanceToVertCenter(y) * this.params.heightRatio) -
          rotation *
            rotationDecrease *
            (max *
              xCenter *
              (1 - this.getDistanceToVertCenter(y) * this.params.heightRatio) -
              min);

        return Math.min(max, Math.max(effect, min));
      };

      const lineLength = getEffectStrength(
        this.params.maxLineLength,
        this.params.minLineLength,
        this.params.lineLengthRatio
      );
      const lineWidth = getEffectStrength(
        this.params.maxLineWidth,
        this.params.minLineWidth,
        this.params.lineWidthRatio
      );

      this.ctx.lineWidth = lineWidth;

      const color = this.colors[colorIndex];

      this.ctx.strokeStyle = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);

      // const direction =
      //   Math.cos(value) * Math.sign(Math.sin(value));

      //const direction = directionSign * Math.sign(Math.sin(value));
      const direction = this.params.rotateCanvas
        ? Math.sign(Math.sin(value))
        : Math.sign(Math.cos(value));

      const bezier = {
        cp1: {
          x: lineLength * 0.3,
          y:
            (0.5 * (-direction * lineWidth * lineLength)) /
            (this.params.maxLineLength - this.params.minLineLength),
        },
        cp2: {
          x: lineLength * 0.7,
          y:
            (0.5 * (-direction * lineWidth * lineLength)) /
            (this.params.maxLineLength - this.params.minLineLength),
        },
        p: {
          x: lineLength,
          y: 0,
        },
      };

      this.ctx.bezierCurveTo(
        bezier.cp1.x,
        bezier.cp1.y, // first control point
        bezier.cp2.x,
        bezier.cp2.y, // second control point
        bezier.p.x,
        bezier.p.y
      );

      // this.ctx.lineTo(lineLength, 0);

      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  override destroy() {
    super.destroy();
    this.resizeObserver.disconnect();
    this.lineDrawerScene?.destroy();
  }
}
