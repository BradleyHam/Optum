# Optum Website Analytics Context

Last updated: 22 July 2026 (Pacific/Auckland)

## Objective

Establish a reliable baseline for the current Optum website and compare it with the replacement site after launch. The primary outcome to measure is qualified enquiries generated from organic website traffic, supported by search visibility, traffic, conversion rate, landing-page performance, and site speed.

Current website: https://optum.co.nz/

## Current tracking audit

The live site was inspected directly and tested with Google Tag Assistant.

### Google Analytics

- Google Analytics 4 is installed directly on the site.
- GA4 measurement ID: `G-55X3P0MF8P`
- Tag Assistant confirmed that the GA4 tag sends page views.
- The GA4 property does not appear in the `info@rankhigher.co.nz` Google Analytics account.
- Do not create a replacement GA4 property yet. First attempt to recover the existing property and its historical data.

### Legacy Google Analytics

- Universal Analytics ID: `UA-105626753-1`
- The legacy tag still sends page views but is obsolete.
- Remove it as part of the new-site tracking cleanup, after access and continuity decisions are settled.

### Google Tag Manager

- No Google Tag Manager container was found.
- Google tracking appears to have been inserted directly into the WordPress site.

### Matomo

- Matomo Analytics is installed through `https://analytics.host.kiwi/`.
- Matomo site ID: `67`
- It records page views, heartbeat/time-on-page information, and link tracking.
- The site contains explicit Matomo events for phone-number and email-address clicks.
- `analytics.host.kiwi` is evidence of the Matomo provider, not proof that the same company hosts the WordPress website.

### Other behavioural and contact tools

- Zoho PageSense is installed.
- Zoho SalesIQ is installed for chat.
- The ebook journey uses Zoho Forms.
- The primary contact form posts visitor details to FormSubmit.co and sends them to Optum.
- No explicit successful contact-form event was found in the current GA4 implementation.
- A successful enquiry submission is therefore the largest current measurement gap.

### Consent and privacy

- No visible cookie-consent tool was found during the audit.
- Google Tag Assistant reported: `Consent not configured`.
- Consent/privacy requirements should be reviewed before adding tracking to the replacement site.

## Current WordPress access

The available WordPress account was inspected without making changes.

- The account has Editor-style access.
- It can manage content including posts, pages, media, menus, and several custom content types.
- It can access some Appearance controls.
- It cannot access Plugins, Users, or the main site-wide Settings area.
- WordPress explicitly returns `Sorry, you are not allowed to access this page` for plugin management.
- These permissions are not sufficient to install Site Kit or Tag Manager, upload `analytics.txt` to the web root, add verification code to the global `<head>`, or change DNS.

The site reports:

- WordPress 7.0.2
- Custom `Optum` theme
- WPBakery Page Builder

No passwords or login details are stored in this file.

## Existing account access

As of 22 July 2026:

- Optum does not appear in Google Analytics for `info@rankhigher.co.nz`.
- Optum does not appear in Google Search Console for `info@rankhigher.co.nz`.
- Existing GA4, Search Console, and Matomo administrators are unknown.

## Previous provider investigation

The WordPress dashboard contains a custom Website Help section linked to:

- https://knowledgebase.co.nz/

The site also loads a private WordPress plugin named:

- `wbj-managed-hosting`

Together, these are strong indications that the organisation behind Knowledgebase may have built, hosted, or managed the current site. This has not yet been confirmed.

An enquiry was submitted through the Knowledgebase contact form on 22 July 2026 using:

- Name: Bradley Hamilton
- Reply address: `info@rankhigher.co.nz`
- Website: `https://optum.co.nz/`

The form confirmed: `Thank you for your message. It has been sent.`

Because the enquiry was sent through their website, it will not appear in the Rank Higher Gmail Sent folder. The confirmation proves that the form accepted the submission, but not that a monitored inbox received or read it.

Allow two business days for a response. Check the Rank Higher inbox and spam folder through the end of Friday, 24 July 2026. If there is no reply, follow up once on Monday morning.

## Access recovery plan

### Preferred outcome

The existing provider or administrator adds `info@rankhigher.co.nz` to:

- GA4 property `G-55X3P0MF8P` with sufficient access to configure and report.
- The existing Search Console property for `optum.co.nz`.
- Matomo site `67`.

