<script setup lang="ts">
import { VueLenis, useLenis } from "lenis/vue";
import gsap from "gsap";

const lenisRef = ref();

watchEffect((onInvalidate) => {
  function update(time: number) {
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
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </VueLenis>
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
  transition: opacity 0.5s;

  @media (prefers-reduced-motion) {
    transition: none;
  }
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
