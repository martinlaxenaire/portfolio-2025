<script lang="ts" setup>
import { useTimeoutFn } from "@vueuse/core";
const { currentLevelPoints, currentFeaturePoints } = useLevelExperience();

interface PointerPosition {
  x: number;
  y: number;
}

interface ExperiencePoint {
  value: number;
  position: PointerPosition;
  type: "level" | "feature";
}

const pointer: PointerPosition = {
  x: 0,
  y: 0,
};

const onPointerMove = (e: MouseEvent | TouchEvent) => {
  const { clientX, clientY } =
    "targetTouches" in e && e.targetTouches.length
      ? (e.targetTouches[0] as Touch)
      : (e as MouseEvent);

  pointer.x = clientX;
  pointer.y = clientY;
};

const passiveOptions = { passive: true };

onMounted(() => {
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("touchmove", onPointerMove, passiveOptions);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onPointerMove);
  window.removeEventListener(
    "touchmove",
    onPointerMove,
    passiveOptions as unknown as EventListenerOptions
  );
});

const gainedExperience = ref([] as ExperiencePoint[]);

const onExperienceGained = (params: ExperiencePoint) => {
  gainedExperience.value.push(params);

  useTimeoutFn(() => {
    gainedExperience.value.shift();
  }, 2500);
};

watch(currentLevelPoints, (newPoints, oldPoints) => {
  onExperienceGained({
    value: newPoints - oldPoints,
    position: pointer,
    type: "level",
  });
});

watch(currentFeaturePoints, (newPoints, oldPoints) => {
  onExperienceGained({
    value: newPoints - oldPoints,
    position: pointer,
    type: "feature",
  });
});
</script>

<template>
  <span
    :class="[
      $style['gained-experience'],
      $style['gained-experience--is-' + xp.type],
    ]"
    v-for="(xp, i) in gainedExperience"
    :key="i"
    :style="{
      top: xp.position.y + 'px',
      left: xp.position.x + 'px',
      '--scale': 1 + Math.sqrt(xp.value),
    }"
    >+{{ xp.value }}</span
  >
</template>

<style lang="scss" module>
@keyframes xp-animation {
  from {
    transform: translate3d(-50%, -50%, 0)
      scale3d(
        calc(1.125 + var(--scale, 1) * 0.1),
        calc(1.125 + var(--scale, 1) * 0.1),
        1
      );
    opacity: 1;
  }

  to {
    transform: translate3d(-50%, calc(-50% - 2rem), 0)
      scale3d(
        calc(1 + var(--scale, 1) * 0.1),
        calc(1 + var(--scale, 1) * 0.1),
        1
      );
    opacity: 0;
  }
}

.gained-experience {
  position: fixed;
  z-index: 99;
  transform: translate3d(-50%, -50%, 0)
    scale3d(
      calc(1.125 + var(--scale, 1) * 0.1),
      calc(1.125 + var(--scale, 1) * 0.1),
      1
    );
  pointer-events: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 0.6rem;
  width: 2.5em;
  height: 2.5em;
  border-radius: 50%;

  animation: xp-animation 2s 0.05s ease(out-quad) forwards;

  @media (prefers-reduced-motion) {
    animation: none;
    display: none;
  }

  &--is-level {
    background: var(--color-palette-0);

    body:global(.is-light) & {
      background: var(--color-palette-4);
    }
  }

  &--is-feature {
    background: var(--color-palette-1);

    body:global(.is-light) & {
      background: var(--color-palette-3);
    }
  }
}
</style>