Access should be granted through account invitations. Passwords should not be requested or shared.

### If no GA4 administrator can be found

Use Google's no-administrator recovery process:

1. Prepare the required `analytics.txt` verification content for `G-55X3P0MF8P` and `info@rankhigher.co.nz`.
2. Ask the host to place it at `https://optum.co.nz/analytics.txt`, or use Google's permitted homepage meta-tag method.
3. Submit Google's Analytics access-recovery form.
4. If the account contains other websites or linked advertising accounts that cannot be verified, recovery may fail.

### Search Console

Search Console does not require cooperation from the previous Search Console owner once control of the site or domain is available.

Verification options are:

- Preferred long-term option: create a Domain property and add Google's DNS TXT record.
- Lower-friction option: verify the live `https://optum.co.nz/` URL-prefix property using an HTML tag/file.
- After GA4 recovery: attempt verification using the existing GA4 tag and the same Google account.

The current WordPress permissions are insufficient for these verification methods without assistance from a WordPress administrator, host, or domain/DNS administrator.

### Final fallback

If the existing GA4 property cannot be recovered before launch:

1. Create a clean, client-owned GA4 property.
2. Give Rank Higher administrator access rather than making Rank Higher the sole owner.
3. Install the new tracking on the replacement site.
4. Use any obtainable Matomo history, public SEO baselines, and business enquiry records for the before-period comparison.

## Measurement plan for the replacement site

### Primary KPI

Qualified enquiries per organic session.

### Supporting measures

- Organic clicks and impressions
- Organic sessions/users
- Search queries and landing pages
- Successful enquiries
- Enquiry conversion rate
- Phone and email clicks
- Booking/service-action clicks
- Ebook downloads
- Indexed pages and coverage issues
- Core Web Vitals and page speed

### Recommended events

- `generate_lead`: fire only after a form is successfully accepted.
- `phone_click`: fire on tracked telephone links.
- `email_click`: fire on tracked email links.
- `book_service`: fire on the primary booking/service action.
- `file_download`: use for the ebook if enhanced measurement does not cover it reliably.
- `form_start`: optional diagnostic event, not a primary conversion.

Mark genuine lead outcomes as GA4 key events. Treat phone/email clicks as intent signals rather than confirmed customers.

### Implementation principles

- Reuse `G-55X3P0MF8P` if access is recovered.
- Keep event names and definitions consistent across launch.
- Prefer Google Tag Manager for the replacement site so tracking can be managed without code deployments.
- Exclude staging, developer, and internal testing traffic where practical.
- Test every event in Tag Assistant and GA4 DebugView before launch.
- Record the launch date with a GA4 annotation.
- Compare at least 4–8 weeks before and after launch, with year-on-year context where available.
- Avoid judging the launch using raw traffic alone; seasonality and marketing activity must be considered.

## Analytics and SEO work to complete before design is finalised

These tasks can proceed while access recovery is pending:

1. Capture a complete inventory of current URLs from the sitemap and crawl.
2. Map each current URL to its replacement URL or a deliberate retirement/redirect.
3. Record current titles, descriptions, headings, status codes, canonicals, and indexability.
4. Capture mobile and desktop PageSpeed/Core Web Vitals baselines for important pages.
5. Document the current enquiry journeys: contact form, telephone, email, booking, and ebook.
6. Identify priority landing pages and content that must be preserved.
7. Take reference screenshots of important current pages.
8. Finalise the replacement site's sitemap, page hierarchy, and conversion-focused wireframes.

## Immediate project decision

Analytics access recovery should run in parallel with the website design. It should not block sitemap, wireframe, content, or visual design work.

Do not alter the current WordPress tracking or create another GA4 property while the provider response and recovery path are still pending.

## What Bradley needs to do now

1. Monitor `info@rankhigher.co.nz`, including spam, for the Knowledgebase reply.
2. Forward or share any reply so the access request can continue.
3. If there is no reply by the end of Friday, follow up once on Monday morning.
4. Continue with the public-site baseline and replacement-site design in parallel.

No other action from Tracy is currently required. If a provider later asks for proof of authority, the minimum request should be a one-line authorisation allowing Bradley Hamilton to manage Optum's website and analytics access.
