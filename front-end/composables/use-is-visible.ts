import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
} from "@vueuse/core";

export function useIsVisible(
  container: Ref<HTMLElement | null>,
  triggerOnce = true,
  options: UseIntersectionObserverOptions = {}
) {
  const isVisible = ref(false);

  useIntersectionObserver(
    container,
    ([entry]) => {
      const isIntersecting = entry?.isIntersecting || false;
      if (triggerOnce && isIntersecting && !isVisible.value) {
        isVisible.value = true;
      } else if (!triggerOnce && isIntersecting !== isVisible.value) {
        isVisible.value = isIntersecting;
      }
    },
    options
  );

  return { isVisible };
}
