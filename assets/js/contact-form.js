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
      const response = await fetch('/api/enquiry', {
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
        const body = ['Name', 'email', 'Phone', 'Enquiry type', 'Message']
          .map(name => `${name}: ${value(name)}`).join('\n\n');
        const link = document.createElement('a');
        link.href = `mailto:admin@optum.co.nz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        link.textContent = 'open your email app with these details';
        const phone = document.createElement('a');
        phone.href = 'tel:034435718';
        phone.textContent = '03 443 5718';
        note.replaceChildren('We couldn’t confirm your enquiry was sent. Please ', link,
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
