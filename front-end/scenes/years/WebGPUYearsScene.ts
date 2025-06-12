import {
  GPUCurtainsRenderer,
  Object3D,
  Vec3,
  RenderBundle,
  PlaneGeometry,
  RenderTarget,
  Sampler,
  Texture,
  ComputePass,
  ShaderPass,
  Vec2,
} from "gpu-curtains";
import type { PerspectiveCamera } from "gpu-curtains";
import { mediaPlanesShaderPassFs } from "./shaders/years-planes.wgsl";
import { WebGPUScene, type WebGPUSceneParams } from "../WebGPUScene";
import { YearTitlePlane } from "./YearTitlePlane";
import { MediaPlane } from "./MediaPlane";
import { computeYearsBackground } from "./shaders/compute-years-background.wgsl";

export interface WebGPUYearsParams extends WebGPUSceneParams {
  items: HTMLElement[];
  wrapper: HTMLElement;
}

export class WebGPUYearsScene extends WebGPUScene {
  renderer: GPUCurtainsRenderer;

  items: HTMLElement[];
  wrapper: HTMLElement;
  geometry: PlaneGeometry;

  visibleSize: PerspectiveCamera["visibleSize"];
  widthRatio!: number;

  anisotropicSampler: Sampler;

  titleRenderBundle!: RenderBundle;
  titlePlanes: YearTitlePlane[];
  titlePivot: Object3D;
  rotation: {
    current: Vec3;
    lerped: Vec3;
  };

  scroll: {
    current: Vec2;
    lerped: Vec2;
  };

  titleBoundingRects: DOMRect[] = [];
  titleMaxWidth = 0;

  mediaPlanes: MediaPlane[];

  renderTarget!: RenderTarget;

  backgroundStorageTexture!: Texture;
  backgroundTexture!: Texture;
  backgroundComputePass!: ComputePass;
  deformationStrength!: number;
  shaderPass!: ShaderPass;

  #lerpedProgress!: number;

  constructor({
    gpuCurtains,
    container,
    wrapper,
    progress = 0,
    colors = [],
    debugPane = null,
    items,
  }: WebGPUYearsParams) {
    super({ gpuCurtains, container, progress, colors, debugPane });

    this.isVisible = false;

    this.wrapper = wrapper;
    this.items = items;
    this.titlePlanes = [];
    this.mediaPlanes = [];

    this.lerpedProgress = 0;

    this.renderer = new GPUCurtainsRenderer({
      label: "Project scene renderer",
      deviceManager: this.gpuCurtains.deviceManager,
      container,
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
      lights: false,
    });

    this.anisotropicSampler = new Sampler(this.renderer, {
      label: "Anisotropic sampler",
      name: "anisotropicSampler",
      maxAnisotropy: 16,
    });

    this.titlePivot = new Object3D();
    this.titlePivot.rotation.x = Math.PI / 24;
    this.titlePivot.parent = this.renderer.scene;

    this.rotation = {
      current: this.titlePivot.rotation.clone(),
      lerped: this.titlePivot.rotation.clone(),
    };

    this.scroll = {
      current: new Vec2(),
      lerped: new Vec2(),
    };

    this.renderer.camera.position.z = 25;
    this.visibleSize = this.renderer.camera.getVisibleSizeAtDepth();
    this.setWidthRatio();

    this.renderer
      .onBeforeRender(() => this.onRender())
      .onResize(() => {
        this.visibleSize = this.renderer.camera.getVisibleSizeAtDepth();

        this.setWidthRatio();
        this.setTitleBoundingRects();

        this.forceProgressUpdate(this.progress);
      });

    this.geometry = new PlaneGeometry({
      widthSegments: 30,
      heightSegments: 2,
    });

    this.createTitles();
    this.createMediaPlanes();

    this.scroll.lerped.onChange(() => this.setScroll());

    this.addDebug();
  }

  override onRender(): void {
    super.onRender();

    this.rotation.lerped.lerp(this.rotation.current, 0.2);
    this.titlePivot.rotation.copy(this.rotation.lerped);

    this.scroll.lerped.lerp(this.scroll.current, 0.2);

    const progress = this.progress * (this.items.length - 1);
    this.lerpedProgress += (progress - this.lerpedProgress) * 0.2;
  }

