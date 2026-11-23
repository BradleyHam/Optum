(() => {
  const card = document.getElementById('enquire');
  const form = document.getElementById('plumbingForm');
  if (!card || !form) return;

  const formWrap = card.querySelector('.plumb-form-wrap');
  const success = document.getElementById('plumbSuccess');
  const note = document.getElementById('plumbFormNote');
  const defaultNote = note?.innerHTML;

  // ---- Enquiry modal ----
  // Every enquiry button opens the hero form in a dialog, so a click always has a
  // visible result, even when the form is already on screen. The real card moves
  // into the dialog (keeping its handlers and state) and an inert copy stays in
  // the hero, so the page behind the overlay looks unchanged and keeps its height.
  const modal = document.createElement('div');
  modal.className = 'plumb-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="plumb-modal-backdrop" data-plumb-modal-close></div>
    <div class="plumb-modal-dialog" role="dialog" aria-modal="true" aria-label="Request a plumber">
      <button class="plumb-modal-close" type="button" aria-label="Close" data-plumb-modal-close>&times;</button>
      <div class="plumb-modal-slot"></div>
    </div>`;
  document.body.appendChild(modal);
  const modalDialog = modal.querySelector('.plumb-modal-dialog');
  const modalSlot = modal.querySelector('.plumb-modal-slot');
  let ghost = null;
  let modalOpen = false;
  let returnFocus = null;
  let closeTimer = 0;

  const focusMessage = () => document.getElementById('plumbMessage')?.focus({preventScroll: true});

  const openModal = opener => {
    if (modalOpen) return;
    modalOpen = true;
    window.clearTimeout(closeTimer);
    returnFocus = opener || document.activeElement;
    ghost = card.cloneNode(true);
    ghost.classList.add('plumb-form-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    [ghost, ...ghost.querySelectorAll('[id],[for],[name]')].forEach(el => {
      el.removeAttribute('id');
      el.removeAttribute('for');
      el.removeAttribute('name');
    });
    card.replaceWith(ghost);
    card.style.transform = '';
    modalSlot.appendChild(card);
    modal.hidden = false;
    document.documentElement.classList.add('plumb-modal-open');
    window.optumLenis?.stop();
    void modal.offsetWidth; // commit the hidden state so the fade-in transition runs
    modal.classList.add('is-open');
    window.setTimeout(focusMessage, 60);
  };

  const closeModal = () => {
    if (!modalOpen) return;
    modalOpen = false;
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('plumb-modal-open');
    window.optumLenis?.start();
    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      if (ghost) {
        card.style.transform = ghost.style.transform;
        ghost.replaceWith(card);
        ghost = null;
      }
      window.dispatchEvent(new Event('scroll'));
    }, 260);
    returnFocus?.focus?.({preventScroll: true});
  };

  modal.addEventListener('click', event => {
    if (event.target.closest('[data-plumb-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (!modalOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...modalDialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"]),select,textarea,[tabindex]:not([tabindex="-1"])')]
      .filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // On this page every enquiry button opens the plumbing form in the modal.
  const goToForm = event => {
    event.preventDefault();
    const drawer = document.getElementById('drawer');
    if (drawer?.classList.contains('open')) document.getElementById('drawerClose')?.click();
    openModal(event.currentTarget);
  };
  const dockLink = document.querySelector('.mobile-action-dock a');
  if (dockLink) {
    dockLink.removeAttribute('data-consultation-open');
    dockLink.setAttribute('href', '#enquire');
    dockLink.setAttribute('data-plumbing-enquire', '');
    const kicker = dockLink.querySelector('.mobile-action-kicker');
    const title = dockLink.querySelector('.mobile-action-title');
    if (kicker) kicker.textContent = 'Plumbing · Wānaka & Queenstown';
    if (title) title.textContent = 'Request a plumber';
  }
  document.querySelectorAll('[data-plumbing-enquire]').forEach(link => link.addEventListener('click', goToForm));

  const hero = card.closest('.page-hero');
  // Below desktop the hero is taller than the screen, so the see-through header
  // ends up over the copy. Give it a backing once the page moves (CSS limits
  // this to narrower screens; desktop keeps the clear header).
  const siteHeader = document.querySelector('.site-header');
  const tintHeader = () => siteHeader?.classList.toggle('plumb-header-tint', window.scrollY > 24);
  tintHeader();
  window.addEventListener('scroll', tintHeader, {passive: true});

  const setHeroHeight = () => hero?.style.setProperty('--hero-h', `${hero.offsetHeight}px`);
  setHeroHeight();
  window.addEventListener('resize', setHeroHeight);
  if ('ResizeObserver' in window && hero) new ResizeObserver(setHeroHeight).observe(hero);

  // Gentle parallax: once the hero pins, its copy and form drift up at a fraction
  // of scroll speed while the next section slides over at full speed.
  // Rates are fractions of scroll distance: the heading drifts a touch more than the form.
  const parallaxItems = hero ? [
    {el: hero.querySelector('.plumb-hero-copy'), rate: 0.08},
    {el: card, rate: 0.04},
  ].filter(item => item.el) : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (hero && parallaxItems.length) {
    let ticking = false;
    const applyParallax = () => {
      ticking = false;
      if (reduceMotion.matches) {
        parallaxItems.forEach(({el}) => { el.style.transform = ''; });
        return;
      }
      const heroH = hero.offsetHeight;
      // offsetTop on a sticky element reports its stuck position, so measure the
      // hero's natural top from the (non-sticky) section that follows it.
      const next = hero.nextElementSibling;
      const heroTop = next ? next.offsetTop - heroH : 0;
      const pinStart = heroTop + Math.max(0, heroH - window.innerHeight);
      const travelled = Math.min(Math.max(0, window.scrollY - pinStart), heroH);
      parallaxItems.forEach(({el, rate}) => {
        if (el === card && modalOpen) return;
        const shift = travelled * rate;
        el.style.transform = shift ? `translate3d(0,${-shift.toFixed(2)}px,0)` : '';
      });
    };
    const requestParallax = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(applyParallax);
    };
    applyParallax();
    window.addEventListener('scroll', requestParallax, {passive: true});
    window.addEventListener('resize', requestParallax);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      document.body.classList.toggle('plumb-form-visible', entries[0].isIntersecting);
    }, {threshold: .05}).observe(card);
  }

  const clearInvalid = event => event.target.removeAttribute('aria-invalid');
  form.addEventListener('input', clearInvalid);
  form.addEventListener('change', clearInvalid);

  const validate = () => {
    let firstInvalid = null;
    form.querySelectorAll('[required]').forEach(input => {
      if (!input.value.trim()) {
        input.setAttribute('aria-invalid', 'true');
        firstInvalid ||= input;
      }
    });
    if (firstInvalid) {
      if (note) note.textContent = 'Please fill in all three fields so we can call you back.';
      firstInvalid.focus();
      return false;
    }
    return true;
  };

  // Rough guess at the job type so the email subject is useful at a glance.
  const guessService = text => {
    if (/burst|flood|emergenc|urgent/i.test(text)) return 'Emergency plumbing';
    if (/renovat|bathroom|kitchen|laundry|new build|extension/i.test(text)) return 'New build or renovation';
    return 'Plumbing, gas or drainage';
  };

  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !validate()) return;

    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const service = guessService(value('Message'));
    const subject = `Plumbing enquiry - ${value('Name')}`;
    const payload = {
      Name: value('Name'),
      Phone: value('Phone'),
      'Enquiry type': service,
      Message: `${value('Message')}\n\n(Sent from the plumbing page. Please call back on the number above.)`,
      _honey: value('_honey'),
      _subject: subject,
      _url: window.location.href,
      'Website context': 'Plumbing page hero form',
      'Page title': document.title,
      formKind: 'consultation'
    };

    const button = form.querySelector('button[type="submit"]');
    const originalButton = button?.innerHTML;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }
    if (note) note.textContent = 'Sending your enquiry…';

    sending = true;
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Accept: 'application/json'},
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.success !== true) throw new Error('Submission failed');

      if (!payload._honey) {
        document.dispatchEvent(new CustomEvent('optum-enquiry-sent', {
          detail: {form_name: 'plumbing_hero', service_type: service}
        }));
      }
      form.reset();
      formWrap.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      if (note) {
        const body = ['Name', 'Phone', 'Message'].map(name => `${name}: ${value(name)}`).join('\n\n');
        const link = document.createElement('a');
        link.href = `mailto:admin@optum.co.nz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        link.textContent = 'email these details';
        const phone = document.createElement('a');
        phone.href = 'tel:0800467886';
        phone.textContent = '0800 467 886';
        note.replaceChildren('We couldn’t confirm that sent. Please ', link, ' or call ', phone, '.');
      }
    } finally {
      sending = false;
      window.clearTimeout(timeout);
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButton;
      }
    }
  });

  form.addEventListener('reset', () => {
    if (note && defaultNote) note.innerHTML = defaultNote;
  });
})();
