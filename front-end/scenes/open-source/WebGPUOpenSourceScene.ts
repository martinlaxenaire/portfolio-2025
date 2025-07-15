import type { GithubContribution } from "../../server/api/github";
import { WebGPUScene, type WebGPUSceneParams } from "../WebGPUScene";
import {
  AmbientLight,
  BindGroup,
  BoxGeometry,
  BufferBinding,
  ComputePass,
  DirectionalLight,
  RenderTarget,
  RenderBundle,
  Sampler,
  PlaneGeometry,
  PerspectiveCamera,
  GPUCameraRenderer,
  LitMesh,
  sRGBToLinear,
  Vec2,
  Vec3,
  Object3D,
  Texture,
  PingPongPlane,
  ShaderPass,
} from "gpu-curtains";
import { computeCurl } from "./shaders/compute-curl.wgsl";
import { curlAdditionalVertexParticle } from "./shaders/chunks/curl-additional-vertex-contribution.wgsl";
import { curlParticlesHelpers } from "./shaders/chunks/curl-particles-helpers.wgsl";
import { curlPreliminaryFragmentParticle } from "./shaders/chunks/curl-preliminary-fragment-contribution.wgsl";
import { gsap } from "gsap";
import { ColorModel } from "@martinlaxenaire/color-palette-generator";
import { shadowedParticles } from "./shaders/shadowed-particles.wgsl";
import {
  floorAdditionalHeadContribution,
  floorPreliminaryContribution,
} from "./shaders/chunks/floor-fragment-contributions.wgsl";
import { pingPongPlaneFs } from "./shaders/ping-pong-plane";
import { pixelPassFs } from "./shaders/pixel-pass";
import { CanvasLineDrawerScene } from "./CanvasLineDrawerScene";

export interface WebGPUOpenSourceSceneParams extends WebGPUSceneParams {
  contributions?: GithubContribution[];
  onStarted?: () => void;
  onSceneComplete?: () => void;
}

export class WebGPUOpenSourceScene extends WebGPUScene {
  renderer: GPUCameraRenderer;
  contributions: GithubContribution[];
  cameraLookAt: Vec3;
  particlesPosition: Vec3;

  visibleSize: PerspectiveCamera["visibleSize"];

  ambientLight: AmbientLight;
  directionalLight: DirectionalLight;
  shadowIntensity: number;

  instancesCount: number;
  instancesPerContribution: number;

  computePass!: ComputePass;
  computeBindGroup!: BindGroup;

  isReflectionActive!: boolean;
  reflectionCameraPositionRatio: Vec3;
  reflectionTarget!: RenderTarget;
  reflectionQuality!: number;
  particlesSystem!: LitMesh;
  reflectionCameraBindGroup!: BindGroup;

  floor!: LitMesh;
  floorColor!: ColorModel;

  pingPongPlane!: PingPongPlane;
  pixelPass!: ShaderPass;

  mouse: {
    current: Vec2;
    lerped: Vec2;
    strength: number;
  };

  private _pointerMoveHandler: (e: MouseEvent | TouchEvent) => void;

  lineDrawerScene: CanvasLineDrawerScene;

  linePoints: {
    first: Vec3;
    second: Vec3;
  };

  constructor({
    gpuCurtains,
    container,
    progress = 0,
    colors = [],
    debugPane = null,
    contributions = [],
    onStarted = () => {},
    onSceneComplete = () => {},
  }: WebGPUOpenSourceSceneParams) {
    super({ gpuCurtains, container, progress, colors, debugPane });

    this.isVisible = false;

    this.renderer = new GPUCameraRenderer({
      label: "Intro scene renderer",
      deviceManager: this.gpuCurtains.deviceManager,
      container,
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
      camera: {
        near: 10,
        far: 5000,
      },
    });

    this.contributions = contributions;

    this.lineDrawerScene = new CanvasLineDrawerScene({
      container,
      progress,
      colors,
      onStarted,
      onSceneComplete: () => {
        onSceneComplete();
      },
    });

    this.setTheme();

    // this.renderer.camera.position.y = 900;
    // this.renderer.camera.position.z = 450;
    this.renderer.camera.position.y = 600;
    this.renderer.camera.position.z = 550;

    this.cameraLookAt = new Vec3(0, 250, 0);
    this.particlesPosition = new Vec3(0, 300, 0);
    this.reflectionCameraPositionRatio = new Vec3(2, -1, 0.25);

    this.renderer.camera.lookAt(this.cameraLookAt);

    this.visibleSize = this.renderer.camera.getVisibleSizeAtDepth();

    // mouse interaction
    this.mouse = {
      current: new Vec2(0.5), // center
      lerped: new Vec2(0.5),
      strength: 3,
    };

    this.linePoints = {
      first: new Vec3(0.5),
      second: new Vec3(0.5),
    };

    this.renderer
      .onResize(() => {
        this.visibleSize = this.renderer.camera.getVisibleSizeAtDepth();
      })
      .onBeforeRender(() => this.onRender());

    this.ambientLight = new AmbientLight(this.renderer, {
      intensity: 0.2,
    });

    this.shadowIntensity = 1;

    this.directionalLight = new DirectionalLight(this.renderer, {
      position: new Vec3(250, 1250, 50),
      target: this.cameraLookAt.clone(),
      intensity: 3,
      shadow: {
        intensity: this.shadowIntensity,
        depthTextureSize: new Vec2(1024),
        bias: 0.004,
        pcfSamples: 2,
        camera: {
          top: 500,
          left: -500,
          right: 500,
          bottom: -500,
          near: 10,
          far: 2000,
        },
      },
    });

    //this.instancesCount = 1_000;
    this.instancesPerContribution = 5;
    this.instancesCount = this.contributions.reduce(
      (acc, v) => acc + v.count * this.instancesPerContribution,
      0
    );

    if (!this.instancesCount) {
      this.instancesCount = 20_000;
    }

    this._pointerMoveHandler = this.onPointerMove.bind(this);

    window.addEventListener("mousemove", this._pointerMoveHandler);
    window.addEventListener("touchmove", this._pointerMoveHandler);

    this.createPixelPass();

    this.createParticles();
    this.createReflector();

    this.addDebug();
  }

