import {defineField, defineType} from 'sanity'

export const menuType = defineType({
    name: 'menu',
    title: 'Menu',
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
            validation: (rule) => rule
                .required()
                .error(`Required to generate a menu on the website`),
            hidden: ({document}) => !document?.title,
        }),
        defineField({
            name: 'date',
            type: 'datetime',
        }),
        defineField({
            name: 'pages',
            type: 'array',
            of: [
                {
                    type: 'reference',
                    to: [{type: 'page'}],
                }
            ],
        }),
    ],
    // After the "fields" array
    preview: {
        select: {
            title: "title",
            date: 'date',
        },
        prepare({title, date}) {
            const nameFormatted = title || 'Untitled menu'
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