<script lang="ts" setup>
import type { GithubContribution } from "~/server/api/github";
import type { WebGPUOpenSourceScene } from "~/scenes/open-source/WebGPUOpenSourceScene";
import { CanvasOpenSourceScene } from "~/scenes/open-source/CanvasOpenSourceScene";

// props and emits
const props = defineProps<{
  contributions: GithubContribution[] | null;
}>();

const emit = defineEmits(["onStart", "onComplete"]);

const { theme } = useTheme();
const { colors } = usePaletteGenerator();
const { addLevelPoints } = useLevelExperience();

const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);

let hasStarted = false;
let isComplete = false;
let scene: WebGPUOpenSourceScene | CanvasOpenSourceScene | null;

onMounted(async () => {
  const { $gpuCurtains, $hasWebGPU, $debugPane } = useNuxtApp();

  const onStarted = () => {
    if (!hasStarted) {
      addLevelPoints(10);
      emit("onStart");
    }

    hasStarted = true;
  };

  const onSceneComplete = () => {
    if (!isComplete) {
      addLevelPoints(20);
      emit("onComplete");
    }

    isComplete = true;
  };

  // If data is still loading when component mounts, wait for it
  if (!props.contributions || !props.contributions.length) {
    // Wait for pending to become false (data loaded)
    await new Promise<void>((resolve) => {
      // One-time watcher that automatically stops after pending becomes false
      const stopWatcher = watch(
        () => !props.contributions || !props.contributions.length,
        (isPending) => {
          if (!isPending) {
            stopWatcher(); // Clean up the watcher
            resolve();
          }
        }
      );
    });
  }

  // At this point, data has loaded
  if ($hasWebGPU && canvas.value) {
    // dynamic webgpu scene import only if supported
    const { WebGPUOpenSourceScene } = await import(
      "~/scenes/open-source/WebGPUOpenSourceScene"
    );

    scene = new WebGPUOpenSourceScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      progress: 1,
      contributions: props.contributions as GithubContribution[],
      colors: colors.value,
      debugPane: $debugPane,
      onStarted: onStarted,
      onSceneComplete: onSceneComplete,
    });

    scene.setSceneVisibility(isVisible.value);
  } else if (canvas.value) {
    scene = new CanvasOpenSourceScene({
      container: canvas.value,
      contributions: props.contributions as GithubContribution[],
      colors: colors.value,
      onStarted: onStarted,
      onSceneComplete: onSceneComplete,
    });
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});

watch(isVisible, () => {
  if (scene) {
    scene.setSceneVisibility(isVisible.value);
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

watch(theme, () => {
  if (scene) {
    scene.setTheme();
  }
});

// toggle instance
const toggleInstance = (index = 0) => {
  if (scene) {
    scene.toggleParticleInstance(index);
  }
};

defineExpose({
  toggleInstance,
});
</script>

<template>
  <div :class="$style.root" ref="canvas"></div>
</template>

<style lang="scss" module>
.root {
  position: absolute;
  inset: 0;

  canvas {
    position: absolute;
    inset: 0;
  }
}
</style>
