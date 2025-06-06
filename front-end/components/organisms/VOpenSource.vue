<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { GithubContribution } from "~/server/api/github";
import { CanvasOpenSourceScene } from "~/scenes/open-source/CanvasOpenSourceScene";
import type { WebGPUOpenSourceScene } from "~/scenes/open-source/WebGPUOpenSourceScene";
import { useTimeoutFn } from "@vueuse/core";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["openSourceTitle"];
  description?: NonNullable<HomeQueryResult>["openSourceDescription"];
  legend?: NonNullable<HomeQueryResult>["openSourceLegend"];
}>();

const { addFeaturePoints } = useLevelExperience();

const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);

const { data, status } = await useFetch("/api/github");
//console.log(data);

let scene: WebGPUOpenSourceScene | CanvasOpenSourceScene | null;

const contributions = ref(
  data.value
    ? [...data.value]
        .sort((a, b) => b.count - a.count)
        .map((c) => {
          return { ...c, isActive: true };
        })
    : []
);

const { colors } = usePaletteGenerator();
const { theme } = useTheme();
const { addLevelPoints } = useLevelExperience();

const hasStarted = ref(true);
const sceneComplete = ref(false);
const showCongratulations = ref(false);

onMounted(async () => {
  hasStarted.value = false;
  const { $gpuCurtains, $hasWebGPU, $debugPane } = useNuxtApp();

  const onStarted = () => {
    if (!hasStarted.value) {
      addLevelPoints(10);
    }
    hasStarted.value = true;
  };

  const onSceneComplete = () => {
    if (!sceneComplete.value) {
      addLevelPoints(20);

      sceneComplete.value = true;
      showCongratulations.value = true;

      useTimeoutFn(() => {
        showCongratulations.value = false;
      }, 3500);
    }
  };

  // If data is still loading when component mounts, wait for it
  if (status.value === "pending") {
    // Wait for pending to become false (data loaded)
    await new Promise<void>((resolve) => {
      // One-time watcher that automatically stops after pending becomes false
      const stopWatcher = watch(
        () => status.value === "pending",
        (isPending) => {
          if (!isPending) {
            stopWatcher(); // Clean up the watcher
            resolve();
          }
        }
      );
    });
  }

  // At this point, data has loaded
  if ($hasWebGPU && canvas.value) {
    const { WebGPUOpenSourceScene } = await import(
      "~/scenes/open-source/WebGPUOpenSourceScene"
    );

    scene = new WebGPUOpenSourceScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      progress: 1,
      contributions: data.value as GithubContribution[],
      colors: colors.value,
      debugPane: $debugPane,
      onStarted: onStarted,
      onSceneComplete: onSceneComplete,
    });

    scene.setSceneVisibility(isVisible.value);
  } else if (canvas.value) {
    scene = new CanvasOpenSourceScene({
      container: canvas.value,
      contributions: data.value as GithubContribution[],
      colors: colors.value,
      onStarted: onStarted,
      onSceneComplete: onSceneComplete,
    });
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});

let seen = false;

