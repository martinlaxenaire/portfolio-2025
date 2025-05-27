<script lang="ts" setup>
import { CanvasFaviconScene } from "~/scenes/favicon/CanvasFaviconScene";

// favicon
const { colors } = usePaletteGenerator();

let faviconScene: CanvasFaviconScene | null;

onMounted(() => {
  faviconScene = new CanvasFaviconScene({
    container: document.body as HTMLElement, // whatever
    colors: colors.value,
  });
});

watch(colors, () => {
  if (faviconScene) {
    faviconScene.setColors(colors.value);
  }
});
</script>

<template>
  <VHeader />

  <main>
    <slot />
  </main>

  <div id="debug" :class="$style.debug" />
</template>

<style lang="scss" module>
.debug {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 9999;
}
</style>
