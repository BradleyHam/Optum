import {createReadStream} from 'node:fs'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const studioRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteRoot = path.resolve(studioRoot, '..')
const client = getCliClient({apiVersion: '2026-08-01'})
const content = JSON.parse(await readFile(path.join(siteRoot, 'content', 'fallback.json'), 'utf8'))

const existingIds = new Set(
  await client.fetch('*[_type in ["pageContent", "project"]]._id'),
)
if (existingIds.size > 0) {
  console.log(`Keeping ${existingIds.size} existing Optum documents unchanged.`)
}

async function uploadImage(source, alt) {
  const absolute = path.join(siteRoot, source)
  const asset = await client.assets.upload('image', createReadStream(absolute), {
    filename: path.basename(source),
  })
  return {
    _type: 'image',
    asset: {_type: 'reference', _ref: asset._id},
    alt,
  }
}

for (const page of content.sitePages) {
  const documentId = `page.${page.pageKey}`
  if (existingIds.has(documentId)) continue
  await client.createOrReplace({
    _id: documentId,
    _type: 'pageContent',
    ...page,
  })
  console.log(`Imported wording: ${page.pageTitle}`)
}

for (const project of content.projects) {
  const documentId = `project.${project.slug}`
  if (existingIds.has(documentId)) continue
  const heroImage = await uploadImage(project.heroImage.src, project.heroImage.alt)
  const gallery = []
  for (const [index, item] of project.gallery.entries()) {
    gallery.push({
      _key: `image-${index + 1}`,
      _type: 'galleryImage',
      image: await uploadImage(item.src, item.alt),
      alt: item.alt,
      caption: item.caption,
      wide: Boolean(item.wide),
    })
  }
  await client.createOrReplace({
    _id: documentId,
    _type: 'project',
    ...project,
    slug: {_type: 'slug', current: project.slug},
    heroImage,
    facts: project.facts.map((fact, index) => ({_key: `fact-${index + 1}`, _type: 'fact', ...fact})),
    features: project.features.map((feature, index) => ({
      _key: `feature-${index + 1}`,
      _type: 'feature',
      ...feature,
    })),
    gallery,
  })
  console.log(`Imported project: ${project.title}`)
}

console.log('Initial Optum content import complete.')
