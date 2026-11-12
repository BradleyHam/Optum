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

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(script);
})();
