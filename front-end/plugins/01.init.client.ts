import { gsap } from "gsap";
import { SplitText } from "gsap/all";
import { ScrollTrigger } from "gsap/all";
import { InertiaPlugin } from "gsap/all";
import { Draggable } from "gsap/all";

export default defineNuxtPlugin({
  name: "init",
  setup() {
    // gsap
    gsap.registerPlugin(SplitText);
    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(InertiaPlugin);
    gsap.registerPlugin(Draggable);

    // theme
    const theme = useState<"light" | "dark">("theme");

    // Run only once on client-side
    const storedTheme = localStorage.getItem("theme");
    theme.value =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    document.body.classList.toggle("is-dark", theme.value === "dark");
    document.body.classList.toggle("is-light", theme.value === "light");

    // debug levels
    // const { currentLevel, currentFeature } = useLevelExperience();

    // const url = new URL(window.location.href);
    // const searchParams = new URLSearchParams(url.search);
    // const startLevel = searchParams.has("level")
    //   ? parseInt(searchParams.get("level") as string)
    //   : 0;

    // const startFeature = searchParams.has("feature")
    //   ? parseInt(searchParams.get("feature") as string)
    //   : 0;

    // currentLevel.value = startLevel;
    // currentFeature.value = startFeature;

    // console.log(levels.value.length, levels.value[startLevel - 1], startLevel);

    // currentLevelPoints.value =
    //   levels.value.length && levels.value.length >= startLevel - 1
    //     ? levels.value[startLevel - 1].pointsNeeded
    //     : currentLevelPoints.value;

    // currentFeaturePoints.value =
    //   features.value.length && features.value.length >= startFeature - 1
    //     ? features.value[startFeature - 1].pointsNeeded
    //     : currentFeaturePoints.value;

    // reduced motion
    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    return {
      provide: { isReducedMotion },
    };
  },
});
