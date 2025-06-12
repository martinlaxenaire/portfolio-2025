<script lang="ts" setup>
import { gsap } from "gsap";
import { UIElements } from "~/assets/static-data/ui-elements";

const { isGameActive, currentLevel, addFeaturePoints } = useLevelExperience();
const isActive = ref(false);

watch(currentLevel, () => {
  if (isGameActive.value && currentLevel.value > 0) {
    isActive.value = true;
  }
});

let onScrollHanlder: null | (() => void) = null;
let lastScrollDelta = 0;
let scroll = 0;

const passiveOptions = { passive: true };

onMounted(() => {
  onScrollHanlder = () => {
    const newScroll = window.pageYOffset;
    if (isActive.value) lastScrollDelta += newScroll - scroll;
    scroll = newScroll;

    if (lastScrollDelta > 300 && isActive.value) {
      isActive.value = false;
      lastScrollDelta = 0;
    }
  };

  window.addEventListener("scroll", onScrollHanlder, passiveOptions);
});

onBeforeUnmount(() => {
  if (onScrollHanlder) {
    window.removeEventListener(
      "scroll",
      onScrollHanlder,
      passiveOptions as unknown as EventListenerOptions
    );
  }
});

let tween: GSAPTween | null = null;

const onClick = () => {
  const section = document.querySelector("#level-" + currentLevel.value);

  if (section) {
    addFeaturePoints(currentLevel.value);

    const boundingRect = section.getBoundingClientRect();

    const currentScroll = {
      value: window.pageYOffset,
    };

    tween = gsap.to(currentScroll, {
      value: currentScroll.value + boundingRect.top,
      duration: 1.25,
      ease: "circ.inOut",
      onUpdate: () => {
        window.scrollTo(0, currentScroll.value);
      },
    });
  }
};

onBeforeUnmount(() => {
  tween?.kill();
});
</script>

<template>
  <Transition
    appear
    :enter-active-class="$style['scroll-enter-active']"
    :leave-active-class="$style['scroll-leave-active']"
    :enter-from-class="$style['scroll-enter-from']"
    :leave-to-class="$style['scroll-leave-to']"
  >
    <button :class="$style.root" v-if="isActive" @click="onClick">
      <span :class="$style.label">
        {{ UIElements.game.scrollToContinue }}
      </span>
      <VAnimatedArrow :class="$style.arrow" />
    </button>
  </Transition>
</template>

<style lang="scss" module>
.root {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  position: fixed;
  z-index: 5;
  left: 50%;
  bottom: calc(var(--gutter-size) * 2);
  transform: translate3d(-50%, 0, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5em 0;
  font-family: var(--display-font);
  font-size: var(--small-font-size);

  @media (prefers-reduced-motion) {
    display: none;
  }
}

.scroll-enter-active,
.scroll-leave-active {
  opacity: 1;

  transition: opacity 0.5s 0.65s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.scroll-enter-from,
.scroll-leave-to {
  opacity: 0;
  transition: opacity 0.5s 0s ease(in-quad);
}

.label {
  text-transform: uppercase;
  -webkit-text-stroke: 1px var(--background-color);
}

.arrow {
  width: 1.5rem;
  height: auto;
}
</style>
