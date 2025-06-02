<script lang="ts" setup>
const props = defineProps<{
  isVisible: boolean;
}>();
</script>

<template>
  <div :class="[$style.root, isVisible && $style['root--is-visible']]">
    <div :class="$style.grid" class="container grid">
      <div v-for="i in 12" :key="i" :class="$style.col"></div>
    </div>
  </div>
</template>

<style lang="scss" module>
.root {
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;

  opacity: 0;
  transition: opacity 0.25s;

  &--is-visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}

.grid {
  height: 100lvh;
}

.col {
  height: 100%;
  background: color-mix(in srgb, var(--color-palette-0) 50%, transparent);

  body:global(.is-light) & {
    background: color-mix(in srgb, var(--color-palette-4) 50%, transparent);
  }
}
</style>
