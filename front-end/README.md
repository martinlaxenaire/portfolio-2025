# Nuxt front-end

## Nuxt setup

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

### Setup

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

### Development Server

Start the development server on `http://localhost:3000`:

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

### Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Environment variables

The website uses environment variable to fetch data from Google sheets and Github, as well as for Analytics tracking with Umami.
There's a `env.example` provided ready to be used.

If the data cannot be fetched from Google sheets or Github, fake data are used.

## Project structure

### Pages

The whole site consists of a single landing page, so there's only an `index.vue` file and no routing system.

### Components

The `components` folder is using the (https://atomicdesign.bradfrost.com/chapter-2/)[Atomic design system].

Each component file name starts with the capitalized letter `V` (for `Vue`) in order to avoid confusion with existing HTML tags (`Header.vue` becomes `VHeader.vue` so we avoid writing `<header>` in our components templates).

The whole process is inspired by (https://github.com/rezozero/nuxt-starter)[Rezo Zero's Nuxt starter].

### WebGPU (gpu-curtains) and fallback scenes

All the WebGPU scenes code can be found in the `scenes` folder. They are imported dynamically in the components only if WebGPU is supported to reduce payload for browsers that do not support WebGPU yet.
In case WebGPU is not supported, a fallback scene (usually using 2D canvas) is provided for each scene.

## Debugging

There are a few URL query parameters that can be used to help debugging with the website. I've decided not to remove them in production because the whole point of this portfolio is also to be transparent about the dev process.

### Game

#### Contents

You can load the website with any desired level/content unlocked by adding `?level=${desiredLevelValue}` (where `desiredLevelValue` is an integer) to the URL.

#### Features

You can load the website with any desired feature unlocked by adding `?feature=${desiredFeatureValue}` (where `desiredFeatureValue` is an integer) to the URL.

### WebGPU

You can add the WebGPU scenes debug panel by adding `?debug=true` to the URL.
