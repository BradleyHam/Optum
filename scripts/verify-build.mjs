import {access, readFile, readdir, stat} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {load} from 'cheerio'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist')
const fallback = JSON.parse(await readFile(path.join(root, 'content', 'fallback.json'), 'utf8'))
const errors = []

const exists = async (file) => {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

const htmlFiles = (await readdir(output)).filter((file) => file.endsWith('.html'))
const expectedPages = [
  'index.html',
  'heating.html',
  'plumbing.html',
  'ventilation.html',
  'servicing.html',
  'about.html',
  'contact.html',
  'our-work.html',
  ...fallback.projects.map((project) => `project-${project.slug}.html`),
]

for (const expected of expectedPages) {
  if (!htmlFiles.includes(expected)) errors.push(`Missing page: ${expected}`)
}

for (const file of htmlFiles) {
  const absolute = path.join(output, file)
  const html = await readFile(absolute, 'utf8')
  const $ = load(html)
  if (!$('title').first().text().trim()) errors.push(`${file}: missing page title`)
  if (!$('h1, .hero-title, .contact-main h2').first().text().trim()) errors.push(`${file}: missing main heading`)
  if (/\b(?:undefined|null)\b/.test(html)) errors.push(`${file}: contains an undefined or null value`)

  for (const element of $('img[src], video[src]').toArray()) {
    const source = $(element).attr('src')
    if (!source || /^(?:https?:|data:|\/\/)/.test(source)) continue
    const localPath = path.join(output, source.split(/[?#]/)[0])
    if (!(await exists(localPath))) errors.push(`${file}: missing media ${source}`)
  }

  for (const element of $('a[href]').toArray()) {
    const href = $(element).attr('href')
    if (!href || !href.includes('.html') || /^(?:https?:|mailto:|tel:|\/\/)/.test(href)) continue
    const target = href.split(/[?#]/)[0]
    if (!(await exists(path.join(output, target)))) errors.push(`${file}: broken link ${href}`)
  }
}

const work$ = load(await readFile(path.join(output, 'our-work.html'), 'utf8'))
if (work$('.work-card').length !== fallback.projects.length) {
  errors.push(`Our Work contains ${work$('.work-card').length} cards; expected ${fallback.projects.length}`)
}

for (const project of fallback.projects) {
  const $ = load(await readFile(path.join(output, `project-${project.slug}.html`), 'utf8'))
  if ($('.project-gallery-item').length !== project.gallery.length) {
    errors.push(`${project.slug}: gallery image count changed during generation`)
  }
  if ($('.project-system').length !== project.features.length) {
    errors.push(`${project.slug}: system feature count changed during generation`)
  }
}

// Restored advice articles must exist at their original URLs, with a title,
// a heading, a canonical pointing at that URL, and a link back to the advice hub.
const articles = JSON.parse(await readFile(path.join(root, 'content', 'articles.json'), 'utf8'))
if (!(await exists(path.join(output, 'advice.html')))) errors.push('Missing page: advice.html')
for (const article of articles) {
  const file = path.join(output, 'article', article.slug, 'index.html')
  if (!(await exists(file))) { errors.push(`Missing article: /article/${article.slug}/`); continue }
  const $ = load(await readFile(file, 'utf8'))
  if ($('h1').first().text().trim() !== article.title) errors.push(`${article.slug}: heading does not match title`)
  if ($('link[rel="canonical"]').attr('href') !== `https://www.optum.co.nz/article/${article.slug}/`) errors.push(`${article.slug}: wrong canonical`)
  if (!$('a[href="/advice.html"]').length) errors.push(`${article.slug}: no link to the advice hub`)
  for (const element of $('img[src], script[src], link[rel="stylesheet"]').toArray()) {
    const source = $(element).attr('src') || $(element).attr('href')
    if (/^(?:https?:|data:|\/\/)/.test(source)) continue
    if (!source.startsWith('/')) errors.push(`${article.slug}: relative asset ${source} breaks inside /article/`)
    else if (!(await exists(path.join(output, source.split(/[?#]/)[0])))) errors.push(`${article.slug}: missing asset ${source}`)
  }
}

// No redirect may hide a restored article.
const redirects = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8')).redirects
for (const article of articles) {
  if (redirects.some((r) => r.source.replace(/\/$/, '') === `/article/${article.slug}`)) errors.push(`${article.slug}: is also redirected`)
}

for (const sourceOnly of ['studio', 'scripts', 'content', 'node_modules', 'package.json', '.env.example']) {
  if (await exists(path.join(output, sourceOnly))) errors.push(`Source-only item leaked into dist: ${sourceOnly}`)
}

if ((await stat(output)).isDirectory() && errors.length === 0) {
  console.log(`Verified ${htmlFiles.length} pages, ${fallback.projects.length} projects, and all local links/media.`)
} else {
  console.error(errors.join('\n'))
  process.exitCode = 1
}
