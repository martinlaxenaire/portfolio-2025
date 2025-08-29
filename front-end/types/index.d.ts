import type {
  ColorPalette,
  ColorPaletteGenerator,
} from "@martinlaxenaire/color-palette-generator";
import type { GPUCurtains } from "gpu-curtains";

declare module "#app" {
  interface NuxtApp {
    $isReducedMotion: boolean;
    $gpuCurtains: GPUCurtains;
    $hasWebGPU: boolean;
    $hasWebGPUVideo: boolean;
    $debugPane: DebugPane;
    $paletteGenerator: ColorPaletteGenerator;
    $palette: ColorPalette;
  }
}
