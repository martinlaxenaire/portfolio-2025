<script lang="ts" setup>
import { UIElements } from "~/assets/static-data/ui-elements";
import { useTimeoutFn } from "@vueuse/core";

const {
  levels,
  features,
  isGameActive,
  currentLevel,
  currentLevelPoints,
  currentFeature,
  currentFeaturePoints,
  addFeaturePoints,
} = useLevelExperience();

let hasInteracted = false;
const isLegendVisible = ref(false);

const toggleLegend = () => {
  isLegendVisible.value = !isLegendVisible.value;
  if (!hasInteracted && isLegendVisible.value) {
    hasInteracted = true;
    addFeaturePoints(1);
  }
};

const skipGame = () => {
  isLegendVisible.value = false;
};

const mainLegend = useTemplateRef("mainLegend");
const mainButton = useTemplateRef("mainButton");
const onDocumentClick = (e: MouseEvent) => {
  if (mainButton.value?.contains(e.target as Node)) return;

  if (
    isLegendVisible.value &&
    mainLegend.value &&
    !mainLegend.value.expandableLevelLegend?.contains(e.target as Node)
  ) {
    isLegendVisible.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});

watch(
  currentLevelPoints,
  () => {
    if (currentLevel.value >= levels.value.length) return;

    for (let i = 0; i < levels.value.length; i++) {
      const level = levels.value[i];
      if (
        currentLevelPoints.value >= level.pointsNeeded &&
        currentLevel.value <= i
      ) {
        currentLevel.value = i + 1;
      }
    }
  },
  { immediate: true }
);

const nextLevelExperienceNeeded = computed(() =>
  currentLevel.value >= levels.value.length
    ? 0
    : levels.value[currentLevel.value].pointsNeeded - currentLevelPoints.value
);

// TODO
const activeLevelLegend = ref([] as number[]);

watch(currentLevel, () => {
  if (!isGameActive.value) return;

  if (import.meta.client) {
    umTrackEvent("Game", {
      name: `Unlocked level ${currentLevel.value}`,
    });
  }

  if (
    currentLevel.value === levels.value.length &&
    currentFeature.value === features.value.length
  ) {
    isGameActive.value = false;
  }

  activeLevelLegend.value.push(currentLevel.value - 1);

  useTimeoutFn(() => {
    activeLevelLegend.value.shift();
  }, 5000);
});

watch(
  currentFeaturePoints,
  () => {
    if (currentFeature.value >= features.value.length) return;

    for (let i = 0; i < features.value.length; i++) {
      const feature = features.value[i];
      if (
        currentFeaturePoints.value >= feature.pointsNeeded &&
        currentFeature.value <= i
      ) {
        currentFeature.value = i + 1;
      }
    }
  },
  { immediate: true }
);

const activeFeatureLegend = ref([] as number[]);

watch(currentFeature, () => {
  if (!isGameActive.value) return;

  if (import.meta.client) {
    umTrackEvent("Game", {
      name: `Unlocked feature ${currentFeature.value}`,
    });
  }

  if (
    currentLevel.value === levels.value.length &&
    currentFeature.value === features.value.length
  ) {
    isGameActive.value = false;
  }

  activeFeatureLegend.value.push(currentFeature.value - 1);

  useTimeoutFn(() => {
    activeFeatureLegend.value.shift();
  }, 5000);
});

const nextFeatureExperienceNeeded = computed(() =>
  currentFeature.value >= features.value.length
    ? 0
    : features.value[currentFeature.value].pointsNeeded -
      currentFeaturePoints.value
);

const percentComplete = computed(() => {
  return Math.round(
    100 *
      ((currentFeature.value / Math.max(1, features.value.length)) * 0.25 +
        (currentLevel.value / Math.max(1, levels.value.length)) * 0.75)
  );
});
</script>

