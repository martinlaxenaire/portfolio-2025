import {defineField, defineType} from 'sanity'

export const yearType = defineType({
  name: 'year',
  title: 'Year',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required().error(`Required to generate a year on the website`),
      hidden: ({document}) => !document?.title,
    }),
    defineField({
      name: 'date',
      type: 'datetime',
    }),
    defineField({
      name: 'videos',
      type: 'array',
      of: [{type: 'file'}],
    }),
  ],
  // After the "fields" array
  preview: {
    select: {
      title: 'title',
      date: 'date',
    },
    prepare({title, date}) {
      const nameFormatted = title || 'Untitled year'
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
