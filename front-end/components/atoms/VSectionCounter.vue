<script lang="ts" setup>
defineProps<{
  section: number;
  reversed?: boolean;
}>();
</script>

<template>
  <div :class="[$style.root, reversed && $style['root--is-reversed']]">
    <span :class="$style.count">{{ section }}.</span>
  </div>
</template>

<style lang="scss" module>
.root {
  position: absolute;
  inset: 0 var(--gutter-size);
  z-index: -1;
  text-align: right;
  pointer-events: none;

  &--is-reversed {
    @media screen and (min-aspect-ratio: 10 / 8) {
      text-align: left;
    }
  }
}

.count {
  position: sticky;
  top: calc(100% - 0.75em - var(--gutter-size));

  display: inline-block;
  font-family: var(--display-font);
  font-weight: normal;
  text-transform: uppercase;
  line-height: 0.75;
  font-size: 20rem;
  opacity: 0.2;
  -webkit-text-stroke: 0.005em var(--foreground-color);
  color: var(--background-color);

  @media screen and (max-aspect-ratio: 10 / 8) {
    font-size: 15rem;
    opacity: 0.1;
    -webkit-text-stroke: 0.01em var(--foreground-color);
  }
}
</style>