  setTheme() {
    this.lineDrawerScene.setTheme();

    const floorColor = window
      .getComputedStyle(document.body)
      .getPropertyValue("--background-color");
    this.floorColor = new ColorModel(floorColor);

    if (this.floor) {
      this.floor.uniforms.params.reflectionStrength.value =
        this.floorColor.rgb.r > 155 ? 0.75 : 0.1;

      this.floor.uniforms.material.color.value = sRGBToLinear(
        new Vec3(
          this.floorColor.rgb.r,
          this.floorColor.rgb.g,
          this.floorColor.rgb.b
        ).divideScalar(255)
      );
    }
  }

  override setSceneVisibility(isVisible = false) {
    super.setSceneVisibility(isVisible);
    this.renderer.shouldRenderScene = isVisible;
  }

  boundingRectToNDC(x = 0, y = 0) {
    return {
      x: (x / this.renderer.boundingRect.width) * 2 - 1,
      y: (1 - y / this.renderer.boundingRect.height) * 2 - 1,
    };
  }

  ndcToWorldSpace(vector: Vec3) {
    // clamp
    vector.x = Math.max(-1, Math.min(1, vector.x));
    vector.y = Math.max(-1, Math.min(1, vector.y));

    // what follows is not strictly accurate,
    // but good enough (and fast) for our needs
    const visibleSize =
      vector.z === 0
        ? this.visibleSize
        : this.renderer.camera.getVisibleSizeAtDepth(vector.z);

    vector.x *= visibleSize.width;
    vector.y *= visibleSize.height;

    vector.multiplyScalar(0.5);

    vector.applyQuat(this.renderer.camera.quaternion);
  }

  onPointerMove(e: MouseEvent | TouchEvent) {
    const { clientX, clientY } =
      "targetTouches" in e && e.targetTouches.length
        ? (e.targetTouches[0] as Touch)
        : (e as MouseEvent);

    const offsetTop = this.renderer.canvas.getBoundingClientRect().top;

    const ndcPosition = this.boundingRectToNDC(clientX, clientY - offsetTop);

    this.mouse.current.set(ndcPosition.x, ndcPosition.y);
  }

  override onRender() {
    super.onRender();

    this.mouse.lerped.lerp(this.mouse.current, 0.05);

    // if (this.particlesSystem) {
    //   this.particlesSystem.rotation.x = this.mouse.lerped.y * Math.PI * 0.25;
    //   this.particlesSystem.rotation.y =
    //     Math.PI * 0.75 + this.mouse.lerped.x * Math.PI * 0.25;
    // }
  }

  override setColors(colors: ColorModelBase[]): void {
    super.setColors(colors);

    if (this.particlesSystem) {
      const colors = this.contributions.map((c, i) => {
        return sRGBToLinear(
          new Vec3(
            this.colors[i].rgb.r,
            this.colors[i].rgb.g,
            this.colors[i].rgb.b
          ).divideScalar(255)
        );
      });

      for (let i = 0; i < colors.length; i++) {
        this.particlesSystem.uniforms.params.colors.value[i * 4] = colors[i].x;
        this.particlesSystem.uniforms.params.colors.value[i * 4 + 1] =
          colors[i].y;
        this.particlesSystem.uniforms.params.colors.value[i * 4 + 2] =
          colors[i].z;
      }

      this.particlesSystem.uniforms.params.colors.shouldUpdate = true;
    }
  }

