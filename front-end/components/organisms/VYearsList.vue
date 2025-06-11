<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import type { WebGPUYearsScene } from "~/scenes/years/WebGPUYearsScene";
import { gsap } from "gsap";
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

const yearsWrapper = useTemplateRef("years-wrapper");
const yearsContainer = useTemplateRef("years-container");
const yearsItems = useTemplateRef("years-items");
const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);
let seen = false;

let scene: WebGPUYearsScene | null;

const { colors } = usePaletteGenerator();

const { currentLevel, addLevelPoints } = useLevelExperience();

let scrollTrigger: ScrollTrigger | null = null;

const hasStarted = ref(currentLevel.value >= 2);
const sceneComplete = ref(false);

onMounted(async () => {
  const { $gpuCurtains, $hasWebGPU, $debugPane, $isReducedMotion } =
    useNuxtApp();

  let progress = 0;

  if ($hasWebGPU && canvas.value && yearsItems.value && yearsContainer.value) {
    const { WebGPUYearsScene } = await import(
      "~/scenes/years/WebGPUYearsScene"
    );

    scene = new WebGPUYearsScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      wrapper: yearsContainer.value,
      items: yearsItems.value,
      debugPane: $debugPane,
      progress,
      colors: colors.value,
    });

    scene.setSceneVisibility(isVisible.value);
  }

  let isScrollTriggerResizing = false;

  if (yearsWrapper.value && yearsContainer.value && !$isReducedMotion) {
    // scroll trigger
    scrollTrigger = ScrollTrigger.create({
      trigger: yearsContainer.value,
      scroller: yearsWrapper.value,
      horizontal: true,
      start: "left left",
      end: "right right",
      // markers: true,
      onUpdate: (self) => {
        progress = self.progress;

        if (!hasStarted.value && progress > 0.1) {
          hasStarted.value = true;
          addLevelPoints(5);
        }

        if (!sceneComplete.value && progress > 0.9) {
          sceneComplete.value = true;
          addLevelPoints(10);
        }

        if (scene) {
          scene.progress = progress;

          const currentScroll = scrollTrigger.scroll();
          scene.setCurrentScroll(currentScroll);
          if (isScrollTriggerResizing) {
            scene.resetScroll(currentScroll);
          }
        }

        isScrollTriggerResizing = false;
      },
    });

    ScrollTrigger.addEventListener("refreshInit", () => {
      isScrollTriggerResizing = true;
    });

    let startScroll = yearsWrapper.value.scrollLeft;

    if (ScrollTrigger.isTouch !== 1) {
      ScrollTrigger.observe({
        target: yearsContainer.value,
        type: "pointer",
        onPress: function () {
          startScroll = scrollTrigger.scroll();
        },
        onDragStart: function () {
          gsap.killTweensOf(scrollTrigger);
          yearsWrapper.value.style.cursor = "grabbing";
        },
        onDrag: function (self) {
          scrollTrigger?.scroll(
            gsap.utils.clamp(
              0,
              scrollTrigger.end,
              startScroll + self.startX - self.x
            )
          );
        },
        onDragEnd: function (self) {
          yearsWrapper.value.style.cursor = "grab";
          gsap.to(scrollTrigger, {
            inertia: {
              scroll: {
                velocity: -self.velocityX,
                min: 0,
                max: scrollTrigger.end,
              },
              resistance: scrollTrigger.end,
            },
          });
        },
      });
    }
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
  if (scrollTrigger) {
    gsap.killTweensOf(scrollTrigger);
    scrollTrigger.kill();
  }

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

    <div :class="$style.content">
      <div :class="$style.canvas" ref="canvas"></div>
      <div :class="$style.years" ref="years-wrapper">
        <ul
          :class="$style.list"
          v-if="years"
          ref="years-container"
          :style="{ '--nb-items': years.length }"
        >
          <li v-for="(year, i) in years" :key="i" ref="years-items">
            <VYearItem :year="year" :key="i" />
          </li>
        </ul>
      </div>

      <ClientOnly>
        <Transition appear name="instant-in-fade-out">
          <div v-if="!hasStarted" :class="$style.guideline">
            <div :class="$style['guideline-arrow']">
              <VAnimatedArrow :class="$style['guideline-arrow-svg']" />
            </div>

            <VAnimatedTextByLetters label="Drag left" :animate-colors="false" />
          </div>
        </Transition>
      </ClientOnly>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
  padding: 3rem 0 0 0;
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
  grid-column: 7 / 19;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 4 / 10;
  }

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.content {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.years {
  position: relative;
  overflow-x: scroll;
  overflow-y: hidden;
  user-select: none;
  scrollbar-color: #aaa #252525;
  cursor: grab;

  body:global(.is-light) & {
    scrollbar-color: #666 #eee;
  }

  @media (prefers-reduced-motion) {
    overflow: hidden;
    user-select: auto;
    cursor: auto;
  }
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100lvh;
  pointer-events: none;
}

.list {
  --window-width: calc(100vw - var(--scrollbar-width));
  --list-item-margin: #{get-col-span-width(3, 4)};

  list-style: none;
  padding: 0;
  margin: 0;
  height: 100lvh;
  display: flex;
  flex-wrap: nowrap;
  width: calc(
    var(--window-width) * var(--nb-items) -
      (var(--list-item-margin) * (var(--nb-items) - 1))
  );
  max-width: none;

  @media screen and (max-aspect-ratio: 12 / 8) {
    --list-item-margin: #{get-col-span-width(1, 2)};
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    --list-item-margin: #{get-col-span-width(0, 1)};
  }

  opacity: 0;

  body:global(.no-webgpu) & {
    opacity: 1;
  }

  @media (prefers-reduced-motion) {
    height: auto;
    width: 100% !important;
    display: block;
  }

  li {
    position: relative;
    height: 100lvh;
    width: var(--window-width);
    pointer-events: none;

    &:not(:first-child) {
      margin-left: calc(-1 * var(--list-item-margin));

      @media (prefers-reduced-motion) {
        margin-left: 0;
      }
    }

    @media (prefers-reduced-motion) {
      width: auto;
      pointer-events: auto;
    }
  }
}

.guideline {
  @include interaction-title;

  //-webkit-text-stroke: 0.025em var(--color-palette-0);

  // top: 0;
  // transform: translate3d(-50%, calc(var(--gutter-size) * 2), 0)
  //   skew(-20deg, 0deg);

  top: 100%;
  // transform: translate3d(-50%, calc(-100% - var(--gutter-size) * 2), 0)
  //   skew(-20deg, 0deg);

  left: auto;
  transform: translate3d(0, calc(-100% - var(--gutter-size) * 2), 0)
    skew(-20deg, 0deg);

  display: flex;
  justify-content: flex-end;
  align-items: center;

  @media screen and (max-aspect-ratio: 12 / 8) {
    justify-content: center;
  }

  &-arrow {
    margin-right: 0.5em;
    transform: rotate3d(0, 0, 1, 90deg);

    &-svg {
      width: 0.5em;
      height: auto;
    }
  }
}
</style>
