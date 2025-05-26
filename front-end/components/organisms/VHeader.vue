<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { gsap } from "gsap";
import { useIntersectionObserver } from "@vueuse/core";
import VThemeSwitcher from "../molecules/VThemeSwitcher.vue";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["title"];
}>();

const { theme } = useTheme();
const { generatePalette } = usePaletteGenerator();
const { currentFeature, addFeaturePoints } = useLevelExperience();

const { $isReducedMotion } = useNuxtApp();
const isReducedMotion = ref($isReducedMotion);

const header = useTemplateRef("header");

const isVisible = ref(false);

useIntersectionObserver(header, ([entry], observerElement) => {
  isVisible.value = entry?.isIntersecting || false;
});

let firstTitleClick = false;
let firstPaletteClick = false;

const onTitleClick = () => {
  if (isReducedMotion.value) {
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

  if (!firstTitleClick) {
    firstTitleClick = true;
    addFeaturePoints(1);
  }
};

const onPaletteClick = () => {
  generatePalette();

  if (!firstPaletteClick) {
    firstPaletteClick = true;
    addFeaturePoints(3);
  }
};

watch(theme, () => {
  generatePalette(false);
});
</script>

<template>
  <header
    :class="[$style.root, isVisible && $style['root--is-visible']]"
    ref="header"
  >
    <div class="container">
      <div :class="$style.inner">
        <nav v-if="title" :class="$style.nav">
          <NuxtLink to="/" custom v-slot="{ href }">
            <a :href="href" @click.prevent="onTitleClick">{{ title }}</a>
          </NuxtLink>
        </nav>

        <div :class="$style.display">
          <ClientOnly>
            <Transition
              appear
              :enter-active-class="$style['header-element-enter-active']"
              :leave-active-class="$style['header-element-leave-active']"
              :enter-from-class="$style['header-element-enter-from']"
              :leave-to-class="$style['header-element-leave-to']"
            >
              <div
                :class="$style.palette"
                v-if="currentFeature >= 2 || isReducedMotion"
              >
                <button @click="onPaletteClick">
                  <span :class="$style['palette-label']">
                    <span>New color palette</span>
                  </span>
                </button>
              </div>
            </Transition>

            <Transition
              appear
              :enter-active-class="$style['header-element-enter-active']"
              :leave-active-class="$style['header-element-leave-active']"
              :enter-from-class="$style['header-element-enter-from']"
              :leave-to-class="$style['header-element-leave-to']"
            >
              <div
                v-if="currentFeature >= 1 || isReducedMotion"
                :class="$style.theme"
              >
                <VThemeSwitcher />
              </div>
            </Transition>
          </ClientOnly>

          <div :class="$style.level">
            <VLevelManager />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style module lang="scss">
.root {
  position: fixed;
  z-index: 2;
  right: 0;
  left: 0;
  pointer-events: none;
}

.inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.nav {
  font-family: var(--display-font);
  text-transform: uppercase;
  flex-shrink: 1;

  transform: translate3d(0, -100%, 0);
  opacity: 0;
  transition: transform 0.35s ease(out-cubic), opacity 0.35s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  .root--is-visible & {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }

  a {
    color: inherit;
    text-decoration: none;
    pointer-events: auto;
    -webkit-text-stroke: 1px var(--background-color);

    display: inline-block;
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

.display {
  display: flex;
  gap: 0 1rem;
  flex-shrink: 1;
}

.header-element-enter-active,
.header-element-leave-active {
  transform: translate3d(0, 0, 0);
  opacity: 1;

  transition: transform 0.35s ease(out-cubic), opacity 0.35s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.header-element-enter-from,
.header-element-leave-to {
  transform: translate3d(0, -100%, 0);
  opacity: 0;
}

.palette {
  margin: 0 0.75rem 0 0;

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  button {
    display: inline-flex;
    height: 100%;
    align-items: center;
    background: none;
    border: 0;

    font: inherit;
    pointer-events: none;
    padding: 0;
    cursor: pointer;

    .palette-label {
      display: inline-flex;
      height: 100%;
      align-items: center;
      position: relative;

      span {
        display: inline-flex;
        align-items: center;
        padding: 0 1.5rem 0 0.5rem;
        box-sizing: border-box;
        height: 100%;
        border-radius: 1rem;
        font-size: var(--small-font-size);
        border: 2px solid var(--foreground-color);
        transform: scale3d(0, 1, 1);
        transform-origin: 100% 50%;
        overflow: hidden;
        border-color: transparent;
        background-color: transparent;
        color: transparent;
        transition: transform 0.15s 0.15s ease(out-expo),
          border-color 0.1s 0.05s ease(out-quad),
          background-color 0.1s 0.05s ease(out-quad), color 0.15s ease(out-quad);

        @media (prefers-reduced-motion: reduce) {
          transition: none !important;
        }

        @media screen and (max-width: 480px) {
          display: none;
        }
      }

      &:after {
        content: "";
        position: absolute;
        pointer-events: auto;
        top: 50%;
        right: -0.5em;
        transform: translate3d(0, -50%, 0) scale3d(1, 1, 1) rotateZ(0deg);
        display: block;
        width: 1.5em;
        height: 1.5em;
        box-sizing: border-box;
        background-image: conic-gradient(
          var(--color-palette-4) 0%,
          var(--color-palette-4) 20%,
          var(--color-palette-3) 20%,
          var(--color-palette-3) 40%,
          var(--color-palette-2) 40%,
          var(--color-palette-2) 60%,
          var(--color-palette-1) 60%,
          var(--color-palette-1) 80%,
          var(--color-palette-0) 80%,
          var(--color-palette-0) 100%
        );
        border-radius: 50%;
        border: 2px solid var(--foreground-color);

        transition: transform 0.25s ease(in-out-quad),
          border-width 0.25s ease(in-out-quad);

        @media (prefers-reduced-motion: reduce) {
          transition: none !important;
        }
      }
    }

    &:hover,
    &:focus-visible {
      pointer-events: auto;

      .palette-label {
        span {
          transform: scale3d(1, 1, 1);
          border-color: var(--foreground-color);
          background-color: var(--background-color);
          color: var(--foreground-color);
          transition: transform 0.25s ease(out-expo),
            border-color 0.1s ease(out-quad),
            background-color 0.1s ease(out-quad), color 0.2s 0.05s ease(in-quad);
        }

        &:after {
          transform: translate3d(0, -50%, 0) scale3d(1.35, 1.35, 1)
            rotateZ(360deg);
          border-width: calc(2px / 1.35);

          transition: transform 0.25s ease(out-quart),
            border-width 0.25s ease(out-quart);
        }
      }
    }
  }
}

.theme {
  display: flex;
  align-items: center;

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.level {
  opacity: 0;
  transition: opacity 0.35s 0.15s ease(in-quad);

  @media (prefers-reduced-motion) {
    display: none;
    transition: none !important;
  }

  .root--is-visible & {
    opacity: 1;
  }
}
</style>
