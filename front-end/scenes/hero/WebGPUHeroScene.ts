import { WebGPUScene, type WebGPUSceneParams } from "../WebGPUScene";
import { GPURenderer, FullscreenPlane, Vec2 } from "gpu-curtains";
import { gsap } from "gsap";
import { heroPlaneFs } from "./shaders/hero-plane.wgsl";

export class WebGPUHeroScene extends WebGPUScene {
  renderer: GPURenderer;
  plane: FullscreenPlane;

  hasBeenVisible: boolean;
  showTl!: GSAPTimeline;
  showProgress: number;

  constructor({
    gpuCurtains,
    container,
    progress = 0,
    colors = [],
    debugPane = null,
  }: WebGPUSceneParams) {
    super({ gpuCurtains, container, progress, colors, debugPane });

    this.hasBeenVisible = false;
    this.showProgress = 0;

    this.renderer = new GPURenderer({
      label: "Hero scene renderer",
      deviceManager: this.gpuCurtains.deviceManager,
      container,
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
      renderPass: {
        useDepth: false,
        sampleCount: 1,
      },
    });

    this.plane = new FullscreenPlane(this.renderer, {
      label: "Hero fullscreen plane",
      transparent: true,
      shaders: {
        fragment: {
          code: heroPlaneFs,
        },
      },
      uniforms: {
        params: {
          visibility: ["fragment"],
          struct: {
            nbColors: {
              type: "i32",
              value: this.colors.length,
            },
            numTriangles: {
              type: "f32",
              value: 3,
            },
            time: {
              type: "f32",
              value: 0,
            },
            speed: {
              type: "f32",
              value: 0.005,
            },
            noiseStrength: {
              type: "f32",
              value: 0.075,
            },
            noiseScale: {
              type: "f32",
              value: 10,
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            borderRadius: {
              type: "f32",
              value: this.borderRadius,
            },
            fillColorRatio: {
              type: "f32",
              value: 6, // how much the colored triangles scale compared to empty areas
            },
            showProgress: {
              type: "f32",
              value: 0,
            },
            colors: {
              type: "array<vec3f>",
              value: this.colors.reduce(
                (acc: number[], v) => [
                  ...acc,
                  v.rgb.r / 255,
                  v.rgb.g / 255,
                  v.rgb.b / 255,
                ],
                []
              ),
            },
          },
        },
      },
    });

    this.plane
      .onRender(() => {
        (this.plane.uniforms.params.time.value as number)++;
      })
      .onAfterResize(() => {
        (this.plane.uniforms.params.resolution.value as Vec2).set(
          this.renderer.boundingRect.width,
          this.renderer.boundingRect.height
        );

        this.plane.uniforms.params.borderRadius.value = this.borderRadius;
      });

    this.renderer.onBeforeRender(() => this.onRender());

    this.setShowTl();

    this.addDebug();
  }

  get borderRadius(): number {
    return parseFloat(window.getComputedStyle(document.body).fontSize);
  }

  setShowTl() {
    this.showTl = gsap
      .timeline({
        paused: true,
        delay: 0.1,
      })
      .to(this, {
        showProgress: 1,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          this.plane.uniforms.params.showProgress.value =
            this.showProgress * 0.75 + this.progress * 0.25;
        },
      });
  }

  override onProgress(): void {
    this.plane.uniforms.params.showProgress.value =
      this.showProgress * 0.75 + this.progress * 0.25;
  }

  override setSceneVisibility(isVisible = false) {
    if (!this.hasBeenVisible && isVisible) {
      this.hasBeenVisible = true;
      this.showTl.restart(true);
    }

    super.setSceneVisibility(isVisible);
    this.renderer.shouldRenderScene = isVisible;
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    if (this.plane) {
      this.plane.uniforms.params.colors.value = this.colors.reduce(
        (acc: number[], v) => [
          ...acc,
          v.rgb.r / 255,
          v.rgb.g / 255,
          v.rgb.b / 255,
        ],
        []
      );

      this.plane.uniforms.params.colors.shouldUpdate = true;
    }
  }

  override onQualityChange(newQuality: number): void {
    const pixelRatio = this.lerp(1, window.devicePixelRatio, newQuality / 10);
    this.renderer.setPixelRatio(pixelRatio);

    super.onQualityChange(newQuality);
  }

  addDebug() {
    this.addDebugBinding(this.plane.uniforms.params.numTriangles, "value", {
      label: "Number of triangles",
      min: 1,
      max: 7,
      step: 1,
    });

    this.addDebugBinding(this.plane.uniforms.params.speed, "value", {
      label: "Speed",
      min: 0.001,
      max: 0.02,
      step: 0.001,
    });

    this.addDebugBinding(this.plane.uniforms.params.noiseStrength, "value", {
      label: "Noise strength",
      min: 0.01,
      max: 0.2,
      step: 0.01,
    });

    this.addDebugBinding(this.plane.uniforms.params.noiseScale, "value", {
      label: "Noise scale",
      min: 0,
      max: 30,
      step: 0.5,
    });

    this.addDebugBinding(this.plane.uniforms.params.fillColorRatio, "value", {
      label: "Fill color ratio",
      min: 1,
      max: 15,
      step: 1,
    });

    this.addDebugBinding(this.plane.uniforms.params.showProgress, "value", {
      label: "Show progress",
      min: 0,
      max: 1,
      step: 0.01,
    });
  }

  override destroy() {
    super.destroy();
    this.showTl.kill();
    this.plane?.remove();
    this.renderer.destroy();
  }
}
