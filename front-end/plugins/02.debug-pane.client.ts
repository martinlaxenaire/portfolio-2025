import { DebugPane } from "~/scenes/DebugPane";

export default defineNuxtPlugin(async (nuxtApp) => {
  // TODO dev/production check?
  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  const isDebug = searchParams.has("debug");

  const debugPane = isDebug ? new DebugPane() : null;

  return {
    provide: {
      debugPane,
    },
  };
});
