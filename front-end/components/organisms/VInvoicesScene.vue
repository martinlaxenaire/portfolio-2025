<script lang="ts" setup>
import type { InvoicesData } from "~/server/api/google-sheets";
import type { WebGPUInvoicesScene } from "~/scenes/invoices/WebGPUInvoicesScene";
import { CanvasInvoicesScene } from "~/scenes/invoices/CanvasInvoicesScene";

// props and emits
const props = defineProps<{
  invoicesData: InvoicesData | null;
}>();

const emit = defineEmits(["onStart", "onComplete"]);

const { theme } = useTheme();
const { colors } = usePaletteGenerator();
const { addLevelPoints } = useLevelExperience();

const canvas = useTemplateRef("canvas");
const { isVisible } = useIsVisible(canvas, false);

let hasStarted = false;
let isComplete = false;
let scene: WebGPUInvoicesScene | CanvasInvoicesScene | null;

onMounted(async () => {
  const { $gpuCurtains, $hasWebGPU, $debugPane, $isReducedMotion } =
    useNuxtApp();

  const onStarted = () => {
    if (!hasStarted) {
      addLevelPoints(8);
      emit("onStart");
    }

    hasStarted = true;
  };

  const onSceneComplete = () => {
    if (!isComplete) {
      addLevelPoints(15);
      emit("onComplete");
    }

    isComplete = true;
  };

  // If data is still loading when component mounts, wait for it
  if (!props.invoicesData || !props.invoicesData.length) {
    // Wait for pending to become false (data loaded)
    await new Promise<void>((resolve) => {
      // One-time watcher that automatically stops after pending becomes false
      const stopWatcher = watch(
        () => !props.invoicesData || !props.invoicesData.length,
        (isPending) => {
          if (!isPending) {
            stopWatcher(); // Clean up the watcher
            resolve();
          }
        }
      );
    });
  }

  if ($hasWebGPU && canvas.value) {
    // dynamic webgpu scene import only if supported
    const { WebGPUInvoicesScene } = await import(
      "~/scenes/invoices/WebGPUInvoicesScene"
    );

    scene = new WebGPUInvoicesScene({
      gpuCurtains: $gpuCurtains,
      container: canvas.value,
      invoices: props.invoicesData as InvoicesData,
      colors: colors.value,
      theme: theme.value,
      debugPane: $debugPane,
      onStarted: onStarted,
      onAttractionComplete: onSceneComplete,
    });

    scene.setSceneVisibility(isVisible.value);
  } else if (canvas.value) {
    scene = new CanvasInvoicesScene({
      container: canvas.value,
      invoices: props.invoicesData as InvoicesData,
      colors: colors.value,
      isReducedMotion: $isReducedMotion,
      onStarted: onStarted,
      onAttractionComplete: onSceneComplete,
    });
  }
});

onBeforeUnmount(() => {
  if (scene) {
    scene.destroy();
  }
});

watch(isVisible, (newValue) => {
  if (scene) {
    scene.setSceneVisibility(newValue);
  }
});

watch(colors, () => {
  if (scene) {
    scene.setColors(colors.value);
  }
});

watch(theme, (newValue) => {
  if (scene) {
    scene.updateTheme(newValue);
  }
});
</script>

<template>
  <div :class="$style.root" ref="canvas"></div>
</template>

<style lang="scss" module>
.root {
  position: absolute;
  inset: 0;
  cursor: grab;
}
</style>
