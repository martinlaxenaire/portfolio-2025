# Sanity Clean Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the community Slack](https://slack.sanity.io/?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

## Generate schema and query types

Run the following commands to generate the typescript types for the Sanity queries, to use with the front-end application:

```
sanity schema extract

sanity typegen generate
```

For more informations, see: https://www.sanity.io/docs/apis-and-sdks/sanity-typegen
