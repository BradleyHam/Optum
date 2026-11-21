import {defineArrayMember, defineField, PatchEvent, set, setIfMissing, useFormValue} from 'sanity'
import type {ArrayOfObjectsInputProps, BlockDecoratorProps} from 'sanity'

type Block = {children?: {text?: string}[]}

export function formattedText(blocks: Block[]): string {
  return blocks
    .map((block) => block.children?.map((span) => span.text ?? '').join('') ?? '')
    .join('\n')
}

function existingParagraphs(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

function ParagraphInput(props: ArrayOfObjectsInputProps) {
  const legacyName = String(props.path[props.path.length - 1]).replace(/Formatted$/, '')
  const legacy = useFormValue([...props.path.slice(0, -1), legacyName])
  const paragraphs = existingParagraphs(legacy)
  return richTextInput(
    props,
    paragraphs.map((text) => [{text}]),
  )
}

export type SeedSpan = {text: string; italic?: boolean}

export function richTextInput(props: ArrayOfObjectsInputProps, seed: SeedSpan[][]) {
  if (props.value === undefined && seed.some((line) => line.some((span) => span.text))) {
    const startEditing = () =>
      props.onChange(
        setIfMissing(
          seed.map((line) => ({
            _key: crypto.randomUUID(),
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: line.map((span) => ({
              _key: crypto.randomUUID(),
              _type: 'span',
              text: span.text,
              marks: span.italic ? ['em'] : [],
            })),
          })),
        ),
      )
    return (
      <div>
        {seed.map((line, index) => (
          <p key={index} style={{whiteSpace: 'pre-wrap'}}>
            {line.map((span, i) => (span.italic ? <em key={i}>{span.text}</em> : span.text))}
          </p>
        ))}
        <button type="button" disabled={props.readOnly} onClick={startEditing}>
          Edit with formatting
        </button>
      </div>
    )
  }

  // An explicitly cleared field must stay empty on the site and when reopened.
  return props.renderDefault({
    ...props,
    onChange: (change) => {
      props.onChange(
        PatchEvent.from(change).patches.map((patch) =>
          patch.type === 'unset' && patch.path.length === 0 ? set([]) : patch,
        ),
      )
    },
  })
}

export const paragraphBlock = defineArrayMember({
  type: 'block',
  styles: [{title: 'Paragraph', value: 'normal'}],
  lists: [],
  marks: {
    decorators: [
      {
        title: 'Semibold',
        value: 'semibold',
        icon: () => <span style={{fontWeight: 600}}>Sb</span>,
        component: ({children}: BlockDecoratorProps) => (
          <span style={{fontWeight: 600}}>{children}</span>
        ),
      },
      {title: 'Bold', value: 'strong'},
      {title: 'Italic', value: 'em'},
      {title: 'Underline', value: 'underline'},
    ],
    annotations: [],
  },
})

type Options = {group?: string; required?: boolean; maxLength?: number; legacyList?: boolean}

export function paragraphFields(name: string, title: string, options: Options = {}) {
  const legacy = options.legacyList
    ? defineField({name, title, type: 'array', of: [{type: 'text'}], hidden: true})
    : defineField({name, title, type: 'text', hidden: true})
  return [
    legacy,
    defineField({
      name: name + 'Formatted',
      title,
      type: 'array',
      group: options.group,
      of: [paragraphBlock],
      components: {input: ParagraphInput},
      validation: (rule) =>
        rule.custom((blocks, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          const text =
            blocks === undefined
              ? existingParagraphs(parent?.[name]).join('\n')
              : formattedText(blocks as Block[])
          if (options.required && !text.trim()) return 'Please add some text.'
          if (options.maxLength && text.length > options.maxLength)
            return 'Use up to ' + options.maxLength + ' characters.'
          return true
        }),
    }),
  ]
}
