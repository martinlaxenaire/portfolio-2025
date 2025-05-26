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

export const usePaletteGenerator = () => {
  const colors = useState<ColorModelBase[]>("colors", () => []);
  const { theme } = useTheme();

  const generatePalette = (regenerate = true) => {
    if (regenerate || !generator || !initPalette) {
      // generator = new ColorPaletteGenerator({
      //   precision: 4,
      //   baseSaturation: 75,
      //   //hueRange: 135,
      //   //hueRange: 225,
      //   //hueRange: 150,
      // });

      // initPalette = generator.getDistributedPalette({
      //   length: paletteLength,
      //   //minSaturation: 35,
      //   minBrightness: 5,
      //   maxBrightness: 85,
      // });

      const precision = 3;

      generator = new ColorPaletteGenerator({
        precision,
        //baseSaturation: 50,
        hueRange: 150 + Math.random() * 50,
      });

      const startIndex = precision - Math.round((paletteLength - 1) * 0.5);
      const endIndex = precision + Math.round((paletteLength - 1) * 0.5);

      initPalette = generator.basePalette.filter(
        (c, i) => i >= startIndex && i <= endIndex
      );
    }

    palette = initPalette.map((color, i) => {
      const indexRatio = i / (paletteLength - 1);

      //const c = color.clone().saturateHsl(25);
      //const c = color.clone().saturateHsl(20);
      //const c = color.clone();
      //c.saturateHsl(30);
      //c.saturateHsv(10 + indexRatio * 20);

      // if (theme.value === "light") {
      //   c.lighten(10 - (i / paletteLength - 1) * 10);
      // } else {
      //   c.lighten(15 - (i / paletteLength - 1) * 15);
      // }

      //c.brighten(25);

      const newColor = new ColorModel();
      const hue = newColor.addToHue(0, color.hsl.h);

      const endValue = theme.value === "light" ? 90 : 100;

      // newColor.hsv = {
      //   h: hue,
      //   s: 55 + Math.pow(indexRatio, 0.75) * 45,
      //   v: endValue - Math.pow(indexRatio, 0.75) * 55,
      // };

      newColor.hsv = {
        h: hue,
        s: 55 + Math.pow(indexRatio, 1.5) * 45,
        v: endValue - Math.pow(indexRatio, 5) * 50,
      };

      //console.log(newColor.hsv);

      return newColor;
    });

    // sort again because we modified value
    //palette.sort((a, b) => a.hsl.l - b.hsl.l || a.hsl.h - b.hsl.h);
    //palette.sort((a, b) => a.hsl.l - b.hsl.l);

    // const getLuminance = ({ r = 0, g = 0, b = 0 }) => {
    //   return (0.2126 * r) / 255 + (0.7152 * g) / 255 + (0.0722 * b) / 255;
    // };

    //palette.sort((a, b) => a.hsv.v - b.hsv.v);
    //palette.sort((a, b) => getLuminance(a.rgb) - getLuminance(b.rgb));

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
