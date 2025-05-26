<script lang="ts" setup>
import type { YearsList } from "../organisms/VYearsList.vue";

const props = defineProps<{
  year: YearsList[number];
}>();

const { $hasWebGPU } = useNuxtApp();
const hasWebGPU = ref(true); // for WebGPU titles to work

onMounted(() => {
  hasWebGPU.value = $hasWebGPU;
});
</script>

<template>
  <div
    :class="[
      $style.root,
      $style[`root--has-${year.videos?.length ?? 0}-medias`],
    ]"
  >
    <h3 v-if="year.title && hasWebGPU" :class="$style.title">
      {{ year.title }}
    </h3>
    <h3 v-else-if="year.title" :class="$style.title">
      <VAnimatedTextByLetters :label="year.title" :align="'center'" />
    </h3>

    <div :class="$style.container" class="container grid">
      <div
        v-for="(video, i) in year.videos"
        :key="i"
        :class="[$style.media, $style[`media-${i}`]]"
        class="media-plane"
      >
        <VYearVideoItem :url="video.url" />
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.root {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
}

.title {
  font-family: var(--display-font);
  text-transform: uppercase;
  font-size: 8rem;
  padding: 0 1.5em;
  box-sizing: border-box;
  max-width: 100%;
  border-color: var(--background-color);
  //position: relative;
  z-index: 1;
  -webkit-text-stroke: 0.015em var(--background-color);

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, -50%, 0);
  margin: 0;

  @media screen and (orientation: portrait) {
    font-size: 4.5rem;
    padding: 1em;
  }
}

.container {
  height: 100%;
  box-sizing: border-box;
  padding-top: 10vh;
  padding-bottom: 10vh;
  align-items: center;

  @media screen and (max-aspect-ratio: 10 / 8) {
    padding-top: 7.5vh;
    padding-bottom: 7.5vh;
  }

  @media screen and (orientation: portrait) {
    padding-top: 5vh;
    padding-bottom: 5vh;
  }
}

.media {
  display: flex;
  overflow: hidden;
  aspect-ratio: 1920 / 1080;

  img,
  video {
    object-fit: cover;
    min-width: 100%;
    min-height: 100%;
    width: auto;
    height: auto;
  }
}

.media-0 {
  body:global(.no-webgpu) & {
    background: var(--color-palette-0);
  }

  grid-column: 2 / 7;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 1 / 7;
  }

  .root--has-2-medias &,
  .root--has-3-medias & {
    margin-top: 10%;

    @media screen and (max-aspect-ratio: 12 / 8) {
      grid-column: 1 / 8;
      margin-top: 0;
    }

    @media screen and (max-aspect-ratio: 10 / 8) {
      grid-column: 2 / 9;
    }

    @media screen and (orientation: portrait) {
      grid-column: 1 / 10;
    }
  }

  .root--has-1-medias & {
    grid-column: 3 / 10;
  }

  .root--has-4-medias &,
  .root--has-5-medias & {
    @media screen and (orientation: portrait) {
      grid-column: 1 / 9;
    }
  }
}

.media-1 {
  body:global(.no-webgpu) & {
    background: var(--color-palette-1);
  }

  grid-column: 8 / 12;
  //margin-top: 10%;

  .root--has-2-medias &,
  .root--has-3-medias & {
    @media screen and (max-aspect-ratio: 12 / 8) {
      grid-column: 7 / 13;
      margin-top: 50%;
    }

    @media screen and (max-aspect-ratio: 10 / 8) {
      grid-column: 6 / 12;
      margin-top: 25%;
    }

    @media screen and (orientation: portrait) {
      grid-column: 5 / 13;
      margin-top: 0;
    }
  }

  .root--has-2-medias & {
    margin-top: -50%;

    @media screen and (max-aspect-ratio: 12 / 8) {
      margin-top: 0;
    }
  }

  .root--has-4-medias &,
  .root--has-5-medias & {
    @media screen and (max-aspect-ratio: 10 / 8) {
      grid-column: 8 / 13;
    }

    @media screen and (orientation: portrait) {
      grid-column: 6 / 13;
      margin-top: -10%;
    }
  }
}

.media-2 {
  body:global(.no-webgpu) & {
    background: var(--color-palette-2);
  }

  grid-column: 7 / 10;
  order: 3;
  //margin-top: -25%;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 2 / 7;
    margin-top: 0;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    grid-column: 2 / 6;
  }

  @media screen and (orientation: portrait) {
    grid-column: 2 / 9;
  }

  .root--has-5-medias & {
    grid-column: 6 / 9;
  }

  .root--has-4-medias &,
  .root--has-5-medias & {
    @media screen and (orientation: portrait) {
      grid-column: 3 / 10;
      margin-top: -25%;
    }
  }
}

.media-3 {
  body:global(.no-webgpu) & {
    background: var(--color-palette-3);
  }

  grid-column: 2 / 5;
  order: 3;
  margin-top: -50%;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 1 / 5;
    margin-top: -25%;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / 7;
    order: 4;
  }
}

.media-4 {
  body:global(.no-webgpu) & {
    background: var(--color-palette-4);
  }

  grid-column: 10 / 12;
  order: 5;
  margin-top: -112.5%;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 10 / 13;
    margin-top: -100%;
  }

  @media screen and (max-aspect-ratio: 10 / 8) {
    margin-top: -125%;
  }

  @media screen and (orientation: portrait) {
    grid-column: 8 / 13;
    margin-top: -50%;
  }
}
</style>
