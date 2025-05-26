import {defineField, defineType} from 'sanity'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    // MAIN
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required().error(`Required to generate a page on the website`),
      hidden: ({document}) => !document?.title,
    }),
    defineField({
      name: 'date',
      type: 'datetime',
    }),
    // SEO
    defineField({
      name: 'seoTitle',
      type: 'string',
    }),
    defineField({
      name: 'seoDescription',
      type: 'string',
    }),
    // INTRO
    defineField({
      name: 'baseline',
      type: 'string',
    }),
    defineField({
      name: 'intro',
      type: 'array',
      of: [{type: 'block'}],
    }),
    // PROJECTS
    defineField({
      name: 'projectsTitle',
      type: 'string',
    }),
    defineField({
      name: 'projectsDescription',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'projects',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'project'}],
        },
      ],
    }),
    defineField({
      name: 'recognition',
      type: 'array',
      of: [{type: 'block'}],
    }),
    // YEARS
    defineField({
      name: 'yearsTitle',
      type: 'string',
    }),
    // PROCESS & INVOICES
    defineField({
      name: 'processDescription',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'invoicesTitle',
      type: 'string',
    }),
    defineField({
      name: 'invoicesDescription',
      type: 'array',
      of: [{type: 'block'}],
    }),
    // OPEN SOURCE
    defineField({
      name: 'openSourceTitle',
      type: 'string',
    }),
    defineField({
      name: 'openSourceDescription',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'openSourceLegend',
      type: 'array',
      of: [{type: 'block'}],
    }),
    // FOOTER
    defineField({
      name: 'footerTitle',
      type: 'string',
    }),
    defineField({
      name: 'footerDescription',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'socials',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'social'}],
        },
      ],
    }),
  ],
  // After the "fields" array
  preview: {
    select: {
      title: 'title',
      date: 'date',
    },
    prepare({title, date}) {
      const nameFormatted = title || 'Untitled page'
      const dateFormatted = date
        ? new Date(date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        : 'No date'

      return {
        title: nameFormatted,
        subtitle: dateFormatted,
      }
    },
  },
})
