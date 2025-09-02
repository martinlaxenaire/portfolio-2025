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
    let hasWebGPUVideo = false;

    gpuCurtains.onError(() => {
      document.body.classList.add("no-webgpu");
    });

    if (!nuxtApp.$isReducedMotion) {
      try {
        await gpuCurtains.setDevice();
        // use gsap ticker
        gsap.ticker.add(() => gpuCurtains.render());
        hasWebGPU = true;

        // TODO at the moment (Firefox 142.0.1), Firefox does not support video textures
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=1922098
        // and https://bugzilla.mozilla.org/show_bug.cgi?id=1827116
        // so we rely on testing the existence of 'importExternalTexture' in the WebGPU device
        // and drop the WebGPU video scene if needed to avoid breaking the site
        hasWebGPUVideo =
          !!gpuCurtains.deviceManager.device &&
          "importExternalTexture" in gpuCurtains.deviceManager.device;

        if (!hasWebGPUVideo) {
          document.body.classList.add("no-webgpu-video");
        }

        umTrackEvent("Feature", {
          name: "WebGPU enabled",
        });
      } catch (e) {
        console.log(e);
        hasWebGPU = false;

        umTrackEvent("Feature", {
          name: "WebGPU disabled",
        });
      }
    } else {
      document.body.classList.add("no-webgpu");
      document.body.classList.add("no-webgpu-video");
    }

    return {
      provide: { gpuCurtains, hasWebGPU, hasWebGPUVideo },
    };
  },
});
