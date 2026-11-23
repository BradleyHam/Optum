// Editable sections of the plumbing page beyond the shared hero/intro/closing fields.
// `extractPlumbingSections` reads them out of plumbing.html (for content/fallback.json),
// and `applyPlumbingSections` writes CMS content back into the built page. Images and
// layout stay in the HTML; only wording comes from the CMS. Any field that is missing
// leaves the HTML as it is, so a partly filled Sanity document never blanks the page.
import {load} from 'cheerio'
import {escapeHtml} from './paragraphs.mjs'

// Set per call so helpers can serialise child elements with $.html().
let $

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim()
const stripQuotes = (value) => clean(value).replace(/^[“"]\s*/, '').replace(/\s*[”"]$/, '')
const has = (value) => typeof value === 'string' && value.trim() !== ''
const list = (value) => (Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [])

// Phone numbers in editable text become tap-to-call links.
function withPhoneLinks(text) {
  return escapeHtml(text).replace(/0800\s?467\s?886/g, (match) => `<a href="tel:0800467886">${match}</a>`)
}

function splitEmphasis($element) {
  const html = $element.html() || ''
  const match = html.match(/^(.*?)<em(?:\s[^>]*)?>(.*?)<\/em>(.*)$/s)
  const fragmentText = (fragment) => clean(load(`<div>${fragment}</div>`)('div').text())
  if (!match) return {before: clean($element.text()), emphasis: '', after: ''}
  return {before: fragmentText(match[1]), emphasis: fragmentText(match[2]), after: fragmentText(match[3])}
}

function emphasisHtml(before, emphasis, after) {
  const parts = []
  if (has(before)) parts.push(escapeHtml(before.trim()))
  if (has(emphasis)) parts.push(`<em>${escapeHtml(emphasis.trim())}</em>`)
  if (has(after)) parts.push(escapeHtml(after.trim()))
  return parts.join(' ')
}

function setTextKeepingArrow($element, text) {
  if (!$element.length || !has(text)) return
  const arrow = $element.find('.arw, span[aria-hidden="true"]').first()
  $element.html(`${escapeHtml(text.trim())}${arrow.length ? ` ${$.html(arrow)}` : ''}`)
}
function textWithoutArrow($element) {
  const copy = $element.clone()
  copy.find('.arw, span[aria-hidden="true"]').remove()
  return clean(copy.text())
}

export function extractPlumbingSections(doc) {
  $ = doc
  const hero = $('.page-hero--plumbing')
  const quoteCaption = hero.find('.plumb-quote figcaption').first().clone()
  quoteCaption.find('.plumb-quote-stars').remove()
  const form = $('#enquire')
  const services = $('.svc-list-sec')
  const emergency = $('.emergency-callout')
  const emergencyHeading = splitEmphasis(emergency.find('h2').first())
  const owners = $('.plumb-owners')
  const ownersHeading = splitEmphasis(owners.find('h2').first())
  const reviews = $('.heating-reviews')
  const faq = $('.plumb-faq')
  const faqHeading = splitEmphasis(faq.find('h2').first())

  return {
    heroQuote: stripQuotes(hero.find('.plumb-quote blockquote').first().text()),
    heroQuoteCredit: clean(quoteCaption.text()),

    formTitle: clean(form.find('.plumb-form-title').first().text()),
    formMessageLabel: clean(form.find('label[for="plumbMessage"]').first().text()),
    formMessagePlaceholder: clean(form.find('#plumbMessage').attr('placeholder')),
    formButton: textWithoutArrow(form.find('.plumb-submit').first()),
    formSuccessTitle: clean(form.find('.plumb-success h2').first().text()),
    formSuccessBody: clean(form.find('.plumb-success p').first().text()),

    servicesEyebrow: clean(services.find('.eyebrow').first().text()),
    services: services.find('.svc-row').toArray().map((row) => ({
      title: clean($(row).find('h3').first().text()),
      body: clean($(row).find('h3').first().next('p').text()),
    })),

    emergencyKicker: clean(emergency.find('.emergency-kicker').first().text()),
    emergencyTitleBefore: emergencyHeading.before,
    emergencyTitleEmphasis: emergencyHeading.emphasis,
    emergencyBody: clean(emergency.find('.emergency-copy > p:not(.emergency-kicker)').first().text()),

    ownersEyebrow: clean(owners.find('.eyebrow').first().text()),
    ownersTitleBefore: ownersHeading.before,
    ownersTitleEmphasis: ownersHeading.emphasis,
    ownersLead: clean(owners.find('.lead').first().text()),
    ownersBody: clean(owners.find('.plumb-owners-copy > p:not(.lead):not(.eyebrow)').first().text()),
    ownersCaption: clean(owners.find('figcaption').first().text()),
    ownersFacts: owners.find('.plumb-owners-facts li').toArray().map((item) => ({
      value: clean($(item).find('strong').text()),
      label: clean($(item).find('span').text()),
    })),
    ownersLinkLabel: textWithoutArrow(owners.find('.plumb-owners-link').first()),

    reviewsEyebrow: clean(reviews.find('.heating-reviews-intro .eyebrow').first().text()),
    reviewsTitle: clean(reviews.find('.heating-reviews-intro h2').first().text()),
    reviewsIntro: clean(reviews.find('.heating-reviews-intro .sub').first().text()),
    reviews: reviews.find('.heating-rv-card:not(.heating-rv-stat)').toArray().map((card) => {
      const quote = $(card).find('.heating-rv-text').first()
      return {
        quote: stripQuotes(quote.text()),
        highlight: clean(quote.find('em').first().text()),
        name: clean($(card).find('.heating-rv-name').text()),
        source: clean($(card).find('.heating-rv-source').text()),
      }
    }),

    faqEyebrow: clean(faq.find('.plumb-faq-head .eyebrow').first().text()),
    faqTitleBefore: faqHeading.before,
    faqTitleEmphasis: faqHeading.emphasis,
    faqIntro: clean(faq.find('.plumb-faq-head > p:not(.eyebrow)').first().text()),
    faqs: faq.find('details').toArray().map((item) => ({
      question: clean($(item).find('summary').text()),
      answer: clean($(item).find('p').text()),
    })),
  }
}

