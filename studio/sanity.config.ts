import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Optum',

  projectId: 'n74bykst',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((template) => template.schemaType !== 'pageContent'),
  },

  document: {
    actions: (actions, context) =>
      context.schemaType === 'pageContent'
        ? actions.filter(({action}) => action !== 'delete' && action !== 'duplicate')
        : actions,
  },
})
