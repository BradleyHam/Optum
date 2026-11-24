const services = new Set(['Emergency plumbing', 'New build or renovation', 'Heating', 'Plumbing, gas or drainage', 'Ventilation or cooling', 'Servicing or repair', 'Something else']);

export async function POST(request) {
  let data;
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) throw new Error();
    if (Number(request.headers.get('content-length') || 0) > 20000) throw new Error();
    const raw = await request.text();
    if (raw.length > 12000) throw new Error();
    data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  if (data._honey) return Response.json({ success: true });
  const get = (name, max) => typeof data[name] === 'string' ? data[name].trim().slice(0, max) : '';
  const name = get('Name', 120);
  const email = get('email', 254);
  const phone = get('Phone', 80);
  const location = get('Project location', 160);
  const service = get('Enquiry type', 80);
  const message = get('Message', 8000);
  const kind = data.formKind === 'consultation' ? 'Consultation request' : 'Website enquiry';
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[\r\n]/.test(email);
  // Quick enquiries (e.g. the plumbing page) may leave a phone number instead of an email.
  if (!name || !message || !services.has(service) || (email ? !validEmail : !/\d{6,}/.test(phone.replace(/\D/g, '')))) {
    return Response.json({ success: false }, { status: 400 });
  }
  if (!process.env.RESEND_API_KEY) return Response.json({ success: false }, { status: 503 });

  const text = [`Name: ${name}`, `Email: ${email || 'Not provided'}`, `Phone: ${phone || 'Not provided'}`, ...(location ? [`Location: ${location}`] : []), `Service: ${service}`, `Message:\n${message}`].join('\n\n');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Optum website via Rank Higher <website@rankhigher.co.nz>', to: ['admin@optum.co.nz'], ...(email ? {reply_to: email} : {}), subject: `${kind}: ${service}`, text }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return Response.json({ success: false }, { status: 502 });
    const result = await response.json();
    if (!result.id) return Response.json({ success: false }, { status: 502 });
    await recordEnquiry(data, { kind: data.formKind === 'consultation' ? 'consultation' : 'contact', service }).catch(() => {});
    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 502 });
  }
}

// Tell GA4 an enquiry was actually delivered. Unlike the browser's generate_lead event,
// this one is sent by the server after Resend accepts the email, so ad blockers and
// closed tabs cannot lose it. Only form type and service are sent: never names,
// emails, phone numbers or messages. A failure here never affects the enquiry.
async function recordEnquiry(data, { kind, service }) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret || process.env.VERCEL_ENV !== 'production') return;
  const context = data._analytics && typeof data._analytics === 'object' ? data._analytics : {};
  const text = (value, max) => typeof value === 'string' ? value.slice(0, max) : '';
  const clientId = /^\d+\.\d+$/.test(text(context.client_id, 40)) ? context.client_id : `server.${crypto.randomUUID()}`;
  const sessionId = /^\d+$/.test(text(context.session_id, 20)) ? Number(context.session_id) : undefined;
  const params = {
    form_name: kind,
    service_type: service,
    page_location: text(context.page_location, 400) || undefined,
    session_id: sessionId,
    engagement_time_msec: 1
  };
  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, events: [{ name: 'enquiry_received', params }] }),
      signal: AbortSignal.timeout(3000)
    });
  } catch { /* Analytics must never block an enquiry. */ }
}
