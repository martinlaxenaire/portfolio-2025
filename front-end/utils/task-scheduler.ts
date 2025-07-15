export const taskScheduler =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? requestIdleCallback
    : setTimeout;
