<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { useTimeoutFn } from "@vueuse/core";
import { UIElements } from "~/assets/static-data/ui-elements";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["openSourceTitle"];
  description?: NonNullable<HomeQueryResult>["openSourceDescription"];
  legend?: NonNullable<HomeQueryResult>["openSourceLegend"];
}>();

const { currentLevel, addFeaturePoints } = useLevelExperience();

const hasStarted = ref(true);
const showCompleted = ref(false);

// avoid hydration mismatch
onMounted(() => {
  hasStarted.value = false;
});

const onStart = () => {
  hasStarted.value = true;
};

const onComplete = () => {
  showCompleted.value = true;

  useTimeoutFn(() => {
    showCompleted.value = false;
  }, 3500);
};

const { data } = await useFetch("/api/github");

const contributions = ref(
  data.value
    ? [...data.value]
        .sort((a, b) => b.count - a.count)
        .map((c) => {
          return { ...c, isActive: true };
        })
    : []
);

const openSourceScene = useTemplateRef("openSourceScene");
let hasToggled = false;

const toggleInstance = (index = 0) => {
  const nbActiveContributions = contributions.value.filter((c) => !!c.isActive);

  if (nbActiveContributions.length <= 1 && contributions.value[index].isActive)
    return;

  if (!hasToggled) {
    addFeaturePoints(5);

    umTrackEvent("UI", {
      name: "Used open source filters",
    });
  }

  hasToggled = true;

  contributions.value[index].isActive = !contributions.value[index].isActive;

  if (openSourceScene.value) {
    openSourceScene.value.toggleInstance(index);
  }
};
</script>

<template>
  <div :class="$style.root" ref="container">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div :class="$style.intro" class="container grid">
      <VSectionCounter
        :section="3"
        :class="$style['section-counter']"
        :reversed="true"
      />
      <div :class="$style.description" v-if="description">
        <!-- @vue-ignore -->
        <VSanityBlock :content="description" />
      </div>
    </div>

    <div :class="$style.content" class="container grid">
      <h2 :class="$style.title" v-if="title">
        <VAnimatedTextByLetters :align="'center'" :label="title" />
      </h2>

      <div :class="$style['middle-separator']">
        <VCanvasSeparator />
      </div>
    </div>

    <div :class="$style.experiment">
      <div :class="$style.wrapper">
        <Transition appear name="instant-in-fade-out">
          <div v-if="!hasStarted" :class="$style.guideline">
            <VAnimatedTextByLetters
              :label="UIElements.openSource.guideline"
              :animate-colors="false"
            />
          </div>
        </Transition>

        <Transition appear name="instant-in-fade-out">
          <div v-if="showCompleted" :class="$style.congratulations">
            <VAnimatedTextByLetters
              :label="UIElements.openSource.completed"
              :animate-colors="false"
            />
          </div>
        </Transition>

        <LazyVOpenSourceScene
          ref="openSourceScene"
          v-if="currentLevel >= 3"
          :contributions="data"
          @on-start="onStart"
          @on-complete="onComplete"
        />

        <VExpandableLegend :class="$style.legend" label="open source scene">
          <div :class="$style['legend-description']" v-if="legend">
            <!-- @vue-ignore -->
            <SanityContent :blocks="legend" />
          </div>

          <ul :class="$style['legend-list']">
            <li
              v-for="(contribution, i) in contributions"
              :key="i"
              :class="[
                $style.contribution,
                $style['contribution--is-' + i],
                contribution.isActive && $style['contribution--is-active'],
              ]"
            >
              <button
                @click="toggleInstance(i)"
                :class="$style['contribution-button']"
              >
                <span :class="$style['contribution-label']">
                  {{ contribution.label }}:
                </span>
                <span :class="$style['contribution-count']">
                  {{ contribution.count }}
                </span>
              </button>
            </li>
          </ul>
        </VExpandableLegend>

        <LazyVScrollToContinue hydrate-on-idle :level="4" />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
}

.top-separator {
  @include bottom-separator;
  top: 0;
}

.intro {
  position: relative;
  z-index: 1;
  padding-top: calc(var(--height-space) + 3rem);
  padding-bottom: 3rem;
  margin-bottom: 3rem;
}

.content {
  position: relative;
  z-index: 1;
  margin-bottom: calc(var(--height-space) * 0.5);
}

.section-counter {
  inset: calc(var(--height-space) + 6rem) var(--gutter-size) 6rem
    var(--gutter-size);
}

.title {
  @include section-title;
  grid-column: 7 / 19;

  @media screen and (max-aspect-ratio: 14 / 8) {
    grid-column: 5 / 21;
  }

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 2 / 12;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 1 / -1;
  }
}

.description {
  @include right-column-text;
}

.middle-separator {
  @include top-separator;
  top: auto;
  bottom: calc(var(--height-space) * -0.5);
}

.experiment {
  position: relative;
  height: 200lvh;
}

.wrapper {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  height: 100lvh;
}

.guideline {
  @include interaction-title;
}

.congratulations {
  @include interaction-title;
}

.legend {
  h3 {
    font-family: var(--light-display-font);
    font-weight: normal;
    text-transform: uppercase;
    font-size: 1em;
    margin: 0 0 0.5em 0;
  }

  p:last-child {
    margin-bottom: 0;
  }

  &-list {
    padding: var(--gutter-size) calc(var(--gutter-size) * 2) 0 0;
    list-style: none;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--gutter-size);
    font-size: 0.8rem;
  }
}

.contribution {
  opacity: 0.5;
  transition: opacity 0.15s ease-out;

  @media (prefers-reduced-motion) {
    transition: none;
  }

  &--is-active {
    opacity: 1;
  }

  &-button {
    display: inline-flex;
    align-items: center;
    gap: 0 0.25em;
    margin: 0;
    padding: 0;
    background: transparent;
    font: inherit;
    color: inherit;
    border: none;
    cursor: pointer;
  }

  &-label {
    display: inline-flex;
    align-items: center;
    gap: 0 0.25em;
    position: relative;

    &:before {
      content: "";
      width: 2em;
      height: 1em;
      display: inline-block;
      border: 2px solid var(--foreground-color);
      border-radius: 1em;
      margin-right: 0.25em;
    }

    &:after {
      content: "";
      position: absolute;
      width: 0.75em;
      height: 0.75em;
      display: inline-block;
      border-radius: 50%;
      top: 50%;
      left: 0;
      border: 2px solid var(--foreground-color);
      box-sizing: border-box;
      transform: translate3d(calc(0.125em + 2px), -50%, 0);
      transition: transform 0.15s ease-out;

      @media (prefers-reduced-motion) {
        transition: none;
      }

      .contribution--is-active & {
        transform: translate3d(calc(2em - 100%), -50%, 0);
      }
    }
  }

  @for $i from 1 through 6 {
    &:nth-child(#{$i}) {
      .contribution-label:after {
        background-color: var(--color-palette-#{($i - 1)});
      }
    }
  }
}
</style>
