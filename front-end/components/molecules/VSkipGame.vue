<script lang="ts" setup>
const emit = defineEmits(["onSkipGame"]);
const {
  levels,
  features,
  isGameActive,
  currentLevelPoints,
  currentFeaturePoints,
} = useLevelExperience();

const skipGame = () => {
  currentLevelPoints.value = Math.max(
    levels.value[levels.value.length - 1].pointsNeeded,
    currentLevelPoints.value
  );

  currentFeaturePoints.value = Math.max(
    features.value[features.value.length - 1].pointsNeeded,
    currentFeaturePoints.value
  );

  isGameActive.value = false;

  emit("onSkipGame");
};
</script>

<template>
  <div :class="[$style.root, !isGameActive && $style['root--is-inactive']]">
    <p :class="$style.text">Don't want to play the game? Too bad!</p>
    <button @click="skipGame" :disabled="!isGameActive" :class="$style.button">
      Unlock everything
    </button>
  </div>
</template>

<style lang="scss" module>
.root {
  @media (prefers-reduced-motion) {
    display: none;
  }
}

.text {
  margin: 0;
  opacity: 1;
  transition: opacity 0.25s;

  .root--is-inactive & {
    opacity: 0.5;
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}

.button {
  display: inline-block;
  margin: 1em 0 0 0;
  padding: 0.25em 0.5em;
  text-transform: uppercase;
  font: inherit;
  background: var(--background-color);
  border: 2px solid var(--foreground-color);
  color: var(--foreground-color);
  cursor: pointer;
  pointer-events: auto;
  border-radius: 1em;

  transition: background 0.25s, color 0.25s, opacity 0.25s;

  @media (prefers-reduced-motion) {
    transition: none;
  }

  &--is-active,
  &:hover {
    background: var(--foreground-color);
    color: var(--background-color);
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
