import { GPUCurtains } from "gpu-curtains";
import { gsap } from "gsap";
//import { GPUCurtains } from "~/assets/gpu-curtains/dist/esm";

export default defineNuxtPlugin({
  name: "gpu-curtains",
  dependsOn: ["init"],
  async setup(nuxtApp) {
    const gpuCurtains = new GPUCurtains({
      watchScroll: false,
      production: process.env.NODE_ENV === "production",
      autoRender: false, // do not create a request animation frame loop
      pixelRatio: Math.min(1.5, window.devicePixelRatio),
    });

    let hasWebGPU = false;

    gpuCurtains.onError(() => {
      document.body.classList.add("no-webgpu");
    });

    if (!nuxtApp.$isReducedMotion) {
      try {
        await gpuCurtains.setDevice();
        // use gsap ticker
        gsap.ticker.add(() => gpuCurtains.render());
        gsap.ticker.fps(60);
        hasWebGPU = true;
      } catch (e) {
        console.log(e);
        hasWebGPU = false;
      }
    } else {
      document.body.classList.add("no-webgpu");
    }

    return {
      provide: { gpuCurtains, hasWebGPU },
    };
  },
});
