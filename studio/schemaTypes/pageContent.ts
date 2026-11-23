import {aboutFields, isAbout, isHome} from './aboutFields'
import {paragraphFields} from './paragraphFields'
import {defineField, defineType, type ConditionalPropertyCallbackContext} from 'sanity'
import {plumbingFields, plumbingFieldsets} from './plumbingSections'

const servicePages = ['heating', 'plumbing', 'ventilation', 'servicing']
const hideServiceIntro = ({document}: ConditionalPropertyCallbackContext) =>
  !servicePages.includes(String(document?.pageKey))

export const pageContent = defineType({
  name: 'pageContent',
  title: 'Website wording',
  type: 'document',
  fieldsets: [
    {name: 'hero', title: 'Top of page', options: {collapsible: true, collapsed: true}},
    {
      name: 'intro',
      title: 'Service introduction',
      hidden: hideServiceIntro,
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'story',
      title: 'Our story',
      hidden: (ctx) => !isAbout(ctx),
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'homeAbout',
      title: 'Homepage About section',
      description: 'The heading and two paragraphs beside the owners’ photo.',
      hidden: (ctx) => !isHome(ctx),
      options: {collapsible: true, collapsed: false},
    },
    ...plumbingFieldsets,
    {
      name: 'cta',
      title: 'Consultation at the bottom of the page',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    defineField({name: 'pageKey', title: 'Page key', type: 'string', hidden: true}),
    defineField({
      name: 'pageTitle',
      title: 'Page',
      type: 'string',
      hidden: true,
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroEyebrow',
      title: 'Small heading',
      type: 'string',
      fieldset: 'hero',
      description: 'The short label above the main heading.',
    }),
    defineField({
      name: 'heroTitleBefore',
      hidden: isAbout,
      title: 'Main heading',
      type: 'string',
      fieldset: 'hero',
      description: 'The normal part of the main heading.',
      validation: (rule) =>
        rule.custom(
          (value, ctx) =>
            ctx.document?.pageKey === 'about' ||
            Boolean(value?.trim()) ||
            'Please add a main heading.',
        ),
    }),
    defineField({
      name: 'heroTitleEmphasis',
      hidden: isAbout,
      title: 'Italic words',
      type: 'string',
      fieldset: 'hero',
      description: 'The words to emphasise within the heading.',
    }),
    defineField({
      name: 'heroTitleAfter',
      hidden: isAbout,
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'hero',
      description: 'Optional normal text that follows the highlighted words.',
    }),
    ...aboutFields,
    ...paragraphFields('heroSummary', 'Opening summary', {fieldset: 'hero'}),
    defineField({
      name: 'introTitleBefore',
      title: 'Introduction heading',
      type: 'string',
      fieldset: 'intro',
    }),
    defineField({
      name: 'introTitleEmphasis',
      title: 'Italic words',
      type: 'string',
      fieldset: 'intro',
    }),
    defineField({
      name: 'introTitleAfter',
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'intro',
    }),
    ...paragraphFields('introBody', 'Introduction text', {fieldset: 'intro'}),
    ...plumbingFields,
    defineField({name: 'ctaEyebrow', title: 'Small heading', type: 'string', fieldset: 'cta'}),
    defineField({name: 'ctaTitleBefore', title: 'Main heading', type: 'string', fieldset: 'cta'}),
    defineField({
      name: 'ctaTitleEmphasis',
      title: 'Italic words',
      type: 'string',
      fieldset: 'cta',
    }),
    defineField({
      name: 'ctaTitleAfter',
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'cta',
    }),
    ...paragraphFields('ctaBody', 'Supporting text', {fieldset: 'cta'}),
    defineField({
      name: 'ctaButton',
      title: 'Consultation button text',
      description: 'On Home, this also sets the consultation button at the top of the page.',
      type: 'string',
      fieldset: 'cta',
    }),
  ],
  preview: {
    select: {title: 'pageTitle', subtitle: 'heroTitleBefore'},
  },
})
