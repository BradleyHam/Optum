(() => {
  if (document.querySelector('.mobile-action-dock')) return;

  const header = document.querySelector('.site-header');
  const navCta = header?.querySelector('.nav-cta');
  const menuButton = navCta?.querySelector('.menu-btn');

  if (header && navCta && menuButton) {
    if (document.querySelector('.hero,.page-hero')) {
      header.classList.add('mobile-header--overlay');
    }

    const phone = document.createElement('a');
    phone.className = 'mobile-header-phone';
    phone.href = 'tel:0800467886';
    phone.setAttribute('aria-label', 'Call Optum on 0800 467 886');
    phone.innerHTML = '<span class="mobile-header-phone-label">Call</span><span>0800 467 886</span>';
    navCta.insertBefore(phone, menuButton);
  }

  const dock = document.createElement('div');
  dock.className = 'mobile-action-dock';
  dock.innerHTML = `
    <a href="#contact" data-consultation-open aria-label="Start an enquiry with Optum">
      <span class="mobile-action-copy">
        <span class="mobile-action-kicker">Heating · plumbing · servicing</span>
        <span class="mobile-action-title">Start an enquiry</span>
      </span>
      <span class="mobile-action-arrow" aria-hidden="true">→</span>
    </a>`;
  document.body.appendChild(dock);

  const mobile = window.matchMedia('(max-width:999px)');
  let shouldShow = false;

  const render = () => {
    const drawerOpen = document.getElementById('drawer')?.classList.contains('open');
    dock.classList.toggle('is-visible', mobile.matches && shouldShow && !drawerOpen);
    dock.classList.toggle('is-suppressed', Boolean(drawerOpen));
  };

  const heroCta = document.querySelector('.hero .hero-bottom .btn');
  if (heroCta && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      shouldShow = !entries[0].isIntersecting;
      render();
    }, {threshold:.15});
    observer.observe(heroCta);
  } else {
    window.setTimeout(() => {
      shouldShow = true;
      render();
    }, 650);
  }

  const drawer = document.getElementById('drawer');
  if (drawer) {
    new MutationObserver(render).observe(drawer, {attributes:true,attributeFilter:['class']});
  }

  if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', render);
  else mobile.addListener(render);
  render();
})();
