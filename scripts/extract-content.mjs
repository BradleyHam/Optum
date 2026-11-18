import {readFile, writeFile, mkdir} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {load} from 'cheerio'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const text = ($, selector) => $(selector).first().text().trim()
const nullable = (value) => value || undefined

function splitEmphasis($element) {
  const html = $element.html() || ''
  const match = html.match(/^(.*?)<em(?:\s[^>]*)?>(.*?)<\/em>(.*)$/s)
  if (!match) {
    return {before: $element.text().replace(/\s+/g, ' ').trim(), emphasis: undefined, after: undefined}
  }
  const fragmentText = (fragment) => load(`<div>${fragment}</div>`)('div').text().replace(/\s+/g, ' ').trim()
  return {
    before: fragmentText(match[1]),
    emphasis: nullable(fragmentText(match[2])),
    after: nullable(fragmentText(match[3])),
  }
}

function buttonText($element) {
  const clone = $element.clone()
  clone.find('.arw').remove()
  return clone.text().replace(/\s+/g, ' ').trim()
}

function closingContent($) {
  const section = $('section.closing').last()
  const heading = splitEmphasis(section.find('h2').first())
  return {
    ctaEyebrow: nullable(section.find('.eyebrow').first().text().trim()),
    ctaTitleBefore: nullable(heading.before),
    ctaTitleEmphasis: heading.emphasis,
    ctaTitleAfter: heading.after,
    ctaBody: nullable(section.find('.wrap > p:not(.eyebrow)').first().text().trim()),
    ctaButton: nullable(buttonText(section.find('.btn').first())),
  }
}

async function extractPage(key, filename) {
  const $ = load(await readFile(path.join(root, filename), 'utf8'))
  let hero
  let intro = {}

  if (key === 'home') {
    const heading = splitEmphasis($('.hero .hero-title').first())
    hero = {
      heroEyebrow: text($, '.hero .hero-top .eyebrow'),
      heroTitleBefore: heading.before,
      heroTitleEmphasis: heading.emphasis,
      heroTitleAfter: heading.after,
      heroSummary: text($, '.hero .lede'),
    }
  } else if (['heating', 'plumbing', 'ventilation', 'servicing'].includes(key)) {
    const heading = splitEmphasis($('.page-hero .title').first())
    const introHeading = splitEmphasis($('.intro h1').first())
    hero = {
      heroEyebrow: text($, '.page-hero .eyebrow'),
      heroTitleBefore: heading.before,
      heroTitleEmphasis: heading.emphasis,
      heroTitleAfter: heading.after,
      heroSummary: text($, '.page-hero .sub'),
    }
    intro = {
      introTitleBefore: introHeading.before,
      introTitleEmphasis: introHeading.emphasis,
      introTitleAfter: introHeading.after,
      introBody: text($, '.intro .wrap > p'),
    }
  } else if (key === 'about') {
    const heading = splitEmphasis($('.about-hero h1').first())
    hero = {
      heroEyebrow: text($, '.about-hero .eyebrow'),
      heroTitleBefore: heading.before,
      heroTitleEmphasis: heading.emphasis,
      heroTitleAfter: heading.after,
      heroSummary: text($, '.about-story .lead'),
    }
  } else {
    const heading = splitEmphasis($('.work-hero h1').first())
    hero = {
      heroEyebrow: text($, '.work-hero .eyebrow'),
      heroTitleBefore: heading.before,
      heroTitleEmphasis: heading.emphasis,
      heroTitleAfter: heading.after,
      heroSummary: text($, '.work-hero .wrap > p:not(.eyebrow)'),
    }
  }

  return {
    pageKey: key,
    pageTitle: key === 'our-work' ? 'Our Work' : key[0].toUpperCase() + key.slice(1),
    ...hero,
    ...intro,
    ...closingContent($),
  }
}

