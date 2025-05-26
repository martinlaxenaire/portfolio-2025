<script lang="ts" setup>
const { addFeaturePoints } = useLevelExperience();

const legend = useTemplateRef("legend");

const isLegendVisible = ref(false);
let hasInteracted = false;
const toggleLegend = () => {
  isLegendVisible.value = !isLegendVisible.value;
  if (!hasInteracted && isLegendVisible.value) {
    hasInteracted = true;
    addFeaturePoints(2);
  }
};

const onDocumentClick = (e: MouseEvent) => {
  if (
    isLegendVisible.value &&
    legend.value &&
    !legend.value.contains(e.target as Node)
  ) {
    isLegendVisible.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<template>
  <div
    :class="[$style.root, isLegendVisible && $style['root--is-visible']]"
    class="container grid"
    ref="legend"
  >
    <div :class="$style.wrapper">
      <button :class="$style.toggle" @click="toggleLegend">
        {{ isLegendVisible ? "×" : "i" }}
      </button>

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
  position: absolute;
  bottom: var(--gutter-size);
  width: 100%;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 10;
}

.toggle {
  border: 2px solid var(--foreground-color);
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  position: absolute;
  z-index: 1;
  bottom: 0;
  right: 0;
  border-radius: var(--gutter-size);
  font: inherit;
  color: inherit;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(var(--gutter-size) * 2 - 1px);
  height: calc(var(--gutter-size) * 2 - 1px);
  padding: 0;
  box-sizing: border-box;
}

.wrapper {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;

  grid-column: 9 / 13;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 7 / 13;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 5 / 13;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
  }

  .root--is-visible & {
    pointer-events: auto;
  }
}

.content {
  overflow: hidden;
  position: relative;
  padding: calc(var(--gutter-size) - 2px);
  background: var(--background-color);
  border-radius: var(--gutter-size);
  border: 2px solid var(--foreground-color);
  border-color: transparent;
  box-sizing: border-box;

  width: 0;
  display: grid;
  grid-template-rows: 0fr;

  transition: grid-template-rows 0.25s 0.15s ease(in-out-quad),
    width 0.25s 0.15s ease(in-cubic), border-color 0s 0.4s;

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
  }

  .root--is-visible & {
    width: 100%;
    grid-template-rows: 1fr;
    border-color: var(--foreground-color);
    transition: grid-template-rows 0.25s ease(in-out-quad),
      width 0.25s ease(out-cubic), border-color 0s 0s;
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
}
</style>
