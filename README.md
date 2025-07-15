# 2025 Portfolio

Here you'll find the full code of my new 2025 portfolio - [https://www.martin-laxenaire.fr](martin-laxenaire.fr).

I've decided to publish it as a learning material. You might find some useful inspiration, from small UI components to full [https://martinlaxenaire.github.io/gpu-curtains/](gpu-curtains) WebGPU scenes.

This project is published under the [LICENSE.md](Creative Commons Attribution-NonCommercial 4.0 International License).

## Setup

It is built as a monorepo, containing a Sanity backend in the `studio` folder, and a Nuxt application in the `front-end` folder.

### Clone the repository

```
git clone https://github.com/martinlaxenaire/portfolio-2025.git

cd portfolio-2025
```

### Sanity

Run the following commands to start the Sanity studio:

```
cd studio

yarn install

yarn dev
```

The studio should now be running at `localhost:3333`.

### Nuxt front-end

Run the following commands to start the Nuxt front-end:

```
cd front-end

yarn install

yarn dev
```

The front-end should now be running at `localhost:5000`.
