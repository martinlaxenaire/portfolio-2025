<script lang="ts" setup>
import { gsap } from "gsap";
import { siteConfig } from "../../../studio/site-config";

const title = ref(siteConfig.siteTitle);

let firstTitleClick = false;

const { $isReducedMotion } = useNuxtApp();
const router = useRouter();
const { addFeaturePoints } = useLevelExperience();

const onTitleClick = (navigate: () => void) => {
  if (!firstTitleClick) {
    firstTitleClick = true;
    addFeaturePoints(1);
  }

  if (router.currentRoute.value.path !== "/") {
    navigate();
    return;
  }

  if ($isReducedMotion) {
    window.scrollTo(0, 0);

    return;
  }

  const currentScroll = {
    value: window.pageYOffset,
  };

  gsap.to(currentScroll, {
    value: 0,
    duration: Math.min(1, currentScroll.value / 3000),
    ease: "circ.inOut",
    onUpdate: () => {
      window.scrollTo(0, currentScroll.value);
    },
  });
};
</script>

<template>
  <NuxtLink
    to="/"
    custom
    v-slot="{ href, navigate }"
    :class="$style.root"
    v-if="title"
  >
    <a :href="href" @click.prevent="onTitleClick(navigate)">{{ title }}</a>
  </NuxtLink>
</template>

<style lang="scss" module>
.root {
  color: inherit;
  text-decoration: none;
  pointer-events: auto;
  -webkit-text-stroke: 1px var(--background-color);
  backface-visibility: hidden;
  will-change: transform;

  display: inline-block;
  transition: transform 0.35s ease(out-expo);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  &:hover,
  &:focus-visible {
    transform: skew(-15deg, 0deg);
  }

  @media screen and (max-width: 400px) {
    font-size: 0.9rem;
  }
}
</style>
