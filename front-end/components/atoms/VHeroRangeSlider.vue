<script lang="ts" setup>
const progress = defineModel();

const { currentLevel } = useLevelExperience();

const slider = useTemplateRef("slider");
const { isVisible } = useIsVisible(slider);

const isActive = computed(() => isVisible.value && currentLevel.value < 1);
</script>

<template>
  <div
    :class="[$style.root, isActive && $style['root--is-active']]"
    ref="slider"
  >
    <label for="hero-range" :class="$style.label">Slide to unlock</label>
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
.root {
  //   grid-column: 1 / -1;
  position: absolute;
  bottom: calc(var(--gutter-size) * 2);
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em 0;

  opacity: 0;
  transition: opacity 0.5s 0.25s ease(in-out-quad);
  pointer-events: none;

  &--is-active {
    opacity: 1;
    transition: opacity 0.5s 2s ease(in-out-quad);
    pointer-events: auto;
  }
}

.label {
  display: block;
  font-family: var(--display-font);
  text-transform: uppercase;
  -webkit-text-stroke: 1px var(--background-color);
  font-size: var(--small-font-size);
}

$thumb-size: 0.75em;

.wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.25em;
  border-radius: 1em;
  border: 2px solid var(--foreground-color);
  background: var(--background-color);
  box-sizing: border-box;

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
  }
}

.input {
  display: block;
  width: 7.5rem;
  appearance: none;
  height: $thumb-size;
  font: inherit;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  accent-color: var(--foreground-color);
  cursor: grab;
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
