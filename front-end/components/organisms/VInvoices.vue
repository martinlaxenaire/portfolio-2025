<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { useTimeoutFn } from "@vueuse/core";
import { CanvasInvoicesScene } from "~/scenes/invoices/CanvasInvoicesScene";
import { WebGPUInvoicesScene } from "~/scenes/invoices/WebGPUInvoicesScene";

const props = defineProps<{
  process?: NonNullable<HomeQueryResult>["processDescription"];
  title?: NonNullable<HomeQueryResult>["invoicesTitle"];
  description?: NonNullable<HomeQueryResult>["invoicesDescription"];
}>();

let scene: WebGPUInvoicesScene | CanvasInvoicesScene | null;
const { theme } = useTheme();
const canvas = useTemplateRef("canvas");

const { data, status } = await useFetch("/api/google-sheets");

const { isVisible } = useIsVisible(canvas, false);

const hasStarted = ref(true);
const sceneComplete = ref(false);
const showCongratulations = ref(false);

const { colors } = usePaletteGenerator();
const { addLevelPoints } = useLevelExperience();

onMounted(async () => {
  hasStarted.value = false;
  const { $gpuCurtains, $hasWebGPU, $debugPane, $isReducedMotion } =
    useNuxtApp();

  const onStarted = () => {
    if (!hasStarted.value) {
      addLevelPoints(8);
    }
    hasStarted.value = true;
  };

  const onSceneComplete = () => {
    if (!sceneComplete.value) {
      addLevelPoints(15);

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

  if ($hasWebGPU && canvas.value) {
    scene = new WebGPUInvoicesScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      invoices: data.value?.values,
      colors: colors.value,
      theme: theme.value,
      debugPane: $debugPane,
      onStarted: onStarted,
      onAttractionComplete: onSceneComplete,
    });

    scene.setSceneVisibility(isVisible.value);
  } else if (canvas.value) {
    scene = new CanvasInvoicesScene({
      container: canvas.value,
      invoices: data.value?.values,
      colors: colors.value,
      isReducedMotion: $isReducedMotion,
      onStarted: onStarted,
      onAttractionComplete: onSceneComplete,
    });
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});

let seen = false;

watch(isVisible, (newValue) => {
  if (scene) {
    scene.setSceneVisibility(newValue);
  }

  if (newValue && !seen) {
    seen = true;
    //addLevelPoints(1);
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

watch(theme, (newValue) => {
  if (scene) {
    scene.updateTheme(newValue);
  }
});

const invoices = computed(() => {
  return data.value?.values?.flat() || [];
});

// const invoicesTotal = computed(() => {
//   const total = invoices.value.reduce(
//     (acc: number, v: string) => acc + parseInt(v),
//     0
//   );
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "EUR",
//     maximumSignificantDigits: 3,
//   }).format(total);
// });

// TODO dirty
const parsedDescription = computed(() => {
  return props.description?.map((block) => {
    block.children = block.children?.map((c) => {
      c.text = c.text?.replace("#{nbInvoices}", invoices.value.length);
      return c;
    });

    return block;
  });
});
</script>

<template>
  <div :class="$style.root" id="invoices">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div class="container grid" v-if="process">
      <div :class="$style.process">
        <VSanityBlock :content="process" />
      </div>
    </div>

    <div v-if="title" class="container grid">
      <h2 :class="$style.title">
        <VAnimatedTextByLetters :label="title" :align="'center'" />
      </h2>
    </div>

    <div :class="$style['invoices-xp']">
      <div :class="$style.wrapper">
        <div :class="$style['middle-separator']">
          <VCanvasSeparator />
        </div>

        <Transition appear name="instant-in-fade-out">
          <div v-if="!hasStarted" :class="$style.guideline">
            <VAnimatedTextByLetters label="Click & hold" />
          </div>
        </Transition>

        <Transition appear name="instant-in-fade-out">
          <div v-if="showCongratulations" :class="$style.congratulations">
            <VAnimatedTextByLetters label="Well done!!" />
          </div>
        </Transition>

        <VExpandableLegend :class="$style.legend">
          <div :class="$style['legend-desc']" v-if="description">
            <!-- @vue-ignore -->
            <SanityContent :blocks="parsedDescription" />
          </div>
        </VExpandableLegend>

        <div :class="$style.canvas" ref="canvas"></div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
  padding-top: calc(var(--height-space) + 3rem);
  //padding-top: 3rem;
}

.top-separator {
  @include bottom-separator;
  bottom: auto;
  top: 0;
  //z-index: 1;
}

.process {
  @include left-column-text;
}

.title {
  position: relative;
  z-index: 1;
  grid-column: 4 / 10;
  @include section-title;

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.invoices-xp {
  height: 250lvh;
  position: relative;
}

.wrapper {
  position: sticky;

  top: 0;
  height: 100lvh;
  margin: calc(var(--height-space) * 0.5) 0 0 0;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.middle-separator {
  @include top-separator;
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
  //touch-action: none;
}

.legend {
  z-index: 1;
  //pointer-events: none;

  position: absolute;
  right: 0;
  bottom: var(--gutter-size);
  left: 0;

  h3 {
    font-family: var(--light-display-font);
    line-height: 0.85;
    font-weight: normal;
    font-size: 1rem;
    text-transform: uppercase;
    margin: 0 0 0.5em 0;
  }

  &-desc {
    //font-size: 0.8rem;
    //text-transform: uppercase;
    padding-right: calc(var(--gutter-size) * 2);

    p {
      strong {
        font-family: var(--display-font);
        font-weight: normal;
        text-transform: uppercase;
      }

      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
}
</style>
