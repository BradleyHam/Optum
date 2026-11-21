import {formattedText, paragraphFields} from './paragraphFields'
import {defineArrayMember, defineField, defineType} from 'sanity'

const requiredText = (title: string, name: string, fieldset: string) =>
  defineField({
    name,
    title,
    type: 'string',
    fieldset,
    validation: (rule) => rule.required(),
  })

export const project = defineType({
  name: 'project',
  title: 'Completed project',
  type: 'document',
  fieldsets: [
    {
      name: 'overview',
      title: 'Project listing on Our Work',
      options: {collapsible: true, collapsed: false},
    },
    {
      name: 'hero',
      title: 'Project heading and main photo',
      options: {collapsible: true, collapsed: true},
    },
    {name: 'story', title: 'Project story', options: {collapsible: true, collapsed: true}},
    {
      name: 'features',
      title: 'Systems and features',
      options: {collapsible: true, collapsed: true},
    },
    {name: 'gallery', title: 'Photo gallery', options: {collapsible: true, collapsed: true}},
    {name: 'outcome', title: 'Project outcome', options: {collapsible: true, collapsed: true}},
    {
      name: 'cta',
      title: 'Consultation at the bottom of the page',
      options: {collapsible: true, collapsed: true},
    },
    {
      name: 'seo',
      title: 'Search title and description',
      options: {collapsible: true, collapsed: true},
    },
  ],
  fields: [
    requiredText('Project name', 'title', 'overview'),
    defineField({
      name: 'slug',
      title: 'Page address',
      type: 'slug',
      fieldset: 'overview',
      description: 'Use Generate when adding a new project. Avoid changing this after publishing.',
      options: {source: 'title', maxLength: 70},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      fieldset: 'overview',
      description: 'Lower numbers appear first on the Our Work page.',
      initialValue: 50,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({name: 'projectType', title: 'Project type', type: 'string', fieldset: 'overview'}),
    defineField({name: 'location', title: 'Location', type: 'string', fieldset: 'overview'}),
    ...paragraphFields('cardSummary', 'Our Work summary', {
      fieldset: 'overview',
      required: true,
      maxLength: 500,
    }),
    defineField({
      name: 'award',
      title: 'Award label',
      type: 'string',
      fieldset: 'overview',
      description: 'Optional. Shown over the project image.',
    }),
    requiredText('Main heading', 'heroTitleBefore', 'hero'),
    defineField({
      name: 'heroTitleEmphasis',
      title: 'Italic words',
      type: 'string',
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroTitleAfter',
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'hero',
    }),
    ...paragraphFields('heroSummary', 'Opening summary', {fieldset: 'hero', required: true}),
    defineField({
      name: 'heroImage',
      title: 'Main photo (also shown on Our Work)',
      type: 'image',
      fieldset: 'hero',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Image description',
          type: 'string',
          description: 'Describe what is visible for accessibility and search.',
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroCreditLabel',
      title: 'Main image credit',
      type: 'string',
      fieldset: 'hero',
    }),
    defineField({
      name: 'heroCreditUrl',
      title: 'Main image credit link',
      type: 'url',
      fieldset: 'hero',
    }),
    defineField({
      name: 'facts',
      title: 'Quick facts',
      type: 'array',
      fieldset: 'hero',
      validation: (rule) => rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fact',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
    }),
    defineField({name: 'storyKicker', title: 'Small heading', type: 'string', fieldset: 'story'}),
    requiredText('Story heading', 'storyHeadingBefore', 'story'),
    defineField({
      name: 'storyHeadingEmphasis',
      title: 'Italic words',
      type: 'string',
      fieldset: 'story',
    }),
    defineField({
      name: 'storyHeadingAfter',
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'story',
    }),
    ...paragraphFields('storyParagraphs', 'Project story', {
      fieldset: 'story',
      required: true,
      legacyList: true,
    }),
    defineField({
      name: 'featuresHeading',
      title: 'Section heading',
      type: 'string',
      fieldset: 'features',
    }),
    ...paragraphFields('featuresSummary', 'Section summary', {fieldset: 'features'}),
    defineField({
      name: 'features',
      title: 'Systems and features',
      type: 'array',
      fieldset: 'features',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'feature',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            ...paragraphFields('description', 'Description', {required: true}),
          ],
          preview: {
            select: {title: 'title', original: 'description', formatted: 'descriptionFormatted'},
            prepare({title, original, formatted}) {
              return {title, subtitle: formatted == null ? original : formattedText(formatted)}
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'galleryHeading',
      title: 'Small heading',
      type: 'string',
      fieldset: 'gallery',
    }),
    ...paragraphFields('gallerySummary', 'Gallery introduction', {fieldset: 'gallery'}),
    defineField({
      name: 'gallery',
      title: 'Project images',
      type: 'array',
      fieldset: 'gallery',
      options: {layout: 'grid'},
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'galleryImage',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'alt',
              title: 'Image description',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({name: 'caption', title: 'Caption', type: 'string'}),
            defineField({
              name: 'wide',
              title: 'Use wide layout',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {select: {title: 'caption', subtitle: 'alt', media: 'image'}},
        }),
      ],
    }),
    defineField({
      name: 'galleryCreditLabel',
      title: 'Gallery credit',
      type: 'string',
      fieldset: 'gallery',
    }),
    defineField({
      name: 'galleryCreditUrl',
      title: 'Gallery credit link',
      type: 'url',
      fieldset: 'gallery',
    }),
    defineField({
      name: 'outcomeQuoteBefore',
      title: 'Outcome quote',
      type: 'string',
      fieldset: 'outcome',
    }),
    defineField({
      name: 'outcomeQuoteEmphasis',
      title: 'Italic words',
      type: 'string',
      fieldset: 'outcome',
    }),
    defineField({
      name: 'outcomeQuoteAfter',
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'outcome',
    }),
    ...paragraphFields('outcomeBody', 'Outcome text', {fieldset: 'outcome'}),
    defineField({
      name: 'outcomeCredit',
      title: 'Outcome credit',
      type: 'string',
      fieldset: 'outcome',
    }),
    defineField({
      name: 'ctaEyebrow',
      title: 'Call-to-action label',
      type: 'string',
      fieldset: 'cta',
    }),
    defineField({
      name: 'ctaTitleBefore',
      title: 'Call-to-action heading',
      type: 'string',
      fieldset: 'cta',
    }),
    defineField({name: 'ctaTitleEmphasis', title: 'Italic words', type: 'string', fieldset: 'cta'}),
    defineField({
      name: 'ctaTitleAfter',
      title: 'Words after italics (optional)',
      type: 'string',
      fieldset: 'cta',
    }),
    ...paragraphFields('ctaBody', 'Call-to-action text', {fieldset: 'cta'}),
    defineField({
      name: 'ctaButton',
      title: 'Button wording',
      type: 'string',
      fieldset: 'cta',
      initialValue: 'Free consultation',
    }),
    defineField({
      name: 'seoTitle',
      title: 'Search title',
      type: 'string',
      fieldset: 'seo',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      type: 'text',
      rows: 3,
      fieldset: 'seo',
      validation: (rule) => rule.max(170),
    }),
  ],
  orderings: [
    {title: 'Website order', name: 'websiteOrder', by: [{field: 'order', direction: 'asc'}]},
    {title: 'Newest edited', name: 'updatedAt', by: [{field: '_updatedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', subtitle: 'location', media: 'heroImage'},
  },
})
