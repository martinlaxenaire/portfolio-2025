<script lang="ts" setup>
import type { GameQueryResult } from "~/types/sanity.types";
import { gameQueryString } from "../../../studio/src/queries-strings";
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

const gameQuery = groq`${gameQueryString}`;
useSanityQuery<GameQueryResult>(gameQuery).then((result) => {
  if (result && result.data && result.data.value) {
    levels.value =
      result.data.value.levels && result.data.value.levels.length
        ? result.data.value.levels
        : [];

    features.value =
      result.data.value.features && result.data.value.features.length
        ? result.data.value.features
        : [];
  }
});

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

watch(currentLevelPoints, () => {
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
});

const nextLevelExperienceNeeded = computed(() =>
  currentLevel.value >= levels.value.length
    ? 0
    : levels.value[currentLevel.value].pointsNeeded - currentLevelPoints.value
);

// TODO
const activeLevelLegend = ref([] as number[]);

watch(currentLevel, () => {
  if (!isGameActive.value) return;

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

watch(currentFeaturePoints, () => {
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
});

const activeFeatureLegend = ref([] as number[]);

watch(currentFeature, () => {
  if (!isGameActive.value) return;

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

// debug feature/level
onMounted(() => {
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  const startLevel = searchParams.has("level")
    ? parseInt(searchParams.get("level") as string)
    : 0;

  const startFeature = searchParams.has("feature")
    ? parseInt(searchParams.get("feature") as string)
    : 0;

  currentLevel.value = startLevel;
  currentFeature.value = startFeature;

  // console.log(levels.value.length, levels.value[startLevel - 1], startLevel);

  // currentLevelPoints.value =
  //   levels.value.length && levels.value.length >= startLevel - 1
  //     ? levels.value[startLevel - 1].pointsNeeded
  //     : currentLevelPoints.value;

  // currentFeaturePoints.value =
  //   features.value.length && features.value.length >= startFeature - 1
  //     ? features.value[startFeature - 1].pointsNeeded
  //     : currentFeaturePoints.value;
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
        <h3>{{ percentComplete }}% complete</h3>
        <p>
          Interact with the site to gain experience points and unlock new
          contents and features!
        </p>
        <div :class="$style['legend-section']">
          <h3>Contents</h3>
          <ul>
            <li>Unlocked: {{ currentLevel }}/{{ levels.length }}</li>
            <li>Current experience points: {{ currentLevelPoints }}</li>
            <li>
              Next level in {{ nextLevelExperienceNeeded }}
              {{ nextLevelExperienceNeeded > 1 ? "points" : "point" }}
            </li>
          </ul>
        </div>

        <div :class="$style['legend-section']">
          <h3>Features</h3>
          <ul>
            <li>Unlocked: {{ currentFeature }}/{{ features.length }}</li>
            <li>Current experience points: {{ currentFeaturePoints }}</li>
            <li>
              Next level in {{ nextFeatureExperienceNeeded }}
              {{ nextFeatureExperienceNeeded > 1 ? "points" : "point" }}
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
        <h3>New content unlocked!</h3>
        <h4 v-if="level.contentUnlocked">{{ level.contentUnlocked }}</h4>
        <p v-if="level.tip">{{ level.tip }}</p>
      </VLevelExpandableLegend>

      <VLevelExpandableLegend
        v-for="(feature, j) in features"
        :key="j"
        :class="$style.legend"
        :is-visible="activeFeatureLegend.includes(j)"
      >
        <h3>New feature unlocked!</h3>
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

  transition: background 0.25s, color 0.25s;

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
