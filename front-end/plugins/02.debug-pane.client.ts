export default defineNuxtPlugin(async (nuxtApp) => {
  const router = useRouter();

  let debugPane = null;

  const isDebug = !!router.currentRoute.value.query.debug;

  if (isDebug) {
    const { DebugPane } = await import("~/scenes/DebugPane");
    debugPane = new DebugPane();
  }

  return {
    provide: {
      debugPane,
    },
  };
});
