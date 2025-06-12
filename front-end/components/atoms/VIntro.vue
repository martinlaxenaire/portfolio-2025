<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";

const props = defineProps<{
  intro?: NonNullable<HomeQueryResult>["intro"];
}>();

const skipGame = useTemplateRef("skip-game");
const { isVisible } = useIsVisible(skipGame);
</script>

<template>
  <div :class="$style.root" class="container grid">
    <div :class="$style.intro" v-if="intro">
      <!-- @vue-ignore -->
      <VSanityBlock :content="intro" />

      <div
        ref="skip-game"
        :class="[
          $style['skip-game'],
          isVisible && $style['skip-game--is-visible'],
        ]"
      >
        <VSkipGame />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.root {
  position: relative;
  z-index: 1;
}

.intro {
  @include left-column-text;
}

.skip-game {
  font-size: 1rem;
  margin-top: 3rem;

  opacity: 0;
  transition: opacity 0.5s 0.5s ease(in-quad);

  &--is-visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}
</style>
