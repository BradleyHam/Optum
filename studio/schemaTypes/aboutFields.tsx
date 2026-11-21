import {defineField, useFormValue} from 'sanity'
import type {ArrayOfObjectsInputProps, ConditionalPropertyCallbackContext} from 'sanity'
import {paragraphBlock, richTextInput} from './paragraphFields'
import type {SeedSpan} from './paragraphFields'

export const isHome = ({document}: ConditionalPropertyCallbackContext) =>
  document?.pageKey === 'home'

export const isAbout = ({document}: ConditionalPropertyCallbackContext) =>
  document?.pageKey === 'about'

function headingSeed(before: string, emphasis: string, after: string): SeedSpan[][] {
  const parts = [{text: before}, {text: emphasis, italic: true}, {text: after}].filter(
    (part) => part.text,
  )
  return [parts.map((part, index) => ({...part, text: (index ? ' ' : '') + part.text}))]
}

function AboutHeadingInput(props: ArrayOfObjectsInputProps) {
  const before = useFormValue(['heroTitleBefore'])
  const emphasis = useFormValue(['heroTitleEmphasis'])
  const after = useFormValue(['heroTitleAfter'])
  return richTextInput(
    props,
    headingSeed(String(before ?? ''), String(emphasis ?? ''), String(after ?? '')),
  )
}

// Seed the editor with the existing website copy until Tracy first saves a formatted version.
function aboutTextField(
  name: string,
  title: string,
  seed: SeedSpan[][],
  fieldset: 'story' | 'homeAbout' = 'homeAbout',
) {
  return defineField({
    name,
    title,
    fieldset,
    type: 'array',
    of: [paragraphBlock],
    hidden: (ctx) => (fieldset === 'homeAbout' ? !isHome(ctx) : !isAbout(ctx)),
    components: {input: (props: ArrayOfObjectsInputProps) => richTextInput(props, seed)},
  })
}

export const aboutFields = [
  defineField({
    name: 'aboutHeadingFormatted',
    title: 'Main heading',
    fieldset: 'hero',
    type: 'array',
    of: [paragraphBlock],
    hidden: (ctx) => !isAbout(ctx),
    components: {input: AboutHeadingInput},
    validation: (rule) =>
      rule.custom((value, ctx) => {
        if (ctx.document?.pageKey !== 'about') return true
        if (value === undefined)
          return Boolean(ctx.document.heroTitleBefore) || 'Please add a main heading.'
        return (
          value.some((block) =>
            (block as {children?: {text?: string}[]}).children?.some((span) => span.text?.trim()),
          ) || 'Please add a main heading.'
        )
      }),
  }),
  aboutTextField(
    'aboutStoryBody',
    'Story paragraphs',
    [
      [
        {
          text: "One plumber became two teams of plumbers, gasfitters, heating specialists and solar installers. We installed Wānaka's first solar hot water system in 2010, and have worked alongside architects since long before that was common here.",
        },
      ],
      [
        {
          text: 'The people who turn up at your home tend to be the same people, year after year. Our clients ask for them by name.',
        },
      ],
    ],
    'story',
  ),
  aboutTextField(
    'homeAboutHeading',
    'Heading beside the owners’ photo',
    headingSeed('Locally owned, and quietly obsessed with getting it', 'right.', ''),
  ),
  aboutTextField('homeAboutLead', 'Opening paragraph beside the photo', [
    [
      {
        text: "Since 1996, Optum has grown from one Wānaka plumber into two local teams serving Wānaka and Queenstown—installing the town's first solar hot-water system along the way.",
      },
    ],
  ]),
  aboutTextField('homeAboutBody', 'Second paragraph beside the photo', [
    [
      {
        text: 'Our plumbers, gasfitters and heating specialists work together across the whole home. The same familiar people return year after year.',
      },
    ],
  ]),
]
