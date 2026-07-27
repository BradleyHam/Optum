(() => {
  if (document.getElementById('consultationModal')) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'assets/css/consultation-modal.css?v=3';
  document.head.appendChild(css);

  const markup = `
    <div class="consult-modal" id="consultationModal" aria-hidden="true">
      <div class="consult-backdrop" data-consult-close></div>
      <section class="consult-panel" role="dialog" aria-modal="true" aria-labelledby="consultTitle" tabindex="-1">
        <button class="consult-close" type="button" aria-label="Close consultation form" data-consult-close>&times;</button>

        <aside class="consult-intro">
          <p class="consult-brand">OPTUM</p>
          <p class="consult-kicker">Free consultation</p>
          <h2>Tell us what is <em>happening.</em></h2>
          <p class="consult-intro-copy">Whether something needs fixing or you are planning a new build, tell us what you know. We will match it with the right Optum specialist.</p>
          <div class="consult-expect">
            <span><b>01</b> Share the project, problem or idea.</span>
            <span><b>02</b> We match it with the right person.</span>
            <span><b>03</b> You receive a practical next step.</span>
          </div>
          <p class="consult-direct">Prefer to talk? <a href="tel:0800467886">0800 467 886</a></p>
        </aside>

        <div class="consult-form-side">
          <div class="consult-form-wrap">
            <header class="consult-form-head">
              <span class="consult-step">A few details</span>
              <h3 id="consultTitle">What can we help with?</h3>
              <p>A rough description is enough—tell us what you are planning, or what is not working.</p>
            </header>

            <form id="consultationForm">
              <div class="consult-grid">
                <div class="consult-field">
                  <label for="consultName">Name</label>
                  <input id="consultName" name="Name" type="text" autocomplete="name" placeholder="Your name" required>
                </div>
                <div class="consult-field">
                  <label for="consultEmail">Email</label>
                  <input id="consultEmail" name="Email" type="email" autocomplete="email" placeholder="you@example.com" required>
                </div>
                <div class="consult-field">
                  <label for="consultPhone">Phone</label>
                  <input id="consultPhone" name="Phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Best contact number">
                </div>
                <div class="consult-field">
                  <label for="consultLocation">Location</label>
                  <input id="consultLocation" name="Project location" type="text" autocomplete="address-level2" placeholder="Wānaka, Queenstown…">
                </div>
                <div class="consult-field consult-field--full">
                  <label for="consultService">What can we help with?</label>
                  <select id="consultService" name="Enquiry type" required>
                    <option value="" selected disabled>Select a service</option>
                    <option>New build or renovation</option>
                    <option>Heating</option>
                    <option>Plumbing, gas or drainage</option>
                    <option>Ventilation or cooling</option>
                    <option>Servicing or repair</option>
                    <option>Something else</option>
                  </select>
                </div>
                <div class="consult-field consult-field--full">
                  <label for="consultMessage">Tell us about it</label>
                  <textarea id="consultMessage" name="Message" placeholder="What are you planning, or what is the current system doing?" required></textarea>
                </div>
              </div>

              <div class="consult-actions">
                <button class="consult-submit" type="submit">Prepare enquiry <span aria-hidden="true">→</span></button>
                <p class="consult-privacy">Nothing is sent until you review the prepared message and press send in your email app.</p>
              </div>
            </form>
          </div>

          <div class="consult-success" id="consultSuccess" tabindex="-1">
            <div class="consult-success-mark" aria-hidden="true">→</div>
            <span class="consult-step">Ready to send</span>
            <h3>Your email app should be open.</h3>
            <p>Review the prepared message, attach any plans or photographs if useful, then press send. It will go directly to Optum.</p>
            <button type="button" data-consult-close>Return to the website</button>
          </div>
        </div>
      </section>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', markup);

  const modal = document.getElementById('consultationModal');
  const form = document.getElementById('consultationForm');
  const formWrap = modal.querySelector('.consult-form-wrap');
  const success = document.getElementById('consultSuccess');
  let returnFocus = null;
  let enquiryContext = 'Free consultation';

  const focusable = () => [...modal.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )].filter(element => element.offsetParent !== null);

  const resetView = () => {
    form.reset();
    formWrap.hidden = false;
    success.classList.remove('is-visible');
  };

  const open = opener => {
    returnFocus = opener || document.activeElement;
    resetView();
    const section = opener?.closest('section');
    const heading = section?.querySelector('h1,h2,h3');
    enquiryContext = heading?.textContent.trim() || opener?.textContent.trim() || 'Free consultation';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('consultation-open');
    window.setTimeout(() => document.getElementById('consultName').focus(), 80);
  };

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('consultation-open');
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
  };

  const isConsultationTrigger = element => {
    if (element.matches('[data-consultation-open]')) return true;
    return /free consultation/i.test(element.textContent || '');
  };

  document.querySelectorAll('a,button').forEach(element => {
    if (!isConsultationTrigger(element)) return;
    element.setAttribute('aria-haspopup', 'dialog');
    element.addEventListener('click', event => {
      event.preventDefault();
      const drawerClose = document.getElementById('drawerClose');
      if (document.getElementById('drawer')?.classList.contains('open')) drawerClose?.click();
      open(element);
    });
  });

  modal.querySelectorAll('[data-consult-close]').forEach(button => button.addEventListener('click', close));

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable();
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

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const subject = `Consultation request: ${value('Enquiry type')} — ${value('Name')}`;
    const body = [
      'New consultation request from the Optum website',
      '',
      `Name: ${value('Name')}`,
      `Email: ${value('Email')}`,
      `Phone: ${value('Phone') || 'Not provided'}`,
      `Project location: ${value('Project location') || 'Not provided'}`,
      `Enquiry type: ${value('Enquiry type')}`,
      `Website context: ${enquiryContext}`,
      `Page: ${document.title}`,
      '',
      'Project details:',
      value('Message')
    ].join('\n');

    formWrap.hidden = true;
    success.classList.add('is-visible');
    success.focus();
    window.location.href = `mailto:admin@optum.co.nz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
