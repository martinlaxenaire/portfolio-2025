import {defineField, defineType} from 'sanity'

export const projectType = defineType({
    name: 'project',
    title: 'Project',
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
                .error(`Required to generate a project on the website`),
            hidden: ({document}) => !document?.title,
        }),
        defineField({
            name: 'date',
            type: 'datetime',
        }),
        defineField({
            name: 'cover',
            description: 'Project cover image',
            type: 'image',
        }),
        defineField({
            name: 'url',
            type: 'string',
        }),
        defineField({
            name: 'stack',
            type: 'array',
            of: [{type: 'string'}]
        }),
        defineField({
            name: 'details',
            type: 'array',
            of: [{type: 'block'}],
        }),
    ],
    // After the "fields" array
    preview: {
        select: {
            title: "title",
            date: 'date',
            media: "cover",
        },
        prepare({title, date, media}) {
            const nameFormatted = title || 'Untitled project'
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
                media,
            }
        },
    },
})