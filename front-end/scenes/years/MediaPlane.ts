import type { WebGPUYearsScene } from "./WebGPUYearsScene";
import { DOMTexture, Plane } from "gpu-curtains";
import type {
  GPUCurtainsRenderer,
  RenderTarget,
  PlaneGeometry,
} from "gpu-curtains";
import {
  mediaExternalPlaneFs,
  mediaPlaneFs,
  mediaPlaneVs,
} from "./shaders/years-planes.wgsl";

export class MediaPlane {
  yearsScene: WebGPUYearsScene;
  renderer: GPUCurtainsRenderer;
  planeElement: HTMLElement;
  geometry: PlaneGeometry;
  renderTarget: RenderTarget | null;
  label: string;
  yearIndex: number;
  index: number;
  useExternalTextures: boolean;
  video: HTMLVideoElement | null;
  plane!: Plane;
  videoTexture: DOMTexture;
  private _videoLoadingTaskId?: number | null;

  constructor({
    yearsScene,
    planeElement,
    geometry,
    renderTarget = null,
    label = "",
    yearIndex = 0,
    index = 0,
    useExternalTextures = true,
  }: {
    yearsScene: WebGPUYearsScene;
    planeElement: HTMLElement;
    geometry: PlaneGeometry;
    renderTarget?: RenderTarget | null;
    label?: string;
    yearIndex?: number;
    index?: number;
    useExternalTextures?: boolean;
  }) {
    this.yearsScene = yearsScene;
    this.renderer = this.yearsScene.renderer;
    this.planeElement = planeElement;
    this.geometry = geometry;
    this.renderTarget = renderTarget;
    this.label = label;
    this.yearIndex = yearIndex;
    this.index = index;
    this.useExternalTextures = useExternalTextures;

    this.video = this.planeElement.querySelector("video");

    this._videoLoadingTaskId = null;

    const placeholderColor =
      this.yearsScene.colors[
        Math.floor(Math.random() * this.yearsScene.colors.length)
      ];

    this.videoTexture = new DOMTexture(this.renderer, {
      label: `${this.label} ${this.index} texture`,
      name: "planeTexture",
      useExternalTextures: this.useExternalTextures,
      placeholderColor: [
        placeholderColor.rgb.r,
        placeholderColor.rgb.g,
        placeholderColor.rgb.b,
        255,
      ],
    });

    this.plane = new Plane(this.renderer, this.planeElement, {
      label: `${this.label} ${this.index}`,
      geometry: this.geometry,
      watchScroll: false,
      depthWriteEnabled: false,
      ...(this.renderTarget && { outputTarget: this.renderTarget }),
      shaders: {
        vertex: {
          code: mediaPlaneVs,
        },
        fragment: {
          code:
            this.useExternalTextures && !!this.video
              ? mediaExternalPlaneFs
              : mediaPlaneFs,
        },
      },
      autoloadSources: false,
      domTextures: [this.videoTexture],
    });

    this.yearsScene.compilteMaterialOnIdle(this.plane.material);

    // TODO handle play promises?
    this.plane
      .onReEnterView(() => {
        this.plane.domTextures.forEach((texture) => {
          if (texture.isVideoSource(texture.source) && texture.source.paused) {
            texture.source.play();
          }
        });
      })
      .onLeaveView(() => {
        this.plane.domTextures.forEach((texture) => {
          if (texture.isVideoSource(texture.source) && !texture.source.paused) {
            texture.source.pause();
          }
        });
      });
  }

  loadVideo(callback = () => {}) {
    if (!!this.video) {
      let isVideoLoaded = false;
      let loadedThreshold = 0.75;

      this._videoLoadingTaskId =
        this.renderer.onBeforeCommandEncoderCreation.add(() => {
          const loadedPercentage =
            this.video.buffered.end(0) / this.video.duration;

          if (loadedPercentage >= loadedThreshold && !isVideoLoaded) {
            isVideoLoaded = true;

            // remove from tasks queue
            this.clearVideoLoadingTask();

            callback();
          }
        });

      this.videoTexture.loadVideo(this.video);
    }
  }

  clearVideoLoadingTask() {
    if (this._videoLoadingTaskId !== null) {
      this.renderer.onBeforeCommandEncoderCreation.remove(
        this._videoLoadingTaskId
      );
    }

    this._videoLoadingTaskId = null;
  }

  togglePlayback(shouldPlay = false) {
    if (!shouldPlay) {
      this.plane.domTextures.forEach((texture) => {
        if (texture.isVideoSource(texture.source) && !texture.source.paused) {
          texture.source.pause();
        }
      });
    } else if (this.plane.isInFrustum) {
      this.plane.domTextures.forEach((texture) => {
        if (texture.isVideoSource(texture.source) && texture.source.paused) {
          texture.source.play();
        }
      });
    }
  }

  destroy() {
    this.togglePlayback(false);

    this.clearVideoLoadingTask();

    this.plane?.remove();
  }
}