  async createParticles() {
    const speed = 0.5;
    const curlStrength = 0.85;
    const curlPersistence = 0.1;
    const timeScale = 0.001;
    const duration = Math.random() * 50 + 200;
    const radius = Math.random() * 0.25 + 1;
    const initRadius = 40;

    const initPosition = new Float32Array(this.instancesCount * 4);
    const initVelocity = new Float32Array(this.instancesCount * 4);
    const initData = new Float32Array(this.instancesCount * 4);

    const contributionsStartIndices = this.contributions.reduce<number[]>(
      (acc, curr, index) => {
        const prevSum = acc[index - 1] ?? 0; // Get previous sum, default to 0 for first element
        acc.push(prevSum + curr.count);
        return acc;
      },
      []
    );

    const totalContributionCount = this.contributions.reduce(
      (acc, contribution) => acc + contribution.count,
      0
    );

    const baseScale = new Vec3(0.75, 1.0, 5.0).multiplyScalar(1.5);

    const scales = this.contributions.map((contribution) => {
      const contributionScale = 1 - contribution.count / totalContributionCount;
      return baseScale.clone().multiplyScalar(0.5 + contributionScale);
    });

    for (let i = 0; i < this.instancesCount; i++) {
      const phi = Math.random() * 2 * Math.PI;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const r = (0.85 + 0.15 * Math.random()) * initRadius * radius;

      const randomDuration =
        (0.25 + 0.75 * ((0.25 + 0.75 * Math.random()) * duration)) / speed;

      initPosition[i * 4] = r * Math.sin(theta) * Math.cos(phi);
      initPosition[i * 4 + 1] = r * Math.sin(theta) * Math.sin(phi);
      initPosition[i * 4 + 2] = r * Math.cos(theta);
      initPosition[i * 4 + 3] = randomDuration; // frames life

      initVelocity[i * 4 + 3] = randomDuration;

      const contribIndex = contributionsStartIndices.findIndex(
        (c) => c * this.instancesPerContribution > i
      );

      // scale
      initData[i * 4] = scales[contribIndex].x;
      initData[i * 4 + 1] = scales[contribIndex].y;
      initData[i * 4 + 2] = scales[contribIndex].z;

      // color
      initData[i * 4 + 3] = contribIndex;
    }

    const initComputeBuffer = new BufferBinding({
      label: "Compute particles init buffer",
      name: "initParticles",
      bindingType: "storage",
      access: "read_write", // we want a readable AND writable buffer!
      usage: ["vertex"], // we're going to use this buffer as a vertex buffer along default usages
      visibility: ["compute"],
      struct: {
        position: {
          type: "array<vec4f>",
          value: initPosition,
        },
        velocity: {
          type: "array<vec4f>",
          value: initVelocity,
        },
        data: {
          type: "array<vec4f>",
          value: initData,
        },
      },
    });

    // update buffer, cloned from init one
    const updateComputeBuffer = initComputeBuffer.clone({
      ...initComputeBuffer.options,
      label: "Compute particles update buffer",
      name: "particles",
    });

    this.computeBindGroup = new BindGroup(this.renderer, {
      label: "Compute instances bind group",
      bindings: [initComputeBuffer, updateComputeBuffer],
      uniforms: {
        params: {
          visibility: ["compute"],
          struct: {
            radius: {
              type: "f32",
              value: radius,
            },
            initRadius: {
              type: "f32",
              value: initRadius,
            },
            maxLife: {
              type: "f32",
              value: duration / speed, // in frames
            },
            maxLifeRatio: {
              type: "f32",
              value: 1,
            },
            speed: {
              type: "f32",
              value: speed,
            },
            curlStrength: {
              type: "f32",
              value: curlStrength,
            },
            curlPersistence: {
              type: "f32",
              value: curlPersistence,
            },
            time: {
              type: "f32",
              value: 0,
            },
            timeScale: {
              type: "f32",
              value: timeScale,
            },
            mouseStrength: {
              type: "f32",
              value:
                this.mouse.strength /
                Math.hypot(this.visibleSize.width, this.visibleSize.height),
            },
            firstMousePosition: {
              type: "vec3f",
              value: new Vec3(0.5),
            },
            secondMousePosition: {
              type: "vec3f",
              value: new Vec3(0.5),
            },
          },
        },
      },
    });

    this.computePass = new ComputePass(this.renderer, {
      label: "Compute particles pass",
      shaders: {
        compute: {
          code: computeCurl,
          entryPoint: "updateData",
        },
      },
      dispatchSize: Math.ceil(this.instancesCount / 256),
      bindGroups: [this.computeBindGroup],
    });

    this.computePass
      .onBeforeRender(() => {
        (this.computePass.uniforms.params.time.value as number)++;

        if (this.lineDrawerScene.hasStarted) {
          const firstPointNDC = this.boundingRectToNDC(
            this.lineDrawerScene.firstPoint.x,
            this.lineDrawerScene.firstPoint.y
          );

          this.linePoints.first.set(firstPointNDC.x, firstPointNDC.y, 0);
          this.ndcToWorldSpace(this.linePoints.first);

          (
            this.computePass.uniforms.params.firstMousePosition.value as Vec3
          ).copy(this.linePoints.first);

          const secondPointNDC = this.boundingRectToNDC(
            this.lineDrawerScene.secondPoint.x,
            this.lineDrawerScene.secondPoint.y
          );

          this.linePoints.second.set(secondPointNDC.x, secondPointNDC.y, 0);

          this.ndcToWorldSpace(this.linePoints.second);

          const lineLengthRatio =
            Math.hypot(
              this.lineDrawerScene.firstPoint.x -
                this.lineDrawerScene.secondPoint.x,
              this.lineDrawerScene.firstPoint.y -
                this.lineDrawerScene.secondPoint.y
            ) /
            Math.hypot(
              this.renderer.boundingRect.width,
              this.renderer.boundingRect.height
            );
          const newRadius = radius + lineLengthRatio;

          this.computePass.uniforms.params.radius.value = newRadius;

          const newDuration = duration * (1 + lineLengthRatio);
          this.computePass.uniforms.params.maxLife.value = newDuration / speed;

          (
            this.computePass.uniforms.params.secondMousePosition.value as Vec3
          ).lerp(this.linePoints.second, 0.1);
        }
      })
      .onAfterResize(() => {
        (this.computePass.uniforms.params.mouseStrength.value as number) =
          this.mouse.strength /
          Math.hypot(this.visibleSize.width, this.visibleSize.height);
      });

    this.compilteMaterialOnIdle(this.computePass.material);

    //--------------------
    // RENDERING
    //--------------------

    const toneMapping = "Khronos";

    //--------------------
    // PARTICLES
    //--------------------

    const geometry = new BoxGeometry({
      instancesCount: this.instancesCount,
      vertexBuffers: [
        {
          // use instancing
          stepMode: "instance",
          name: "instanceAttributes",
          buffer: updateComputeBuffer.buffer, // pass the compute buffer right away
          attributes: [
            {
              name: "particlePosition",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
            {
              name: "particleVelocity",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
            {
              name: "particleData",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
          ],
        },
      ],
    });

    // particles colors
    const colors = this.contributions.map((c, i) => {
      return sRGBToLinear(
        new Vec3(
          this.colors[i].rgb.r,
          this.colors[i].rgb.g,
          this.colors[i].rgb.b
        ).divideScalar(255)
      );
    });

    // since we need this uniform in both the depth pass and regular pass
    // create a new buffer binding that will be shared by both materials
    const particlesParamsBindings = new BufferBinding({
      label: "Params",
      name: "params",
      bindingType: "uniform",
      visibility: ["vertex", "fragment"],
      struct: {
        size: {
          type: "f32",
          value: 1,
        },
        colors: {
          type: "array<vec4f>",
          value: colors.map((c) => [c.x, c.y, c.z, 1]).flat(),
        },
      },
    });

    this.reflectionQuality = 0.5;

    this.reflectionTarget = new RenderTarget(this.renderer, {
      label: "Reflection render target",
      depthStoreOp: "discard", // important so we don't interfer with the main buffer
      renderTextureName: "reflectionTexture",
      qualityRatio: this.reflectionQuality,
    });

    this.particlesSystem = new LitMesh(this.renderer, {
      label: "Shadowed particles system",
      geometry,
      frustumCulling: false,
      receiveShadows: true,
      additionalOutputTargets: [this.reflectionTarget],
      material: {
        shading: "Lambert",
        color: colors[0],
        toneMapping,
        // we need an additional 'velocity' varying
        // to pass from the vertex to the fragment shader
        additionalVaryings: [
          {
            name: "velocity",
            type: "vec4f",
          },
          {
            name: "data",
            type: "vec4f",
          },
        ],
        vertexChunks: {
          additionalHead: curlParticlesHelpers,
          additionalContribution: curlAdditionalVertexParticle,
        },
        fragmentChunks: {
          preliminaryContribution: curlPreliminaryFragmentParticle,
        },
      },
      bindings: [particlesParamsBindings],
    });

    this.particlesSystem.position.copy(this.particlesPosition);

    this.compilteMaterialOnIdle(this.particlesSystem.material);

    const scenePassEntry = this.renderer.scene.getObjectRenderPassEntry(
      this.particlesSystem
    );

    if (scenePassEntry) {
      scenePassEntry.onBeforeRenderPass = () => {
        this.renderer.renderPass.setLoadOp("clear");
      };
    }

    this.directionalLight.shadow.addShadowCastingMesh(this.particlesSystem, {
      bindings: [particlesParamsBindings],
      shaders: {
        vertex: {
          code: shadowedParticles,
          entryPoint: "shadowMapVertex",
        },
        fragment: {
          code: shadowedParticles,
          entryPoint: "shadowMapFragment",
        },
      },
    });
  }

  createReflector() {
    this.isReflectionActive = true;

    // create a camera based on our renderer camera
    const reflectionCamera = new PerspectiveCamera({
      fov: this.renderer.camera.fov,
      near: this.renderer.camera.near,
      far: this.renderer.camera.far,
      width: this.renderer.camera.size.width,
      height: this.renderer.camera.size.height,
      pixelRatio: this.renderer.camera.pixelRatio,
    });

    // don't forget to update perspective on resize
    this.renderer.onAfterResize(() => {
      reflectionCamera.setPerspective({
        width: this.renderer.boundingRect.width,
        height: this.renderer.boundingRect.height,
      });
    });

    reflectionCamera.parent = this.renderer.scene;

    // create a camera buffer binding
    const reflectionCameraBinding = this.renderer.createCameraBinding(
      reflectionCamera,
      "Reflection camera"
    );

    // create a camera bind group
    this.reflectionCameraBindGroup = this.renderer.cameraLightsBindGroup.clone({
      bindings: [
        reflectionCameraBinding,
        ...this.renderer.cameraLightsBindGroup.bindings.slice(1),
      ],
      keepLayout: true,
    });

    // not really needed, here for the sake of clarity
    // as the camera bind group always has an index of 0
    // and this is also the default bind group index
    this.reflectionCameraBindGroup.setIndex(0);

    const reflectionCameraLookAt = new Vec3();
    const reflectionScenePassEntry =
      this.renderer.scene.getRenderTargetPassEntry(this.reflectionTarget);

    const { cameraLightsBindGroup } = this.renderer;

    reflectionScenePassEntry.onBeforeRenderPass = () => {
      this.reflectionTarget.renderPass.setLoadOp("clear");

      if (!this.isReflectionActive) {
        if (this.particlesSystem) this.particlesSystem.visible = false;
        if (this.floor) this.floor.visible = false;

        return;
      } else {
        if (this.particlesSystem) this.particlesSystem.visible = true;
        if (this.floor) this.floor.visible = true;
      }

      // negate Y position and lookAt
      reflectionCamera.position
        .copy(this.renderer.camera.actualPosition)
        .multiply(this.reflectionCameraPositionRatio);

      reflectionCameraLookAt.set(0, -1 * this.cameraLookAt.y, 0);
      reflectionCamera.lookAt(reflectionCameraLookAt);

      // update reflection camera matrices
      reflectionCamera.updateMatrixStack();

      // force the reflection camera buffer to update
      reflectionCameraBinding.shouldUpdateBinding("view");
      reflectionCameraBinding.shouldUpdateBinding("projection");
      reflectionCameraBinding.shouldUpdateBinding("position");

      // update the reflection camera bind group
      this.reflectionCameraBindGroup.update();

      this.particlesSystem.setCameraBindGroup(this.reflectionCameraBindGroup);
    };

    reflectionScenePassEntry.onAfterRenderPass = () => {
      if (!this.isReflectionActive) {
        if (this.particlesSystem) this.particlesSystem.visible = true;

        return;
      }

      this.particlesSystem.setCameraBindGroup(cameraLightsBindGroup);
    };

    const floorPivot = new Object3D();
    floorPivot.parent = this.renderer.scene;

    floorPivot.rotation.x = -Math.PI / 2;

    const frostedIntensity = 0.0025;

    this.floor = new LitMesh(this.renderer, {
      label: "Reflection floor",
      geometry: new PlaneGeometry(),
      frustumCulling: false,
      textures: [this.reflectionTarget.renderTexture as Texture], // use the reflection target texture
      samplers: [
        new Sampler(this.renderer, {
          label: "Reflection sampler",
          name: "reflectionSampler",
          addressModeU: "mirror-repeat",
          addressModeV: "mirror-repeat",
        }),
      ],
      material: {
        shading: "Unlit",
        toneMapping: false,
        color: new Vec3(
          this.floorColor.rgb.r,
          this.floorColor.rgb.g,
          this.floorColor.rgb.b
        ).divideScalar(255),
        metallic: 0.2,
        roughness: 0.8,
        fragmentChunks: {
          additionalHead: floorAdditionalHeadContribution,
          preliminaryContribution: floorPreliminaryContribution,
        },
      },
      uniforms: {
        params: {
          visibility: ["fragment"],
          struct: {
            reflectionStrength: {
              type: "f32",
              value: this.floorColor.rgb.r > 155 ? 0.75 : 0.1,
            },
            reflectionQuality: {
              type: "f32",
              value: this.reflectionQuality,
            },
            frostedIntensity: {
              type: "f32",
              value: frostedIntensity,
            },
          },
        },
      },
    });

    this.floor.userData.time = 0;

    this.floor.parent = floorPivot;
    this.floor.scale.set(
      this.visibleSize.width * 2,
      this.visibleSize.height,
      1
    );

    this.floor
      .onBeforeRender(() => {
        this.floor.uniforms.params.frostedIntensity.value =
          frostedIntensity +
          Math.cos(this.floor.userData.time * 0.01) * frostedIntensity * 0.1;

        this.floor.userData.time++;
      })
      .onAfterResize(() => {
        this.floor.scale.set(
          this.visibleSize.width * 2,
          this.visibleSize.height,
          1
        );
      });

    this.compilteMaterialOnIdle(this.floor.material);
  }

  createPixelPass() {
    this.pingPongPlane = new PingPongPlane(this.renderer, {
      label: "Ping pong mouse trail",
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
      uniforms: {
        flowmap: {
          label: "Flowmap",
          struct: {
            mousePosition: {
              type: "vec2f",
              value: this.mouse.current.clone(),
            },
            // how much the cursor must dissipate over time (ie trail length)
            // closer to 1 = no dissipation
            dissipation: {
              type: "f32",
              value: 0.99,
            },
            cursorSize: {
              type: "f32",
              value: 0.25, // size of the mouse cursor
            },
            // alpha of the cursor
            alpha: {
              type: "f32",
              value: 1,
            },
            // canvas aspect ratio, used to draw a circle shaped cursor
            aspect: {
              type: "f32",
              value:
                this.renderer.boundingRect.width /
                this.renderer.boundingRect.height,
            },
            isActive: {
              type: "i32",
              value: 1,
            },
          },
        },
      },
    });

    this.pingPongPlane
      .onRender(() => {
        this.pingPongPlane.uniforms.flowmap.isActive.value = this
          .lineDrawerScene.isDrawing
          ? 1
          : 0;

        this.pingPongPlane.uniforms.flowmap.mousePosition.value.copy(
          this.mouse.current
        );
      })
      .onAfterResize(() => {
        this.pingPongPlane.uniforms.flowmap.aspect.value =
          this.renderer.boundingRect.width / this.renderer.boundingRect.height;
      });

    this.compilteMaterialOnIdle(this.pingPongPlane.material);

    this.pixelPass = new ShaderPass(this.renderer, {
      label: "Pixel pass",
      shaders: {
        fragment: {
          code: pixelPassFs,
        },
      },
      textures: [
        // ping pong planes use a Texture internally
        // so we need to create one to use it in our plane
        new Texture(this.renderer, {
          label: "Flow map texture",
          name: "flowMapTexture",
          fromTexture: this.pingPongPlane.renderTexture,
        }),
      ],
      samplers: [
        new Sampler(this.renderer, {
          label: "Clamp sampler",
          name: "clampSampler",
          addressModeU: "clamp-to-edge",
          addressModeV: "clamp-to-edge",
        }),
      ],
      uniforms: {
        params: {
          struct: {
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            minPixelSize: {
              type: "f32",
              value: 0.1,
            },
          },
        },
      },
    });

    this.pixelPass.onAfterResize(() => {
      this.pixelPass.uniforms.params.resolution.value.set(
        this.renderer.boundingRect.width,
        this.renderer.boundingRect.height
      );
    });

    this.compilteMaterialOnIdle(this.pixelPass.material);
  }

  toggleParticleInstance(index = 0) {
    const color = (
      this.particlesSystem.uniforms.params.colors.value as number[]
    )[index * 4 + 3];

    const isColorVisible = color === 1;

    const tweenProp = {
      opacity: color,
    };

    gsap.to(tweenProp, {
      opacity: isColorVisible ? 0 : 1,
      onUpdate: () => {
        // toggle opacity
        (this.particlesSystem.uniforms.params.colors.value as number[])[
          index * 4 + 3
        ] = tweenProp.opacity;

        this.particlesSystem.uniforms.params.colors.shouldUpdate = true;
      },
    });
  }

  override onQualityChange(newQuality: number): void {
    // we cannot really update pixel ratio, as it wipes the ping pong texture every times it changes
    const pixelRatio = this.lerp(1, window.devicePixelRatio, newQuality / 10);
    this.renderer.setPixelRatio(pixelRatio);

    if (this.reflectionTarget) {
      this.reflectionQuality = this.lerp(0.2, 0.8, newQuality / 10);
      this.reflectionTarget.setQualityRatio(this.reflectionQuality);

      if (this.floor) {
        this.floor.uniforms.params.reflectionQuality.value =
          this.reflectionQuality;
      }
    }

    super.onQualityChange(newQuality);

    if (newQuality < 1) {
      this.directionalLight.shadow.intensity = 0;
      this.pingPongPlane.visible = false;
      this.pixelPass.visible = false;
      return;
    } else {
      this.directionalLight.shadow.intensity = this.shadowIntensity;
      this.pingPongPlane.visible = true;
      this.pixelPass.visible = true;
    }

    const pcfSamples = this.lerp(1, 3, newQuality / 10);
    this.directionalLight.shadow.pcfSamples = Math.round(pcfSamples);

    const shadowMapSize = (() => {
      switch (true) {
        case newQuality <= 3:
          return 256;
        case newQuality >= 8:
          return 2048;
        case newQuality < 5:
          return 512;
        default:
          return 1024;
      }
    })();

    this.directionalLight.shadow.depthTextureSize.set(shadowMapSize);
  }

  addDebug() {
    const cameraFolder = this.addDebugFolder({
      title: "Camera",
      expanded: false,
    });

    if (cameraFolder) {
      this.addDebugBinding(
        this.renderer.camera,
        "position",
        {
          label: "Position",
          x: { step: 5, min: -1000, max: 1000 },
          y: { step: 5, min: 0, max: 1000 },
          z: { step: 5, min: -1000, max: 1000 },
        },
        cameraFolder
      );

      const cameraLookAtBinding = this.addDebugBinding(
        this,
        "cameraLookAt",
        {
          label: "Target",
          x: { step: 5, min: -200, max: 200 },
          y: { step: 5, min: 0, max: 700 },
          z: { step: 5, min: -200, max: 200 },
        },
        cameraFolder
      );

      if (cameraLookAtBinding) {
        cameraLookAtBinding.on("change", (ev) => {
          this.renderer.camera.lookAt(ev.value as Vec3);
        });
      }
    }

    const lightFolder = this.addDebugFolder({
      title: "Directional light",
      expanded: false,
    });

    if (lightFolder) {
      this.addDebugBinding(
        this.directionalLight,
        "position",
        {
          label: "Position",
          x: { step: 5, min: -500, max: 500 },
          y: { step: 5, min: 250, max: 2000 },
          z: { step: 5, min: -500, max: 500 },
        },
        lightFolder
      );

      this.addDebugBinding(
        this.directionalLight,
        "target",
        {
          label: "Target",
          x: { step: 5, min: -500, max: 500 },
          y: { step: 5, min: 0, max: 1000 },
          z: { step: 5, min: -500, max: 500 },
        },
        lightFolder
      );
    }

    const shadowFolder = this.addDebugFolder({ title: "Shadow" }, lightFolder);

    if (shadowFolder) {
      const shadowIntensityBinding = this.addDebugBinding(
        this,
        "shadowIntensity",
        {
          label: "Intensity",
          step: 0.05,
          min: 0,
          max: 1,
        },
        shadowFolder
      );

      if (shadowIntensityBinding) {
        shadowIntensityBinding.on("change", (ev) => {
          this.directionalLight.shadow.intensity = ev.value as number;
        });
      }

      this.addDebugBinding(
        this.directionalLight.shadow,
        "bias",
        {
          label: "Bias",
          step: 0.0001,
          min: 0,
          max: 0.01,
        },
        shadowFolder
      );

      this.addDebugBinding(
        this.directionalLight.shadow,
        "pcfSamples",
        {
          label: "PCF samples",
          step: 1,
          min: 1,
          max: 3,
        },
        shadowFolder
      );

      const depthTextureSizeBinding = this.addDebugBinding(
        { size: this.directionalLight.shadow.depthTextureSize.x },
        "size",
        {
          label: "Depth texture size",
          step: 1,
          min: 128,
          max: 2048,
        },
        shadowFolder
      );

      if (depthTextureSizeBinding) {
        depthTextureSizeBinding.on("change", (ev) => {
          this.directionalLight.shadow.depthTextureSize.set(ev.value);
        });
      }
    }

    if (this.computePass) {
      const computeFolder = this.addDebugFolder({
        title: "Compute pass",
        expanded: false,
      });

      if (computeFolder) {
        this.addDebugBinding(
          this.computePass.uniforms.params.radius,
          "value",
          {
            label: "Radius",
            min: 0.25,
            max: 10,
            step: 0.05,
          },
          computeFolder
        );

        this.addDebugBinding(
          this.computePass.uniforms.params.initRadius,
          "value",
          {
            label: "Initial radius",
            min: 5,
            max: 200,
            step: 0.5,
          },
          computeFolder
        );

        this.addDebugBinding(
          this.computePass.uniforms.params.speed,
          "value",
          {
            label: "Speed",
            min: 0,
            max: 1,
            step: 0.05,
          },
          computeFolder
        );

        this.addDebugBinding(
          this.computePass.uniforms.params.curlStrength,
          "value",
          {
            label: "Curl strength",
            min: 0.05,
            max: 2,
            step: 0.05,
          },
          computeFolder
        );

        this.addDebugBinding(
          this.computePass.uniforms.params.curlPersistence,
          "value",
          {
            label: "Curl persistence",
            min: 0.01,
            max: 0.5,
            step: 0.005,
          },
          computeFolder
        );

        const mouseStrengthBinding = this.addDebugBinding(
          this.mouse,
          "strength",
          {
            label: "Mouse strength",
            min: 1,
            max: 10,
            step: 0.25,
          },
          computeFolder
        );

        if (mouseStrengthBinding) {
          mouseStrengthBinding.on("change", (value) => {
            (this.computePass.uniforms.params.mouseStrength.value as number) =
              this.mouse.strength /
              Math.hypot(this.visibleSize.width, this.visibleSize.height);
          });
        }
      }
    }

    if (this.particlesSystem) {
      const particlesFolder = this.addDebugFolder({
        title: "Particles",
        expanded: false,
      });

      if (particlesFolder) {
        this.addDebugBinding(
          this.particlesSystem.uniforms.params.size,
          "value",
          {
            label: "Size",
            min: 0.1,
            max: 3,
            step: 0.05,
          },
          particlesFolder
        );

        const positionBinding = this.addDebugBinding(
          this,
          "particlesPosition",
          {
            label: "Position",
            x: { step: 1, min: -200, max: 200 },
            y: { min: 0, max: 700, step: 1 },
            z: { step: 1, min: -200, max: 200 },
          },
          particlesFolder
        );

        if (positionBinding) {
          positionBinding.on("change", (ev) => {
            this.particlesSystem.position.copy(ev.value);
          });
        }
      }
    }

    if (this.reflectionTarget && this.floor) {
      const reflectionFolder = this.addDebugFolder({
        title: "Reflection",
        expanded: false,
      });

      if (reflectionFolder) {
        this.addDebugBinding(
          this,
          "isReflectionActive",
          {
            label: "Active",
          },
          reflectionFolder
        );

        const qualityBinding = this.addDebugBinding(
          this,
          "reflectionQuality",
          {
            label: "Quality",
            min: 0.1,
            max: 1,
            step: 0.05,
          },
          reflectionFolder
        );

        if (qualityBinding) {
          qualityBinding.on("change", (ev) => {
            this.reflectionTarget.setQualityRatio(ev.value);
            this.floor.uniforms.params.reflectionQuality.value = ev.value;
          });
        }

        this.addDebugBinding(
          this.floor.uniforms.params.reflectionStrength,
          "value",
          {
            label: "Strength",
            min: 0,
            max: 1,
            step: 0.05,
          },
          reflectionFolder
        );

        this.addDebugBinding(
          this,
          "reflectionCameraPositionRatio",
          {
            label: "Reflection camera position ratio",
            x: { step: 0.05, min: 0.05, max: 3 },
            y: { min: -1, max: -1 },
            z: { step: 0.05, min: 0.05, max: 3 },
          },
          reflectionFolder
        );
      }
    }

    if (this.pingPongPlane && this.pixelPass) {
      const postProFolder = this.addDebugFolder({
        title: "Post processing",
        expanded: false,
      });

      if (postProFolder) {
        const pingPongFolder = this.addDebugFolder(
          { title: "Ping pong trail" },
          postProFolder
        );

        if (pingPongFolder) {
          /*
dissipation: {
              type: "f32",
              value: 0.99,
            },
            cursorSize: {
              type: "f32",
              value: 0.275, // size of the mouse cursor
            },
          */

          this.addDebugBinding(
            this.pingPongPlane.uniforms.flowmap.dissipation,
            "value",
            {
              label: "Dissipation",
              min: 0.9,
              max: 0.995,
              step: 0.005,
            },
            pingPongFolder
          );

          this.addDebugBinding(
            this.pingPongPlane.uniforms.flowmap.cursorSize,
            "value",
            {
              label: "Cursor size",
              min: 0.1,
              max: 0.5,
              step: 0.005,
            },
            pingPongFolder
          );
        }
      }
    }
  }

  override destroy() {
    super.destroy();

    this.lineDrawerScene.destroy();

    // destroy both compute pass and compute bind group
    this.computePass?.remove();
    this.computeBindGroup?.destroy();

    this.particlesSystem?.remove();
    //this.glassMesh?.remove();

    this.reflectionTarget?.remove();
    this.reflectionCameraBindGroup?.destroy();
    this.floor?.remove();

    this.pixelPass?.remove();

    this.renderer?.destroy();
  }
}
