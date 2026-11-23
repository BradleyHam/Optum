import {cp, mkdir, readFile, readdir, rm, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {load} from 'cheerio'
import {escapeHtml, inlineText, paragraphs, plainText} from './paragraphs.mjs'
import {applyPlumbingSections} from './plumbing-sections.mjs'

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
  'api',
  'content',
  'dist',
  'node_modules',
  'scripts',
  'studio',
])

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
  if (!token && process.env.VERCEL_ENV === 'production' && process.env.SANITY_USE_FALLBACK !== 'true') {
    throw new Error('SANITY_API_READ_TOKEN is required for the production build.')
  }
  if (!token || process.env.SANITY_USE_FALLBACK === 'true') {
    console.log('Building with checked-in fallback content.')
    return fallback
  }

  const query = `{
    "sitePages": *[_type == "pageContent"] | order(pageKey asc) {
      aboutHeadingFormatted, aboutStoryBody, homeAboutHeading, homeAboutLead, homeAboutBody,
      pageKey, pageTitle, heroEyebrow, heroTitleBefore, heroTitleEmphasis, heroTitleAfter, "heroSummary": coalesce(heroSummaryFormatted, heroSummary),
      introTitleBefore, introTitleEmphasis, introTitleAfter, "introBody": coalesce(introBodyFormatted, introBody),
      ctaEyebrow, ctaTitleBefore, ctaTitleEmphasis, ctaTitleAfter, "ctaBody": coalesce(ctaBodyFormatted, ctaBody), ctaButton,
      heroQuote, heroQuoteCredit,
      formTitle, formMessageLabel, formMessagePlaceholder, formButton, formSuccessTitle, formSuccessBody,
      servicesEyebrow, services[]{title, body},
      emergencyKicker, emergencyTitleBefore, emergencyTitleEmphasis, emergencyBody,
      ownersEyebrow, ownersTitleBefore, ownersTitleEmphasis, ownersLead, ownersBody, ownersCaption,
      ownersFacts[]{value, label}, ownersLinkLabel,
      reviewsEyebrow, reviewsTitle, reviewsIntro, reviews[]{quote, highlight, name, source},
      faqEyebrow, faqTitleBefore, faqTitleEmphasis, faqIntro, faqs[]{question, answer}
    },
    "projects": *[_type == "project"] | order(order asc) {
      title, "slug": slug.current, order, projectType, location, "cardSummary": coalesce(cardSummaryFormatted, cardSummary), award,
      heroTitleBefore, heroTitleEmphasis, heroTitleAfter, "heroSummary": coalesce(heroSummaryFormatted, heroSummary),
      "heroImage": {"url": heroImage.asset->url, "alt": heroImage.alt},
      heroCreditLabel, heroCreditUrl, facts,
      storyKicker, storyHeadingBefore, storyHeadingEmphasis, storyHeadingAfter, "storyParagraphs": coalesce(storyParagraphsFormatted, storyParagraphs),
      featuresHeading, "featuresSummary": coalesce(featuresSummaryFormatted, featuresSummary), features[]{title, "description": coalesce(descriptionFormatted, description)},
      galleryHeading, "gallerySummary": coalesce(gallerySummaryFormatted, gallerySummary),
      "gallery": gallery[]{alt, caption, wide, "url": image.asset->url},
      galleryCreditLabel, galleryCreditUrl,
      outcomeQuoteBefore, outcomeQuoteEmphasis, outcomeQuoteAfter, "outcomeBody": coalesce(outcomeBodyFormatted, outcomeBody), outcomeCredit,
      ctaEyebrow, ctaTitleBefore, ctaTitleEmphasis, ctaTitleAfter, "ctaBody": coalesce(ctaBodyFormatted, ctaBody), ctaButton,
      seoTitle, seoDescription
    }
  }`
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('perspective', 'published')
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
  const requiredPages = new Set(fallback.sitePages.map((page) => page.pageKey))
  for (const page of content.sitePages) {
    if (!requiredPages.delete(page.pageKey)) {
      throw new Error('Sanity returned an unknown or duplicate Optum page.')
    }
  }
  if (requiredPages.size !== 0) {
    throw new Error('Sanity returned incomplete Optum page content.')
  }
  const slugs = new Set()
  for (const project of content.projects) {
    if (typeof project.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || slugs.has(project.slug)) {
      throw new Error('Sanity returned an invalid or duplicate project slug.')
    }
    slugs.add(project.slug)
  }
  console.log(`Building with ${content.sitePages.length} published Sanity pages and ${content.projects.length} projects.`)
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
  if (page.ctaBody != null) closing.find('.wrap > p:not(.eyebrow)').first().html(inlineText(page.ctaBody))
  updateButton($, 'section.closing .btn', page.ctaButton)
}

