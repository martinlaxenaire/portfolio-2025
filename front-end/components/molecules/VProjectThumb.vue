<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";

const props = defineProps<{
  project?: NonNullable<NonNullable<HomeQueryResult>["projects"]>[number];
  index: number;
}>();

const { addFeaturePoints } = useLevelExperience();

const projectThumb = useTemplateRef<HTMLElement>("projectThumb");
const { isVisible } = useIsVisible(projectThumb);

const formattedStack = computed(() => {
  return props.project?.stack ? props.project?.stack.join(", ") : null;
});

const projectComponent = computed(() => {
  return props.project?.url ? "a" : "div";
});

const projectComponentAttrs = computed(() => {
  return props.project?.url
    ? {
        href: props.project.url,
        target: "_blank",
        onClickOnce() {
          addFeaturePoints(1);
        },
      }
    : {};
});
</script>

<template>
  <component
    :is="projectComponent"
    :class="[
      $style.root,
      $style['root--is-index-' + index],
      isVisible && $style['root--is-visible'],
    ]"
    :style="{ '--index': index }"
    v-bind="projectComponentAttrs"
    v-if="project"
    ref="projectThumb"
  >
    <div :class="$style.content">
      <h3 v-if="project.title" :class="$style.title">
        {{ project.title }}
      </h3>

      <div v-if="formattedStack" :class="$style.stack">
        {{ formattedStack }}
      </div>
    </div>
  </component>
</template>

<style module lang="scss">
.root {
  display: block;
  position: relative;
  color: inherit;
  overflow: hidden;
  text-decoration: none;
  padding: 0 0 2px 0;

  &--is-index-0 {
    padding: 2px 0;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 2px;
      background: var(--foreground-color);
      transform-origin: 0% 50%;
      transform: scale3d(0, 1, 1);
      transition: transform 0.35s ease(out-expo);

      @media (prefers-reduced-motion) {
        transform: scale3d(1, 1, 1);
        transition: none;
      }
    }
  }

  &:after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--foreground-color);
    transform-origin: 0% 50%;
    transform: scale3d(0, 1, 1);
    transition: transform 0.35s calc(0.05s + 0.05s * var(--index))
      ease(out-expo);

    @media (prefers-reduced-motion) {
      transform: scale3d(1, 1, 1);
      transition: none;
    }
  }

  &--is-visible {
    &:before,
    &:after {
      transform: scale3d(1, 1, 1);
    }
  }
}

