<script lang="ts" setup>
import { gsap } from "gsap";
import { SplitText } from "gsap/all";
import { useIntersectionObserver } from "@vueuse/core";

const props = defineProps<{
  index: number;
}>();

const content = useTemplateRef("content");
const { isVisible } = useIsVisible(content);

let split: Ref<GSAPTimeline | null> = ref(null);

const isReady = computed(() => isVisible.value && split.value);

watch(isReady, () => {
  if (isReady.value) {
    split.value?.restart(true);
  }
});

const { $isReducedMotion } = useNuxtApp();

onMounted(() => {
  if ($isReducedMotion) return;

  document.fonts.ready.then(() => {
    gsap.set(content.value, { opacity: 1 });

    SplitText.create(content.value, {
      //aria: "hidden",
      type: "words,lines",
      linesClass: "line",
      autoSplit: true,
      smartWrap: true,
      mask: "lines",
      tag: "span",
      onSplit: (self) => {
        split.value = gsap
          .timeline({
            paused: true,
            delay: 0.2 + 0.4 * props.index,
          })
          .from(self.lines, {
            duration: 0.6,
            yPercent: 100,
            opacity: 0,
            stagger: 0.125,
            ease: "expo.out",
            onComplete: () => self.revert(), // revert the element to its original (unsplit) state
          });

        return split.value;
      },
    });
  });
});

onBeforeUnmount(() => {
  split.value?.kill();
});
</script>

<template>
  <p :class="$style.root" ref="content">
    <slot />
  </p>

  <!--
  <p :class="$style['sr-only']">
    <slot />
  </p>
  -->
</template>

<style lang="scss" module>
.root {
  margin: 0 0 1em 0;

  a {
    &:hover {
      text-decoration: none;
    }
  }
}

.sr-only {
  @include sr-only;
}
</style>
<style lang="scss">
.line-mask,
.line {
  display: block;
}
</style>
