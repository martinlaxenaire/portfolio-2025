import { WebGPUScene, type WebGPUSceneParams } from "../WebGPUScene";
import {
  GPURenderer,
  PingPongPlane,
  FullscreenPlane,
  Vec2,
  Sampler,
  Vec3,
} from "gpu-curtains";
import { pingPongPlaneFs } from "./shaders/ping-pong-plane";
import { planeFs } from "./shaders/plane";
import { ColorModel } from "@martinlaxenaire/color-palette-generator";

export class WebGPU404Scene extends WebGPUScene {
  renderer: GPURenderer;

  bgColor!: ColorModel;

  mouse: {
    current: Vec2;
    last: Vec2;
    velocity: Vec2;
    updateVelocity: boolean;
  };

  pingPongPlane: PingPongPlane;
  plane: FullscreenPlane;

  private _pointerMoveHandler: (e: MouseEvent | TouchEvent) => void;

  constructor({
    gpuCurtains,
    container,
    progress = 0,
    colors = [],
    debugPane = null,
  }: WebGPUSceneParams) {
    super({ gpuCurtains, container, progress, colors, debugPane });

    this.renderer = new GPURenderer({
      label: "404 scene renderer",
      deviceManager: this.gpuCurtains.deviceManager,
      container,
      //pixelRatio: Math.min(1.5, window.devicePixelRatio),
      pixelRatio: 1,
      renderPass: {
        useDepth: false,
        sampleCount: 1,
      },
    });

    this.renderer.onBeforeRender(() => this.onRender());

    this.bgColor = new ColorModel();
    this.setBgColor();

    this.mouse = {
      current: new Vec2(),
      last: new Vec2(),
      velocity: new Vec2(),
      updateVelocity: false,
    };

    this._pointerMoveHandler = this.onPointerMove.bind(this);

    window.addEventListener("mousemove", this._pointerMoveHandler);
    window.addEventListener("touchmove", this._pointerMoveHandler);

    const nullVector = new Vec2();

    const clampSampler = new Sampler(this.renderer, {
      label: "Clamp sampler",
      name: "clampSampler",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge",
    });

    this.pingPongPlane = new PingPongPlane(this.renderer, {
      label: "Ping pong plane",
      shaders: {
        fragment: {
          code: pingPongPlaneFs,
        },
      },
      targets: [
        {
          format: "rgba16float", // important, we'll be using floating point textures
        },
      ],
      samplers: [clampSampler],
      uniforms: {
        params: {
          struct: {
            mousePosition: {
              type: "vec2f",
              value: new Vec2(),
            },
            velocity: {
              type: "vec2f",
              value: new Vec2(),
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            alpha: {
              type: "f32",
              value: 1,
            },
            dissipation: {
              type: "f32",
              value: 0.98,
            },
            spreadUp: {
              type: "f32",
              value: 0.025,
            },
            size: {
              type: "f32",
              value: 4,
            },
            density: {
              type: "f32",
              value: 0.9,
            },
          },
        },
      },
    });

    this.pingPongPlane
      .onRender(() => {
        // update mouse position
        this.pingPongPlane.uniforms.params.mousePosition.value.copy(
          this.pingPongPlane.mouseToPlaneCoords(this.mouse.current)
        );

        // update velocity
        if (!this.mouse.updateVelocity) {
          this.mouse.velocity.lerp(nullVector, 0.05);
        }

        this.mouse.updateVelocity = false;

        this.pingPongPlane.uniforms.params.velocity.value.copy(
          this.mouse.velocity
        );
      })
      .onAfterResize(() => {
        this.pingPongPlane.uniforms.params.resolution.value.set(
          this.renderer.boundingRect.width,
          this.renderer.boundingRect.height
        );
      });

    this.plane = new FullscreenPlane(this.renderer, {
      label: "Render plane",
      shaders: {
        fragment: {
          code: planeFs,
        },
      },
      textures: [this.pingPongPlane.renderTexture],
      samplers: [clampSampler],
      transparent: true,
      uniforms: {
        params: {
          struct: {
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
              value: 1,
            },
            noiseScale: {
              type: "f32",
              value: 10,
            },
            pointerOpacity: {
              type: "f32",
              value: 1,
            },
            nbColors: {
              type: "f32",
              value: this.colors.length,
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            bgColor: {
              type: "vec3f",
              value: new Vec3(
                this.bgColor.rgb.r,
                this.bgColor.rgb.g,
                this.bgColor.rgb.b
              ).divideScalar(255),
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
        this.plane.uniforms.params.time.value++;
      })
      .onAfterResize(() => {
        this.plane.uniforms.params.resolution.value.set(
          this.renderer.boundingRect.width,
          this.renderer.boundingRect.height
        );
      });
  }

  setBgColor() {
    this.bgColor.hex = window
      .getComputedStyle(document.body)
      .getPropertyValue("--background-color");

    if (this.plane) {
      this.plane.uniforms.params.bgColor.value
        .set(this.bgColor.rgb.r, this.bgColor.rgb.g, this.bgColor.rgb.b)
        .divideScalar(255);
    }
  }

  onPointerMove(e: MouseEvent | TouchEvent) {
    const { clientX, clientY } =
      "targetTouches" in e && e.targetTouches.length
        ? (e.targetTouches[0] as Touch)
        : (e as MouseEvent);

    this.mouse.last.copy(this.mouse.current);
    this.mouse.current.set(clientX, clientY);

    const fps =
      this.qualityManager.fpsWatcher.average === 0
        ? 60
        : this.qualityManager.fpsWatcher.average;

    this.mouse.velocity
      .set(
        this.mouse.current.x - this.mouse.last.x,
        this.mouse.current.y - this.mouse.last.y
      )
      .divideScalar(1000 / fps);

    this.mouse.updateVelocity = true;
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

  override destroy(): void {
    super.destroy();

    window.removeEventListener("mousemove", this._pointerMoveHandler);
    window.removeEventListener("touchmove", this._pointerMoveHandler);

    this.pingPongPlane?.remove();
    this.plane?.remove();

    this.renderer.destroy();
  }
}
