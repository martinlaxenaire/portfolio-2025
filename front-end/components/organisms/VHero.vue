<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { WebGPUHeroScene } from "~/scenes/hero/WebGPUHeroScene";
import { CanvasHeroScene } from "~/scenes/hero/CanvasHeroScene";

const props = defineProps<{
  baseline?: NonNullable<HomeQueryResult>["baseline"];
}>();

let scene: WebGPUHeroScene | CanvasHeroScene | null;
const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);

const { colors } = usePaletteGenerator();
const { isGameActive, currentLevel, addLevelPoints } = useLevelExperience();

const sliderProgress = ref(currentLevel.value >= 1 ? 1 : 0);

onMounted(async () => {
  const { $gpuCurtains, $hasWebGPU, $isReducedMotion, $debugPane } =
    useNuxtApp();

  if ($isReducedMotion) {
    sliderProgress.value = 1;
  }

  if ($hasWebGPU && canvas.value) {
    const { WebGPUHeroScene } = await import("~/scenes/hero/WebGPUHeroScene");

    scene = new WebGPUHeroScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      progress: sliderProgress.value,
      colors: colors.value,
      debugPane: $debugPane,
    });

    scene.setSceneVisibility(isVisible.value);
  } else if (canvas.value) {
    scene = new CanvasHeroScene({
      container: canvas.value,
      progress: sliderProgress.value,
      isReducedMotion: $isReducedMotion,
      colors: colors.value,
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
  if (scene && scene instanceof CanvasHeroScene) {
    scene.setBgColor();
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

const unlockedNextStep = ref(false);

watch(unlockedNextStep, () => {
  if (unlockedNextStep.value) {
    addLevelPoints(5);
  }
});

watch(sliderProgress, () => {
  if (scene) {
    scene.progress = sliderProgress.value;
  }

  if (sliderProgress.value >= 0.999 && !unlockedNextStep.value) {
    unlockedNextStep.value = true;
  }
});

watch(isGameActive, () => {
  if (!isGameActive.value) {
    sliderProgress.value = 1;
  }
});
</script>

<template>
  <section
    :class="[$style.root, $style['root--is-visible']]"
    :style="{ '--slider-progress': sliderProgress }"
  >
    <div :class="$style.wrapper" class="grid">
      <div :class="$style.canvas" ref="canvas"></div>

      <h2 v-if="baseline" :class="$style.baseline">
        <VAnimatedTextByLetters
          :label="baseline"
          :align="'center'"
          :timeline-delay="1.25"
        />
      </h2>
    </div>

    <VHeroRangeSlider v-model="sliderProgress" />
  </section>
</template>

<style module lang="scss">
$header-padding: 3.2rem;

.root {
  height: 100svh;
  // display: flex;
  // flex-direction: column;
  // justify-content: space-between;
  // align-items: center;
  box-sizing: border-box;
  padding: $header-padding 0 0 0;
  position: relative;
  overflow: hidden;
}

.wrapper {
  position: absolute;
  top: $header-padding;
  right: 0;
  bottom: 0;
  left: 0;
  justify-content: center;
  align-items: center;

  opacity: 0;

  .root--is-visible & {
    opacity: 1;
  }
}

.canvas {
  position: absolute;
  inset: 0;
  top: calc(-1 * var(--gutter-size));
  z-index: -1;

  body:global(.no-webgpu) & {
    top: 0;
    margin: 0 var(--gutter-size) var(--gutter-size) var(--gutter-size);
    border-radius: var(--gutter-size);
    overflow: hidden;

    &:after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: min(100vw, 100svh);
      height: min(100vw, 100svh);
      border-radius: 50%;
      transform: translate3d(-50%, -50%, 0);
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--background-color) 100%, transparent) 0%,
        color-mix(in srgb, var(--background-color) 100%, transparent) 20%,
        color-mix(in srgb, var(--background-color) 0%, transparent) 50%
      );
      pointer-events: none;
    }
  }
}

.baseline {
  @include main-title;
  grid-column: 5 / 21;
  text-align: center;
  //padding-bottom: calc(var(--gutter-size) * 2 + 2.8rem);
  padding-bottom: $header-padding;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 3 / 11;
  }

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}
</style>
