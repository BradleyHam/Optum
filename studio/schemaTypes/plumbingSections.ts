import {defineArrayMember, defineField} from 'sanity'
import type {ConditionalPropertyCallbackContext} from 'sanity'

// Extra sections that only exist on the plumbing page. They are hidden on every
// other page's wording document. The website build (scripts/plumbing-sections.mjs)
// puts this wording into the page; images and layout stay as they are.
const onlyPlumbing = ({document}: ConditionalPropertyCallbackContext) => document?.pageKey !== 'plumbing'

const collapsed = {collapsible: true, collapsed: true}
export const plumbingFieldsets = [
  {name: 'form', title: 'Enquiry form', hidden: onlyPlumbing, options: collapsed},
  {name: 'services', title: 'Services list', hidden: onlyPlumbing, options: collapsed},
  {name: 'emergency', title: 'Emergency panel', hidden: onlyPlumbing, options: collapsed},
  {name: 'owners', title: 'Meet the owners', hidden: onlyPlumbing, options: collapsed},
  {name: 'reviews', title: 'Reviews', hidden: onlyPlumbing, options: collapsed},
  {name: 'faq', title: 'FAQs', hidden: onlyPlumbing, options: collapsed},
]

const text = (name: string, title: string, fieldset: string, description?: string, rows = 3) =>
  defineField({name, title, type: 'text', rows, fieldset, description, hidden: onlyPlumbing})
const line = (name: string, title: string, fieldset: string, description?: string) =>
  defineField({name, title, type: 'string', fieldset, description, hidden: onlyPlumbing})

export const plumbingFields = [
  // Top of page
  text('heroQuote', 'Review quote', 'hero', 'The short review under the opening text. Leave out the quote marks.', 2),
  line('heroQuoteCredit', 'Review credit', 'hero', 'For example: Simon Pascoe · 5.0 on Google'),

  // Enquiry form
  line('formTitle', 'Form heading', 'form'),
  line('formMessageLabel', 'First question', 'form', 'The label above the first box.'),
  line('formMessagePlaceholder', 'Example answer', 'form', 'The grey hint text inside the first box.'),
  line('formButton', 'Send button wording', 'form'),
  line('formSuccessTitle', 'Thank-you heading', 'form', 'Shown after someone sends the form.'),
  text('formSuccessBody', 'Thank-you message', 'form', 'Phone numbers become tap-to-call links automatically.'),

  // Services
  line('servicesEyebrow', 'Small heading', 'services'),
  defineField({
    name: 'services',
    title: 'Services',
    type: 'array',
    fieldset: 'services',
    hidden: onlyPlumbing,
    description:
      'Drag to reorder. The first and third services show a photo beside them, so keep those in place if you want the photos to match.',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'service',
        fields: [
          defineField({name: 'title', title: 'Service', type: 'string', validation: (rule) => rule.required()}),
          defineField({name: 'body', title: 'Description', type: 'text', rows: 3, validation: (rule) => rule.required()}),
        ],
        preview: {select: {title: 'title', subtitle: 'body'}},
      }),
    ],
  }),

  // Emergency panel
  line('emergencyKicker', 'Small heading', 'emergency'),
  line('emergencyTitleBefore', 'Main heading', 'emergency'),
  line('emergencyTitleEmphasis', 'Highlighted ending', 'emergency', 'The italic word(s) at the end of the heading.'),
  text('emergencyBody', 'Supporting text', 'emergency'),

  // Owners
  line('ownersEyebrow', 'Small heading', 'owners'),
  line('ownersTitleBefore', 'Main heading', 'owners'),
  line('ownersTitleEmphasis', 'Highlighted ending', 'owners', 'The italic word(s) at the end of the heading.'),
  text('ownersLead', 'Opening paragraph', 'owners', undefined, 4),
  text('ownersBody', 'Second paragraph', 'owners'),
  line('ownersCaption', 'Photo caption', 'owners'),
  defineField({
    name: 'ownersFacts',
    title: 'Key facts',
    type: 'array',
    fieldset: 'owners',
    hidden: onlyPlumbing,
    description: 'The large numbers under the text. Two or three works best.',
    validation: (rule) => rule.max(3),
    of: [
      defineArrayMember({
        type: 'object',
        name: 'fact',
        fields: [
          defineField({name: 'value', title: 'Number or short fact', type: 'string', validation: (rule) => rule.required()}),
          defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
        ],
        preview: {select: {title: 'value', subtitle: 'label'}},
      }),
    ],
  }),
  line('ownersLinkLabel', 'Link wording', 'owners', 'The link to the About page.'),

  // Reviews
  line('reviewsEyebrow', 'Small heading', 'reviews'),
  line('reviewsTitle', 'Main heading', 'reviews'),
  text('reviewsIntro', 'Supporting text', 'reviews'),
  defineField({
    name: 'reviews',
    title: 'Reviews',
    type: 'array',
    fieldset: 'reviews',
    hidden: onlyPlumbing,
    description: 'Only use genuine reviews, copied word for word. The first review is shown larger.',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'review',
        fields: [
          defineField({
            name: 'quote',
            title: 'Review',
            type: 'text',
            rows: 3,
            description: 'Leave out the quote marks.',
            validation: (rule) => rule.required(),
          }),
          defineField({
            name: 'highlight',
            title: 'Words to show in italics',
            type: 'string',
            description: 'Optional. Copy a few words exactly as they appear in the review.',
          }),
          defineField({name: 'name', title: 'Reviewer name', type: 'string', validation: (rule) => rule.required()}),
          defineField({
            name: 'source',
            title: 'Where it came from',
            type: 'string',
            description: 'For example: Google review',
          }),
        ],
        preview: {select: {title: 'name', subtitle: 'quote'}},
      }),
    ],
  }),

  // FAQs
  line('faqEyebrow', 'Small heading', 'faq'),
  line('faqTitleBefore', 'Main heading', 'faq'),
  line('faqTitleEmphasis', 'Highlighted ending', 'faq', 'The italic word(s) at the end of the heading.'),
  text('faqIntro', 'Supporting text', 'faq', 'Phone numbers become tap-to-call links automatically.', 2),
  defineField({
    name: 'faqs',
    title: 'Questions',
    type: 'array',
    fieldset: 'faq',
    hidden: onlyPlumbing,
    description:
      'Drag to reorder. These also show to Google as FAQs, so answer the question directly in the first sentence.',
    of: [
      defineArrayMember({
        type: 'object',
        name: 'faq',
        fields: [
          defineField({name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required()}),
          defineField({
            name: 'answer',
            title: 'Answer',
            type: 'text',
            rows: 4,
            description: 'Phone numbers become tap-to-call links automatically.',
            validation: (rule) => rule.required(),
          }),
        ],
        preview: {select: {title: 'question', subtitle: 'answer'}},
      }),
    ],
  }),
]
