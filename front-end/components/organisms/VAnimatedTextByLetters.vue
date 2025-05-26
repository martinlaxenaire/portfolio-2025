<script lang="ts" setup>
import { gsap } from "gsap";

const {
  label = "",
  align = "left",
  timelineDelay = 0.2,
  duration = 0.65,
  stagger = 0.0375,
  ease = "power3.out",
  nbCharsDelay = 2,
  onComplete = () => {},
} = defineProps<{
  label?: string;
  align?: "center" | "left" | "right";
  timelineDelay?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  nbCharsDelay?: number;
  onComplete?: () => void;
}>();

const words = computed(() => {
  return label.split(" ");
});

const getChars = (word: string = "") => {
  return word.match(/[\u200C]?.[\u200C]?/gu) || [];
};

const container = useTemplateRef("container");
const chars = useTemplateRef("chars");
const { isVisible } = useIsVisible(container);
const isComplete = ref(false);

const playTimeline = computed(() => {
  return isVisible.value && chars.value?.length;
});

const { theme } = useTheme();
// non reactive
//const themeValue = theme.value;

const { colors } = usePaletteGenerator();

const timeline = gsap.timeline({
  paused: true,
  onComplete: () => {
    timeline.clear();
    onComplete();
  },
});

onMounted(() => {
  // non reactive
  const themeValue = theme.value;

  let tweenDuration = duration;
  let tweenStagger = stagger;
  let tlDelay = timelineDelay;

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: reduce)", () => {
    tweenDuration = 0;
    tweenStagger = 0;
    tlDelay = 0;
  });

  const initTimeline = () => {
    timeline.delay(tlDelay);
    //timeline.timeScale(0.1);

    const endColor = window
      .getComputedStyle(document.body)
      .getPropertyValue("--foreground-color");

    const hexColors: string[] = colors.value.map((c) => c.hex);

    if (themeValue === "light") {
      hexColors.reverse();
    }

    hexColors.push(endColor);

    timeline.kill();

    timeline
      .set(chars.value, { autoAlpha: 0, color: hexColors[0], scale: 0.9 })
      .to(chars.value, {
        autoAlpha: 1,
        duration: tweenDuration,
        stagger: tweenStagger,
        ease,
      });

    for (let i = 1; i < hexColors.length; i++) {
      timeline.to(
        chars.value,
        {
          color: hexColors[i],
          duration: tweenDuration,
          stagger: tweenStagger,
          ease,
        },
        i * tweenStagger * nbCharsDelay
      );
    }

    const popinDuration = tweenDuration * 0.5;

    timeline
      .to(
        chars.value,
        {
          scale: 1.25,
          rotateZ: -2.5,
          duration: popinDuration,
          ease: "power3.out",
          stagger: tweenStagger,
        },
        0.05
      )
      .to(
        chars.value,
        {
          scale: 1,
          rotateZ: 0,
          duration: popinDuration,
          ease: "power2.out",
          stagger: tweenStagger,
        },
        popinDuration + 0.05
      );

    timeline
      .call(() => {
        isComplete.value = true;
      })
      .set(chars.value, {
        clearProps: "all",
      });
  };

  watch(playTimeline, () => {
    if (playTimeline.value) {
      initTimeline();
      timeline.restart(true);
    }
  });
});

onBeforeUnmount(() => {
  timeline.kill();
});
</script>

<template>
  <span
    :class="[
      $style.root,
      $style['root--is-' + align],
      isComplete && $style['root--is-complete'],
    ]"
    ref="container"
  >
    <span :class="$style.original">
      {{ label }}
    </span>

    <ClientOnly>
      <span :class="$style.animated" aria-hidden="true">
        <span
          :class="$style['animated-word']"
          v-for="(word, wordIndex) in words"
          :key="wordIndex"
        >
          <span
            v-for="(char, charIndex) in getChars(word)"
            :key="charIndex"
            :class="$style['animated-char']"
            ref="chars"
            :data-char="char"
          >
            {{ char }}
          </span>
        </span>
      </span>
    </ClientOnly>
  </span>
</template>

<style module lang="scss">
.root {
  position: relative;
  display: inline-block;

  // font kerning
  [data-char="a"] + [data-char="y"] {
    margin-left: -0.25em;
  }

  [data-char="s"] + [data-char="y"],
  [data-char="r"] + [data-char="y"],
  [data-char="y"] + [data-char="o"],
  [data-char="a"] + [data-char="t"],
  [data-char="p"] + [data-char="a"],
  [data-char="a"] + [data-char="w"],
  [data-char="c"] + [data-char="a"] {
    margin-left: -0.125em;
  }

  [data-char="o"] + [data-char="w"],
  [data-char="k"] + [data-char="s"],
  [data-char="a"] + [data-char="s"] {
    margin-left: -0.075em;
  }

  [data-char="b"] + [data-char="u"],
  [data-char="y"] + [data-char="f"] {
    margin-left: -0.025em;
  }
}

.original {
  display: none;
  // debug positions
  // position: absolute;
  // opacity: 0.2;

  @media (prefers-reduced-motion) {
    display: inline;
  }
}

.animated {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin: 0 0 0 -0.175em;
  gap: 0 0.4em;
  width: calc(100% + 0.37em);

  @media (prefers-reduced-motion) {
    display: none;
  }

  .root--is-center & {
    justify-content: center;
  }

  .root--is-right & {
    justify-content: flex-end;
  }

  &-word {
    white-space: pre;
    //padding: 0 0.37em 0 0;
    display: inline-block;
    font-kerning: none;
    white-space-collapse: preserve;

    // .root--is-center & {
    //   padding: 0 0.185em;
    // }

    // .root--is-right & {
    //   padding: 0 0 0 0.37em;
    // }
  }

  &-char {
    opacity: 0;
    display: inline-block;
    will-change: transform;

    .root--is-complete & {
      opacity: 1;
    }
  }
}
</style>
