import { hoistUseStatements } from "./utils/hoist-use-statements";
import { siteConfig } from "../studio/site-config";

const runtimeConfig = {
  googleAPIKey: process.env.NUXT_GOOGLE_API_KEY,
  invoiceSheetId: process.env.NUXT_INVOICE_SHEET_ID,
  githubAccessToken: process.env.NUXT_GITHUB_GRAPHQL_TOKEN,
  umamiId: process.env.NUXT_UMAMI_ID,
  umamiHost: process.env.NUXT_UMAMI_HOST,
  public: {
    siteBaseUrl: process.env.NUXT_SITE_BASE_URL,
  },
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: "/test/portfolio-2025/",
    head: {
      htmlAttrs: {
        lang: "en",
      },
    },
    pageTransition: { name: "page", mode: "out-in" },
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  runtimeConfig,
  modules: ["@nuxtjs/sanity", "lenis/nuxt", "nuxt-umami"],
  sanity: {
    projectId: siteConfig.projectId,
  },
  css: ["~/assets/scss/main.scss"],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: hoistUseStatements(
            `@import "~/assets/scss/_style-resources.scss";`
          ),
          quietDeps: true,
          api: "modern-compiler", // silence deprecation warnings https://github.com/sass/dart-sass/issues/2280
          // For now, just silence the deprecation warning.
          // But we have to use Dart Sass modern API https://sass-lang.com/documentation/breaking-changes/legacy-js-api/ soon.
          // Vite 5.x uses the legacy API as default https://vitejs.dev/config/shared-options.html#css-preprocessoroptions
          // Probably for best performance we should use `api: "modern-compiler"` and `sass-embedded` package.
          // Waiting on Vite fixing the missing sourcemap files https://github.com/vitejs/vite/pull/18113 warning.
          silenceDeprecations: [
            "mixed-decls",
            "color-functions",
            "import",
            "global-builtin",
          ],
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("gpu-curtains")) {
              return "gpu-curtains";
            }
          },
        },
      },
    },
  },
  components: [
    "~/components/atoms",
    "~/components/molecules",
    "~/components/organisms",
  ],
  // https://umami.nuxt.dev/getting-started/installation
  umami: {
    id: runtimeConfig.umamiId,
    host: runtimeConfig.umamiHost,
    autoTrack: true,
  },
});
