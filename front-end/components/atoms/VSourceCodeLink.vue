<script lang="ts" setup></script>

<template>
  <a
    href="https://github.com/martinlaxenaire/portfolio-2025"
    target="_blank"
    rel="noopener"
    :class="$style.root"
  >
    &lt;/&gt;
  </a>
</template>

<style lang="scss" module>
.root {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.5rem;
  font-weight: bold;
  text-decoration: none;
  border: 2px solid var(--foreground-color);
  color: var(--foreground-color);
  background: var(--background-color);
  border-radius: 50%;
  pointer-events: auto;

  transition: background 0.35s, color 0.35s;

  &:hover,
  &:focus-visible {
    color: var(--background-color);
    background: var(--foreground-color);
  }

  @media (prefers-reduced-motion) {
    transition: none;
  }
}
</style>
