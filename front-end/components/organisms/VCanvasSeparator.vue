<script lang="ts" setup>
import { CanvasSeparatorScene } from "~/scenes/separator/CanvasSeparatorScene";

const props = defineProps<{
  invertColors?: boolean;
}>();

let scene: CanvasSeparatorScene | null;
const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, true, { threshold: 0.25 });

const { colors } = usePaletteGenerator();

onMounted(async () => {
  const { $isReducedMotion } = useNuxtApp();

  if (canvas.value) {
    scene = new CanvasSeparatorScene({
      container: canvas.value,
      progress: 0,
      colors: colors.value,
      isReducedMotion: $isReducedMotion,
      theme: theme.value,
      invertColors: props.invertColors,
    });

    scene.setSceneVisibility(isVisible.value);
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});

watch(isVisible, (newValue) => {
  if (scene) {
    scene.setSceneVisibility(newValue);
  }
});

const { theme } = useTheme();

watch(theme, (newValue) => {
  if (scene) {
    scene.setTheme(newValue);
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});
</script>

<template>
  <div :class="$style.canvas" ref="canvas"></div>
</template>

<style module lang="scss">
.canvas {
  position: absolute;
  inset: 0;
  z-index: -1;
}
</style>
