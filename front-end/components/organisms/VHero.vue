<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { WebGPUHeroScene } from "~/scenes/hero/WebGPUHeroScene";
import { UIElements } from "~/assets/static-data/ui-elements";
import { CanvasHeroScene } from "~/scenes/hero/CanvasHeroScene";

defineProps<{
  baseline?: NonNullable<HomeQueryResult>["baseline"];
}>();

let scene: WebGPUHeroScene | CanvasHeroScene | null;
const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);

const { colors } = usePaletteGenerator();
const { isGameActive, currentLevel, addLevelPoints } = useLevelExperience();

const sliderProgress = ref(currentLevel.value >= 1 ? 1 : 0);

const hasHeroAnimStarted = ref(false);

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
      onStart: () => (hasHeroAnimStarted.value = true),
      debugPane: $debugPane,
    });

    scene.setSceneVisibility(isVisible.value);
  } else if (canvas.value) {
    scene = new CanvasHeroScene({
      container: canvas.value,
      progress: sliderProgress.value,
      isReducedMotion: $isReducedMotion,
      colors: colors.value,
      onStart: () => (hasHeroAnimStarted.value = true),
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

const showSlider = ref(false);
const onTitleComplete = () => {
  showSlider.value = true;
};
</script>

<template>
  <section
    :class="[$style.root, hasHeroAnimStarted && $style['root--has-started']]"
    :style="{ '--slider-progress': sliderProgress }"
    :data-loading="UIElements.common.loading"
  >
    <div :class="$style.wrapper" class="container grid">
      <div :class="$style.canvas" ref="canvas"></div>

      <h2 v-if="baseline" :class="$style.baseline">
        <Transition appear name="instant-in-fade-out">
          <VAnimatedTextByLetters
            :label="baseline"
            :align="'center'"
            :timeline-delay="1"
            v-show="hasHeroAnimStarted"
            @on-before-complete="onTitleComplete"
          />
        </Transition>
      </h2>
    </div>

    <VHeroRangeSlider v-model="sliderProgress" :is-visible="showSlider" />
  </section>
</template>

<style module lang="scss">
$header-padding: 3.2rem;

.root {
  height: 100svh;
  box-sizing: border-box;
  padding: $header-padding 0 0 0;
  position: relative;
  overflow: hidden;

  &:after {
    content: attr(data-loading);
    position: absolute;
    inset: 0;
    top: $header-padding;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: var(--light-display-font);
    text-transform: uppercase;
    pointer-events: none;
    z-index: -1;

    opacity: 1;
    transition: opacity 0.35s ease(in-out-quad);

    @media (prefers-reduced-motion) {
      transition: none;
    }
  }

  &--has-started:after {
    opacity: 0;
  }
}

.wrapper {
  position: absolute;
  top: $header-padding;
  right: 0;
  bottom: 0;
  left: 0;
  justify-content: center;
  align-items: center;
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
      transform: translate3d(-50%, -50%, 0)
        scale3d(
          calc(0.25 + 0.25 * var(--slider-progress)),
          calc(0.25 + 0.25 * var(--slider-progress)),
          1
        );
      background: radial-gradient(
        circle,
        color-mix(in srgb, var(--background-color) 100%, transparent) 0%,
        color-mix(in srgb, var(--background-color) 100%, transparent) 10%,
        color-mix(in srgb, var(--background-color) 0%, transparent) 50%
      );
      pointer-events: none;

      transition: transform 1.5s ease(out-expo);

      @media (prefers-reduced-motion) {
        transition: none;
      }
    }
  }

  body:global(.no-webgpu) .root--has-started & {
    &:after {
      transform: translate3d(-50%, -50%, 0)
        scale3d(
          calc(0.75 + 0.25 * var(--slider-progress)),
          calc(0.75 + 0.25 * var(--slider-progress)),
          1
        );
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
