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

for (const sourceOnly of ['studio', 'scripts', 'content', 'node_modules', 'package.json', '.env.example']) {
  if (await exists(path.join(output, sourceOnly))) errors.push(`Source-only item leaked into dist: ${sourceOnly}`)
}

if ((await stat(output)).isDirectory() && errors.length === 0) {
  console.log(`Verified ${htmlFiles.length} pages, ${fallback.projects.length} projects, and all local links/media.`)
} else {
  console.error(errors.join('\n'))
  process.exitCode = 1
}
