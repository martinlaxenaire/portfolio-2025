<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { useTimeoutFn } from "@vueuse/core";
import { UIElements } from "~/assets/static-data/ui-elements";

const props = defineProps<{
  process?: NonNullable<HomeQueryResult>["processDescription"];
  title?: NonNullable<HomeQueryResult>["invoicesTitle"];
  description?: NonNullable<HomeQueryResult>["invoicesDescription"];
}>();

const { currentLevel } = useLevelExperience();

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

const { data } = await useFetch("/api/google-sheets");

const invoices: ComputedRef<string[]> = computed(() => {
  return data.value?.flat() || [];
});

// TODO that's a bit dirty
const parsedDescription = computed(() => {
  return props.description?.map((block) => {
    block.children = block.children?.map((c) => {
      c.text = c.text?.replace(
        "#{nbInvoices}",
        invoices.value.length.toString()
      );
      return c;
    });

    return block;
  });
});
</script>

<template>
  <div :class="$style.root" id="invoices">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div class="container grid" v-if="process">
      <div :class="$style.process">
        <!-- @vue-ignore -->
        <VSanityBlock :content="process" />
      </div>
    </div>

    <div v-if="title" class="container grid">
      <h2 :class="$style.title">
        <VAnimatedTextByLetters :label="title" :align="'center'" />
      </h2>
    </div>

    <div :class="$style['invoices-xp']">
      <div :class="$style.wrapper">
        <div :class="$style['middle-separator']">
          <VCanvasSeparator />
        </div>

        <Transition appear name="instant-in-fade-out">
          <div v-if="!hasStarted" :class="$style.guideline">
            <VAnimatedTextByLetters
              :label="UIElements.invoices.guideline"
              :animate-colors="false"
            />
          </div>
        </Transition>

        <Transition appear name="instant-in-fade-out">
          <div v-if="showCompleted" :class="$style.congratulations">
            <VAnimatedTextByLetters
              :label="UIElements.invoices.completed"
              :animate-colors="false"
            />
          </div>
        </Transition>

        <VExpandableLegend :class="$style.legend">
          <div :class="$style['legend-desc']" v-if="description">
            <!-- @vue-ignore -->
            <SanityContent :blocks="parsedDescription" />
          </div>
        </VExpandableLegend>

        <LazyVInvoicesScene
          v-if="currentLevel >= 2"
          :invoices-data="data"
          @on-start="onStart"
          @on-complete="onComplete"
        />

        <LazyVScrollToContinue hydrate-on-idle :level="3" />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  position: relative;
  padding-top: calc(var(--height-space) + 3rem);
}

.top-separator {
  @include bottom-separator;
  bottom: auto;
  top: 0;
}

.process {
  @include left-column-text;
}

.title {
  position: relative;
  z-index: 1;
  grid-column: 7 / 19;
  @include section-title;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 4 / 10;
  }

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.invoices-xp {
  height: 200lvh;
  position: relative;
}

.wrapper {
  position: sticky;

  top: 0;
  height: 100lvh;
  margin: calc(var(--height-space) * 0.5) 0 0 0;

  display: flex;
  align-items: center;
  justify-content: center;
}

.middle-separator {
  @include top-separator;
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
    line-height: 0.85;
    font-weight: normal;
    font-size: 1rem;
    text-transform: uppercase;
    margin: 0 0 0.5em 0;
  }

  &-desc {
    padding-right: calc(var(--gutter-size) * 2);

    p {
      strong {
        font-family: var(--display-font);
        font-weight: normal;
        text-transform: uppercase;
      }

      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }
}
</style>
