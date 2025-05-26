import {defineField, defineType} from 'sanity'

export const gameContentType = defineType({
  name: 'gameContent',
  title: 'Game content',
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
      validation: (rule) =>
        rule.required().error(`Required to generate a game content on the website`),
      hidden: ({document}) => !document?.title,
    }),
    defineField({
      name: 'date',
      type: 'datetime',
    }),
    defineField({
      name: 'levels',
      type: 'array',
      //   validation: (Rule) =>
      //     Rule.custom((content) => {
      //       console.log(content)
      //       const levels = (content || []).filter((item) => item.type.value === 'level')

      //       return levels
      //     }),
      of: [
        {
          type: 'reference',
          to: [{type: 'gameItem'}],
        },
      ],
    }),
    defineField({
      name: 'features',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'gameItem'}],
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
      const nameFormatted = title || 'Untitled game content'
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
