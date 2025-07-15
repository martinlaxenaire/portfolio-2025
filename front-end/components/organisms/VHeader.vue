<script lang="ts" setup>
const { currentFeature } = useLevelExperience();

const { $isReducedMotion } = useNuxtApp();
const isReducedMotion = ref($isReducedMotion);

const header = useTemplateRef("header");

const { isVisible } = useIsVisible(header);
</script>

<template>
  <header
    :class="[$style.root, isVisible && $style['root--is-visible']]"
    ref="header"
  >
    <div class="container">
      <div :class="$style.inner">
        <nav :class="$style.nav">
          <VHeaderSiteTitleLink />
        </nav>

        <div :class="$style.display">
          <ClientOnly>
            <Transition
              appear
              :enter-active-class="$style['header-element-enter-active']"
              :leave-active-class="$style['header-element-leave-active']"
              :enter-from-class="$style['header-element-enter-from']"
              :leave-to-class="$style['header-element-leave-to']"
            >
              <div
                :class="$style.palette"
                v-if="currentFeature >= 3 || isReducedMotion"
              >
                <VColorPaletteButton />
              </div>
            </Transition>

            <Transition
              appear
              :enter-active-class="$style['header-element-enter-active']"
              :leave-active-class="$style['header-element-leave-active']"
              :enter-from-class="$style['header-element-enter-from']"
              :leave-to-class="$style['header-element-leave-to']"
            >
              <div
                v-if="currentFeature >= 2 || isReducedMotion"
                :class="$style['theme-switcher']"
              >
                <VThemeSwitcher />
              </div>
            </Transition>
          </ClientOnly>

          <Transition
            appear
            :enter-active-class="$style['header-element-enter-active']"
            :leave-active-class="$style['header-element-leave-active']"
            :enter-from-class="$style['header-element-enter-from']"
            :leave-to-class="$style['header-element-leave-to']"
          >
            <div
              :class="$style['source-code']"
              v-show="currentFeature >= 1 || isReducedMotion"
            >
              <VSourceCodeLink />
            </div>
          </Transition>

          <ClientOnly>
            <div :class="$style.level">
              <VLevelManager />
            </div>
          </ClientOnly>
        </div>
      </div>
    </div>
  </header>
</template>

<style module lang="scss">
.root {
  position: fixed;
  z-index: 2;
  right: 0;
  left: 0;
  pointer-events: none;
}

.inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.nav {
  font-family: var(--display-font);
  text-transform: uppercase;
  flex-shrink: 1;

  transform: translate3d(0, -100%, 0);
  opacity: 0;
  transition: transform 0.35s ease(out-cubic), opacity 0.35s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }

  .root--is-visible & {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

.display {
  display: flex;
  gap: 0 1rem;
  flex-shrink: 1;
}

.header-element-enter-active,
.header-element-leave-active {
  transform: translate3d(0, 0, 0);
  opacity: 1;

  transition: transform 0.35s ease(out-cubic), opacity 0.35s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.header-element-enter-from,
.header-element-leave-to {
  transform: translate3d(0, -100%, 0);
  opacity: 0;
}

.palette {
  margin: 0 0.75rem 0 0;

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.theme-switcher {
  display: flex;
  align-items: center;

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.level {
  opacity: 0;
  transition: opacity 0.35s 0.15s ease(in-quad);

  @media (prefers-reduced-motion) {
    display: none;
    transition: none !important;
  }

  .root--is-visible & {
    opacity: 1;
  }
}
</style>
