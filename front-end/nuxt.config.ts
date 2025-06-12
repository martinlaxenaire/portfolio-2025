import { hoistUseStatements } from "./utils/hoist-use-statements";
import { siteConfig } from "../studio/site-config";

const runtimeConfig = {
  googleAPIKey: process.env.NUXT_GOOGLE_API_KEY,
  invoiceSheetId: process.env.NUXT_INVOICE_SHEET_ID,
  githubAccessToken: process.env.NUXT_GITHUB_GRAPHQL_TOKEN,
  piwikProId: process.env.NUXT_PIWIK_PRO_CONTAINER_ID,
  piwikProUrl: process.env.NUXT_PIWIK_PRO_CONTAINER_URL,
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
  modules: [
    "@nuxtjs/sanity",
    "lenis/nuxt",
    [
      "@piwikpro/nuxt-piwik-pro",
      {
        containerId: runtimeConfig.piwikProId,
        containerUrl: runtimeConfig.piwikProUrl,
      },
    ],
  ],
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
  },
  components: [
    "~/components/atoms",
    "~/components/molecules",
    "~/components/organisms",
  ],
});
