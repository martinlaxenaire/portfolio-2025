<script setup>
import { VueLenis, useLenis } from "lenis/vue";
import gsap from "gsap";

const lenisRef = ref();

watchEffect((onInvalidate) => {
  function update(time) {
    lenisRef.value?.lenis?.raf(time * 1000);
  }
  gsap.ticker.add(update);

  onInvalidate(() => {
    gsap.ticker.remove(update);
  });
});

const { $isReducedMotion } = useNuxtApp();

const lenis = useLenis();

onMounted(() => {
  if ($isReducedMotion && lenis.value) {
    lenis.value.destroy();
  }
});
</script>

<template>
  <VueLenis :root="true" ref="lenisRef" :options="{ autoRaf: false }">
    <main>
      <NuxtPage />
    </main>
    <div id="debug" :class="$style.debug" />
  </VueLenis>
</template>

<style module lang="scss">
.debug {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 9999;
}
</style>
