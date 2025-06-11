<template>
  <svg viewBox="0 0 40 20" :class="$style.root">
    <path
      d="M 2 2 L 20 18 L 38 2"
      fill="transparent"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="$style.path"
    />
  </svg>
</template>

<style lang="scss" module>
@keyframes arrow-animation {
  0% {
    transform: translate3d(0, -25%, 0);
    opacity: 0;
  }

  50% {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }

  100% {
    transform: translate3d(0, 25%, 0);
    opacity: 0;
  }
}

.root {
  display: block;

  animation: arrow-animation 1.5s ease(in-out-quad) infinite;

  @media (prefers-reduced-motion) {
    animation: none;
  }
}

.path {
  stroke: var(--foreground-color);
  stroke-width: 0.1rem;
  filter: drop-shadow(0.075rem 0.0325rem var(--background-color));
}
</style>
