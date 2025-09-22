import { gsap } from "gsap";
import { SplitText } from "gsap/all";
import { ScrollTrigger } from "gsap/all";
import { InertiaPlugin } from "gsap/all";

export default defineNuxtPlugin({
  name: "init",
  setup() {
    // gsap
    gsap.registerPlugin(SplitText);
    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(InertiaPlugin);

    gsap.ticker.fps(60);

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

    // reduced motion
    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    const onResize = () => {
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        window.innerWidth - document.documentElement.clientWidth + "px"
      );
    };

    onResize();
    window.addEventListener("resize", onResize);

    return {
      provide: { isReducedMotion },
    };
  },
});