.content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  overflow: hidden;
  padding: calc(var(--gutter-size) * 2) var(--gutter-size);

  &:before {
    content: "";
    position: absolute;
    inset: 0;
    top: -50%;
    bottom: -50%;
    z-index: 1;
    background-color: var(--foreground-color);
    //background: var(--color-palette-3);
    transform: translate3d(0, 0, 0) scale3d(1, 0.5, 1);
    opacity: 0;
    transition: transform 0.1s ease(out-cubic), opacity 0.1s ease(out-cubic);

    @media (prefers-reduced-motion) {
      transition: none !important;
    }

    background-image: url('data:image/svg+xml,<svg fill="%23121212" viewBox="0 0 500 284.46" version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg"><path d="M154.35,2.08c.28,1.23,2.93,15.89,5.77,32.53S165.7,66.39,166,68c.47,2.27.28,2.93-.85,2.93-.85,0-22.89-1.32-49-2.84S68.49,65.35,68.3,65.54c-.28.38,36.6,33.48,38.77,34.9.66.38.85.85.66,1-.47.38-75.75,13.43-91.92,16-4.07.57-7.38,1.32-7.38,1.7S25.74,125.4,47,132.3s39.34,12.86,40.38,13.24c2,.85,2.84.38-54.85,28.18-14.56,7-27.9,13.43-29.69,14.19s-3,1.51-2.84,1.7,24.87-2.18,54.75-5.2,54.47-5.39,54.66-5.2-5.58,15.89-12.58,35-12.67,35.18-12.58,35.46S105.37,238,130.81,223s46.34-27.14,46.43-27,5,15.6,10.88,34.33,10.88,34.42,11.25,34.8,12.2-12.58,26.29-28.84,27.42-31.68,29.69-34.14l4.16-4.54,26.38,43.6c14.47,23.93,26.48,43.41,26.67,43.31s2.18-12.67,4.54-27.71c4.63-28.75,7.75-47.66,8.61-51.45.38-1.51,1-2.08,2.18-1.7.85.19,16.45,5.2,34.52,11.06s33.1,10.4,33.29,10.21-4.92-11-11.35-24.11l-11.63-23.83,64.4.47c38.68.28,63.74.09,62.6-.47-1-.38-18.63-7.28-39-15.13s-38.68-15-40.57-15.79l-3.4-1.42,41.61-23.83L500,96.93l-4.82-.66c-2.74-.38-25.53-2-50.78-3.59s-47.28-3.12-49-3.4c-2.93-.47-2.08-1.23,29.32-27C466.62,27.8,484.4,13.14,485.53,12.1c1.32-1.23,9.74-4.63-107.05,42.65-27.14,11-49.65,20-50.12,20s-6.9-11.92-14.47-26.48L300.18,21.85l-4.73,4.54c-2.55,2.46-14.85,14-27.24,25.63-20.52,19.2-22.6,20.9-24.11,19.67C238,66.39,154.92,0,154.45,0,154.16,0,154.07.95,154.35,2.08Z"/></svg>');
    background-repeat: no-repeat;
    background-size: 37.5% auto;
    background-position: center center;

    body:global(.is-light) & {
      background-image: url('data:image/svg+xml,<svg fill="%23ffffff" viewBox="0 0 500 284.46" version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg"><path d="M154.35,2.08c.28,1.23,2.93,15.89,5.77,32.53S165.7,66.39,166,68c.47,2.27.28,2.93-.85,2.93-.85,0-22.89-1.32-49-2.84S68.49,65.35,68.3,65.54c-.28.38,36.6,33.48,38.77,34.9.66.38.85.85.66,1-.47.38-75.75,13.43-91.92,16-4.07.57-7.38,1.32-7.38,1.7S25.74,125.4,47,132.3s39.34,12.86,40.38,13.24c2,.85,2.84.38-54.85,28.18-14.56,7-27.9,13.43-29.69,14.19s-3,1.51-2.84,1.7,24.87-2.18,54.75-5.2,54.47-5.39,54.66-5.2-5.58,15.89-12.58,35-12.67,35.18-12.58,35.46S105.37,238,130.81,223s46.34-27.14,46.43-27,5,15.6,10.88,34.33,10.88,34.42,11.25,34.8,12.2-12.58,26.29-28.84,27.42-31.68,29.69-34.14l4.16-4.54,26.38,43.6c14.47,23.93,26.48,43.41,26.67,43.31s2.18-12.67,4.54-27.71c4.63-28.75,7.75-47.66,8.61-51.45.38-1.51,1-2.08,2.18-1.7.85.19,16.45,5.2,34.52,11.06s33.1,10.4,33.29,10.21-4.92-11-11.35-24.11l-11.63-23.83,64.4.47c38.68.28,63.74.09,62.6-.47-1-.38-18.63-7.28-39-15.13s-38.68-15-40.57-15.79l-3.4-1.42,41.61-23.83L500,96.93l-4.82-.66c-2.74-.38-25.53-2-50.78-3.59s-47.28-3.12-49-3.4c-2.93-.47-2.08-1.23,29.32-27C466.62,27.8,484.4,13.14,485.53,12.1c1.32-1.23,9.74-4.63-107.05,42.65-27.14,11-49.65,20-50.12,20s-6.9-11.92-14.47-26.48L300.18,21.85l-4.73,4.54c-2.55,2.46-14.85,14-27.24,25.63-20.52,19.2-22.6,20.9-24.11,19.67C238,66.39,154.92,0,154.45,0,154.16,0,154.07.95,154.35,2.08Z"/></svg>');
    }
  }

  &:hover:before {
    transform: translate3d(0, 0, 0) scale3d(2, 1, 1);
    opacity: 1;
    transition: transform 0.25s ease(out-cubic), opacity 0.25s ease(out-cubic);
  }

  &:after {
    content: "Click!";
    position: absolute;
    inset: 0;
    z-index: 2;
    transform: translate3d(-80%, 0, 0) skew(25deg, 0deg);
    transition: transform 0.15s ease(in-out-quad);

    @media (prefers-reduced-motion) {
      transition: none !important;
    }

    text-transform: uppercase;
    font-size: calc(var(--gutter-size) * 4 + 1rem);
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--display-font);

    @include retro-colored-letters;

    @media screen and (max-aspect-ratio: 12 / 8) {
      transform: translate3d(-90%, 0, 0) skew(25deg, 0deg);
    }

    @media screen and (max-aspect-ratio: 10 / 8) {
      transform: translate3d(-100%, 0, 0) skew(25deg, 0deg);
    }

    @media screen and (orientation: portrait) {
      transform: translate3d(-125%, 0, 0) skew(25deg, 0deg);
    }
  }

  &:hover:after {
    transform: translate3d(0, 0, 0) skew(-20deg, 0);
    transition: transform 0.25s ease(out-back-custom);
  }
}

.title {
  font-family: var(--light-display-font);
  text-transform: uppercase;
  font-weight: normal;
  font-size: 1rem;
  margin: 0;

  opacity: 0;
  transition: opacity 0.35s calc(0.1s + 0.05s * var(--index)) ease(in-quad);

  @media (prefers-reduced-motion) {
    opacity: 1;
    transition: none;
  }

  .root--is-visible & {
    opacity: 1;
  }
}

.stack {
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.5s calc(0.2s + 0.1s * var(--index)) ease(in-quad);

  @media (prefers-reduced-motion) {
    opacity: 1;
    transition: none;
  }

  .root--is-visible & {
    opacity: 1;
  }
}
</style>
