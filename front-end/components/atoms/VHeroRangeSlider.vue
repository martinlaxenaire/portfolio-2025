<script lang="ts" setup>
import type { ModelRef } from "vue";
import { UIElements } from "~/assets/static-data/ui-elements";

const props = defineProps<{
  isVisible: boolean;
}>();

const progress: ModelRef<number | undefined> = defineModel();

const { currentLevel } = useLevelExperience();

const isActive = computed(() => props.isVisible && currentLevel.value < 1);
</script>

<template>
  <div :class="[$style.root, isActive && $style['root--is-active']]">
    <label for="hero-range" :class="$style.label">
      {{ UIElements.hero.guideline }}
    </label>
    <span :class="$style.wrapper" :style="{ '--progress': progress }">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :class="$style.input"
        id="hero-range"
        v-model="progress"
      />
    </span>
  </div>
</template>

<style lang="scss" module>
$thumb-size: 0.75em;

.root {
  position: absolute;
  bottom: calc(var(--gutter-size) * 2);
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em 0;

  pointer-events: none;

  &--is-active {
    pointer-events: auto;
  }
}

.label {
  display: block;
  font-family: var(--display-font);
  text-transform: uppercase;
  -webkit-text-stroke: 1px var(--background-color);
  font-size: var(--small-font-size);

  opacity: 0;
  transition: opacity 0.35s 0.25s ease(in-out-quad);

  .root--is-active & {
    opacity: 1;
    transition: opacity 0.35s 0s ease(in-out-quad);
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}

.wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 0.25em;
  border-radius: 1em;
  border: 2px solid var(--foreground-color);
  background: var(--background-color);
  box-sizing: border-box;
  align-self: flex-start;

  opacity: 0;
  width: calc(#{$thumb-size} + 0.5em + 4px);
  transition: opacity 0.35s 0.25s ease(in-out-quad), width 0s 1s;

  .root--is-active & {
    opacity: 1;
    width: 100%;
    transition: opacity 0.35s 0.25s ease(in-out-quad),
      width 0.75s 0.25s ease(out-expo);
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }

  &:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 0.25em;
    transform: translate3d(0, -50%, 0);
    pointer-events: none;
    border-radius: calc(#{$thumb-size} * 0.5);
    width: calc(
      #{$thumb-size} + (100% - 0.5em - #{$thumb-size}) * var(--progress, 0)
    );
    height: $thumb-size;
    background: var(--foreground-color);

    opacity: 0;
    transition: opacity 0.35s 0.25s ease(in-out-quad);

    .root--is-active & {
      opacity: 1;
      transition: opacity 0.35s 0.5s ease(in-out-quad);
    }

    @media (prefers-reduced-motion) {
      transition: none;
    }
  }
}

.input {
  display: block;
  width: 7.5rem;
  appearance: none;
  height: calc(#{$thumb-size} + 0.25em * 2);

  font: inherit;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  accent-color: var(--foreground-color);
  cursor: grab;

  opacity: 0;
  transition: opacity 0.35s 0.25s ease(in-out-quad);

  .root--is-active & {
    opacity: 1;
    transition: opacity 0.35s 2.5s ease(in-out-quad);
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  background: var(--foreground-color);
  border-color: var(--foreground-color);
  border-radius: calc(#{$thumb-size} * 0.5);
  box-sizing: border-box;
  width: $thumb-size;
  height: $thumb-size;
}

input[type="range"]::-moz-range-thumb {
  appearance: none;
  -webkit-appearance: none;
  background: var(--foreground-color);
  border-color: var(--foreground-color);
  border-radius: calc(#{$thumb-size} * 0.5);
  box-sizing: border-box;
  width: $thumb-size;
  height: $thumb-size;
}
</style>
