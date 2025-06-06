<script lang="ts" setup>
import { CanvasThemeButtonScene } from "~/scenes/theme-button/CanvasThemeButtonScene";

let firstThemeClick = false;

const { theme, toggleTheme } = useTheme();
const { addFeaturePoints } = useLevelExperience();

const onThemeClick = () => {
  toggleTheme();

  if (!firstThemeClick) {
    firstThemeClick = true;
    addFeaturePoints(3);
  }
};

const canvasButton = useTemplateRef("canvas-button");
let scene: CanvasThemeButtonScene | null = null;

onMounted(() => {
  const { $isReducedMotion } = useNuxtApp();

  const createScene = () => {
    scene = new CanvasThemeButtonScene({
      container: canvasButton.value as HTMLElement,
      isReducedMotion: $isReducedMotion,
      theme: theme.value,
    });
  };

  let testIndex = 0;
  let maxTest = 10;

  const createSceneCheck = () => {
    if (canvasButton.value) {
      createScene();
    } else if (testIndex < maxTest) {
      testIndex++;
      nextTick(() => {
        createSceneCheck();
      });
    }
  };

  createSceneCheck();
});

watch(theme, () => {
  if (scene) {
    scene.setTheme(theme.value);
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});
</script>

<template>
  <button
    @click="onThemeClick"
    :class="$style.root"
    :title="`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`"
  >
    <span ref="canvas-button" />
  </button>
</template>

<style lang="scss" module>
.root {
  text-indent: -9999rem;
  display: block;
  padding: 0 !important;
  background: transparent;
  border: 0;
  pointer-events: auto;
  cursor: pointer;
  backface-visibility: hidden;
  will-change: transform;

  transition: transform 0.25s ease(out-cubic);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  &:hover,
  &:focus-visible {
    transform: scale3d(0.9, 0.9, 1);
    transition: transform 0.25s ease(out-cubic);
  }

  span {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
    position: relative;

    canvas {
      position: absolute;
      inset: 0;
    }
  }
}
</style>