watch(isVisible, () => {
  if (scene) {
    scene.setSceneVisibility(isVisible.value);
  }

  if (isVisible.value && !seen) {
    seen = true;
    //addLevelPoints(1);
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

watch(theme, () => {
  if (scene) {
    scene.setTheme();
  }
});

let hasToggled = false;

const toggleInstance = (index = 0) => {
  const nbActiveContributions = contributions.value.filter((c) => !!c.isActive);

  if (nbActiveContributions.length <= 1 && contributions.value[index].isActive)
    return;

  if (!hasToggled) {
    addFeaturePoints(5);
    hasToggled = true;
  }

  contributions.value[index].isActive = !contributions.value[index].isActive;
  if (scene) {
    scene.toggleParticleInstance(index);
  }
};
</script>

<template>
  <div :class="$style.root" ref="container">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div :class="$style.content" class="container grid">
      <div :class="$style.description" v-if="description">
        <VSanityBlock :content="description" />
      </div>

      <h2 :class="$style.title" v-if="title">
        <VAnimatedTextByLetters :align="'center'" :label="title" />
      </h2>

      <div :class="$style['middle-separator']">
        <VCanvasSeparator />
      </div>
    </div>

    <div :class="$style.experiment">
      <div :class="$style.wrapper">
        <Transition appear name="instant-in-fade-out">
          <div v-if="!hasStarted" :class="$style.guideline">
            <VAnimatedTextByLetters label="Draw a line" />
          </div>
        </Transition>

        <Transition appear name="instant-in-fade-out">
          <div v-if="showCongratulations" :class="$style.congratulations">
            <VAnimatedTextByLetters label="Excellent!!" />
          </div>
        </Transition>

        <div :class="$style.canvas" ref="canvas"></div>

        <VExpandableLegend :class="$style.legend">
          <div :class="$style['legend-description']" v-if="legend">
            <SanityContent :blocks="legend" />
          </div>

          <ul :class="$style['legend-list']">
            <li
              v-for="(contribution, i) in contributions"
              :key="i"
              :class="[
                $style.contribution,
                $style['contribution--is-' + i],
                contribution.isActive && $style['contribution--is-active'],
              ]"
            >
              <button
                @click="toggleInstance(i)"
                :class="$style['contribution-button']"
              >
                <span :class="$style['contribution-label']">
                  {{ contribution.label }}:
                </span>
                <span :class="$style['contribution-count']">
                  {{ contribution.count }}
                </span>
              </button>
            </li>
          </ul>
        </VExpandableLegend>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
}

.top-separator {
  @include bottom-separator;
  top: 0;
}

.content {
  position: relative;
  z-index: 1;
  // padding-top: calc(var(--height-space) * 0.5);
  padding-top: calc(var(--height-space) + 3rem);
  margin-bottom: calc(var(--height-space) * 0.5);
}

.title {
  @include section-title;
  //grid-column: 3 / 11;
  grid-column: 4 / 10;

  @media screen and (max-aspect-ratio: 14 / 8) {
    grid-column: 2 / 12;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 1 / -1;
  }
}

.description {
  @include right-column-text;
}

.middle-separator {
  @include top-separator;
  top: auto;
  bottom: calc(var(--height-space) * -0.5);
}

.experiment {
  position: relative;
  height: 250lvh;
}

.wrapper {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 100lvh;
  //margin-top: -50vh;
}

.guideline {
  @include interaction-title;
}

.congratulations {
  @include interaction-title;
}

.canvas {
  position: absolute;
  inset: 0;

  canvas {
    position: absolute;
    inset: 0;
  }
}

.legend {
  h3 {
    font-family: var(--light-display-font);
    font-weight: normal;
    text-transform: uppercase;
    font-size: 1em;
    margin: 0 0 0.5em 0;
  }

  p:last-child {
    margin-bottom: 0;
  }

  &-list {
    padding: var(--gutter-size) calc(var(--gutter-size) * 2) 0 0;
    list-style: none;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--gutter-size);
    font-size: 0.8rem;
  }
}

.contribution {
  opacity: 0.5;
  transition: opacity 0.15s ease-out;

  @media (prefers-reduced-motion) {
    transition: none;
  }

  &--is-active {
    opacity: 1;
  }

  &-button {
    display: inline-flex;
    align-items: center;
    gap: 0 0.25em;
    margin: 0;
    padding: 0;
    background: transparent;
    font: inherit;
    color: inherit;
    border: none;
    cursor: pointer;
  }

  &-label {
    display: inline-flex;
    align-items: center;
    gap: 0 0.25em;
    position: relative;

    &:before {
      content: "";
      width: 2em;
      height: 1em;
      display: inline-block;
      border: 2px solid var(--foreground-color);
      border-radius: 1em;
      margin-right: 0.25em;
    }

    &:after {
      content: "";
      position: absolute;
      width: 0.75em;
      height: 0.75em;
      display: inline-block;
      border-radius: 50%;
      top: 50%;
      left: 0;
      border: 2px solid var(--foreground-color);
      box-sizing: border-box;
      transform: translate3d(calc(0.125em + 2px), -50%, 0);
      transition: transform 0.15s ease-out;

      @media (prefers-reduced-motion) {
        transition: none;
      }

      .contribution--is-active & {
        transform: translate3d(calc(2em - 100%), -50%, 0);
      }
    }
  }

  @for $i from 1 through 6 {
    &:nth-child(#{$i}) {
      .contribution-label:after {
        background-color: var(--color-palette-#{($i - 1)});
      }
    }
  }
}
</style>
