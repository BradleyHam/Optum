import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'n74bykst',
    dataset: 'production'
  },
  deployment: {
    appId: 'u7y28jqdoh89u63gv090yq46',
    autoUpdates: false,
  },
})