  override onDocumentVisibilityChange(): void {
    super.onDocumentVisibilityChange();

    if (!document.hidden) {
      this.playMediaPlanesVideoOnVisibilityChange(this.isVisible);
    }
  }

  override onProgress(): void {
    if (this.rotation) {
      this.rotation.current.y =
        Math.PI *
        2 *
        ((this.progress * (this.items.length - 1)) / this.items.length);
    }
  }

  get lerpedProgress(): number {
    return this.#lerpedProgress;
  }

  set lerpedProgress(value: number) {
    if (this.backgroundComputePass) {
      this.backgroundComputePass.uniforms.params.progress.value = 1 - value;
      this.backgroundComputePass.uniforms.params.intensity.value = Math.min(
        1,
        Math.abs(this.#lerpedProgress - value) * 20
      );

      this.backgroundComputePass.active =
        Math.abs(value - this.#lerpedProgress) > 0.0001;
    }

    this.#lerpedProgress = value;
  }

  setWidthRatio() {
    const wrapperBoundingRect = this.wrapper.getBoundingClientRect();
    this.widthRatio =
      (wrapperBoundingRect.width - this.renderer.boundingRect.width) /
      this.renderer.boundingRect.width;
  }

  setCurrentScroll(xScroll: number) {
    this.scroll.current.x = xScroll;
  }

  setScroll() {
    this.gpuCurtains.updateScrollValues({ x: this.scroll.lerped.x, y: 0 });
    this.mediaPlanes.forEach((mediaPlane, i) => {
      mediaPlane.plane.updateScrollPosition({
        x: this.gpuCurtains.scrollDelta.x,
        y: 0,
      });
      mediaPlane.plane.shouldUpdateComputedSizes();
    });
  }

  resetScroll(xScroll: number) {
    this.gpuCurtains.updateScrollValues({
      x: xScroll,
      y: 0,
    });
    this.gpuCurtains.scrollManager.delta.x = 0;
    this.scroll.lerped.x = this.scroll.current.x;
  }

  override setSceneVisibility(isVisible = false) {
    super.setSceneVisibility(isVisible);

    if (this.backgroundComputePass && !isVisible) {
      // clear background compute pass texture
      this.backgroundComputePass.uniforms.params.intensity.value = 0;
      this.renderer.renderOnce([this.backgroundComputePass]);
    }

    this.renderer.shouldRenderScene = isVisible;

    this.playMediaPlanesVideoOnVisibilityChange(isVisible);
  }

  playMediaPlanesVideoOnVisibilityChange(isVisible = false) {
    this.mediaPlanes.forEach((plane) => plane.togglePlayback(isVisible));
  }

  updateTheme() {
    this.titlePlanes.forEach((plane) => {
      plane.updateTheme();
    });
  }

  createMediaPlanes() {
    //const angleStep = (Math.PI * 2) / this.items.length; // 360° / 5

    this.renderTarget = new RenderTarget(this.renderer, {
      label: "Media planes render target",
      useDepth: false,
    });

    const nbRectangles = 40 * this.items.length;
    const rectSizes = new Float32Array(nbRectangles * 2);
    const rectPositions = new Float32Array(nbRectangles * 2);
    const rectColors = new Float32Array(nbRectangles * 4);

    for (let i = 0; i < nbRectangles; i++) {
      rectSizes[i * 2] = Math.random() * 0.2 + 0.05;
      rectSizes[i * 2 + 1] = Math.random() * 0.005 + 0.00125;

      // offset along uv.x
      const u = i % this.items.length;
      rectPositions[i * 2] = u - Math.random();
      rectPositions[i * 2 + 1] = Math.random();

      const colorIndex = Math.floor(Math.random() * this.colors.length);
      const color = this.colors[colorIndex].rgb;

      rectColors[i * 4] = color.r / 255;
      rectColors[i * 4 + 1] = color.g / 255;
      rectColors[i * 4 + 2] = color.b / 255;
      rectColors[i * 4 + 3] = 1;
    }

    this.backgroundStorageTexture = new Texture(this.renderer, {
      label: "Background storage texture",
      name: "backgroundStorageTexture",
      type: "storage",
      visibility: ["compute", "fragment"],
      format: "rgba8unorm",
      qualityRatio: 0.25,
    });

    this.backgroundTexture = new Texture(this.renderer, {
      label: "Background texture",
      name: "backgroundTexture",
      visibility: ["fragment"],
      fromTexture: this.backgroundStorageTexture,
    });

    this.backgroundComputePass = new ComputePass(this.renderer, {
      label: "Background compute pass",
      shaders: {
        compute: {
          code: computeYearsBackground,
        },
      },
      dispatchSize: [
        Math.ceil(this.backgroundStorageTexture.size.width / 16),
        Math.ceil(this.backgroundStorageTexture.size.height / 16),
      ],
      textures: [this.backgroundStorageTexture],
      storages: {
        rectangles: {
          struct: {
            sizes: {
              type: "array<vec2f>",
              value: rectSizes,
            },
            positions: {
              type: "array<vec2f>",
              value: rectPositions,
            },
            colors: {
              type: "array<vec4f>",
              value: rectColors,
            },
          },
        },
      },
      uniforms: {
        params: {
          struct: {
            progress: {
              type: "f32",
              value: 0,
            },
            intensity: {
              type: "f32",
              value: 0,
            },
          },
        },
      },
    });

    this.backgroundComputePass.onAfterResize(() => {
      this.backgroundComputePass.material.dispatchSize = [
        Math.ceil(this.backgroundStorageTexture.size.width / 16),
        Math.ceil(this.backgroundStorageTexture.size.height / 16),
      ];
    });

    this.compilteMaterialOnIdle(this.backgroundComputePass.material);

    this.deformationStrength = 0.2;

    this.shaderPass = new ShaderPass(this.renderer, {
      label: "Media planes pass",
      isPrePass: true,
      inputTarget: this.renderTarget,
      shaders: {
        fragment: {
          code: mediaPlanesShaderPassFs,
        },
      },
      textures: [this.backgroundTexture],
      samplers: [
        new Sampler(this.renderer, {
          label: "Clamp sampler",
          name: "clampSampler",
          addressModeU: "clamp-to-edge",
          addressModeV: "clamp-to-edge",
          magFilter: "linear",
        }),
      ],
      uniforms: {
        deformation: {
          struct: {
            maxStrength: {
              type: "f32",
              value:
                (this.deformationStrength * this.renderer.boundingRect.width) /
                this.renderer.boundingRect.height,
            },
          },
        },
      },
    });

    this.shaderPass.onAfterResize(() => {
      this.shaderPass.uniforms.deformation.maxStrength.value =
        (this.deformationStrength * this.renderer.boundingRect.width) /
        this.renderer.boundingRect.height;
    });

    this.compilteMaterialOnIdle(this.shaderPass.material);

    const geometry = new PlaneGeometry();

    this.items.forEach((item, i) => {
      const planeElements = item.querySelectorAll(".media-plane");

      planeElements.forEach((planeElement, j) => {
        const mediaPlane = new MediaPlane({
          yearsScene: this,
          planeElement: planeElement as HTMLElement,
          geometry,
          renderTarget: this.renderTarget,
          label: `${item.querySelector("h3")?.innerText} media plane`,
          yearIndex: i,
          index: j,
          useExternalTextures: true, // TODO?!
        });

        this.compilteMaterialOnIdle(mediaPlane.plane.material);

        this.mediaPlanes.push(mediaPlane);
      });
    });
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    if (this.backgroundComputePass) {
      const nbRectangles = 40 * this.items.length;
      for (let i = 0; i < nbRectangles; i++) {
        const colorIndex = Math.floor(Math.random() * this.colors.length);
        const color = this.colors[colorIndex].rgb;

        (
          this.backgroundComputePass.storages.rectangles.colors
            .value as Float32Array
        )[i * 4] = color.r / 255;
        (
          this.backgroundComputePass.storages.rectangles.colors
            .value as Float32Array
        )[i * 4 + 1] = color.g / 255;
        (
          this.backgroundComputePass.storages.rectangles.colors
            .value as Float32Array
        )[i * 4 + 2] = color.b / 255;
        (
          this.backgroundComputePass.storages.rectangles.colors
            .value as Float32Array
        )[i * 4 + 3] = 1;

        this.backgroundComputePass.storages.rectangles.colors.shouldUpdate =
          true;
      }
    }
  }

  setTitleBoundingRects() {
    this.titleBoundingRects = this.items.map((item) => {
      const title = item.querySelector("h3");
      return title?.getBoundingClientRect() as DOMRect;
    });

    this.titleMaxWidth = this.titleBoundingRects.reduce(
      (acc, v) => Math.max(acc, v.width),
      0
    );
  }

  createTitles() {
    const titleRadius = 0.75;

    this.setTitleBoundingRects();

    this.titleRenderBundle = new RenderBundle(this.renderer, {
      label: "Years render bundle",
      useBuffer: true,
      size: this.items.length,
    });

    this.items.forEach((item, i) => {
      const title = item.querySelector("h3");

      if (title) {
        const yearTitlePlane = new YearTitlePlane({
          yearsScene: this,
          title,
          titleRadius,
          index: i,
          geometry: this.geometry,
          renderBundle: this.titleRenderBundle,
          sampler: this.anisotropicSampler,
        });

        this.compilteMaterialOnIdle(yearTitlePlane.plane.material);

        this.titlePlanes.push(yearTitlePlane);
      }
    });
  }

  // override onQualityChange(newQuality: number): void {
  //   super.onQualityChange(newQuality);

  //   const pixelRatio = this.lerp(1, window.devicePixelRatio, newQuality / 10);
  //   this.renderer.setPixelRatio(pixelRatio);
  // }

  addDebug() {
    if (this.titlePivot) {
      const titlesFolder = this.addDebugFolder({ title: "Years title" });

      if (titlesFolder) {
        this.addDebugBinding(
          this.rotation.current,
          "x",
          {
            min: -Math.PI / 4,
            max: Math.PI / 4,
            step: Math.PI / 48,
            label: "Inclination",
            format: (v) => ((v * 180) / Math.PI).toFixed(3),
          },
          titlesFolder
        );
      }
    }

    if (this.shaderPass) {
      const shaderPassFolder = this.addDebugFolder({
        title: "Deformation pass",
      });

      if (shaderPassFolder) {
        const strengthBinding = this.addDebugBinding(
          this,
          "deformationStrength",
          {
            min: 0,
            max: 0.5,
            step: 0.05,
            label: "Strength",
          },
          shaderPassFolder
        );

        if (strengthBinding) {
          strengthBinding.on("change", (ev) => {
            this.shaderPass.uniforms.deformation.maxStrength.value =
              ((ev.value as number) * this.renderer.boundingRect.width) /
              this.renderer.boundingRect.height;
          });
        }

        if (this.backgroundComputePass) {
          const qualityBinding = this.addDebugBinding(
            { quality: this.backgroundStorageTexture.options.qualityRatio },
            "quality",
            {
              min: 0.1,
              max: 1,
              step: 0.05,
              label: "Background quality",
            },
            shaderPassFolder
          );

          if (qualityBinding) {
            qualityBinding.on("change", (ev) => {
              this.backgroundStorageTexture.setQualityRatio(ev.value);

              if (this.backgroundTexture) {
                this.backgroundTexture.copy(this.backgroundStorageTexture);
              }

              this.backgroundComputePass.material.dispatchSize = [
                Math.ceil(this.backgroundStorageTexture.size.width / 16),
                Math.ceil(this.backgroundStorageTexture.size.height / 16),
              ];
            });
          }
        }
      }
    }
  }

  override destroy() {
    super.destroy();
    this.titlePlanes?.forEach((plane) => plane.destroy());

    this.titleRenderBundle?.destroy();
    this.mediaPlanes?.forEach((plane) => plane.destroy());

    this.backgroundComputePass?.remove();
    this.backgroundTexture?.destroy();
    this.backgroundStorageTexture?.destroy();

    this.shaderPass?.remove();
    this.renderTarget?.remove();
    this.renderer?.destroy();
  }
}
