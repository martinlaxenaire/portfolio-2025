<script setup lang="ts">
import type { GameQueryResult } from "~/types/sanity.types";
import { gameQueryString } from "../studio/src/queries-strings";
import { VueLenis, useLenis } from "lenis/vue";

const { $isReducedMotion } = useNuxtApp();

const lenis = useLenis();

onMounted(() => {
  if ($isReducedMotion && lenis.value) {
    lenis.value.destroy();
  }
});

// load game data
const { levels, features, currentLevelPoints, currentFeaturePoints } =
  useLevelExperience();
const router = useRouter();

const gameQuery = groq`${gameQueryString}`;
const { data } = await useSanityQuery<GameQueryResult>(gameQuery);

if (data.value) {
  levels.value =
    data.value.levels && data.value.levels.length ? data.value.levels : [];

  features.value =
    data.value.features && data.value.features.length
      ? data.value.features
      : [];

  // debug levels
  if (levels.value.length && router.currentRoute.value.query?.level) {
    const startLevel = Math.min(
      parseInt(router.currentRoute.value.query.level as string),
      levels.value.length
    );

    currentLevelPoints.value =
      levels.value.length >= startLevel - 1
        ? (levels.value[startLevel - 1].pointsNeeded as number)
        : currentLevelPoints.value;
  }

  // debug features
  if (features.value.length && router.currentRoute.value.query?.feature) {
    const startFeature = Math.min(
      parseInt(router.currentRoute.value.query.feature as string),
      features.value.length
    );

    currentLevelPoints.value =
      features.value.length >= startFeature - 1
        ? (features.value[startFeature - 1].pointsNeeded as number)
        : currentFeaturePoints.value;
  }
}

// debug levels
</script>

<template>
  <VueLenis :root="true">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </VueLenis>
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
  transition: opacity 0.5s;

  @media (prefers-reduced-motion) {
    transition: none;
  }
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
