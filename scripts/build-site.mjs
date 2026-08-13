import {cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {load} from 'cheerio'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'dist')
const projectId = process.env.SANITY_PROJECT_ID || 'n74bykst'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = '2026-08-01'

const excluded = new Set([
  '.git',
  '.github',
  '.vercel',
  '_stash',
  'content',
  'dist',
  'node_modules',
  'scripts',
  'studio',
])

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

function highlighted(before, emphasis, after) {
  const normal = escapeHtml(before)
  if (!emphasis) return [normal, escapeHtml(after)].filter(Boolean).join(' ')
  const highlightedText = `${normal}${normal ? ' ' : ''}<em>${escapeHtml(emphasis)}</em>`
  return `${highlightedText}${after ? ` ${escapeHtml(after)}` : ''}`
}

function imageUrl(image) {
  return image?.url || image?.src || ''
}

async function loadContent() {
  const fallback = JSON.parse(await readFile(path.join(root, 'content', 'fallback.json'), 'utf8'))
  const token = process.env.SANITY_API_READ_TOKEN
  if (!token || process.env.SANITY_USE_FALLBACK === 'true') {
    console.log('Building with checked-in fallback content.')
    return fallback
  }

  const query = `{
    "sitePages": *[_type == "pageContent"] | order(pageKey asc) {
      pageKey, pageTitle, heroEyebrow, heroTitleBefore, heroTitleEmphasis, heroTitleAfter, heroSummary,
      introTitleBefore, introTitleEmphasis, introTitleAfter, introBody,
      ctaEyebrow, ctaTitleBefore, ctaTitleEmphasis, ctaTitleAfter, ctaBody, ctaButton
    },
    "projects": *[_type == "project"] | order(order asc) {
      title, "slug": slug.current, order, projectType, location, cardSummary, award,
      heroTitleBefore, heroTitleEmphasis, heroTitleAfter, heroSummary,
      "heroImage": {"url": heroImage.asset->url, "alt": heroImage.alt},
      heroCreditLabel, heroCreditUrl, facts,
      storyKicker, storyHeadingBefore, storyHeadingEmphasis, storyHeadingAfter, storyParagraphs,
      featuresHeading, featuresSummary, features,
      galleryHeading, gallerySummary,
      "gallery": gallery[]{alt, caption, wide, "url": image.asset->url},
      galleryCreditLabel, galleryCreditUrl,
      outcomeQuoteBefore, outcomeQuoteEmphasis, outcomeQuoteAfter, outcomeBody, outcomeCredit,
      ctaEyebrow, ctaTitleBefore, ctaTitleEmphasis, ctaTitleAfter, ctaBody, ctaButton,
      seoTitle, seoDescription
    }
  }`
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', query)
  const response = await fetch(url, {headers: {Authorization: `Bearer ${token}`}})
  if (!response.ok) {
    throw new Error(`Sanity content request failed (${response.status}).`)
  }
  const body = await response.json()
  const content = body.result
  if (!content?.projects?.length || !content?.sitePages?.length) {
    throw new Error('Sanity returned incomplete Optum content; the build was stopped to protect the live site.')
  }
  console.log(`Building with ${content.projects.length} published Sanity projects.`)
  return content
}

async function copySiteFiles() {
  await rm(output, {recursive: true, force: true})
  await mkdir(output, {recursive: true})
  for (const entry of await readdir(root)) {
    if (entry.startsWith('.')) continue
    if (excluded.has(entry) || entry === '.DS_Store' || entry.startsWith('package')) continue
    if (entry.endsWith('.md') || entry === 'vercel.json') continue
    const source = path.join(root, entry)
    const details = await stat(source)
    if (details.isDirectory() || details.isFile()) {
      await cp(source, path.join(output, entry), {recursive: true})
    }
  }
}

function updateButton($, selector, label) {
  if (!label) return
  const button = $(selector).first()
  if (!button.length) return
  button.html(`${escapeHtml(label)} <span class="arw" aria-hidden="true">→</span>`)
}

