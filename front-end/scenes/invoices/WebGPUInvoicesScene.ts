import { WebGPUScene, type WebGPUSceneParams } from "../WebGPUScene";
import {
  AmbientLight,
  BindGroup,
  BufferBinding,
  WritableBufferBinding,
  ComputePass,
  DirectionalLight,
  PointLight,
  GPUCameraRenderer,
  LitMesh,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  sRGBToLinear,
  Vec2,
  Vec3,
  FullscreenPlane,
  RenderTarget,
  MediaTexture,
  ShaderPass,
  Texture,
  Sampler,
} from "gpu-curtains";
import type { PerspectiveCamera } from "gpu-curtains";
import { computeAttraction } from "./shaders/compute-attraction.wgsl";
import { attractionPlaneFs } from "./shaders/attraction-plane.wgsl";
import { attractionShadowMap } from "./shaders/chunks/attraction-shadow-map.wgsl";
import { volumetricLightingPass } from "./shaders/volumetric-lighting-pass.wgsl";
import {
  mainSphereGlowFs,
  mainSphereGlowVs,
} from "./shaders/main-sphere-glow.wgsl";
import { blendPassFs, gaussianBlurPassFs } from "./shaders/blur-pass.wgsl";
import {
  wrappingBoxAdditionalHead,
  wrappingBoxPreliminaryContribution,
} from "./shaders/chunks/wrapping-box-fragment-constributions.wgsl";
import { ColorModel } from "@martinlaxenaire/color-palette-generator";
import { instancesAdditionalVertexHead } from "./shaders/chunks/instances-additional-vertex-head";
import type { initAsyncCompiler } from "sass";

export interface WebGPUInvoicesSceneParams extends WebGPUSceneParams {
  invoices?: string[];
  theme?: Theme;
  onStarted?: () => void;
  onAttractionComplete?: () => void;
}

// inspiration
// https://x.com/active_theory/status/1744397422724583572
// and https://x.com/pschroen/status/1859014619408592955
export class WebGPUInvoicesScene extends WebGPUScene {
  renderer: GPUCameraRenderer;

  invoices: number[];

  visibleSize!: PerspectiveCamera["visibleSize"];
  visibleSizeAtOrigin!: PerspectiveCamera["visibleSize"];
  depthRange: number;
  depthPosition: number;

  onStarted: () => void;
  onAttractionComplete: () => void;

  ambientLight: AmbientLight;
  directionalLights: DirectionalLight[];
  pointLight: PointLight;

  theme: Theme;

  mouse: {
    current: Vec2;
    //last: Vec2;
    lerped: Vec2;
    constrained: Vec2;
  };

  systemSize: Vec3;
  scaleRef!: number;
  minDistance: number;

  containerParent: HTMLElement | null;
  currentAttraction: number;
  maxAttraction: number;
  attractionSpeed: number;
  repulsionSpeed: number;
  hasFirstAttraction: boolean;
  isAttracting: boolean;
  attractionComplete: boolean;

  private _pointerMoveHandler: (e: MouseEvent | TouchEvent) => void;
  private _pointerDownHandler: (e: PointerEvent | TouchEvent) => void;
  private _pointerUpHandler: (e: PointerEvent | TouchEvent) => void;

  // blue: Vec3;
  // pink: Vec3;

  mainColor: Vec3;
  secondaryColor: Vec3;
  collisionColor: Vec3;
  gridColor: Vec3;

  particleBindGroupA!: BindGroup;
  particleBindGroupB!: BindGroup;
  computeAttractionPass!: ComputePass;
  instancedGeometry!: SphereGeometry;
  instancedMesh!: LitMesh;

  mainSphere!: LitMesh;

  normalTexture!: MediaTexture;
  blueNoiseTexture!: MediaTexture;

  plane!: FullscreenPlane;
  wrappingBox!: LitMesh;

  volumetricQuality!: number;
  volumetricOutputTarget!: RenderTarget;
  blurInputTarget!: RenderTarget;
  blurOutputTarget!: RenderTarget;

  volumetricPass!: ShaderPass;
  volumetricDensityFactor!: number;
  volumetricDensityAttractionFactor!: number;

  horizontalGaussianBlurPass!: ShaderPass;
  verticalGaussianBlurPass!: ShaderPass;
  blendPass!: ShaderPass;

  constructor({
    gpuCurtains,
    container,
    progress = 0,
    colors = [],
    debugPane = null,
    invoices = [],
    theme = "light",
    onStarted = () => {},
    onAttractionComplete = () => {},
  }: WebGPUInvoicesSceneParams) {
    super({
      gpuCurtains,
      container,
      progress,
      colors,
      debugPane,
      targetFPS: 45,
    });

    this.isVisible = false;

    this.theme = theme;

    if (!invoices.length) {
      invoices = Array.from({ length: 150 }, () =>
        Math.floor(Math.random() * 4900 + 100).toString()
      );
    }

    this.invoices = invoices.flat().map((v) => parseInt(v));

    this.minDistance = 5;
    this.systemSize = new Vec3(0, 0, 15);

    this.onStarted = onStarted;
    this.onAttractionComplete = onAttractionComplete;

    this.renderer = new GPUCameraRenderer({
      label: "Invoices scene renderer",
      deviceManager: this.gpuCurtains.deviceManager,
      container,
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
      camera: {
        near: this.minDistance,
        far: this.systemSize.z * 2 + this.minDistance,
        fov: 35,
      },
    });

    this.depthRange = this.renderer.camera.far - this.renderer.camera.near;
    this.depthPosition = -this.renderer.camera.near - 1.25;

    // mouse interaction
    this.mouse = {
      current: new Vec2(0.5), // center
      lerped: new Vec2(0.5),
      constrained: new Vec2(0.5),
    };

    this.renderer.camera.position.z = this.systemSize.z + this.minDistance;

    this.onResize();
    this.renderer
      .onResize(() => this.onResize())
      .onBeforeRender(() => this.onRender());

    // this.blue = new Vec3(5, 5, 175).divideScalar(255);
    // this.pink = new Vec3(222, 0, 255).divideScalar(255);

    this.mainColor = new Vec3();
    this.secondaryColor = new Vec3();
    this.collisionColor = new Vec3();
    this.gridColor = new Vec3();

    this.applyColors();

    this.ambientLight = new AmbientLight(this.renderer, {
      intensity: 0.1,
    });

    this.directionalLights = [];

    this.directionalLights.push(
      new DirectionalLight(this.renderer, {
        position: new Vec3(200, 50, 100),
        intensity: 2,
      })
    );

    this.directionalLights.push(
      new DirectionalLight(this.renderer, {
        position: new Vec3(-200, -50, 100),
        intensity: 2,
      })
    );

    this.pointLight = new PointLight(this.renderer, {
      intensity: 25,
      range: 1000,
      color: this.mainColor,
      shadow: {
        depthTextureSize: new Vec2(256),
      },
    });

    this.maxAttraction = 0.3;
    this.attractionSpeed = 0.005;
    this.repulsionSpeed = 0.05;
    this.currentAttraction = 0;
    this.isAttracting = false;
    this.attractionComplete = false;
    this.hasFirstAttraction = false;

    this._pointerMoveHandler = this.onPointerMove.bind(this);
    this._pointerDownHandler = this.onPointerDown.bind(this);
    this._pointerUpHandler = this.onPointerUp.bind(this);

    window.addEventListener("mousemove", this._pointerMoveHandler);
    window.addEventListener("touchmove", this._pointerMoveHandler);

    //this.containerParent = this.container.parentNode as HTMLElement;
    this.containerParent = document.querySelector("#invoices") as HTMLElement;

    if (this.containerParent) {
      this.containerParent.addEventListener(
        "pointerdown",
        this._pointerDownHandler
      );
      this.containerParent.addEventListener(
        "touchstart",
        this._pointerDownHandler,
        { passive: true }
      );
      this.containerParent.addEventListener(
        "pointerup",
        this._pointerUpHandler
      );
      this.containerParent.addEventListener("touchend", this._pointerUpHandler);
    }

    this.createFullscreenPlane();
    this.createInstancedMesh();
    this.createWrappingBox();
    this.createVolumetric();

    this.addDebug();
  }

