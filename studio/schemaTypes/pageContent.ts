import {aboutFields, isAbout} from './aboutFields'
import {paragraphFields} from './paragraphFields'
import {defineField, defineType} from 'sanity'

export const pageContent = defineType({
  name: 'pageContent',
  title: 'Website wording',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Top of page', default: true},
    {name: 'intro', title: 'Introduction'},
    {name: 'homeAbout', title: 'Homepage About section', hidden: (ctx) => !isAbout(ctx)},
    {name: 'cta', title: 'Bottom call to action'},
  ],
  fields: [
    defineField({name: 'pageKey', title: 'Page key', type: 'string', hidden: true}),
    defineField({
      name: 'pageTitle',
      title: 'Page',
      type: 'string',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroEyebrow',
      title: 'Small heading',
      type: 'string',
      group: 'hero',
      description: 'The short label above the main heading.',
    }),
    defineField({
      name: 'heroTitleBefore',
      hidden: isAbout,
      title: 'Main heading',
      type: 'string',
      group: 'hero',
      description: 'The normal part of the main heading.',
      validation: (rule) => rule.custom((value, ctx) => ctx.document?.pageKey === 'about' || Boolean(value?.trim()) || 'Please add a main heading.'),
    }),
    defineField({
      name: 'heroTitleEmphasis',
      hidden: isAbout,
      title: 'Highlighted ending',
      type: 'string',
      group: 'hero',
      description: 'The italic ending of the main heading.',
    }),
    defineField({
      name: 'heroTitleAfter',
      hidden: isAbout,
      title: 'Text after highlighted words',
      type: 'string',
      group: 'hero',
      description: 'Optional normal text that follows the highlighted words.',
    }),
    ...aboutFields,
    ...paragraphFields('heroSummary', 'Opening summary', {group: 'hero'}),
    defineField({
      name: 'introTitleBefore',
      title: 'Introduction heading',
      type: 'string',
      group: 'intro',
    }),
    defineField({
      name: 'introTitleEmphasis',
      title: 'Highlighted ending',
      type: 'string',
      group: 'intro',
    }),
    defineField({
      name: 'introTitleAfter',
      title: 'Text after highlighted words',
      type: 'string',
      group: 'intro',
    }),
    ...paragraphFields('introBody', 'Introduction text', {group: 'intro'}),
    defineField({name: 'ctaEyebrow', title: 'Small heading', type: 'string', group: 'cta'}),
    defineField({name: 'ctaTitleBefore', title: 'Main heading', type: 'string', group: 'cta'}),
    defineField({
      name: 'ctaTitleEmphasis',
      title: 'Highlighted ending',
      type: 'string',
      group: 'cta',
    }),
    defineField({
      name: 'ctaTitleAfter',
      title: 'Text after highlighted words',
      type: 'string',
      group: 'cta',
    }),
    ...paragraphFields('ctaBody', 'Supporting text', {group: 'cta'}),
    defineField({name: 'ctaButton', title: 'Button wording', type: 'string', group: 'cta'}),
  ],
  preview: {
    select: {title: 'pageTitle', subtitle: 'heroTitleBefore'},
  },
})
