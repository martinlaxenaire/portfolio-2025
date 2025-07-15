import {defineCliConfig} from 'sanity/cli'
import {siteConfig} from './site-config'

export default defineCliConfig({
  api: {
    projectId: siteConfig.projectId,
    dataset: 'production',
  },
  /**
   * Enable auto-updates for studios.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  autoUpdates: true,
})
