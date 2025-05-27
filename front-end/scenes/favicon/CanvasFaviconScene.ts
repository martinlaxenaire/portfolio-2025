import { Scene, type SceneParams } from "../Scene";

export class CanvasFaviconScene extends Scene {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;

  strokeColor: string;

  size: number;

  constructor({ container, progress = 0, colors = [] }: SceneParams) {
    super({ container, progress, colors });

    this.size = 512;

    this.canvas = new OffscreenCanvas(this.size, this.size);
    this.ctx = this.canvas.getContext(
      "2d"
    ) as OffscreenCanvasRenderingContext2D;

    this.strokeColor = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? window.getComputedStyle(document.body).getPropertyValue("--light-color")
      : window.getComputedStyle(document.body).getPropertyValue("--dark-color");

    this.draw();
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    this.draw();
  }

  draw() {
    const center = this.size * 0.5;

    this.ctx.clearRect(0, 0, this.size, this.size);

    // clip
    this.ctx.beginPath();
    this.ctx.moveTo(center, center);
    this.ctx.arc(center, center, this.size * 0.5, 0, Math.PI * 2);
    this.ctx.clip();

    const size = Math.hypot(this.size, this.size) * 0.5;
    const nbColors = this.colors.length;

    const segmentSize = (Math.PI * 2) / nbColors;
    let angle = -segmentSize * Math.PI * 2;

    for (let i = 0; i < nbColors; i++) {
      let colorIndex = i % nbColors;
      let startAngle = angle;
      let endAngle = angle - segmentSize;

      this.ctx.fillStyle = this.colors[colorIndex].hex;
      this.ctx.beginPath();
      this.ctx.moveTo(center, center);
      this.ctx.arc(center, center, size, startAngle, endAngle, true);
      this.ctx.fill();

      angle = endAngle;
    }

    this.ctx.strokeStyle = this.strokeColor;
    const lineWidth = this.size * 0.05;
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.arc(
      center,
      center,
      this.size * 0.5 - lineWidth * 0.5,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();

    this.updateFavicon();
  }

  async updateFavicon() {
    let faviconLink: HTMLLinkElement;

    faviconLink = document.querySelector('link[rel="shortcut icon"]');

    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "shortcut icon";
      document.head.appendChild(faviconLink);
    }

    const blob = await this.canvas.convertToBlob();
    //faviconLink.href = new FileReaderSync().readAsDataURL(blob);
    faviconLink.href = URL.createObjectURL(blob);
  }
}
