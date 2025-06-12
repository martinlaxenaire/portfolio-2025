<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { homeQueryString } from "../../studio/src/queries-strings";
// import { usePiwikPro } from "@piwikpro/nuxt-piwik-pro/composables";
import { UIElements } from "~/assets/static-data/ui-elements";

const { currentLevel } = useLevelExperience();

// DATA
const homeQuery = groq`${homeQueryString}`;
const { data, error } = await useLazySanityQuery<HomeQueryResult>(homeQuery);

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

const { $piwikPRO } = useNuxtApp();
// $piwikPRO won't be available on server-side code!
// if (import.meta.client) {
//   $piwikPRO.PageViews.trackPageView(data.value?.title);
//   //$piwikPRO.GoalConversions.trackGoal(1, 100);
// }

onMounted(() => {
  $piwikPRO.PageViews.trackPageView("Homepage");
});

// const userId = usePiwikPro(({ PageViews, GoalConversions, UserManagement }) => {
//   PageViews.trackPageView(data.value?.title);
//   //GoalConversions.trackGoal(1, 100);
//   return UserManagement.getUserId();
// });
</script>

<template>
  <div :class="$style.root" v-if="data">
    <VHero :baseline="data.baseline" />

    <section
      :class="[$style.level, currentLevel >= 1 && $style['level--is-active']]"
      id="level-1"
    >
      <VIntro :intro="data.intro" />

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
  <div v-else :class="$style.fallback">
    <h2>{{ UIElements.common.noData }}</h2>
  </div>
</template>

<style module lang="scss">
.root {
  a {
    color: inherit;
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

.fallback {
  position: absolute;
  inset: 0;
  padding-top: 3.2rem;
  display: flex;
  justify-content: center;
  align-items: center;

  h2 {
    font-family: var(--light-display-font);
    font-weight: normal;
    text-transform: uppercase;
  }
}
</style>