function updateClosing($, page) {
  const closing = $('section.closing').last()
  if (!closing.length) return
  if (page.ctaEyebrow) closing.find('.eyebrow').first().text(page.ctaEyebrow)
  if (page.ctaTitleBefore) {
    closing.find('h2').first().html(highlighted(page.ctaTitleBefore, page.ctaTitleEmphasis, page.ctaTitleAfter))
  }
  if (page.ctaBody) closing.find('.wrap > p:not(.eyebrow)').first().text(page.ctaBody)
  updateButton($, 'section.closing .btn', page.ctaButton)
}

async function updateEditablePage(page) {
  const filename = page.pageKey === 'home' ? 'index.html' : `${page.pageKey}.html`
  const file = path.join(output, filename)
  const $ = load(await readFile(file, 'utf8'))

  if (page.pageKey === 'home') {
    $('.hero .hero-top .eyebrow').first().text(page.heroEyebrow || '')
    $('.hero .hero-title').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    $('.hero .lede').first().text(page.heroSummary || '')
    updateButton($, '.hero .btn', page.ctaButton)
  } else if (['heating', 'plumbing', 'ventilation', 'servicing'].includes(page.pageKey)) {
    $('.page-hero .eyebrow').first().text(page.heroEyebrow || '')
    $('.page-hero .title').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    $('.page-hero .sub').first().text(page.heroSummary || '')
    if (page.introTitleBefore) {
      $('.intro h1').first().html(highlighted(page.introTitleBefore, page.introTitleEmphasis, page.introTitleAfter))
    }
    if (page.introBody) $('.intro .wrap > p').first().text(page.introBody)
    updateClosing($, page)
  } else if (page.pageKey === 'about') {
    $('.about-hero .eyebrow').first().text(page.heroEyebrow || '')
    $('.about-hero h1').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    if (page.heroSummary) $('.about-story .lead').first().text(page.heroSummary)
    updateClosing($, page)
  } else if (page.pageKey === 'our-work') {
    $('.work-hero .eyebrow').first().text(page.heroEyebrow || '')
    $('.work-hero h1').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    $('.work-hero .wrap > p:not(.eyebrow)').first().text(page.heroSummary || '')
    updateClosing($, page)
  }

  await writeFile(file, $.html())
}

function renderProjectCard(project) {
  const award = project.award ? `<span class="award">${escapeHtml(project.award)}</span>` : ''
  const location = [project.projectType, project.location].filter(Boolean).join(' · ')
  return `<a class="work-card reveal" href="project-${escapeHtml(project.slug)}.html" aria-label="View ${escapeHtml(project.title)} project">
    <div class="media">${award}<img src="${escapeHtml(imageUrl(project.heroImage))}" alt="${escapeHtml(project.heroImage?.alt || project.title)}"></div>
    <h3>${escapeHtml(project.title)}</h3>
    <p class="loc">${escapeHtml(location)}</p>
    <p>${escapeHtml(project.cardSummary)}</p>
    <span class="work-card-link">View project <span aria-hidden="true">→</span></span>
  </a>`
}

async function updateWorkGrid(projects) {
  const file = path.join(output, 'our-work.html')
  const $ = load(await readFile(file, 'utf8'))
  $('.work-grid').first().html(projects.map(renderProjectCard).join('\n'))
  await writeFile(file, $.html())
}

function setOptionalLink($, element, label, url) {
  if (!label || !url) {
    element.remove()
    return
  }
  element.text(label).attr('href', url)
}

function updateNextLink($, selector, project, label, arrow) {
  const link = $(selector)
  link.attr('href', `project-${project.slug}.html`)
  link.find('img').attr({src: imageUrl(project.heroImage), alt: ''})
  link.find('.project-next-label').text(label)
  link.find('.project-next-title').text(project.title)
  link.find('.project-next-arrow').text(arrow)
}