  override setColors(colors: ColorModelBase[]) {
    super.setColors(colors);

    this.applyColors();
  }

  override setSceneVisibility(isVisible = false) {
    super.setSceneVisibility(isVisible);
    this.renderer.shouldRenderScene = isVisible;
  }

  updateTheme(theme: Theme = "light") {
    this.theme = theme;
    this.applyColors();
  }

  applyColors() {
    if (!this.colors) return;

    const paletteLength = this.colors.length;

    const isLight = this.theme === "light";

    const mainColorIndex = isLight ? 1 : paletteLength - 1;
    const gridColorIndex = isLight ? 2 : paletteLength - 2;

    const secondaryColorIndex = isLight ? paletteLength - 2 : 2;
    const collisionColorIndex = isLight ? paletteLength - 1 : 1;

    this.mainColor
      .set(
        this.colors[mainColorIndex].rgb.r,
        this.colors[mainColorIndex].rgb.g,
        this.colors[mainColorIndex].rgb.b
      )
      .divideScalar(255);

    this.gridColor = new Vec3(
      this.colors[gridColorIndex].rgb.r,
      this.colors[gridColorIndex].rgb.g,
      this.colors[gridColorIndex].rgb.b
    ).divideScalar(255);

    this.secondaryColor
      .set(
        this.colors[secondaryColorIndex].rgb.r,
        this.colors[secondaryColorIndex].rgb.g,
        this.colors[secondaryColorIndex].rgb.b
      )
      .divideScalar(255);

    this.collisionColor
      .set(
        this.colors[collisionColorIndex].rgb.r,
        this.colors[collisionColorIndex].rgb.g,
        this.colors[collisionColorIndex].rgb.b
      )
      .divideScalar(255);

    const linearMainColor = sRGBToLinear(this.mainColor.clone());
    const linearSecondaryColor = sRGBToLinear(this.secondaryColor.clone());
    const linearCollisionColor = sRGBToLinear(this.collisionColor.clone());
    const linearGridColor = sRGBToLinear(this.gridColor);

    // if (this.mainSphere) {
    //   this.mainSphere.uniforms.material.color.value.copy(linearMainColor);
    // }

    if (this.instancedMesh) {
      this.instancedMesh.uniforms.material.color.value.copy(
        linearSecondaryColor
      );
      this.instancedMesh.uniforms.material.specularColor.value.copy(
        linearMainColor
      );
      this.instancedMesh.uniforms.params.collisionColor.value.copy(
        linearCollisionColor
      );
    }

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

    if (this.wrappingBox) {
      this.wrappingBox.uniforms.material.color.value.copy(linearGridColor);
    }
  }

