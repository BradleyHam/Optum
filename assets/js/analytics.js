// Keep local development and Vercel previews out of the production GA4 property.
(function () {
  if (!['optum.co.nz', 'www.optum.co.nz'].includes(window.location.hostname)) return;
  if (window.optumAnalyticsLoaded) return;
  window.optumAnalyticsLoaded = true;

  const measurementId = 'G-55X3P0MF8P';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // GA4 sends one page_view automatically for each full page load.
  window.gtag('config', measurementId);

  document.addEventListener('optum-enquiry-sent', event => {
    window.gtag('event', 'generate_lead', event.detail);
  });

  // Where on the page a link or button sits, e.g. "header", "footer", "emergency-callout".
  const placeOf = element => {
    if (element.closest('.mobile-action-dock')) return 'mobile_bar';
    if (element.closest('#drawer')) return 'menu';
    if (element.closest('header')) return 'header';
    if (element.closest('footer')) return 'footer';
    if (element.closest('.plumb-modal, #enquire')) return 'enquiry_form';
    const section = element.closest('section');
    return (section?.className || '').split(/\s+/)[0] || 'page';
  };

  // Enquiry buttons that open a form (e.g. "Request a plumber" on the plumbing page).
  document.addEventListener('optum-enquiry-open', event => {
    window.gtag('event', 'enquiry_open', event.detail);
  });

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (link?.protocol === 'tel:') window.gtag('event', 'phone_click', {link_location: placeOf(link)});
    if (link?.protocol === 'mailto:') window.gtag('event', 'email_click', {link_location: placeOf(link)});
  }, true);

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
})();
