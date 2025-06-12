<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["footerTitle"];
  siteTitle?: NonNullable<HomeQueryResult>["title"];
  description?: NonNullable<HomeQueryResult>["footerDescription"];
  socials?: NonNullable<HomeQueryResult>["socials"];
}>();

const socialsList = useTemplateRef("socials");
const { isVisible: isSocialsVisible } = useIsVisible(socialsList);

const credits = useTemplateRef("credits");
const { isVisible: isCreditsVisible } = useIsVisible(credits);

const { addFeaturePoints } = useLevelExperience();

watch(isCreditsVisible, () => {
  if (isCreditsVisible.value) {
    addFeaturePoints(1);
  }
});

const isGridHelperVisible = ref(false);
let hasGridBeenVisible = false;

const toggleGridHelper = () => {
  isGridHelperVisible.value = !isGridHelperVisible.value;

  if (!hasGridBeenVisible) {
    addFeaturePoints(3);
  }

  hasGridBeenVisible = true;
};
</script>

<template>
  <footer :class="$style.root">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div class="container grid">
      <h2 :class="$style.title" v-if="title">
        <VAnimatedTextByLetters :align="'center'" :label="title" />
      </h2>
    </div>

    <div :class="$style.content" class="container grid">
      <div :class="$style.description" v-if="description">
        <!-- @vue-ignore -->
        <VSanityBlock :content="description" />
      </div>

      <ul
        :class="[
          $style.socials,
          isSocialsVisible && $style['socials--is-visible'],
        ]"
        v-if="socials"
        ref="socials"
      >
        <li v-for="(social, i) in socials" :key="i">
          <a
            v-if="social.url"
            :href="social.url"
            target="_blank"
            rel="noopener"
          >
            {{ social.title }}
          </a>
        </li>
      </ul>

      <div
        :class="[
          $style.credit,
          isCreditsVisible && $style['credit--is-visible'],
        ]"
        ref="credits"
        @click="toggleGridHelper"
      >
        {{ new Date().getFullYear() }} - {{ siteTitle }}
      </div>
    </div>

    <ClientOnly>
      <VGridHelper :is-visible="isGridHelperVisible" />
    </ClientOnly>
  </footer>
</template>

<style lang="scss" module>
.root {
  position: relative;
  padding: calc(var(--height-space) * 0.5) 0 3rem 0;
}

.top-separator {
  @include top-separator;
  top: 0;
}

.title {
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
  margin-top: 3rem;
}

.description {
  grid-column: 3 / 10;
  padding: 3rem 0 0 0;
  font-size: 1.5rem;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 2 / 8;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    font-size: 1.25rem;
    grid-column: 2 / 12;
  }
}

.socials {
  grid-column: 15 / 23;
  padding: 0;
  padding-top: 3rem;
  margin: 3rem 0;
  list-style: none;
  font-size: 1.25rem;
  text-align: right;
  font-family: var(--light-display-font);

  @media screen and (max-aspect-ratio: 12 / 8) {
    padding-top: 0;
    grid-column: 6 / 12;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 2 / 12;
  }

  li {
    opacity: 0;

    @for $i from 1 through 10 {
      &:nth-child(#{$i}) {
        transition: opacity 0.5s calc(0.5s + #{$i * 0.1s}) ease(in-out-quad);
      }
    }

    @media (prefers-reduced-motion) {
      transition: none !important;
    }

    a {
      text-decoration: none;
      text-transform: uppercase;
      display: inline-block;
      backface-visibility: hidden;
      will-change: transform;

      transition: transform 0.35s ease(out-expo);

      @media (prefers-reduced-motion) {
        transition: none !important;
      }

      &:hover,
      &:focus-visible {
        transform: skew(-15deg, 0deg);
      }
    }
  }

  &--is-visible {
    li {
      opacity: 1;
    }
  }
}

.credit {
  margin-top: 3rem;
  grid-column: 1 / -1;
  text-align: center;
  font-size: var(--small-font-size);

  opacity: 0;
  transition: opacity 0.5s 0.5s ease(in-out-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  &--is-visible {
    opacity: 1;
  }
}
</style>
