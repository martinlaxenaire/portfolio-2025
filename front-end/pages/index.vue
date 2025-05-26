<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { homeQueryString } from "../../studio/src/queries-strings";
import { CanvasFaviconScene } from "~/scenes/favicon/CanvasFaviconScene";

// debug
// const { colors, generator } = usePaletteGenerator();
// const isDev = ref(import.meta.env.DEV);

// TODO dynamic favicon based on color palette?
// https://stackoverflow.com/questions/260857/changing-website-favicon-dynamically

const { currentLevel } = useLevelExperience();

// DATA
const homeQuery = groq`${homeQueryString}`;
const { data } = await useLazySanityQuery<HomeQueryResult>(homeQuery);

// SEO
const config = useRuntimeConfig();

if (import.meta.server) {
  useSeoMeta({
    title: `${data.value?.title} | ${data.value?.seoTitle}`,
    description: data.value?.seoDescription,
    ogTitle: `${data.value?.title} | ${data.value?.seoTitle}`,
    ogUrl: config.public.siteBaseUrl + config.app.baseURL,
    ogType: "website",
    ogDescription: data.value?.seoDescription,
    ogImage:
      config.public.siteBaseUrl +
      config.app.baseURL +
      "images/martin-laxenaire-socials.jpg",
    twitterCard: "summary_large_image",
    twitterTitle: `${data.value?.title} | ${data.value?.seoTitle}`,
    twitterSite: "@martinlaxenaire",
    twitterCreator: "@martinlaxenaire",
    twitterDescription: data.value?.seoDescription,
    twitterImage:
      config.public.siteBaseUrl +
      config.app.baseURL +
      "images/martin-laxenaire-socials.jpg",
  });

  useHead({
    link: [
      {
        rel: "canonical",
        href: config.public.siteBaseUrl + config.app.baseURL,
      },
    ],
    htmlAttrs: {
      lang: "en",
    },
  });
}

// favicon
const { colors } = usePaletteGenerator();

let faviconScene: CanvasFaviconScene | null;

onMounted(() => {
  faviconScene = new CanvasFaviconScene({
    container: document.body as HTMLElement, // whatever
    colors: colors.value,
  });
});

watch(colors, () => {
  if (faviconScene) {
    faviconScene.setColors(colors.value);
  }
});
</script>

<template>
  <div :class="$style.root" v-if="data">
    <VHeader :title="data.title" />

    <VHero :baseline="data.baseline" />

    <section
      :class="[$style.level, currentLevel >= 1 && $style['level--is-active']]"
      id="level-1"
    >
      <VIntro :intro="data.intro" />

      <!-- debug -->
      <!--
      <ClientOnly>
        <div v-if="isDev" :class="$style.debug">
          <div :class="$style['debug-main-palette']">
            <div
              :style="{ 'background-color': color.hex }"
              v-for="(color, i) in colors"
              :key="i"
            ></div>
          </div>

          <div :class="$style['debug-all-palettes']">
            <div
              v-for="(palette, i) in generator?.palettes"
              :key="i"
              :class="$style['debug-all-palettes-palette']"
            >
              <div
                :style="{ 'background-color': color.hex }"
                v-for="(color, i) in palette"
                :key="i"
              ></div>
            </div>
          </div>
        </div>
      </ClientOnly>
    -->

      <VProjectsList
        :title="data.projectsTitle"
        :description="data.projectsDescription"
        :projects="data.projects"
        :recognition="data.recognition"
      />

      <VYearsList :title="data.yearsTitle" />
    </section>

    <section
      :class="[$style.level, currentLevel >= 2 && $style['level--is-active']]"
      id="level-2"
    >
      <VInvoices
        :process="data.processDescription"
        :title="data.invoicesTitle"
        :description="data.invoicesDescription"
      />
    </section>

    <section
      :class="[$style.level, currentLevel >= 3 && $style['level--is-active']]"
      id="level-3"
    >
      <VOpenSource
        :title="data.openSourceTitle"
        :description="data.openSourceDescription"
        :legend="data.openSourceLegend"
      />
    </section>
    <section
      :class="[$style.level, currentLevel >= 4 && $style['level--is-active']]"
      id="level-4"
    >
      <VFooter
        :title="data.footerTitle"
        :site-title="data.title"
        :description="data.footerDescription"
        :socials="data.socials"
      />
    </section>

    <VScrollToContinue />
    <VGainedExperience />
  </div>
</template>

<style module lang="scss">
.root {
  a {
    color: inherit;
  }
}

.debug {
  position: absolute;

  //height: 10vh;
  width: 50%;
  top: calc(100vh + 2rem);
  margin: 0 0 0 calc(50% - var(--gutter-size));

  &-main-palette {
    height: 5rem;
    display: flex;

    div {
      flex-grow: 1;
    }
  }

  &-all-palettes {
    margin-top: 1rem;

    &-palette {
      display: flex;
      height: 2.5rem;

      div {
        flex-grow: 1;
      }
    }
  }
}

.level {
  height: 0;
  overflow: hidden;

  &--is-active {
    height: auto;
    overflow: visible;
  }

  @media (prefers-reduced-motion) {
    height: auto;
    overflow: visible;
  }
}
</style>
