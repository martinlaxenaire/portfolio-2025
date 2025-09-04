<script lang="ts" setup>
import type { HomeQueryResult } from "~/types/sanity.types";
import { homeQueryString } from "../../studio/src/queries-strings";
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
</script>

<template>
  <div>
    <div :class="$style.root" v-if="data">
      <VHero :baseline="data.baseline" />

      <section
        :class="[$style.level, currentLevel >= 1 && $style['level--is-active']]"
        id="level-1"
        :inert="currentLevel >= 1 ? false : true"
      >
        <LazyVIntro hydrate-on-idle :intro="data.intro" />

        <LazyVProjectsList
          hydrate-on-idle
          :title="data.projectsTitle"
          :description="data.projectsDescription"
          :projects="data.projects"
          :recognition="data.recognition"
        />

        <LazyVYearsList hydrate-on-idle :title="data.yearsTitle" />

        <LazyVScrollToContinue hydrate-on-idle :level="2" />
      </section>

      <section
        :class="[$style.level, currentLevel >= 2 && $style['level--is-active']]"
        id="level-2"
        :inert="currentLevel >= 2 ? false : true"
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
        :inert="currentLevel >= 3 ? false : true"
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
        :inert="currentLevel >= 4 ? false : true"
      >
        <VFooter
          :title="data.footerTitle"
          :site-title="data.title"
          :description="data.footerDescription"
          :socials="data.socials"
        />
      </section>

      <LazyVGainedExperience hydrate-on-idle />
    </div>

    <Transition
      appear
      :enter-active-class="$style['fade-enter-active']"
      :leave-active-class="$style['fade-leave-active']"
      :enter-from-class="$style['fade-enter-from']"
      :leave-to-class="$style['fade-leave-to']"
    >
      <div v-if="!data" :class="$style.fallback">
        <h2>{{ UIElements.common.noData }}</h2>
      </div>
    </Transition>
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

.fade-enter-active,
.fade-leave-active {
  opacity: 1;

  transition: opacity 0.5s 0.65s ease(in-quad);

  @media (prefers-reduced-motion) {
    transition: none !important;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transition: opacity 0.5s 0s ease(in-quad);
}
</style>