function reviewQuoteHtml(quote, highlight) {
  let html = escapeHtml(quote.trim())
  if (has(highlight)) {
    const target = escapeHtml(highlight.trim())
    const at = html.indexOf(target)
    if (at !== -1) html = `${html.slice(0, at)}<em>${target}</em>${html.slice(at + target.length)}`
  }
  return `“${html}”`
}

function renderReview(review, featured) {
  const source = has(review.source) ? `<span class="heating-rv-source">${escapeHtml(review.source.trim())}</span>` : ''
  return `<article class="heating-rv-card${featured ? ' heating-rv-feature' : ''}">
        <div class="heating-rv-stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
        <blockquote class="heating-rv-text">${reviewQuoteHtml(review.quote, review.highlight)}</blockquote>
        <div class="heating-rv-foot"><span class="heating-rv-name">${escapeHtml((review.name || '').trim())}</span>${source}</div>
      </article>`
}

function renderFaq(item) {
  return `<details>
          <summary>${escapeHtml(item.question.trim())}</summary>
          <p>${withPhoneLinks(item.answer.trim())}</p>
        </details>`
}

export function applyPlumbingSections(doc, page) {
  $ = doc
  if (!page) return

  // Hero review quote
  const quote = $('.page-hero--plumbing .plumb-quote').first()
  if (has(page.heroQuote)) quote.find('blockquote').first().text(`“${page.heroQuote.trim()}”`)
  if (has(page.heroQuoteCredit)) {
    const caption = quote.find('figcaption').first()
    const stars = caption.find('.plumb-quote-stars').first()
    caption.html(`${stars.length ? $.html(stars) : ''} ${escapeHtml(page.heroQuoteCredit.trim())}`)
  }

  // Enquiry form
  const form = $('#enquire')
  if (has(page.formTitle)) form.find('.plumb-form-title').first().text(page.formTitle.trim())
  if (has(page.formMessageLabel)) form.find('label[for="plumbMessage"]').first().text(page.formMessageLabel.trim())
  if (has(page.formMessagePlaceholder)) form.find('#plumbMessage').attr('placeholder', page.formMessagePlaceholder.trim())
  setTextKeepingArrow(form.find('.plumb-submit').first(), page.formButton)
  if (has(page.formSuccessTitle)) form.find('.plumb-success h2').first().text(page.formSuccessTitle.trim())
  if (has(page.formSuccessBody)) form.find('.plumb-success p').first().html(withPhoneLinks(page.formSuccessBody.trim()))

  // Services list: wording only. Rows keep their images; extra rows reuse the last
  // row's preview image, and removed services drop their rows.
  const servicesSection = $('.svc-list-sec').first()
  if (has(page.servicesEyebrow)) servicesSection.find('.eyebrow').first().text(page.servicesEyebrow.trim())
  const services = list(page.services).filter((item) => has(item.title))
  if (services.length) {
    const container = servicesSection.find('.svc-rows').first()
    let rows = container.find('.svc-row').toArray().map((row) => $(row))
    while (rows.length > services.length) rows.pop().remove()
    while (rows.length < services.length) {
      const template = rows[rows.length - 1].clone()
      template.removeClass('svc-row--with-media')
      template.find('.svc-media').remove()
      container.append(template)
      rows.push(template)
    }
    rows.forEach((row, index) => {
      const service = services[index]
      row.find('.idx').first().text(String(index + 1).padStart(2, '0'))
      row.find('h3').first().text(service.title.trim())
      row.find('h3').first().next('p').text((service.body || '').trim())
    })
  }

  // Emergency panel
  const emergency = $('.emergency-callout').first()
  if (has(page.emergencyKicker)) emergency.find('.emergency-kicker').first().text(page.emergencyKicker.trim())
  if (has(page.emergencyTitleBefore) || has(page.emergencyTitleEmphasis)) {
    emergency.find('.emergency-copy h2').first().html(emphasisHtml(page.emergencyTitleBefore, page.emergencyTitleEmphasis))
  }
  if (has(page.emergencyBody)) emergency.find('.emergency-copy > p:not(.emergency-kicker)').first().text(page.emergencyBody.trim())

  // Owners
  const owners = $('.plumb-owners').first()
  if (has(page.ownersEyebrow)) owners.find('.plumb-owners-copy .eyebrow').first().text(page.ownersEyebrow.trim())
  if (has(page.ownersTitleBefore) || has(page.ownersTitleEmphasis)) {
    owners.find('h2').first().html(emphasisHtml(page.ownersTitleBefore, page.ownersTitleEmphasis))
  }
  if (has(page.ownersLead)) owners.find('.lead').first().text(page.ownersLead.trim())
  if (has(page.ownersBody)) owners.find('.plumb-owners-copy > p:not(.lead):not(.eyebrow)').first().text(page.ownersBody.trim())
  if (has(page.ownersCaption)) owners.find('figcaption').first().text(page.ownersCaption.trim())
  const facts = list(page.ownersFacts).filter((fact) => has(fact.value))
  if (facts.length) {
    const items = facts.map((fact) => `<li><strong>${escapeHtml(fact.value.trim())}</strong><span>${escapeHtml((fact.label || '').trim())}</span></li>`)
    owners.find('.plumb-owners-facts').first().html(`\n          ${items.join('\n          ')}\n        `)
  }
  setTextKeepingArrow(owners.find('.plumb-owners-link').first(), page.ownersLinkLabel)

  // Reviews
  const reviewsSection = $('.heating-reviews').first()
  const reviewsIntro = reviewsSection.find('.heating-reviews-intro').first()
  if (has(page.reviewsEyebrow)) reviewsIntro.find('.eyebrow').first().text(page.reviewsEyebrow.trim())
  if (has(page.reviewsTitle)) reviewsIntro.find('h2').first().text(page.reviewsTitle.trim())
  if (has(page.reviewsIntro)) reviewsIntro.find('.sub').first().text(page.reviewsIntro.trim())
  const reviews = list(page.reviews).filter((review) => has(review.quote))
  if (reviews.length) {
    const track = reviewsSection.find('.heating-reviews-track').first()
    const stat = track.find('.heating-rv-stat').first()
    const cards = reviews.map((review, index) => renderReview(review, index === 0))
    track.html(`\n      ${[stat.length ? $.html(stat) : '', ...cards].filter(Boolean).join('\n\n      ')}\n    `)
  }

  // FAQs, plus the matching FAQPage structured data for search results
  const faq = $('.plumb-faq').first()
  if (has(page.faqEyebrow)) faq.find('.plumb-faq-head .eyebrow').first().text(page.faqEyebrow.trim())
  if (has(page.faqTitleBefore) || has(page.faqTitleEmphasis)) {
    faq.find('h2').first().html(emphasisHtml(page.faqTitleBefore, page.faqTitleEmphasis))
  }
  if (has(page.faqIntro)) faq.find('.plumb-faq-head > p:not(.eyebrow)').first().html(withPhoneLinks(page.faqIntro.trim()))
  const faqs = list(page.faqs).filter((item) => has(item.question) && has(item.answer))
  if (faqs.length) {
    faq.find('.plumb-faq-list').first().html(`\n        ${faqs.map(renderFaq).join('\n        ')}\n      `)
    const schema = $('script[type="application/ld+json"]').toArray().find((script) => /"FAQPage"/.test($(script).html() || ''))
    if (schema) {
      const data = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.question.trim(),
          acceptedAnswer: {'@type': 'Answer', text: item.answer.trim()},
        })),
      }
      $(schema).text(`\n${JSON.stringify(data, null, 2).replaceAll('<', '\\u003c')}\n`)
    }
  }
}
