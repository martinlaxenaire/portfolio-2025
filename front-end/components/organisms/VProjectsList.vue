<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";

const props = defineProps<{
  title?: NonNullable<HomeQueryResult>["projectsTitle"];
  description?: NonNullable<HomeQueryResult>["projectsDescription"];
  projects?: NonNullable<HomeQueryResult>["projects"];
  recognition?: NonNullable<HomeQueryResult>["recognition"];
}>();

const projectsContainer = useTemplateRef("projects-container");
const { isVisible } = useIsVisible(projectsContainer);
const { addLevelPoints } = useLevelExperience();

watch(isVisible, () => {
  if (isVisible.value) {
    addLevelPoints(1);
  }
});
</script>

<template>
  <div :class="$style.root" ref="projects">
    <div :class="$style['top-separator']">
      <VCanvasSeparator :invert-colors="true" />
    </div>

    <div v-if="title" class="container grid">
      <h2 :class="$style.title">
        <VAnimatedTextByLetters :align="'center'" :label="title" />
      </h2>
    </div>

    <div :class="$style.projects">
      <div class="container grid">
        <div :class="$style.description" v-if="description">
          <!-- @vue-ignore -->
          <VSanityBlock :content="description" />
        </div>

        <ul
          :class="$style.list"
          v-if="projects"
          ref="projects-container"
          :style="{ '--nb-items': projects.length }"
        >
          <li v-for="(project, i) in projects" :key="i" ref="projects-items">
            <VProjectThumb :project="project" :index="i" />
          </li>
        </ul>

        <div :class="$style.recognition" v-if="recognition">
          <!-- @vue-ignore -->
          <VSanityBlock :content="recognition" />
        </div>
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  background: var(--bg-color);
  position: relative;
  margin: calc(var(--height-space) * 0.5) 0 0 0;
}

.title {
  @include section-title;
  grid-column: 4 / 10;

  @media screen and (orientation: portrait) {
    grid-column: 2 / 12;
  }
}

.projects {
  position: relative;
  margin: 3rem 0 0 0;
}

.top-separator {
  @include top-separator;
  top: calc(var(--height-space) * -0.5);
}

.bottom-separator {
  @include bottom-separator;
}

.list {
  list-style: none;
  padding: 0;
  position: sticky;
  margin: 0;
  grid-column: 3 / 11;

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
  }
}

.description,
.recognition {
  @include right-column-text;
}
</style>
