<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    isVisible: boolean;
  }>(),
  {
    isVisible: false,
  }
);

const expandableLevelLegend = useTemplateRef("expandableLevelLegend");

defineExpose({
  expandableLevelLegend,
});
</script>

<template>
  <div
    :class="[$style.root, isVisible && $style['root--is-visible']]"
    class="container grid"
    ref="expandableLevelLegend"
  >
    <div :class="$style.wrapper">
      <div :class="$style.content">
        <div :class="$style.inner">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  pointer-events: none;
  margin-bottom: 0;

  transition: margin 0.4s;

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
  }

  &--is-visible {
    margin-bottom: 0.5em;
  }
}

.toggle {
  border: 2px solid var(--foreground-color);
  background: transparent;
  cursor: pointer;
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  border-radius: var(--gutter-size);
  font: inherit;
  color: inherit;
  display: block;
  width: calc(var(--gutter-size) * 2);
  height: calc(var(--gutter-size) * 2);
  padding: 0;
  box-sizing: border-box;
  line-height: 1;
}

.wrapper {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;

  grid-column: 17 / 25;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 7 / 13;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 5 / 13;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
  }
}

.content {
  overflow: hidden;
  position: relative;
  background: var(--background-color);
  border-radius: var(--gutter-size);
  border: 0px solid var(--foreground-color);
  padding: 0;
  border-color: var(--foreground-color);
  box-sizing: border-box;

  width: 0;
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;

  transition: grid-template-rows 0.25s 0.15s ease(in-out-quad),
    width 0.25s 0.15s ease(in-cubic), opacity 0.05s 0.35s,
    border-width 0.05s 0.35s, padding 0.05s 0.35s;

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
  }

  .root--is-visible & {
    opacity: 1;
    padding: calc(var(--gutter-size) - 2px);
    width: 100%;
    border-width: 2px;
    grid-template-rows: 1fr;

    transition: grid-template-rows 0.25s ease(in-out-quad),
      width 0.25s ease(out-cubic), opacity 0.05s 0s, border-width 0.05s 0s,
      padding 0.05s 0s;
  }
}

.inner {
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.25s ease(out-cubic);

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
  }

  .root--is-visible & {
    opacity: 1;
    transition: opacity 0.25s 0.25s ease(in-cubic);
  }

  p {
    margin: 0 0 1em 0;
  }
}
</style>
