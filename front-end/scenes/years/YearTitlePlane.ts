import { MediaTexture, Mesh } from "gpu-curtains";
import type {
  GPUCurtainsRenderer,
  RenderBundle,
  PlaneGeometry,
  Sampler,
} from "gpu-curtains";
import type { WebGPUYearsScene } from "./WebGPUYearsScene";
import { titlePlaneFs, titlePlaneVs } from "./shaders/years-planes.wgsl";

export class YearTitlePlane {
  yearsScene: WebGPUYearsScene;
  index: number;
  renderer: GPUCurtainsRenderer;
  title: HTMLHeadingElement;
  titleRadius: number;
  nbTitles: number;

  geometry: PlaneGeometry;
  renderBundle: RenderBundle | null;
  sampler: Sampler;

  texture: MediaTexture;
  plane: Mesh;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor({
    yearsScene,
    title,
    titleRadius = 1,
    index = 0,
    geometry,
    renderBundle = null,
    sampler,
  }: {
    yearsScene: WebGPUYearsScene;
    title: HTMLHeadingElement;
    titleRadius?: number;
    index?: number;
    geometry: PlaneGeometry;
    renderBundle?: RenderBundle | null;
    sampler: Sampler;
  }) {
    this.yearsScene = yearsScene;
    this.index = index;
    this.renderer = this.yearsScene.renderer;
    this.nbTitles = this.yearsScene.items.length;
    this.title = title;
    this.titleRadius = titleRadius;

    this.geometry = geometry;
    this.renderBundle = renderBundle;
    this.sampler = sampler;

    this.texture = new MediaTexture(this.renderer, {
      label: this.title.innerText,
      name: "planeTexture",
      useTransform: false,
    });

    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    this.writeCanvas();

    this.texture.loadCanvas(this.canvas);

    this.plane = new Mesh(this.renderer, {
      label: this.title.innerText + " plane",
      geometry: this.geometry,
      cullMode: "none",
      transparent: true,
      frustumCulling: false,
      ...(this.renderBundle && { renderBundle: this.renderBundle }),
      shaders: {
        vertex: {
          code: titlePlaneVs,
        },
        fragment: {
          code: titlePlaneFs,
        },
      },
      textures: [this.texture],
      samplers: [this.sampler],
      uniforms: {
        curve: {
          struct: {
            nbItems: {
              type: "f32",
              value: this.nbTitles,
            },
            itemWidth: {
              type: "f32",
              value: 1,
            },
          },
        },
      },
      texturesOptions: {
        premultipliedAlpha: true,
      },
    });

    this.setPlaneScale();

    this.plane.rotation.y = (this.index / this.nbTitles) * Math.PI * 2;

    this.plane.parent = this.yearsScene.titlePivot;

    this.plane.onAfterResize(() => {
      this.setPlaneScale();
      this.writeCanvas();
      this.texture.resize();
      // invalidate render bundle
      if (this.renderBundle) {
        this.renderBundle.ready = false;
      }
    });
  }

  setPlaneScale() {
    const { boundingRect } = this.renderer;

    const baseScale = {
      width: (0.5 * this.yearsScene.visibleSize.width) / boundingRect.width,
      height: (0.5 * this.yearsScene.visibleSize.height) / boundingRect.height,
    };

    //const rect = title.getBoundingClientRect()
    this.plane.scale.x =
      baseScale.width * this.yearsScene.titleMaxWidth * this.titleRadius;
    this.plane.scale.y =
      baseScale.height *
      this.yearsScene.titleBoundingRects[this.index].height *
      this.titleRadius;

    this.plane.uniforms.curve.itemWidth.value = this.plane.scale.x;
  }

  getTitleStyle() {
    return window.getComputedStyle(this.title);
  }

  writeCanvas() {
    if (!this.title) return;

    if (!this.yearsScene.titleMaxWidth) {
      this.yearsScene.setTitleBoundingRects();
    }

    this.canvas.width =
      this.yearsScene.titleMaxWidth * this.renderer.pixelRatio;
    this.canvas.height =
      this.yearsScene.titleBoundingRects[this.index].height *
      this.renderer.pixelRatio;

    this.ctx.scale(this.renderer.pixelRatio, this.renderer.pixelRatio);

    this.ctx.clearRect(
      0,
      0,
      this.yearsScene.titleMaxWidth,
      this.yearsScene.titleBoundingRects[this.index].height
    );

    const titleStyle = this.getTitleStyle();
    this.ctx.fillStyle = titleStyle.color;
    this.ctx.font = `${titleStyle.fontSize} ${titleStyle.fontFamily}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";

    const alignTop =
      this.yearsScene.titleBoundingRects[this.index].height -
      parseFloat(titleStyle.fontSize);

    const strokeColor = titleStyle.borderColor;

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = parseInt(titleStyle.fontSize) * 0.05;
    this.ctx.strokeText(
      this.title.innerText,
      this.yearsScene.titleMaxWidth * 0.5,
      alignTop
    );

    this.ctx.fillText(
      this.title.innerText,
      this.yearsScene.titleMaxWidth * 0.5,
      alignTop
    );
  }

  updateTheme() {
    this.writeCanvas();
    this.texture.sources.forEach((source) => (source.shouldUpdate = true));
  }

  destroy() {
    this.plane.remove();
    this.texture.destroy();
  }
}