async function generateProjectPages(projects) {
  for (const entry of await readdir(output)) {
    if (/^project-.*\.html$/.test(entry)) await rm(path.join(output, entry))
  }
  const template = await readFile(path.join(root, 'project-west-meadows.html'), 'utf8')

  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index]
    const previous = projects[(index - 1 + projects.length) % projects.length]
    const next = projects[(index + 1) % projects.length]
    const $ = load(template)
    $('title').text(project.seoTitle || `${project.title} | Optum`)
    $('meta[name="description"]').attr('content', project.seoDescription || project.cardSummary)
    $('.project-hero-media img').attr({src: imageUrl(project.heroImage), alt: project.heroImage?.alt || project.title})
    setOptionalLink($, $('.project-image-credit').first(), project.heroCreditLabel, project.heroCreditUrl)
    $('.project-hero .eyebrow').first().text([project.projectType, project.location].filter(Boolean).join(' · '))
    $('.project-hero h1').first().html(highlighted(project.heroTitleBefore, project.heroTitleEmphasis, project.heroTitleAfter))
    $('.project-hero-lead').first().text(project.heroSummary)
    const award = $('.project-award')
    if (project.award) {
      if (award.length) award.text(project.award)
      else $('.project-hero .wrap').first().append(`<span class="project-award">${escapeHtml(project.award)}</span>`)
    } else {
      award.remove()
    }
    $('.project-facts-grid').html(
      (project.facts || [])
        .map((fact) => `<dl class="project-fact"><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></dl>`)
        .join(''),
    )
    $('.project-kicker').first().text(project.storyKicker || 'The brief')
    $('.project-intro h2').first().html(highlighted(project.storyHeadingBefore, project.storyHeadingEmphasis, project.storyHeadingAfter))
    $('.project-copy').html(
      (project.storyParagraphs || [])
        .map((paragraph, paragraphIndex) => `<p${paragraphIndex === 0 ? ' class="lead"' : ''}>${escapeHtml(paragraph)}</p>`)
        .join(''),
    )
    $('.project-systems-head h2').first().text(project.featuresHeading || '')
    $('.project-systems-head p').first().text(project.featuresSummary || '')
    $('.project-system-grid').html(
      (project.features || [])
        .map(
          (feature, featureIndex) =>
            `<article class="project-system"><span class="project-system-num">${String(featureIndex + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.description)}</p></div></article>`,
        )
        .join(''),
    )
    $('.project-gallery').attr('aria-label', `${project.title} project gallery`)
    $('.project-gallery-head .eyebrow').first().text(project.galleryHeading || 'Inside the project')
    $('.project-gallery-head p:not(.eyebrow)').first().text(project.gallerySummary || '')
    $('.project-gallery-grid').html(
      (project.gallery || [])
        .map(
          (item) =>
            `<figure class="project-gallery-item${item.wide ? ' project-gallery-item--wide' : ''}"><img src="${escapeHtml(imageUrl(item))}" alt="${escapeHtml(item.alt || '')}" loading="lazy">${item.caption ? `<figcaption class="project-gallery-caption">${escapeHtml(item.caption)}</figcaption>` : ''}</figure>`,
        )
        .join(''),
    )
    const galleryCredit = $('.project-gallery-credit').first()
    if (project.galleryCreditLabel && project.galleryCreditUrl) {
      galleryCredit.html(
        `Imagery supplied by <a href="${escapeHtml(project.galleryCreditUrl)}" target="_blank" rel="noopener">${escapeHtml(project.galleryCreditLabel)}</a>.`,
      )
    } else {
      galleryCredit.remove()
    }
    $('.project-outcome blockquote').first().html(highlighted(project.outcomeQuoteBefore, project.outcomeQuoteEmphasis, project.outcomeQuoteAfter))
    $('.project-outcome-copy p').first().text(project.outcomeBody || '')
    $('.project-outcome-credit').first().text(project.outcomeCredit || '')
    updateNextLink($, '.project-next-grid > a:first-child', previous, 'Previous project', '←')
    updateNextLink($, '.project-next-grid > a:last-child', next, 'Next project', '→')
    updateClosing($, project)
    await writeFile(path.join(output, `project-${project.slug}.html`), $.html())
  }
}

const content = await loadContent()
await copySiteFiles()
for (const page of content.sitePages) await updateEditablePage(page)
await updateWorkGrid(content.projects)
await generateProjectPages(content.projects)
console.log(`Built Optum site to ${output}`)
