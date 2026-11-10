(() => {
  if (document.getElementById('consultationModal')) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'assets/css/consultation-modal.css?v=5';
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
          <p class="consult-direct">Prefer to talk? <a href="tel:034435718">03 443 5718</a></p>
        </aside>

        <div class="consult-form-side">
          <div class="consult-form-wrap">
            <header class="consult-form-head">
              <span class="consult-step">A few details</span>
              <h3 id="consultTitle">What can we help with?</h3>
              <p>A rough description is enough—tell us what you are planning, or what is not working.</p>
            </header>

            <form id="consultationForm" action="https://formsubmit.co/admin@optum.co.nz" method="POST">
              <input type="hidden" name="_subject" value="Consultation request from optum.co.nz">
              <input type="hidden" name="_template" value="table">
              <input type="hidden" name="_captcha" value="false">
              <div class="form-honey" aria-hidden="true">
                <label for="consultCompany">Leave this field empty</label>
                <input id="consultCompany" name="_honey" type="text" tabindex="-1" autocomplete="off">
              </div>
              <div class="consult-grid">
                <div class="consult-field">
                  <label for="consultName">Name</label>
                  <input id="consultName" name="Name" type="text" autocomplete="name" placeholder="Your name" required>
                </div>
                <div class="consult-field">
                  <label for="consultEmail">Email</label>
                  <input id="consultEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
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
                    <option>Emergency plumbing</option>
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
                <button class="consult-submit" type="submit">Send enquiry <span aria-hidden="true">→</span></button>
                <p class="consult-privacy" id="consultFormNote" aria-live="polite">Your details will be sent directly to the Optum team.</p>
              </div>
            </form>
          </div>

          <div class="consult-success" id="consultSuccess" tabindex="-1">
            <div class="consult-success-mark" aria-hidden="true">→</div>
            <span class="consult-step">Enquiry sent</span>
            <h3>Thanks — we’ve got it.</h3>
            <p>The Optum team will review your details and get back to you. For an urgent plumbing problem, call 03 443 5718.</p>
            <button type="button" data-consult-close>Return to the website</button>
          </div>
        </div>
      </section>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', markup);

  const modal = document.getElementById('consultationModal');
  const panel = modal.querySelector('.consult-panel');
  const form = document.getElementById('consultationForm');
  const formWrap = modal.querySelector('.consult-form-wrap');
  const success = document.getElementById('consultSuccess');
  const formNote = document.getElementById('consultFormNote');
  let returnFocus = null;
  let enquiryContext = 'Free consultation';

  const focusable = () => [...modal.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )].filter(element => element.offsetParent !== null);

  const resetView = () => {
    form.reset();
    formWrap.hidden = false;
    success.classList.remove('is-visible');
    if (formNote) formNote.textContent = 'Your details will be sent directly to the Optum team.';
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
    panel.scrollTop = 0;
    window.setTimeout(() => {
      panel.scrollTo({top: 0, left: 0, behavior: 'auto'});
      if (window.matchMedia('(max-width: 760px)').matches) {
        panel.focus({preventScroll: true});
      } else {
        document.getElementById('consultName').focus({preventScroll: true});
      }
    }, 80);
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

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const subject = `Consultation request: ${value('Enquiry type')} — ${value('Name')}`;
    const payload = Object.fromEntries(data.entries());
    payload._subject = subject;
    payload._template = 'table';
    payload._captcha = 'false';
    payload._url = window.location.href;
    payload['Website context'] = enquiryContext;
    payload['Page title'] = document.title;

    const button = form.querySelector('button[type="submit"]');
    const originalButton = button?.innerHTML;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }
    if (formNote) formNote.textContent = 'Sending your enquiry…';

    try {
      const response = await fetch('https://formsubmit.co/ajax/admin@optum.co.nz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.success === false || result.success === 'false') {
        throw new Error(result?.message || 'Submission failed');
      }

      formWrap.hidden = true;
      success.classList.add('is-visible');
      success.focus();
    } catch (error) {
      if (formNote) {
        const body = ['Name', 'email', 'Phone', 'Project location', 'Enquiry type', 'Message']
          .map(name => `${name}: ${value(name)}`).join('\n\n');
        const link = document.createElement('a');
        link.href = `mailto:admin@optum.co.nz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        link.textContent = 'open your email app with these details';
        const phone = document.createElement('a');
        phone.href = 'tel:034435718';
        phone.textContent = '03 443 5718';
        formNote.replaceChildren('We couldn’t confirm your enquiry was sent. Please ', link,
          ' and send it, or call ', phone, '. If the original arrives too, we may receive it twice.');
      }
    } finally {
      window.clearTimeout(timeout);
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButton;
      }
    }
  });
})();
