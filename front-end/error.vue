<script setup lang="ts">
import { WebGPU404Scene } from "./scenes/404/WebGPU404Scene";
import type { NuxtError } from "#app";

const props = defineProps({
  error: Object as () => NuxtError,
});

const container = useTemplateRef("container");
const { isVisible } = useIsVisible(container);

const canvas = useTemplateRef("canvas");
const { $hasWebGPU, $gpuCurtains } = useNuxtApp();
const { colors } = usePaletteGenerator();
const { theme } = useTheme();

let scene: WebGPU404Scene | null = null;

onMounted(() => {
  if ($hasWebGPU && canvas.value) {
    scene = new WebGPU404Scene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value as HTMLElement,
      colors: colors.value,
    });
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

watch(theme, () => {
  if (scene) {
    scene.setBgColor();
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});
</script>

<template>
  <NuxtLayout>
    <div
      :class="[$style.root, isVisible && $style['root--is-visible']]"
      ref="container"
    >
      <div :class="$style.content">
        <div class="container grid">
          <h1 :class="$style.title">
            <VAnimatedTextByLetters :label="error?.statusCode.toString()" />
          </h1>
        </div>
        <NuxtLink to="/" :class="$style.link">Go back home</NuxtLink>
      </div>
    </div>
    <div :class="$style.canvas" ref="canvas"></div>
  </NuxtLayout>
</template>

<style lang="scss" module>
.root {
  padding-top: 3.2rem;
  box-sizing: border-box;
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  overflow: hidden;
  overscroll-behavior: contain;

  a {
    color: inherit;
  }
}

.content {
  position: relative;
  z-index: 1;
}

.title {
  @include main-title;
  grid-column: 1 / -1;
  margin-bottom: 3rem;
}

.link {
  display: inline-block;
  margin: 1em 0 0 0;
  padding: 0.25em 0.5em;
  text-transform: uppercase;
  background: var(--background-color);
  border: 2px solid var(--foreground-color);
  color: var(--foreground-color);
  border-radius: 1em;
  text-decoration: none;
  opacity: 0;
  pointer-events: none;

  transition: background 0.25s, color 0.25s, opacity 0.5s 0.5s;

  .root--is-visible & {
    opacity: 1;
    pointer-events: auto;
  }

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  &:focus-visible,
  &:hover {
    background: var(--foreground-color);
    color: var(--background-color);
  }
}

.canvas {
  position: absolute;
  inset: 0;
}
</style>
