# Sanity Content Studio

This is a very basic and minimal Sanity Studio to help manage the content of the website.

[Getting started with Sanity Studio](https://www.sanity.io/docs/getting-started).

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3333`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Generate schema and query types

Run the following commands to generate the typescript types for the Sanity queries, to use with the front-end application:

```
sanity schema extract

sanity typegen generate
```

For more informations, see: https://www.sanity.io/docs/apis-and-sdks/sanity-typegen
