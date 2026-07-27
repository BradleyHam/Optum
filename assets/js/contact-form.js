(() => {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('contactFormNote');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const subject = `Website enquiry: ${value('Enquiry type') || 'General'} - ${value('Name')}`;
    const body = [
      'New enquiry from the Optum website',
      '',
      `Name: ${value('Name')}`,
      `Email: ${value('Email')}`,
      `Phone: ${value('Phone') || 'Not provided'}`,
      `Enquiry type: ${value('Enquiry type')}`,
      '',
      'Message:',
      value('Message')
    ].join('\n');

    if (note) note.textContent = 'Your email app should open now. Attach any plans before sending.';
    window.location.href = `mailto:admin@optum.co.nz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
