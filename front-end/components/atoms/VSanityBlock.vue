<script lang="ts" setup>
import type { PortableTextBlock } from "@portabletext/types";
import VSanityBlockContent from "~/components/organisms/VSanityBlockContent.vue";

const props = defineProps<{
  content: PortableTextBlock[];
}>();

const { addFeaturePoints } = useLevelExperience();

let index = 0;

const serializers = {
  styles: {
    normal: (props: any, children: any) =>
      h(VSanityBlockContent, { index: index++ }, children.slots),
  },
  marks: {
    link: (props: any, children: any) =>
      h(
        "a",
        {
          target: "_blank",
          href: props.href,
          onClickOnce() {
            addFeaturePoints(1);
          },
        },
        children.slots
      ),
  },
};
</script>

<template>
  <SanityContent :blocks="content" :serializers="serializers" />
</template>
