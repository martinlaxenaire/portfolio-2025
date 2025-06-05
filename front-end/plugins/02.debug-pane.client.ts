import { DebugPane } from "~/scenes/DebugPane";

export default defineNuxtPlugin(async (nuxtApp) => {
  // TODO dev/production check?
  const router = useRouter();

  const isDebug = !!router.currentRoute.value.query.debug;

  const debugPane = isDebug ? new DebugPane() : null;

  return {
    provide: {
      debugPane,
    },
  };
});
