import type { WebGPUYearsScene } from "./WebGPUYearsScene";
import { Plane } from "gpu-curtains";
import type {
  GPUCurtainsRenderer,
  RenderTarget,
  PlaneGeometry,
  Object3D,
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
  pivot: Object3D;
  label: string;
  yearIndex: number;
  index: number;
  useExternalTextures: boolean;
  plane: Plane;

  constructor({
    yearsScene,
    planeElement,
    geometry,
    renderTarget = null,
    pivot,
    label = "",
    yearIndex = 0,
    index = 0,
    useExternalTextures = true,
  }: {
    yearsScene: WebGPUYearsScene;
    planeElement: HTMLElement;
    geometry: PlaneGeometry;
    renderTarget?: RenderTarget | null;
    pivot: Object3D;
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
    this.pivot = pivot;
    this.label = label;
    this.yearIndex = yearIndex;
    this.index = index;
    this.useExternalTextures = useExternalTextures;

    const video = this.planeElement.querySelector("video");

    const placeholderColor =
      this.yearsScene.colors[
        Math.floor(Math.random() * this.yearsScene.colors.length)
      ];

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
            this.useExternalTextures && !!video
              ? mediaExternalPlaneFs
              : mediaPlaneFs,
        },
      },
      texturesOptions: {
        useExternalTextures,
        placeholderColor: [
          placeholderColor.rgb.r,
          placeholderColor.rgb.g,
          placeholderColor.rgb.b,
          255,
        ],
      },
    });

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

    this.plane.parent = this.pivot;

    // this.setPlanePosition();

    // this.plane.onAfterResize(() => this.setPlanePosition());
  }

  // setPlanePosition() {
  //   this.pivot.position.x = -this.yearIndex * this.yearsScene.visibleSize.width;
  // }

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

    this.plane.remove();
  }
}
