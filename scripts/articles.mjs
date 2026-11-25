// Advice articles restored from the old WordPress site (content/articles.json).
// Each one is served at its original URL, /article/<slug>/, so the rankings and
// links it earned before the rebuild point at a live page again. The pages reuse
// the built About page as their shell, so the header, footer and closing section
// stay identical to the rest of the site.
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {load} from 'cheerio'
import {escapeHtml} from './paragraphs.mjs'

const site = 'https://www.optum.co.nz'
const services = {
  plumbing: {href: '/plumbing.html', label: 'Plumbing in Wānaka and Queenstown'},
  heating: {href: '/heating.html', label: 'Heating design and installation'},
}

// Turn the About page into a shell whose links work from any folder depth.
function shell(html) {
  const $ = load(html)
  $('[href], [src]').each((i, element) => {
    for (const attribute of ['href', 'src']) {
      const value = $(element).attr(attribute)
      if (value && !/^(?:[a-z]+:|\/|#|\/\/)/i.test(value)) $(element).attr(attribute, '/' + value)
    }
  })
  $('.is-current').removeClass('is-current').removeAttr('aria-current')
  $('script[src*="about-work.js"]').remove()
  $('link[href*="about.css"]').after('<link rel="stylesheet" href="/assets/css/article.css?v=1">')
  return $.html()
}

function page(shellHtml, {title, description, url, main, jsonLd}) {
  const $ = load(shellHtml)
  $('title').text(title)
  $('meta[name="description"]').attr('content', description)
  $('link[rel="canonical"]').attr('href', url)
  $('head').append(
    `<meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}">` +
      `<meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${url}">` +
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  )
  const closing = $('main section.closing').first().clone()
  $('main').html(main).append(closing)
  return $.html()
}

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], index) => ({'@type': 'ListItem', position: index + 1, name, item})),
})

export async function generateArticles(root, output) {
  const articles = JSON.parse(await readFile(path.join(root, 'content', 'articles.json'), 'utf8'))

  // Link the advice section from every page's footer so search engines can find it.
  for (const file of (await readdir(output)).filter((name) => name.endsWith('.html'))) {
    const target = path.join(output, file)
    const $ = load(await readFile(target, 'utf8'))
    const nav = $('footer nav[aria-label="Sections"]').first()
    if (!nav.length || nav.find('a[href$="advice.html"]').length) continue
    nav.append('\n        <a href="/advice.html">Advice</a>\n      ')
    await writeFile(target, $.html())
  }
  const base = shell(await readFile(path.join(output, 'about.html'), 'utf8'))
  const publisher = {'@type': 'Organization', name: 'Optum Plumbing & Heating', url: site + '/'}

  for (const article of articles) {
    const url = `${site}/article/${article.slug}/`
    const service = services[article.service]
    const main = `
  <section class="about-hero article-hero" aria-label="Advice">
    <div class="wrap">
      <p class="eyebrow"><a href="/advice.html">Advice</a></p>
      <h1>${escapeHtml(article.title)}</h1>
    </div>
  </section>
  <article class="article-body">
    <div class="wrap article-wrap">
      <div class="article-prose">
${article.body}
      </div>
      <aside class="article-next" aria-label="Get help">
        <p class="eyebrow">Need a hand?</p>
        <p>Optum's plumbers and heating specialists work across Wānaka and Queenstown. Call <a href="tel:0800467886">0800 467 886</a> or read about <a href="${service.href}">${service.label}</a>.</p>
        <p><a class="article-back" href="/advice.html">← More advice</a></p>
      </aside>
    </div>
  </article>`
    const html = page(base, {
      title: `${article.title} | Optum Plumbing & Heating`,
      description: article.description,
      url,
      main,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {'@type': 'Article', headline: article.title, description: article.description, mainEntityOfPage: url, author: publisher, publisher},
          breadcrumb([['Home', site + '/'], ['Advice', site + '/advice.html'], [article.title, url]]),
        ],
      },
    })
    await mkdir(path.join(output, 'article', article.slug), {recursive: true})
    await writeFile(path.join(output, 'article', article.slug, 'index.html'), html)
  }

  const hubUrl = `${site}/advice.html`
  const hub = page(base, {
    title: 'Plumbing & Heating Advice | Optum Plumbing & Heating',
    description: 'Practical plumbing and heating advice from Optum for homes in Wānaka, Queenstown and Central Otago.',
    url: hubUrl,
    main: `
  <section class="about-hero article-hero" aria-label="Advice">
    <div class="wrap">
      <p class="eyebrow">Advice</p>
      <h1>Plumbing and heating <em>advice.</em></h1>
    </div>
  </section>
  <section class="article-body" aria-label="Articles">
    <div class="wrap">
      <ul class="advice-list">
${articles.map((a) => `        <li><a href="/article/${a.slug}/"><h2>${escapeHtml(a.title)}</h2><p>${escapeHtml(a.description)}</p></a></li>`).join('\n')}
      </ul>
    </div>
  </section>`,
    jsonLd: {'@context': 'https://schema.org', '@graph': [breadcrumb([['Home', site + '/'], ['Advice', hubUrl]])]},
  })
  await writeFile(path.join(output, 'advice.html'), hub)

  return articles
}
