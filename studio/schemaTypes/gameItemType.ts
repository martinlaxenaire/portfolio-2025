import {defineField, defineType} from 'sanity'

export const gameItemType = defineType({
  name: 'gameItem',
  title: 'Game item',
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
        rule.required().error(`Required to generate a game item on the website`),
      hidden: ({document}) => !document?.title,
    }),
    defineField({
      name: 'date',
      type: 'datetime',
    }),
    defineField({
      name: 'type',
      type: 'string',
      options: {
        list: [
          {title: 'Level', value: 'level'},
          {title: 'Feature', value: 'feature'},
        ],
      },
    }),
    defineField({
      name: 'pointsNeeded',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.required().min(0).integer(),
    }),
    defineField({
      name: 'contentUnlocked',
      type: 'string',
    }),
    defineField({
      name: 'tip',
      type: 'string',
    }),
  ],
  // After the "fields" array
  preview: {
    select: {
      title: 'title',
      date: 'date',
    },
    prepare({title, date}) {
      const nameFormatted = title || 'Untitled game item'
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
