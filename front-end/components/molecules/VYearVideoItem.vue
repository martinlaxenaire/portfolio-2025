<script lang="ts" setup>
import { useIntersectionObserver } from "@vueuse/core";

const props = defineProps<{ url?: string }>();

const { addLevelPoints } = useLevelExperience();

const video = useTemplateRef("video");

const { $isReducedMotion, $hasWebGPU } = useNuxtApp();

let lastTs = 0;

const onTimeUpdate = () => {
  if (video.value) {
    const ts = video.value.currentTime;

    if (ts < lastTs) {
      console.log("VIDEO LOOPED", video.value.src);
      addLevelPoints(5);
      video.value.removeEventListener("timeupdate", onTimeUpdate);
    }

    lastTs = ts;
  }
};

onMounted(() => {
  if (!$isReducedMotion) {
    if (video.value) {
      video.value.addEventListener("timeupdate", onTimeUpdate);
    }

    if (!$hasWebGPU) {
      useIntersectionObserver(video, ([entry]) => {
        const isVideoVisible = entry?.isIntersecting || false;
        if (isVideoVisible) {
          (entry.target as HTMLVideoElement).play();
        } else {
          (entry.target as HTMLVideoElement).pause();
        }
      });
    }
  } else if (video.value) {
    video.value.controls = true;
  }
});

onBeforeUnmount(() => {
  video.value?.removeEventListener("timeupdate", onTimeUpdate);
});
</script>

<template>
  <video
    ref="video"
    v-if="url"
    :src="url"
    data-texture-name="planeTexture"
    crossorigin=""
    muted
    playsinline
    loop
    preload="metadata"
  ></video>
</template>
