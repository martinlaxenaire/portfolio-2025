<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { WebGPUYearsScene } from "~/scenes/years/WebGPUYearsScene";
import { ScrollTrigger } from "gsap/all";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["yearsTitle"];
}>();

export type YearsList = Array<{
  title?: string;
  videos?: Array<{
    url?: string;
  }>;
}>;

const years = ref([
  {
    title: "2022",
    videos: [
      {
        url: "./videos/2022/martin-laxenaire-2022-plongez-dans-lyon-webgl-scene-720p.webm",
      },
      {
        url: "./videos/2022/martin-laxenaire-2022-studio-tumulte-home-720p.webm",
      },
      {
        url: "./videos/2022/martin-laxenaire-2022-studio-tumulte-projects-720p.webm",
      },
    ],
  },
  {
    title: "2023",
    videos: [
      {
        url: "./videos/2023/martin-laxenaire-2023-1-720p.webm",
      },
      {
        url: "./videos/2023/martin-laxenaire-2023-good-fortune-collective-webgl-ui-720p.webm",
      },
      {
        url: "./videos/2023/martin-laxenaire-poi-2023-720p.webm",
      },
    ],
  },
  {
    title: "2024",
    videos: [
      {
        url: "./videos/2024/martin-laxenaire-2024-1-720p.webm",
      },
      {
        url: "./videos/2024/martin-laxenaire-2024-musee-plaisance-timeline-720p.webm",
      },
      {
        url: "./videos/2024/martin-laxenaire-2024-gpu-curtains-webgpu-order-independant-transparency-galaxy-720p.webm",
      },
      {
        url: "./videos/2024/martin-laxenaire-2024-musee-plaisance-timeline-list-switch-720p.webm",
      },
      {
        url: "./videos/2024/martin-laxenaire-2024-gpu-curtains-webgpu-compute-cloth-simulation-720p.webm",
      },
    ],
  },
  {
    title: "2025",
    videos: [
      {
        url: "./videos/2025/martin-laxenaire-2025-dive-into-webgpu-720p.webm",
      },
      {
        url: "./videos/2025/martin-laxenaire-2025-gpu-curtains-webgpu-skinning-shadows-720p.webm",
      },
    ],
  },
]);

const yearsContainer = useTemplateRef("years-container");
const yearsItems = useTemplateRef("years-items");
const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);
let seen = false;

let scene: WebGPUYearsScene | null;

// const containerScroll = useContainerScroll({
//   element: yearsContainer,
//   threshold: 0,
//   topTriggerPadding: 0.5, // from 0->1 relative to window height
//   bottomTriggerPadding: 0.5, // from 0->1 relative to window height
// });

// watch(containerScroll, (newScroll) => {
//   if (scene) {
//     scene.progress = newScroll;
//   }
// });

const { colors } = usePaletteGenerator();

const { currentLevel, addLevelPoints } = useLevelExperience();

let scrollTrigger: ScrollTrigger | null = null;

onMounted(() => {
  const { $gpuCurtains, $hasWebGPU, $debugPane } = useNuxtApp();

  let progress = 0;

  if ($hasWebGPU && canvas.value && yearsItems.value) {
    scene = new WebGPUYearsScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      items: yearsItems.value,
      debugPane: $debugPane,
      //progress: isNaN(containerScroll.value) ? 0 : containerScroll.value,
      progress,
      colors: colors.value,
    });

    scene.setSceneVisibility(isVisible.value);

    // scroll trigger
    scrollTrigger = ScrollTrigger.create({
      trigger: yearsContainer.value,
      start: () => `${window.innerHeight * 0.5}px top`,
      end: "+=50% top",
      //markers: true,
      onUpdate: (self) => {
        progress = self.progress;
        if (scene) scene.progress = progress;
      },
    });
  }
});

watch(isVisible, () => {
  if (scene) {
    scene.setSceneVisibility(isVisible.value);
  }

  if (isVisible.value && !seen) {
    seen = true;
    addLevelPoints(1);
  }
});

watch(currentLevel, () => {
  if (currentLevel.value === 1) {
    nextTick(() => {
      if (scrollTrigger) {
        scrollTrigger.refresh();
      }
    });
  }
});

const { theme } = useTheme();

watch(theme, () => {
  if (scene) {
    scene.updateTheme();
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

onBeforeUnmount(() => {
  scrollTrigger?.kill();

  if (scene) {
    scene.destroy();
  }
});
</script>

<template>
  <div :class="$style.root">
    <div :class="$style.top">
      <div class="container grid">
        <h3 :class="$style.title">
          <VAnimatedTextByLetters :label="title || ''" :align="'center'" />
        </h3>
      </div>

      <div :class="$style['top-separator']">
        <VCanvasSeparator />
      </div>
    </div>

    <div :class="$style.years">
      <div :class="$style.canvas" ref="canvas"></div>

      <ul
        :class="$style.list"
        v-if="years"
        class="container"
        ref="years-container"
        :style="{ '--nb-items': years.length }"
      >
        <li v-for="(year, i) in years" :key="i" ref="years-items">
          <VYearItem :year="year" :key="i" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
  padding: 3rem 0 0 0;
  //background: var(--background-color);
}

.top {
  padding-bottom: calc(var(--height-space) * 0.5);
  position: relative;

  &-separator {
    @include bottom-separator;
    bottom: 0;
    z-index: 0;
  }
}

.title {
  position: relative;
  z-index: 1;
  @include section-title;
  grid-column: 4 / 10;

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.years {
  position: relative;
}

.canvas {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
}

.list {
  list-style: none;
  padding: 0;
  margin: -100vh 0 0 0;
  height: calc(100vh * var(--nb-items));
  position: sticky;

  opacity: 0;
  pointer-events: none;

  body:global(.no-webgpu) & {
    opacity: 1;
    pointer-events: auto;
  }

  li {
    position: absolute;
    top: 0;
    left: 0;
    height: 100vh;

    body:global(.no-webgpu) & {
      position: relative;
      top: auto;
      left: auto;
    }
  }
}
</style>