<template>
  <div :class="$style.root">
    <button
      :class="[
        $style['level-button'],
        isLegendVisible && $style['level-button--is-active'],
      ]"
      @click="toggleLegend"
      ref="mainButton"
    >
      <span>{{ percentComplete }}%</span>
    </button>

    <div :class="$style.content">
      <VLevelExpandableLegend
        :class="$style.legend"
        :is-visible="isLegendVisible"
        ref="mainLegend"
      >
        <h3>{{ UIElements.game.complete(percentComplete) }}</h3>
        <p>
          {{ UIElements.game.guideline }}
        </p>
        <div :class="$style['legend-section']">
          <h3>{{ UIElements.game.contents.title }}</h3>
          <ul>
            <li>{{ UIElements.game.unlocked(currentLevel, levels.length) }}</li>
            <li>{{ UIElements.game.currentXPPoints(currentLevelPoints) }}</li>
            <li>
              {{ UIElements.game.nextLevel(nextLevelExperienceNeeded) }}
            </li>
          </ul>
        </div>

        <div :class="$style['legend-section']">
          <h3>{{ UIElements.game.features.title }}</h3>
          <ul>
            <li>
              {{ UIElements.game.unlocked(currentFeature, features.length) }}
            </li>
            <li>{{ UIElements.game.currentXPPoints(currentFeaturePoints) }}</li>
            <li>
              {{ UIElements.game.nextLevel(nextFeatureExperienceNeeded) }}
            </li>
          </ul>
        </div>

        <div :class="$style['legend-section']" v-if="isGameActive">
          <VSkipGame @onSkipGame="skipGame" />
        </div>
      </VLevelExpandableLegend>

      <VLevelExpandableLegend
        v-for="(level, i) in levels"
        :key="i"
        :class="$style.legend"
        :is-visible="activeLevelLegend.includes(i)"
      >
        <h3>{{ UIElements.game.contents.completed }}</h3>
        <h4 v-if="level.contentUnlocked">{{ level.contentUnlocked }}</h4>
        <p v-if="level.tip">{{ level.tip }}</p>
      </VLevelExpandableLegend>

      <VLevelExpandableLegend
        v-for="(feature, j) in features"
        :key="j"
        :class="$style.legend"
        :is-visible="activeFeatureLegend.includes(j)"
      >
        <h3>{{ UIElements.game.features.completed }}</h3>
        <h4 v-if="feature.contentUnlocked">{{ feature.contentUnlocked }}</h4>
        <p v-if="feature.tip">{{ feature.tip }}</p>
      </VLevelExpandableLegend>
    </div>
  </div>
</template>

<style lang="scss" module>
.root {
  position: relative;
  pointer-events: none;
  font-size: var(--tiny-font-size);
}

.content {
  position: fixed;
  top: 3.2rem;
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  //gap: 0.5em 0;
}

.container {
  width: 100%;
}

.level-button {
  display: block;
  padding: 0.25em 0.5em;
  text-transform: uppercase;
  font: inherit;
  background: var(--background-color);
  border: 2px solid var(--foreground-color);
  color: var(--foreground-color);
  cursor: pointer;
  pointer-events: auto;
  border-radius: 1em;

  transition: background 0.35s, color 0.35s;

  @media (prefers-reduced-motion) {
    transition: none;
  }

  &--is-active,
  &:hover {
    background: var(--foreground-color);
    color: var(--background-color);
  }

  span {
    display: inline-block;
    width: 2.5em;
    text-align: center;
  }
}

.legend {
  @media (prefers-reduced-motion) {
    display: none;
  }

  &-section {
    padding: 1em 0 0 0;
    margin: 1em 0 0 0;
    border-top: 2px solid var(--foreground-color);
  }

  &-skip-game {
    display: block;
    padding: 0.25em 0.5em;
    text-transform: uppercase;
    font: inherit;
    background: var(--background-color);
    border: 2px solid var(--foreground-color);
    color: var(--foreground-color);
    cursor: pointer;
    pointer-events: auto;
    border-radius: 1em;

    transition: background 0.25s, color 0.25s;

    @media (prefers-reduced-motion) {
      transition: none;
    }

    &--is-active,
    &:hover {
      background: var(--foreground-color);
      color: var(--background-color);
    }
  }

  h3 {
    font-family: var(--light-display-font);
    font-weight: normal;
    text-transform: uppercase;
    font-size: 1em;
    margin: 0 0 0.5em 0;
  }

  h4 {
    //font-weight: normal;
    //text-transform: uppercase;
    font-size: 1.15em;
    margin: 0 0 0.5em 0;
    font-weight: normal;
  }

  p {
    margin: 0 0 1em 0;

    &:last-of-type {
      margin: 0;
    }
  }

  ul {
    padding: 0 0 0 1em;
    margin: 0;
    padding: 0;
  }
}
</style>
