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

// Plumbing page sections added after the first import (see scripts/plumbing-sections.mjs).
const sectionFields = new Set([
  'heroQuote', 'heroQuoteCredit',
  'formTitle', 'formMessageLabel', 'formMessagePlaceholder', 'formButton', 'formSuccessTitle', 'formSuccessBody',
  'servicesEyebrow', 'services',
  'emergencyKicker', 'emergencyTitleBefore', 'emergencyTitleEmphasis', 'emergencyBody',
  'ownersEyebrow', 'ownersTitleBefore', 'ownersTitleEmphasis', 'ownersLead', 'ownersBody', 'ownersCaption',
  'ownersFacts', 'ownersLinkLabel',
  'reviewsEyebrow', 'reviewsTitle', 'reviewsIntro', 'reviews',
  'faqEyebrow', 'faqTitleBefore', 'faqTitleEmphasis', 'faqIntro', 'faqs',
])

// Sanity needs a _key on every item in a list (FAQs, services, reviews, facts).
const arrayTypes = {services: 'service', ownersFacts: 'fact', reviews: 'review', faqs: 'faq'}
function withKeys(page) {
  const result = {...page}
  for (const [field, type] of Object.entries(arrayTypes)) {
    if (!Array.isArray(result[field])) continue
    result[field] = result[field].map((item, index) => {
      const clean = Object.fromEntries(Object.entries(item).filter(([, value]) => value !== ''))
      return {_key: `${type}-${index + 1}`, _type: type, ...clean}
    })
  }
  return result
}

for (const page of content.sitePages) {
  const documentId = `page.${page.pageKey}`
  const fields = withKeys(page)
  if (existingIds.has(documentId)) {
    // Fill in sections added since the first import without touching anything
    // that has already been edited in the Studio.
    const missing = Object.fromEntries(
      Object.entries(fields).filter(([key, value]) => sectionFields.has(key) && value !== '' && value != null),
    )
    const before = await client.getDocument(documentId)
    const added = Object.keys(missing).filter((key) => before?.[key] === undefined)
    if (added.length) {
      await client.patch(documentId).setIfMissing(missing).commit()
      console.log(`Added ${added.length} new fields to ${page.pageTitle}: ${added.join(', ')}`)
    }
    continue
  }
  await client.createOrReplace({
    _id: documentId,
    _type: 'pageContent',
    ...fields,
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
