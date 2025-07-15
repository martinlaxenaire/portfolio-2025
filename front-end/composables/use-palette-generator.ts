import {
  ColorPaletteGenerator,
  type ColorPalette,
  ColorModel,
} from "@martinlaxenaire/color-palette-generator";

export interface ColorModelBase {
  hex: ColorModel["hex"];
  rgb: ColorModel["rgb"];
  hsl: ColorModel["hsl"];
  hsv: ColorModel["hsv"];
}

export interface UsePaletteGenerator {
  generator: ColorPaletteGenerator;
  palette: ColorPalette;
}

let generator: ColorPaletteGenerator | null = null;
let initPalette: ColorPalette | null = null;
let palette: ColorPalette | null = null;
// TODO plug to github contributions length?
const paletteLength = 5;
let useGrayscalePalette = false;

export const usePaletteGenerator = () => {
  const colors = useState<ColorModelBase[]>("colors", () => []);
  const { theme } = useTheme();

  const { $piwikPRO } = useNuxtApp();

  const generatePalette = (regenerate = true) => {
    if (regenerate || !generator || !initPalette) {
      if (generator && initPalette && import.meta.client) {
        $piwikPRO.CustomEvent.trackEvent(
          "UX",
          "Click",
          "Generated new palette",
          1
        );
      }

      const precision = 3;

      // very rare grayscale palette
      useGrayscalePalette = Math.random() > 0.975;

      generator = new ColorPaletteGenerator({
        precision,
        hueRange: 150 + Math.random() * 50,
      });

      const startIndex = precision - Math.round((paletteLength - 1) * 0.5);
      const endIndex = precision + Math.round((paletteLength - 1) * 0.5);

      initPalette = generator.basePalette.filter(
        (c, i) => i >= startIndex && i <= endIndex
      );
    }

    palette = initPalette.map((color, i) => {
      const newColor = new ColorModel();
      const indexRatio = i / (paletteLength - 1);

      if (useGrayscalePalette) {
        const grayscaleValue = Math.round(237 - indexRatio * 197.5);

        newColor.rgb = {
          r: grayscaleValue,
          g: grayscaleValue,
          b: grayscaleValue,
        };

        return newColor;
      }

      const hue = newColor.addToHue(0, color.hsl.h);

      const endValue = theme.value === "light" ? 90 : 100;

      newColor.hsv = {
        h: hue,
        s: 55 + Math.pow(indexRatio, 1.5) * 45,
        v: endValue - Math.pow(indexRatio, 5) * 50,
      };

      return newColor;
    });

    palette.reverse();

    // update CSS vars and state
    if (import.meta.client) {
      palette.forEach((color, i) => {
        document.documentElement.style.setProperty(
          "--color-palette-" + i,
          `rgb(${color.rgb.r.toFixed()}, ${color.rgb.g.toFixed()}, ${color.rgb.b.toFixed()})`
        );
      });
    }

    // unfortunately we can't directly use the palette in our Vue state object
    // since private properties are uncompatible with Vue's proxies
    colors.value = palette.map((c, i) => {
      return {
        hex: c.hex,
        rgb: c.rgb,
        hsv: c.hsv,
        hsl: c.hsl,
      };
    });
  };

  // generate first palette if needed
  onMounted(() => {
    if (!colors.value.length) {
      generatePalette();
    }
  });

  return { generator, palette, colors, generatePalette };
};
