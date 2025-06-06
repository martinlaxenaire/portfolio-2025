import type {
  ColorPalette,
  ColorPaletteGenerator,
} from "@martinlaxenaire/color-palette-generator";
import type { GPUCurtains } from "gpu-curtains";
import type PiwikPROServicesType from "@piwikpro/nuxt-piwik-pro";

declare module "#app" {
  interface NuxtApp {
    $isReducedMotion: boolean;
    $gpuCurtains: GPUCurtains;
    $hasWebGPU: boolean;
    $debugPane: DebugPane;
    $paletteGenerator: ColorPaletteGenerator;
    $palette: ColorPalette;
    $piwikPRO: PiwikPROServicesType;
  }
}