async function extractProjects() {
  const work$ = load(await readFile(path.join(root, 'our-work.html'), 'utf8'))
  const cards = new Map()
  work$('.work-card').each((index, element) => {
    const card = work$(element)
    cards.set(card.attr('href'), {
      order: (index + 1) * 10,
      title: card.find('h3').text().trim(),
      cardSummary: card.find('p:not(.loc)').first().text().trim(),
      award: nullable(card.find('.award').text().trim()),
    })
  })

  const files = [...cards.keys()]
  return Promise.all(
    files.map(async (filename) => {
      const $ = load(await readFile(path.join(root, filename), 'utf8'))
      const card = cards.get(filename)
      const slug = filename.replace(/^project-/, '').replace(/\.html$/, '')
      const heroHeading = splitEmphasis($('.project-hero h1').first())
      const storyHeading = splitEmphasis($('.project-intro h2').first())
      const outcomeQuote = splitEmphasis($('.project-outcome blockquote').first())
      const ctaHeading = splitEmphasis($('section.closing h2').first())
      const eyebrow = text($, '.project-hero .eyebrow').split('·').map((part) => part.trim())
      const heroCredit = $('.project-image-credit').first()
      const galleryCredit = $('.project-gallery-credit a').first()
      const metaDescription = $('meta[name="description"]').attr('content')?.trim()

      return {
        slug,
        order: card.order,
        title: card.title,
        projectType: nullable(eyebrow[0]),
        location: nullable(eyebrow.slice(1).join(' · ')),
        cardSummary: card.cardSummary,
        award: card.award,
        heroTitleBefore: heroHeading.before,
        heroTitleEmphasis: heroHeading.emphasis,
        heroTitleAfter: heroHeading.after,
        heroSummary: text($, '.project-hero-lead'),
        heroImage: {
          src: $('.project-hero-media img').attr('src'),
          alt: $('.project-hero-media img').attr('alt') || card.title,
        },
        heroCreditLabel: nullable(heroCredit.text().trim()),
        heroCreditUrl: nullable(heroCredit.attr('href')),
        facts: $('.project-fact')
          .toArray()
          .map((element) => ({label: $(element).find('dt').text().trim(), value: $(element).find('dd').text().trim()})),
        storyKicker: text($, '.project-kicker'),
        storyHeadingBefore: storyHeading.before,
        storyHeadingEmphasis: storyHeading.emphasis,
        storyHeadingAfter: storyHeading.after,
        storyParagraphs: $('.project-copy p')
          .toArray()
          .map((element) => $(element).text().trim()),
        featuresHeading: text($, '.project-systems-head h2'),
        featuresSummary: text($, '.project-systems-head p'),
        features: $('.project-system')
          .toArray()
          .map((element) => ({
            title: $(element).find('h3').text().trim(),
            description: $(element).find('p').text().trim(),
          })),
        galleryHeading: text($, '.project-gallery-head .eyebrow'),
        gallerySummary: text($, '.project-gallery-head p:not(.eyebrow)'),
        gallery: $('.project-gallery-item')
          .toArray()
          .map((element) => ({
            src: $(element).find('img').attr('src'),
            alt: $(element).find('img').attr('alt') || '',
            caption: nullable($(element).find('figcaption').text().trim()),
            wide: $(element).hasClass('project-gallery-item--wide'),
          })),
        galleryCreditLabel: nullable(galleryCredit.text().trim()),
        galleryCreditUrl: nullable(galleryCredit.attr('href')),
        outcomeQuoteBefore: outcomeQuote.before,
        outcomeQuoteEmphasis: outcomeQuote.emphasis,
        outcomeQuoteAfter: outcomeQuote.after,
        outcomeBody: text($, '.project-outcome-copy p'),
        outcomeCredit: text($, '.project-outcome-credit'),
        ctaEyebrow: text($, 'section.closing .eyebrow'),
        ctaTitleBefore: ctaHeading.before,
        ctaTitleEmphasis: ctaHeading.emphasis,
        ctaTitleAfter: ctaHeading.after,
        ctaBody: text($, 'section.closing .wrap > p:not(.eyebrow)'),
        ctaButton: buttonText($('section.closing .btn').first()),
        seoTitle: text($, 'title'),
        seoDescription: nullable(metaDescription),
      }
    }),
  )
}

const pageFiles = {
  home: 'index.html',
  heating: 'heating.html',
  plumbing: 'plumbing.html',
  ventilation: 'ventilation.html',
  servicing: 'servicing.html',
  about: 'about.html',
  'our-work': 'our-work.html',
}

const sitePages = await Promise.all(
  Object.entries(pageFiles).map(([key, filename]) => extractPage(key, filename)),
)
const projects = await extractProjects()

await mkdir(path.join(root, 'content'), {recursive: true})
await writeFile(
  path.join(root, 'content', 'fallback.json'),
  `${JSON.stringify({sitePages, projects}, null, 2)}\n`,
)

console.log(`Extracted ${sitePages.length} editable pages and ${projects.length} projects.`)
