import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {siteConfig} from './site-config'

export default defineConfig({
  name: 'default',
  title: siteConfig.siteTitle,

  projectId: siteConfig.projectId,
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
