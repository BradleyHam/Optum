export const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

function spanHtml(span) {
  if (span?._type !== 'span' || typeof span.text !== 'string') return ''
  let html = escapeHtml(span.text).replaceAll('\n', '<br>')
  const marks = new Set(span.marks)
  if (marks.has('strong')) html = `<strong style="font-weight:700">${html}</strong>`
  else if (marks.has('semibold')) html = `<span style="font-weight:600">${html}</span>`
  if (marks.has('em')) html = `<em>${html}</em>`
  if (marks.has('underline')) html = `<u>${html}</u>`
  return html
}

// Published documents and offline fixtures may still contain plain text or a list of strings.
export function paragraphs(value) {
  if (typeof value === 'string') return [escapeHtml(value)]
  if (!Array.isArray(value)) return []
  return value.flatMap((block) => {
    if (typeof block === 'string') return [escapeHtml(block)]
    if (block?._type !== 'block' || !Array.isArray(block.children)) return []
    return [block.children.map(spanHtml).join('')]
  })
}

export function inlineText(value) {
  return paragraphs(value).join('<br><br>')
}

export function plainText(value) {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value.map((block) => typeof block === 'string'
    ? block
    : (block?.children || []).map((span) => span.text || '').join('')).join(' ')
}
