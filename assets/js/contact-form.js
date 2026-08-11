(() => {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('contactFormNote');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const subject = `Website enquiry: ${value('Enquiry type') || 'General'} - ${value('Name')}`;
    const payload = Object.fromEntries(data.entries());
    payload._subject = subject;
    payload._template = 'table';
    payload._captcha = 'false';
    payload._url = window.location.href;

    const button = form.querySelector('button[type="submit"]');
    const originalButton = button?.innerHTML;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }
    if (note) note.textContent = 'Sending your enquiry…';

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

      form.reset();
      if (note) note.textContent = 'Thanks — your enquiry has been sent to Optum.';
    } catch (error) {
      if (note) {
        note.innerHTML = 'We couldn’t send that just now. Please call <a href="tel:034435718">03 443 5718</a> or email <a href="mailto:admin@optum.co.nz">admin@optum.co.nz</a>.';
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