  createFullscreenPlane() {
    this.plane = new FullscreenPlane(this.renderer, {
      label: "Attraction fullscreen plane shader",
      shaders: {
        fragment: {
          code: attractionPlaneFs,
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
            time: {
              type: "f32",
              value: 0,
            },
            speed: {
              type: "f32",
              value: 0.005,
            },
            mousePosition: {
              type: "vec2f",
              value: this.mouse.constrained,
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            intensity: {
              type: "f32",
              value: 0,
            },
            nbSides: {
              type: "f32",
              value: 12,
            },
            arcStrength: {
              type: "f32",
              value: 1,
            },
            nbPolygons: {
              type: "f32",
              value: 1,
            },
            centerSize: {
              type: "f32",
              value: 0.5,
            },
            outerSize: {
              type: "f32",
              value: 1.35,
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
      });

    this.compilteMaterialOnIdle(this.plane.material);
  }

  createWrappingBox() {
    const beforeScenePassEntry = this.renderer.scene.createScreenPassEntry(
      "Wrapping box pass entry",
      -1
    );

    this.wrappingBox = new LitMesh(this.renderer, {
      label: "Wrapping box",
      geometry: new BoxGeometry(),
      cullMode: "front",
      transparent: true,
      useCustomScenePassEntry: beforeScenePassEntry,
      material: {
        shading: "Lambert",
        toneMapping: "Khronos",
        color: this.gridColor,
        alphaCutoff: 0.1,
        fragmentChunks: {
          additionalHead: wrappingBoxAdditionalHead,
          preliminaryContribution: wrappingBoxPreliminaryContribution,
        },
      },
      uniforms: {
        grid: {
          struct: {
            scale: {
              type: "vec2f",
              value: new Vec2(15),
            },
            lineWidth: {
              type: "vec2f",
              value: new Vec2(0.075),
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
          },
        },
      },
    });

    //this.wrappingBox.position.z = this.depthPosition;

    const setScale = () => {
      this.wrappingBox.scale.set(
        this.visibleSizeAtOrigin.width * 0.5,
        this.visibleSizeAtOrigin.height * 0.5,
        this.depthRange * 0.4995
      );

      this.wrappingBox.uniforms.grid.resolution.value.set(
        this.renderer.boundingRect.width,
        this.renderer.boundingRect.height
      );
    };

    setScale();

    this.wrappingBox.onAfterResize(() => {
      setScale();
    });

    this.compilteMaterialOnIdle(this.wrappingBox.material);
  }

  override onResize() {
    const diagonal = Math.hypot(
      this.renderer.boundingRect.width,
      this.renderer.boundingRect.height
    );

    //const diagonalRef = Math.hypot(1600, 900);
    const diagonalRef = Math.hypot(1920, 1080);

    this.scaleRef = (diagonal / diagonalRef) ** 0.5;

    this.visibleSizeAtOrigin = this.renderer.camera.getVisibleSizeAtDepth();
    this.visibleSize = this.renderer.camera.getVisibleSizeAtDepth(
      this.depthPosition
    );

    // camera screen ratio depends on screen size, fov and camera position
    const cameraRatio = this.visibleSize.height * 0.5;

    const screenRatio =
      this.renderer.boundingRect.width / this.renderer.boundingRect.height;

    //this.systemSize.set(cameraRatio * screenRatio, cameraRatio, 5);
    this.systemSize.x = cameraRatio * screenRatio;
    this.systemSize.y = cameraRatio;
  }

  override onRender() {
    super.onRender();

    this.mouse.lerped.lerp(this.mouse.current, 0.1);

    if (
      this.renderer.shouldRenderScene &&
      this.computeAttractionPass &&
      this.computeAttractionPass.ready
    ) {
      this.currentAttraction = this.isAttracting
        ? Math.min(
            this.maxAttraction,
            this.currentAttraction + this.attractionSpeed
          )
        : Math.max(0, this.currentAttraction - this.repulsionSpeed);

      if (
        this.isAttracting &&
        !this.hasFirstAttraction &&
        this.currentAttraction > 0.1
      ) {
        this.hasFirstAttraction = true;
        this.onStarted();
      }

      // this.currentAttraction = this.lerp(
      //   this.currentAttraction,
      //   this.isAttracting ? this.maxAttraction : 0,
      //   this.isAttracting ? 0.025 : 0.35
      // );

      this.computeAttractionPass.uniforms.params.mouseAttraction.value =
        this.currentAttraction;

      this.plane.visible = this.currentAttraction > 0;
      this.plane.uniforms.params.intensity.value =
        this.currentAttraction / this.maxAttraction;

      this.pointLight.position
        .set(this.mouse.lerped.x, this.mouse.lerped.y, 0)
        .multiplyScalar(2)
        .addScalar(-1)
        .multiply(new Vec3(this.systemSize.x, this.systemSize.y, 0));

      this.pointLight.position.z = this.depthPosition;

      // constrain
      this.pointLight.position.x = Math.min(
        Math.max(
          this.pointLight.position.x,
          this.visibleSizeAtOrigin.width * -0.5 + 1
        ),
        this.visibleSizeAtOrigin.width * 0.5 - 1
      );

      this.pointLight.position.y = Math.min(
        Math.max(
          this.pointLight.position.y,
          this.visibleSizeAtOrigin.height * -0.5 + 1
        ),
        this.visibleSizeAtOrigin.height * 0.5 - 1
      );

      this.mouse.constrained
        .set(
          this.pointLight.position.x / this.systemSize.x,
          this.pointLight.position.y / this.systemSize.y
        )
        .multiplyScalar(0.5)
        .addScalar(0.5);

      (this.computeAttractionPass.uniforms.params.mousePosition.value as Vec3)
        .copy(this.pointLight.position)
        .divideScalar(this.scaleRef);

      this.mainSphere.position.copy(this.pointLight.position);

      if (this.volumetricPass) {
        this.volumetricPass.uniforms.params.density.value =
          this.volumetricDensityFactor * this.scaleRef +
          (this.currentAttraction / this.maxAttraction) *
            this.volumetricDensityAttractionFactor;
      }
    }
  }

  onPointerMove(e: MouseEvent | TouchEvent) {
    const boundingRect = this.container.getBoundingClientRect();

    const { clientX, clientY } =
      "targetTouches" in e && e.targetTouches.length
        ? (e.targetTouches[0] as Touch)
        : (e as MouseEvent);

    this.mouse.current.set(
      (clientX - boundingRect.left) / boundingRect.width,
      1 - (clientY - boundingRect.top) / boundingRect.height
    );
  }

  onPointerDown(e: PointerEvent | TouchEvent) {
    this.isAttracting = true;
    this.onPointerMove(e);
  }

  onPointerUp(e: PointerEvent | TouchEvent) {
    this.isAttracting = false;
  }

  createInstancedMesh() {
    // number of particles instances
    const numParticles = this.invoices.length;

    //const adjustedInvoices = this.invoices.map((v) => Math.sqrt(Math.log1p(v)));

    const scaleFactor = 500; // Adjust this based on your value range
    const adjustedInvoices = this.invoices.map((v) => v / (v + scaleFactor));

    const min = Math.min(...adjustedInvoices);
    const max = Math.max(...adjustedInvoices);

    const normalizedInvoices = adjustedInvoices.map((v) =>
      Math.max(0.1, (v - min) / (max - min))
    );

    const initialParticlePosition = new Float32Array(numParticles * 4);
    const initialParticleVelocity = new Float32Array(numParticles * 4);
    const initialParticleRotation = new Float32Array(numParticles * 4);
    const initialParticleAngularVelocity = new Float32Array(numParticles * 4);
    const initialParticleData = new Float32Array(numParticles * 4);

    for (let i = 0; i < numParticles; ++i) {
      initialParticlePosition[4 * i + 0] =
        this.systemSize.x * (Math.random() - 0.5) * 1.75;
      initialParticlePosition[4 * i + 1] =
        this.systemSize.y * (Math.random() - 0.5) * 1.75;
      initialParticlePosition[4 * i + 2] =
        this.systemSize.z * (Math.random() - 0.5) * 1.75;

      initialParticleVelocity[4 * i + 0] =
        this.systemSize.x * (Math.random() - 0.5) * 0.02;
      initialParticleVelocity[4 * i + 1] =
        this.systemSize.y * (Math.random() - 0.5) * 0.02;
      initialParticleVelocity[4 * i + 2] =
        this.systemSize.z * (Math.random() - 0.5) * 0.02;

      initialParticleRotation[4 * i + 0] = 0;
      initialParticleRotation[4 * i + 1] = 0;
      initialParticleRotation[4 * i + 2] = 0;
      initialParticleRotation[4 * i + 3] = 1;

      initialParticleAngularVelocity[4 * i + 0] = Math.random() * 0.5 - 0.25;
      initialParticleAngularVelocity[4 * i + 1] = Math.random() * 0.5 - 0.25;
      initialParticleAngularVelocity[4 * i + 2] = Math.random() * 0.5 - 0.25;
      initialParticleAngularVelocity[4 * i + 3] = 0;

      initialParticleData[4 * i + 0] = normalizedInvoices[i]; // radius
    }

    const getBoxPlanes = () => {
      // prettier-ignore
      const boxPlanes =  new Float32Array([
        1, 0, 0, this.visibleSizeAtOrigin.width * 0.5 / this.scaleRef, // left
        -1, 0, 0, this.visibleSizeAtOrigin.width * 0.5 / this.scaleRef, // right
        0, -1, 0, this.visibleSizeAtOrigin.height * 0.5 / this.scaleRef, // top
        0, 1, 0, this.visibleSizeAtOrigin.height * 0.5 / this.scaleRef, // bottom
        0, 0, -1, 0, // near
        0, 0, 1, this.depthRange * 0.4995 / this.scaleRef // far
      ])

      return boxPlanes;
    };

    // first our uniform buffer
    const uniformsBufferBinding = new BufferBinding({
      bindingType: "uniform",
      visibility: ["compute"],
      name: "params",
      label: "SimParams",
      struct: {
        deltaT: {
          type: "f32",
          value: 0.04,
        },
        mousePosition: {
          type: "vec3f",
          //value: new Vec2(),
          value: this.pointLight.position.clone(),
        },
        mouseAttraction: {
          type: "f32",
          //value: 0.175,
          value: 0,
        },
        spheresRepulsion: {
          type: "f32",
          value: 0.25,
        },
        boxReboundFactor: {
          type: "f32",
          value: 0.75,
        },
        boxPlanes: {
          type: "array<vec4f>",
          value: getBoxPlanes(),
        },
      },
    });

    // the read-only storage buffer
    const particlesBufferBindingA = new BufferBinding({
      label: "ParticleA",
      name: "particlesA",
      bindingType: "storage",
      access: "read", // we want a read only buffer
      usage: ["vertex"], // we're going to use this buffer as a vertex buffer along default usages
      visibility: ["compute"],
      struct: {
        position: {
          type: "array<vec4f>",
          value: initialParticlePosition,
        },
        velocity: {
          type: "array<vec4f>",
          value: initialParticleVelocity,
        },
        rotation: {
          type: "array<vec4f>",
          value: initialParticleRotation,
        },
        angularVelocity: {
          type: "array<vec4f>",
          value: initialParticleAngularVelocity,
        },
        data: {
          type: "array<vec4f>",
          value: initialParticleData,
        },
      },
    });

    // the read/write storage buffer
    const particlesBufferBindingB = new WritableBufferBinding({
      label: "ParticleB",
      name: "particlesB",
      bindingType: "storage",
      access: "read_write", // we want a readable AND writable buffer!
      usage: ["vertex"], // we're going to use this buffer as a vertex buffer along default usages
      shouldCopyResult: true, // allow to know when attraction is complete
      visibility: ["compute"],
      struct: {
        position: {
          type: "array<vec4f>",
          value: initialParticlePosition,
        },
        velocity: {
          type: "array<vec4f>",
          value: initialParticleVelocity,
        },
        rotation: {
          type: "array<vec4f>",
          value: initialParticleRotation,
        },
        angularVelocity: {
          type: "array<vec4f>",
          value: initialParticleAngularVelocity,
        },
        data: {
          type: "array<vec4f>",
          value: initialParticleData,
        },
      },
    });

    // create a first bind group with all of that
    this.particleBindGroupA = new BindGroup(this.renderer, {
      label: "Particle A bind group",
      bindings: [
        uniformsBufferBinding,
        particlesBufferBindingA,
        particlesBufferBindingB,
      ],
    });

    // create bind group & its layout
    this.particleBindGroupA.createBindGroup();

    // now create a second one, with the same bind group layout but with the storage buffers swapped
    this.particleBindGroupB = this.particleBindGroupA.clone({
      bindings: [
        uniformsBufferBinding,
        particlesBufferBindingB,
        particlesBufferBindingA,
      ],
      keepLayout: true,
    });

    // the compute pass
    this.computeAttractionPass = new ComputePass(this.renderer, {
      label: "Compute attraction pass",
      shaders: {
        compute: {
          code: computeAttraction,
        },
      },
      bindGroups: [this.particleBindGroupA],
    });

    this.computeAttractionPass.onAfterRender(async () => {
      if (!this.isAttracting || this.attractionComplete) return;

      // check attraction result
      const dstResult =
        await this.computeAttractionPass.material.getBufferBindingResultByBindingName(
          "particlesB"
        );

      const resultLength = dstResult.length;

      let totalAttraction = 0;
      const stepSize = 4 * 5; // 5 vec4f attributes

      for (let i = 0; i < resultLength; i += stepSize) {
        totalAttraction += dstResult[i + stepSize - 3]; // attraction is stored in data.y component
      }

      if (
        totalAttraction >= this.invoices.length - 1 &&
        !this.attractionComplete
      ) {
        const binding =
          this.computeAttractionPass.material.getBufferBindingByName(
            "particlesB"
          );

        // stop copying result
        if (binding) {
          (binding as WritableBufferBinding).shouldCopyResult = false;
        }

        this.attractionComplete = true;
        this.onAttractionComplete();
      }
    });

    let pingPong = 0;

    // use a custom render function
    // here the pipeline has already been set
    // we just have to set the bind groups and dispatch the work groups as we want
    this.computeAttractionPass
      .useCustomRender((pass) => {
        // bind group ping pong
        pass.setBindGroup(
          this.particleBindGroupA.index,
          pingPong % 2 === 0
            ? this.particleBindGroupA.bindGroup
            : this.particleBindGroupB.bindGroup
        );

        pass.dispatchWorkgroups(Math.ceil(numParticles / 64));

        pingPong++;
      })
      .onAfterResize(() => {
        this.renderer.camera.updateMatrixStack();

        this.computeAttractionPass.uniforms.params.boxPlanes.value =
          getBoxPlanes();
      });

    this.compilteMaterialOnIdle(this.computeAttractionPass.material);

    this.instancedGeometry = new SphereGeometry({
      instancesCount: numParticles,
      vertexBuffers: [
        {
          stepMode: "instance",
          name: "instanceAttributes",
          // pass the particles buffer right away
          buffer: particlesBufferBindingA.buffer,
          // since we passed a buffer, we do not need to specify arrays for the attributes
          attributes: [
            {
              name: "instancePosition",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
            {
              name: "instanceVelocity",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
            {
              name: "instanceRotation",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
            {
              name: "instanceAngularVelocity",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
            {
              name: "instanceData",
              type: "vec4f",
              bufferFormat: "float32x4",
              size: 4,
            },
          ],
        },
      ],
    });

    const toneMapping = "Khronos";

    this.normalTexture = new MediaTexture(this.renderer, {
      label: "Normal texture",
      name: "normalTexture",
      format: "rgba8unorm",
      visibility: ["fragment"],
      generateMips: true,
      useTransform: true,
    });

    //normalTexture.offset.x = 0.25;
    this.normalTexture.scale.set(8, 4);

    const normalSampler = new Sampler(this.renderer, {
      label: "Normal texture sampler",
      name: "normalSampler",
      addressModeU: "repeat",
      addressModeV: "repeat",
    });

    this.normalTexture.loadImage("./images/normal-map.png");

    // TODO add subsurface scattering?
    // https://github.com/mrdoob/three.js/blob/e431ae3df64a00b4130d94992203d57fa629cb0e/examples/jsm/shaders/SubsurfaceScatteringShader.js#L18
    this.instancedMesh = new LitMesh(this.renderer, {
      label: "Instanced spheres mesh",
      geometry: this.instancedGeometry,
      cullMode: "none",
      //transparent: true,
      material: {
        shading: "PBR",
        toneMapping,
        additionalVaryings: [
          {
            name: "velocity",
            type: "vec4f",
          },
        ],
        vertexChunks: {
          additionalHead: instancesAdditionalVertexHead,
          preliminaryContribution: /* wgsl */ `
            let rotationMatrix = quatToMat4(normalize(attributes.instanceRotation));
            // instanceData.x holds uniform scale
            position = (rotationMatrix * vec4(position * attributes.instanceData.x, 1.0)).xyz + attributes.instancePosition.xyz;
            //position = position * attributes.instanceData.x + attributes.instancePosition.xyz;
            normal = normalize((rotationMatrix * vec4(normal , 1.0)).xyz);
          `,
          additionalContribution: /* wgsl */ `
            vsOutput.velocity = attributes.instanceVelocity;
          `,
        },
        fragmentChunks: {
          additionalHead: wrappingBoxAdditionalHead,
          preliminaryContribution: /* wgsl */ `
            outputColor = mix(outputColor, vec4(vec3(params.collisionColor), outputColor.a), velocity.w);
          `,
          // additionalContribution: /* wgsl */ `
          //   let thicknessColor: vec3f = material.specularColor;
          //   let thicknessDistortion: f32 = 0.3;
          //   let thicknessAmbient: f32 = 0.0;
          //   let thicknessAttenuation: f32 = 0.05;
          //   let thicknessPower: f32 = 2.0;
          //   let thicknessScale: f32 = 0.75;

          //   let pointLight = pointLights.elements[0];
          //   var lightDirection: vec3f = pointLight.position - worldPosition;
          //   lightDirection = normalize(lightDirection);

          //   let scatteringHalf: vec3f = normalize(lightDirection + (geometryNormal * thicknessDistortion));
          //   let scatteringDot: f32 = pow(saturate(dot(viewDirection, -scatteringHalf)), thicknessPower) * thicknessScale;
          //   let scatteringIllu: vec3f = (scatteringDot + thicknessAmbient) * thicknessColor;
          //   reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation;

          //   totalDiffuse = reflectedLight.indirectDiffuse + reflectedLight.directDiffuse;

          //   outgoingLight = totalDiffuse + totalSpecular;

          //   outputColor = vec4(outgoingLight + emissive, outputColor.a);
          // `,
        },
        color: this.secondaryColor,
        //alphaCutoff: 0.75,
        //opacity: 0.85,
        specularColor: this.mainColor,
        metallic: 0.9,
        roughness: 0.6,
        normalTexture: {
          texture: this.normalTexture,
          sampler: normalSampler,
        },
      },
      uniforms: {
        params: {
          visibility: ["fragment"],
          struct: {
            collisionColor: {
              type: "vec3f",
              value: sRGBToLinear(this.collisionColor),
            },
          },
        },
      },
    });

    this.instancedMesh.scale.set(this.scaleRef);
    this.instancedMesh.onAfterResize(() => {
      this.instancedMesh.scale.set(this.scaleRef);
    });

    this.compilteMaterialOnIdle(this.instancedMesh.material);

    // shadow casting for volumetric lighting
    this.pointLight.shadow.addShadowCastingMesh(this.instancedMesh, {
      shaders: {
        vertex: {
          code: attractionShadowMap,
          entryPoint: "shadowMapVertex",
        },
        fragment: {
          code: attractionShadowMap,
          entryPoint: "shadowMapFragment",
        },
      },
    });

    this.mainSphere = new Mesh(this.renderer, {
      label: "Main sphere mesh",
      geometry: new SphereGeometry(),
      transparent: true,
      shaders: {
        vertex: {
          code: mainSphereGlowVs,
        },
        fragment: {
          code: mainSphereGlowFs,
        },
      },
      uniforms: {
        params: {
          struct: {
            color: {
              type: "vec3f",
              value: this.mainColor,
            },
            glowPower: {
              type: "f32",
              value: 0.25,
            },
          },
        },
      },
    });

    this.mainSphere.scale.set(this.scaleRef);
    this.mainSphere.onAfterResize(() => {
      this.mainSphere.scale.set(this.scaleRef);
    });

    this.compilteMaterialOnIdle(this.mainSphere.material);
  }

  createVolumetric() {
    // volumetric pass
    this.volumetricQuality = 0.5;

    this.volumetricOutputTarget = new RenderTarget(this.renderer, {
      label: "Volumetric output render target",
      useDepth: false,
      sampleCount: 1,
      qualityRatio: this.volumetricQuality,
    });

    this.blurInputTarget = new RenderTarget(this.renderer, {
      label: "Blur input target",
      renderTextureName: "volumetricTargetTexture",
      useDepth: false,
      sampleCount: 1,
    });

    this.blurOutputTarget = new RenderTarget(this.renderer, {
      label: "Blur output target",
      renderTextureName: "blurTexture",
      useDepth: false,
      sampleCount: 1,
    });

    const depthTexture = new Texture(this.renderer, {
      label: "Scene depth texture",
      name: "depthTexture",
      type: "depth",
      fromTexture: this.renderer.renderPass.depthTexture,
    });

    const frustumSize = new Vec2();
    this.volumetricDensityFactor = 1.0;
    this.volumetricDensityAttractionFactor = 0.25;

    this.blueNoiseTexture = new MediaTexture(this.renderer, {
      label: "Blue noise texture",
      name: "blueNoiseTexture",
      useTransform: false,
    });

    this.blueNoiseTexture.loadImage("./images/blue-noise-pattern.webp");

    this.volumetricPass = new ShaderPass(this.renderer, {
      label: "Volumetric pass",
      outputTarget: this.volumetricOutputTarget,
      copyOutputToRenderTexture: true,
      sampleCount: 1,
      depth: false,
      shaders: {
        fragment: {
          code: volumetricLightingPass,
        },
      },
      bindings: [
        this.renderer.bindings.pointLights,
        this.renderer.bindings.pointShadows,
      ],
      textures: [
        depthTexture,
        this.pointLight.shadow.depthTexture as Texture,
        this.blueNoiseTexture,
      ],
      samplers: [this.pointLight.shadow.depthComparisonSampler as Sampler],
      uniforms: {
        params: {
          struct: {
            qualityRatio: {
              type: "f32",
              value: this.volumetricQuality,
            },
            lightColor: {
              type: "vec3f",
              value: this.mainColor,
            },
            density: {
              type: "f32",
              value: this.volumetricDensityFactor * this.scaleRef,
            },
            frames: {
              type: "f32",
              value: 0,
            },
            nbSteps: {
              type: "u32",
              value: 50,
            },
          },
        },
        camera: {
          struct: {
            position: {
              type: "vec3f",
              value: this.renderer.camera.actualPosition,
            },
            near: {
              type: "f32",
              value: this.renderer.camera.near,
            },
            far: {
              type: "f32",
              value: this.renderer.camera.far,
            },
            tanFov: {
              type: "f32",
              value:
                2 * Math.tan((this.renderer.camera.fov * Math.PI * 0.5) / 180),
            },
            frustumSize: {
              type: "vec2f",
              value: frustumSize,
            },
          },
        },
      },
    });

    const setFrustumSize = () => {
      const visibleSizeAtFar = this.renderer.camera.getVisibleSizeAtDepth(
        this.renderer.camera.far
      );

      frustumSize.set(visibleSizeAtFar.width, visibleSizeAtFar.height);
    };

    setFrustumSize();

    this.volumetricPass
      .onBeforeRender(() => {
        (this.volumetricPass.uniforms.params.frames.value as number)++;
      })
      .onAfterResize(() => setFrustumSize());

    this.compilteMaterialOnIdle(this.volumetricPass.material);

    // gaussian blur in 2 passes
    this.horizontalGaussianBlurPass = new ShaderPass(this.renderer, {
      label: "Horizontal gaussian blur",
      inputTarget: this.volumetricOutputTarget,
      outputTarget: this.blurInputTarget,
      renderTextureName: "volumetricTargetTexture",
      shaders: {
        fragment: {
          code: gaussianBlurPassFs,
        },
      },
      uniforms: {
        params: {
          struct: {
            direction: {
              type: "vec2f",
              value: new Vec2(1, 0),
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            radius: {
              type: "f32",
              value: 3,
            },
          },
        },
      },
    });

    this.horizontalGaussianBlurPass.onAfterResize(() => {
      this.horizontalGaussianBlurPass.uniforms.params.resolution.value.set(
        this.renderer.boundingRect.width,
        this.renderer.boundingRect.height
      );
    });

    this.compilteMaterialOnIdle(this.horizontalGaussianBlurPass.material);

    this.verticalGaussianBlurPass = new ShaderPass(this.renderer, {
      label: "Vertical gaussian blur",
      renderTextureName: "volumetricTargetTexture",
      inputTarget: this.blurInputTarget,
      outputTarget: this.blurOutputTarget,
      shaders: {
        fragment: {
          code: gaussianBlurPassFs,
        },
      },
      uniforms: {
        params: {
          struct: {
            direction: {
              type: "vec2f",
              value: new Vec2(0, 1),
            },
            resolution: {
              type: "vec2f",
              value: new Vec2(
                this.renderer.boundingRect.width,
                this.renderer.boundingRect.height
              ),
            },
            radius: {
              type: "f32",
              value: 3,
            },
          },
        },
      },
    });

    this.verticalGaussianBlurPass.onAfterResize(() => {
      this.verticalGaussianBlurPass.uniforms.params.resolution.value.set(
        this.renderer.boundingRect.width,
        this.renderer.boundingRect.height
      );
    });

    this.compilteMaterialOnIdle(this.verticalGaussianBlurPass.material);

    this.blendPass = new ShaderPass(this.renderer, {
      label: "Blend pass",
      textures: [this.blurOutputTarget.renderTexture as Texture],
      shaders: {
        fragment: {
          code: blendPassFs,
        },
      },
      uniforms: {
        params: {
          struct: {
            debugView: {
              type: "f32",
              value: 0,
            },
          },
        },
      },
    });

    this.compilteMaterialOnIdle(this.blendPass.material);
  }

  override onQualityChange(newQuality: number): void {
    if (newQuality === this.quality) return;

    const pixelRatio = this.lerp(0.9, window.devicePixelRatio, newQuality / 10);
    this.renderer.setPixelRatio(pixelRatio);

    if (this.volumetricPass) {
      // if (!newQuality) {
      //   this.volumetricPass.visible = false;
      //   this.blendPass.visible = false;
      //   this.pointLight.shadow.intensity = 0;
      //   return;
      // } else {
      //   this.volumetricPass.visible = true;
      //   this.blendPass.visible = true;
      //   this.pointLight.shadow.intensity = 1;
      // }

      this.volumetricQuality = this.lerp(0.3, 1, newQuality / 10);
      this.volumetricOutputTarget.setQualityRatio(this.volumetricQuality);
      this.volumetricPass.uniforms.params.qualityRatio.value =
        this.volumetricQuality;

      this.horizontalGaussianBlurPass.renderTexture.copy(
        this.volumetricOutputTarget.renderTexture as Texture
      );

      const shadowMapSize = (() => {
        switch (true) {
          case newQuality <= 3:
            return 128;
          case newQuality >= 7:
            return 512;
          default:
            return 256;
        }
      })();

      this.pointLight.shadow.depthTextureSize.set(shadowMapSize);

      const nbVolumetricSteps = this.lerp(10, 50, newQuality / 10);
      this.volumetricPass.uniforms.params.nbSteps.value =
        Math.round(nbVolumetricSteps);

      //const blurRadius = this.lerp(4, 1, newQuality / 10);
      const blurRadius = 1 + 0.85 / this.volumetricQuality;

      this.horizontalGaussianBlurPass.uniforms.params.radius.value = blurRadius;
      this.verticalGaussianBlurPass.uniforms.params.radius.value = blurRadius;
    }

    super.onQualityChange(newQuality);
  }

  addDebug() {
    const pointLightFolder = this.addDebugFolder({
      title: "Point light",
      expanded: false,
    });

    if (pointLightFolder) {
      this.addDebugBinding(
        this.pointLight,
        "intensity",
        {
          min: 0,
          max: 300,
          step: 1,
          label: "Intensity",
        },
        pointLightFolder
      );

      this.addDebugBinding(
        this.pointLight,
        "range",
        {
          min: 0,
          max: 10000,
          step: 1,
          label: "Range",
        },
        pointLightFolder
      );

      const shadowFolder = this.addDebugFolder(
        { title: "Shadow" },
        pointLightFolder
      );

      if (shadowFolder) {
        const depthTextureSizeBinding = this.addDebugBinding(
          { size: this.pointLight.shadow.depthTextureSize.x },
          "size",
          {
            label: "Depth texture size",
            step: 1,
            min: 32,
            max: 512,
          },
          shadowFolder
        );

        if (depthTextureSizeBinding) {
          depthTextureSizeBinding.on("change", (ev) => {
            this.pointLight.shadow.depthTextureSize.set(ev.value);
          });
        }
      }
    }

    if (this.wrappingBox) {
      const wrappingBoxFolder = this.addDebugFolder({
        title: "Wrapping box grid",
        expanded: false,
      });

      if (wrappingBoxFolder) {
        this.addDebugBinding(
          this.wrappingBox.uniforms.grid.scale,
          "value",
          {
            x: { min: 1, max: 40, step: 1 },
            y: { min: 1, max: 40, step: 1 },
            label: "Scale",
          },
          wrappingBoxFolder
        );

        this.addDebugBinding(
          this.wrappingBox.uniforms.grid.lineWidth,
          "value",
          {
            x: { min: 0.01, max: 0.4, step: 0.01 },
            y: { min: 0.01, max: 0.4, step: 0.01 },
            label: "Line width",
          },
          wrappingBoxFolder
        );
      }
    }

    if (this.computeAttractionPass) {
      const computeFolder = this.addDebugFolder({
        title: "Compute attraction pass",
        expanded: false,
      });

      if (computeFolder) {
        this.addDebugBinding(
          this.computeAttractionPass.uniforms.params.deltaT,
          "value",
          {
            min: 0,
            max: 0.1,
            step: 0.001,
            label: "Delta time",
          },
          computeFolder
        );

        this.addDebugBinding(
          this.computeAttractionPass.uniforms.params.spheresRepulsion,
          "value",
          {
            min: 0.05,
            max: 1,
            step: 0.05,
            label: "Spheres repulsion",
          },
          computeFolder
        );

        this.addDebugBinding(
          this.computeAttractionPass.uniforms.params.boxReboundFactor,
          "value",
          {
            min: 0.05,
            max: 1,
            step: 0.05,
            label: "Edges rebound factor",
          },
          computeFolder
        );

        this.addDebugBinding(
          this,
          "maxAttraction",
          {
            min: 0.05,
            max: 1,
            step: 0.05,
            label: "Maximum attraction",
          },
          computeFolder
        );

        this.addDebugBinding(
          this,
          "attractionSpeed",
          {
            min: 0.001,
            max: 0.2,
            step: 0.001,
            label: "Attraction speed",
          },
          computeFolder
        );

        this.addDebugBinding(
          this,
          "repulsionSpeed",
          {
            min: 0.001,
            max: 0.2,
            step: 0.001,
            label: "Repulsion speed",
          },
          computeFolder
        );
      }
    }

    if (this.instancedMesh) {
      const instanceFolder = this.addDebugFolder({
        title: "Instanced spheres",
        expanded: false,
      });

      if (instanceFolder) {
        this.addDebugBinding(
          this.instancedMesh.uniforms.material.metallic,
          "value",
          {
            min: 0,
            max: 1,
            step: 0.05,
            label: "Metallic",
          },
          instanceFolder
        );

        this.addDebugBinding(
          this.instancedMesh.uniforms.material.roughness,
          "value",
          {
            min: 0,
            max: 1,
            step: 0.05,
            label: "Roughness",
          },
          instanceFolder
        );
      }
    }

    if (this.mainSphere) {
      const mainSphereFolder = this.addDebugFolder({
        title: "Attraction sphere",
        expanded: false,
      });

      if (mainSphereFolder) {
        this.addDebugBinding(
          this.mainSphere.uniforms.params.glowPower,
          "value",
          {
            min: 0,
            max: 5,
            step: 0.05,
            label: "Glow power",
          },
          mainSphereFolder
        );
      }
    }

    if (this.blurInputTarget && this.volumetricPass && this.blendPass) {
      const volumetricFolder = this.addDebugFolder({
        title: "Volumetric lighting",
        expanded: false,
      });

      if (volumetricFolder) {
        const activeBinding = this.addDebugBinding(
          { active: this.volumetricPass.visible },
          "active",
          {
            label: "Active",
          },
          volumetricFolder
        );

        if (activeBinding) {
          activeBinding.on("change", (ev) => {
            this.volumetricPass.visible = ev.value;
            this.blendPass.visible = ev.value;
            this.pointLight.shadow.intensity = ev.value ? 1 : 0;
          });
        }

        const volumetricPassFolder = this.addDebugFolder(
          { title: "Volumetric pass" },
          volumetricFolder
        );

        if (volumetricPassFolder) {
          const debugBinding = this.addDebugBinding(
            { debug: false },
            "debug",
            {
              label: "Debug volumetric view",
            },
            volumetricPassFolder
          );

          if (debugBinding) {
            debugBinding.on("change", (ev) => {
              this.blendPass.uniforms.params.debugView.value = ev.value ? 1 : 0;
            });
          }

          const qualityBinding = this.addDebugBinding(
            this,
            "volumetricQuality",
            {
              min: 0.1,
              max: 1,
              step: 0.05,
              label: "Quality",
            },
            volumetricPassFolder
          );

          if (qualityBinding) {
            qualityBinding.on("change", (ev) => {
              if (this.quality !== this.qualityManager.quality.current) return;

              this.volumetricOutputTarget.setQualityRatio(ev.value);
              this.volumetricPass.uniforms.params.qualityRatio.value = ev.value;

              this.horizontalGaussianBlurPass.renderTexture.copy(
                this.volumetricOutputTarget.renderTexture as Texture
              );
            });
          }

          this.addDebugBinding(
            this.volumetricPass.uniforms.params.nbSteps,
            "value",
            {
              min: 5,
              max: 100,
              step: 1,
              label: "Number of steps",
            },
            volumetricPassFolder
          );

          this.addDebugBinding(
            this,
            "volumetricDensityFactor",
            {
              min: 0.05,
              max: 2,
              step: 0.05,
              label: "Density factor",
            },
            volumetricPassFolder
          );

          this.addDebugBinding(
            this,
            "volumetricDensityAttractionFactor",
            {
              min: 0.1,
              max: 5,
              step: 0.05,
              label: "Additional density attraction factor",
            },
            volumetricPassFolder
          );
        }

        const blurPassFolder = this.addDebugFolder(
          { title: "Blur passes" },
          volumetricFolder
        );

        if (blurPassFolder) {
          const radiusBinding = this.addDebugBinding(
            this.horizontalGaussianBlurPass.uniforms.params.radius,
            "value",
            {
              min: 0,
              max: 5,
              step: 0.05,
              label: "Radius",
            },
            blurPassFolder
          );

          if (radiusBinding) {
            radiusBinding.on("change", (ev) => {
              this.verticalGaussianBlurPass.uniforms.params.radius.value =
                ev.value;
            });
          }
        }
      }
    }

    if (this.plane) {
      const planeFolder = this.addDebugFolder({
        title: "Attraction plane effect",
        expanded: false,
      });

      if (planeFolder) {
        this.addDebugBinding(
          this.plane.uniforms.params.speed,
          "value",
          {
            min: 0,
            max: 0.02,
            step: 0.001,
            label: "Speed",
          },
          planeFolder
        );

        this.addDebugBinding(
          this.plane.uniforms.params.nbSides,
          "value",
          {
            min: 3,
            max: 24,
            step: 1,
            label: "Number of branches",
          },
          planeFolder
        );

        this.addDebugBinding(
          this.plane.uniforms.params.arcStrength,
          "value",
          {
            min: 0.1,
            max: 3,
            step: 0.1,
            label: "Arc deformation strength",
          },
          planeFolder
        );

        this.addDebugBinding(
          this.plane.uniforms.params.nbPolygons,
          "value",
          {
            min: 1,
            max: 5,
            step: 1,
            label: "Number of color repetitions",
          },
          planeFolder
        );

        this.addDebugBinding(
          this.plane.uniforms.params.centerSize,
          "value",
          {
            min: 0.1,
            max: 1,
            step: 0.05,
            label: "Center size",
          },
          planeFolder
        );

        this.addDebugBinding(
          this.plane.uniforms.params.outerSize,
          "value",
          {
            min: 0.5,
            max: 2,
            step: 0.05,
            label: "Outer size",
          },
          planeFolder
        );
      }
    }
  }

  override destroy() {
    super.destroy();
    window.removeEventListener("mousemove", this._pointerMoveHandler);
    window.removeEventListener("touchmove", this._pointerMoveHandler);

    if (this.containerParent) {
      this.containerParent.removeEventListener(
        "pointerdown",
        this._pointerDownHandler
      );
      this.containerParent.removeEventListener(
        "touchstart",
        this._pointerDownHandler,
        { passive: true } as unknown as EventListenerOptions
      );
      this.containerParent.removeEventListener(
        "pointerup",
        this._pointerUpHandler
      );
      this.containerParent.removeEventListener(
        "touchend",
        this._pointerUpHandler
      );
    }

    this.plane?.remove();
    this.wrappingBox?.remove();
    this.volumetricPass?.remove();
    this.volumetricOutputTarget?.remove();
    this.blurInputTarget?.remove();

    this.blurOutputTarget?.remove();
    this.horizontalGaussianBlurPass?.remove();
    this.verticalGaussianBlurPass?.remove();
    this.blendPass?.remove();

    this.instancedMesh?.remove();
    this.mainSphere?.remove();
    this.computeAttractionPass?.remove();
    this.particleBindGroupA?.destroy();
    this.particleBindGroupB?.destroy();

    this.normalTexture?.destroy();
    this.blueNoiseTexture?.destroy();

    this.renderer?.destroy();
  }
}
