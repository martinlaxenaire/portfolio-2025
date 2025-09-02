<script lang="ts" setup>
import { UIElements } from "~/assets/static-data/ui-elements";

const { theme } = useTheme();
const { generatePalette } = usePaletteGenerator();
const { addFeaturePoints } = useLevelExperience();

let firstPaletteClick = false;

const onPaletteClick = () => {
  generatePalette();

  if (!firstPaletteClick) {
    firstPaletteClick = true;
    addFeaturePoints(3);
  }

  if (import.meta.client) {
    umTrackEvent("UX", {
      name: "Generated new color palette",
    });
  }
};

watch(theme, () => {
  generatePalette(false);
});
</script>

<template>
  <button @click="onPaletteClick" :class="$style.root">
    <span :class="$style.label">
      <span>{{ UIElements.header.colorPaletteButton }}</span>
    </span>
  </button>
</template>

<style lang="scss" module>
.root {
  display: inline-flex;
  height: 100%;
  align-items: center;
  background: none;
  border: 0;

  font: inherit;
  pointer-events: none;
  padding: 0;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    pointer-events: auto;
  }
}

.label {
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

    .root:hover &,
    .root:focus-visible & {
      transform: scale3d(1, 1, 1);
      border-color: var(--foreground-color);
      background-color: var(--background-color);
      color: var(--foreground-color);
      transition: transform 0.25s ease(out-expo),
        border-color 0.1s ease(out-quad), background-color 0.1s ease(out-quad),
        color 0.2s 0.05s ease(in-quad);
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
    backface-visibility: hidden;
    will-change: transform;

    transition: transform 0.25s ease(in-out-quad),
      border-width 0.25s ease(in-out-quad);

    @media (prefers-reduced-motion: reduce) {
      transition: none !important;
    }

    .root:hover &,
    .root:focus-visible & {
      transform: translate3d(0, -50%, 0) scale3d(1.35, 1.35, 1) rotateZ(360deg);
      border-width: calc(2px / 1.35);

      transition: transform 0.25s ease(out-quart),
        border-width 0.25s ease(out-quart);
    }
  }
}
</style>