async function updateEditablePage(page, legacyAbout) {
  const filename = page.pageKey === 'home' ? 'index.html' : `${page.pageKey}.html`
  const file = path.join(output, filename)
  const $ = load(await readFile(file, 'utf8'))

  if (page.pageKey === 'home') {
    $('.hero .hero-top .eyebrow').first().text(page.heroEyebrow || '')
    $('.hero .hero-title').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    $('.hero .lede').first().html(inlineText(page.heroSummary))
    const section = $('#about .about-body')
    for (const [field, selector] of [
      ['homeAboutHeading', 'h2'],
      ['homeAboutLead', 'p.lead'],
      ['homeAboutBody', 'p.lead + p'],
    ]) {
      const value = page[field] ?? legacyAbout?.[field]
      if (value != null) section.find(selector).first().html(inlineText(value))
    }
    updateButton($, '.hero .btn', page.ctaButton)
  } else if (['heating', 'plumbing', 'ventilation', 'servicing'].includes(page.pageKey)) {
    $('.page-hero .eyebrow').first().text(page.heroEyebrow || '')
    $('.page-hero .title').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    $('.page-hero .sub').first().html(inlineText(page.heroSummary))
    if (page.introTitleBefore) {
      $('.intro h1, .intro .intro-title').first().html(highlighted(page.introTitleBefore, page.introTitleEmphasis, page.introTitleAfter))
    }
    if (page.introBody != null) $('.intro .wrap > p').first().html(inlineText(page.introBody))
    if (page.pageKey === 'plumbing') applyPlumbingSections($, page)
  } else if (page.pageKey === 'about') {
    $('.about-hero .eyebrow').first().text(page.heroEyebrow || '')
    $('.about-hero h1').first().html(page.aboutHeadingFormatted == null
      ? highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter)
      : inlineText(page.aboutHeadingFormatted))
    if (page.aboutStoryBody != null) {
      const story = $('.about-story .about-body')
      story.children('p:not(.lead)').remove()
      story.children('.lead').after(paragraphs(page.aboutStoryBody).map(text => `<p>${text}</p>`).join(''))
    }
    if (page.heroSummary != null) $('.about-story .lead').first().html(inlineText(page.heroSummary))
  } else if (page.pageKey === 'our-work') {
    $('.work-hero .eyebrow').first().text(page.heroEyebrow || '')
    $('.work-hero h1').first().html(highlighted(page.heroTitleBefore, page.heroTitleEmphasis, page.heroTitleAfter))
    $('.work-hero .wrap > p:not(.eyebrow)').first().html(inlineText(page.heroSummary))
  }

  updateClosing($, page)
  await writeFile(file, $.html())
}

function renderProjectCard(project) {
  const award = project.award ? `<span class="award">${escapeHtml(project.award)}</span>` : ''
  const location = [project.projectType, project.location].filter(Boolean).join(' · ')
  return `<a class="work-card reveal" href="project-${escapeHtml(project.slug)}.html" aria-label="View ${escapeHtml(project.title)} project">
    <div class="media">${award}<img src="${escapeHtml(imageUrl(project.heroImage))}" alt="${escapeHtml(project.heroImage?.alt || project.title)}"></div>
    <h3>${escapeHtml(project.title)}</h3>
    <p class="loc">${escapeHtml(location)}</p>
    <p>${inlineText(project.cardSummary)}</p>
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
    const filename = `project-${project.slug}.html`
    let pageTemplate = template
    try {
      pageTemplate = await readFile(path.join(root, filename), 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    const $ = load(pageTemplate)
    $('link[rel="canonical"]').attr('href', `https://www.optum.co.nz/${filename}`)
    $('title').text(project.seoTitle || `${project.title} | Optum`)
    $('meta[name="description"]').attr('content', project.seoDescription || plainText(project.cardSummary))
    $('.project-hero-media img').attr({src: imageUrl(project.heroImage), alt: project.heroImage?.alt || project.title})
    setOptionalLink($, $('.project-image-credit').first(), project.heroCreditLabel, project.heroCreditUrl)
    $('.project-hero .eyebrow').first().text([project.projectType, project.location].filter(Boolean).join(' · '))
    $('.project-hero h1').first().html(highlighted(project.heroTitleBefore, project.heroTitleEmphasis, project.heroTitleAfter))
    $('.project-hero-lead').first().html(inlineText(project.heroSummary))
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
      paragraphs(project.storyParagraphs)
        .map((paragraph, paragraphIndex) => `<p${paragraphIndex === 0 ? ' class="lead"' : ''}>${paragraph}</p>`)
        .join(''),
    )
    $('.project-systems-head h2').first().text(project.featuresHeading || '')
    $('.project-systems-head p').first().html(inlineText(project.featuresSummary))
    $('.project-system-grid').html(
      (project.features || [])
        .map(
          (feature, featureIndex) =>
            `<article class="project-system"><span class="project-system-num">${String(featureIndex + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(feature.title)}</h3><p>${inlineText(feature.description)}</p></div></article>`,
        )
        .join(''),
    )
    $('.project-gallery').attr('aria-label', `${project.title} project gallery`)
    $('.project-gallery-head .eyebrow').first().text(project.galleryHeading || 'Inside the project')
    $('.project-gallery-head p:not(.eyebrow)').first().html(inlineText(project.gallerySummary))
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
    $('.project-outcome-copy p').first().html(inlineText(project.outcomeBody))
    $('.project-outcome-credit').first().text(project.outcomeCredit || '')
    updateNextLink($, '.project-next-grid > a:first-child', previous, 'Previous project', '←')
    updateNextLink($, '.project-next-grid > a:last-child', next, 'Next project', '→')
    updateClosing($, project)
    await writeFile(path.join(output, filename), $.html())
  }
}

const content = await loadContent()
await copySiteFiles()
const legacyAbout = content.sitePages.find(page => page.pageKey === 'about')
for (const page of content.sitePages) await updateEditablePage(page, legacyAbout)
await updateWorkGrid(content.projects)
await generateProjectPages(content.projects)
console.log(`Built Optum site to ${output}`)
