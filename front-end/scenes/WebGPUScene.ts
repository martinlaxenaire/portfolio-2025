import { GPUCurtains } from "gpu-curtains";
import type { ComputeMaterial, RenderMaterial } from "gpu-curtains";
import { Scene } from "./Scene";
import type { SceneParams } from "./Scene";
import { DebugPane } from "./DebugPane";
import type { BindingParams, FolderApi } from "tweakpane";
import type {
  Bindable,
  BindingApi,
  BindingValue,
  FolderParams,
  Value,
  ValueController,
  View,
} from "@tweakpane/core";
import type { BindingController } from "@tweakpane/core/dist/blade/binding/controller/binding";
import {
  QualityManager,
  type QualityManagerParams,
} from "./utils/QualityManager";

export interface WebGPUSceneParams extends SceneParams {
  gpuCurtains: GPUCurtains;
  debugPane?: DebugPane | null;
  targetFPS?: QualityManagerParams["targetFPS"];
}

export class WebGPUScene extends Scene {
  gpuCurtains: GPUCurtains;
  debugPane!: DebugPane | null;
  debugFolder!: FolderApi | null;

  qualityManager: QualityManager;
  quality: number;
  _onVisibilityChangeHandler: () => void;

  constructor({
    gpuCurtains,
    container,
    progress = 0,
    colors = [],
    debugPane = null,
    targetFPS = 55,
  }: WebGPUSceneParams) {
    super({ container, progress, colors });

    this.gpuCurtains = gpuCurtains;

    this.debugPane = debugPane;

    this._onVisibilityChangeHandler =
      this.onDocumentVisibilityChange.bind(this);

    this.qualityManager = new QualityManager({
      label: `${this.constructor.name} quality manager`,
      updateDelay: 2000,
      targetFPS,
      onQualityChange: (newQuality) => this.onQualityChange(newQuality),
    });

    this.quality = this.qualityManager.quality.current;

    document.addEventListener(
      "visibilitychange",
      this._onVisibilityChangeHandler
    );

    if (debugPane && debugPane.pane) {
      this.debugFolder = debugPane.pane.addFolder({
        title: this.constructor.name,
        expanded: false,
      });

      // FPS
      const fpsFolder = this.addDebugFolder({ title: "FPS watcher" });

      if (fpsFolder) {
        this.addDebugBinding(
          this.qualityManager.fpsWatcher,
          "updateDelay",
          {
            label: "Update delay (ms)",
            readonly: true,
          },
          fpsFolder
        );

        this.addDebugBinding(
          this.qualityManager.fpsWatcher,
          "average",
          {
            label: "Average FPS",
            readonly: true,
          },
          fpsFolder
        );

        this.addDebugBinding(
          this.qualityManager.fpsWatcher,
          "average",
          {
            label: "Graph",
            readonly: true,
            view: "graph",
            min: 0,
            max: 60,
          },
          fpsFolder
        );
      }

      // quality
      const qualityFolder = this.addDebugFolder({
        title: "Quality",
      });

      if (qualityFolder) {
        const currentBinding = this.addDebugBinding(
          this.qualityManager.quality,
          "current",
          {
            min: 0,
            max: 10,
            step: 1,
            label: "Current",
          },
          qualityFolder
        );

        if (currentBinding) {
          currentBinding.on("change", (ev) => {
            // this means the change hasn't be triggered by a refresh
            // but actually by the input
            if (ev.value !== this.qualityManager.quality.current) {
              this.qualityManager.setCurrentQuality(ev.value);
            }
          });
        }

        this.addDebugBinding(
          this.qualityManager.quality,
          "min",
          {
            min: 0,
            max: 9,
            step: 1,
            label: "Minimum",
          },
          qualityFolder
        );

        this.addDebugBinding(
          this.qualityManager.quality,
          "max",
          {
            min: 1,
            max: 10,
            step: 1,
            label: "Maximum",
          },
          qualityFolder
        );
      }
    }
  }

  override setSceneVisibility(isVisible: boolean = true) {
    super.setSceneVisibility(isVisible);

    this.qualityManager.active = isVisible;

    if (this.debugFolder) {
      this.debugFolder.expanded = isVisible;
    }
  }

  onDocumentVisibilityChange() {
    this.qualityManager.active = this.isVisible && !document.hidden;
  }

  compilteMaterialOnIdle(material: ComputeMaterial | RenderMaterial) {
    if (!this.isVisible && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        console.log("compile material", material.options.label);
        material.compileMaterial();
      });
    }
  }

  override onRender(): void {
    super.onRender();
    this.qualityManager.update();
  }

  onQualityChange(newQuality: number) {
    if (this.debugFolder) {
      this.debugFolder.refresh();
    }

    this.quality = newQuality;
  }

  addDebugFolder(
    params = {} as FolderParams,
    folder: FolderApi | null = this.debugFolder
  ): FolderApi | null {
    if (!folder) return null;

    return folder.addFolder(params);
  }

  addDebugBinding<O extends Bindable>(
    object: O,
    key: keyof O,
    opt_params?: BindingParams,
    folder: FolderApi | null = this.debugFolder
  ): BindingApi<
    unknown,
    O[keyof O],
    BindingController<
      unknown,
      ValueController<unknown, View, Value<unknown>>,
      BindingValue<unknown>
    >
  > | null {
    if (!folder) return null;

    return folder.addBinding(object, key, opt_params);
  }

  override destroy(): void {
    super.destroy();

    document.removeEventListener(
      "visibilitychange",
      this._onVisibilityChangeHandler
    );

    if (this.debugPane && this.debugPane.pane && this.debugFolder) {
      this.debugPane.pane.remove(this.debugFolder);
    }
  }
}
