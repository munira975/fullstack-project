// client/contact.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const alertBox = document.getElementById('formAlert');

  const errFor = (name) => document.querySelector(`.error-text[data-for="${name}"]`);

  const setAlert = (msg, type) => {
    alertBox.textContent = msg || '';
    alertBox.className = `alert ${type || ''}`;
  };

  const validate = () => {
    let ok = true;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();

    // Name
    if (!name || name.length < 2) {
      errFor('name').textContent = 'Please enter your name (min 2 chars).';
      ok = false;
    } else errFor('name').textContent = '';

    // Email
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      errFor('email').textContent = 'Please enter a valid email address.';
      ok = false;
    } else errFor('email').textContent = '';

    // Subject
    if (!subject || subject.length < 3) {
      errFor('subject').textContent = 'Please enter a subject (min 3 chars).';
      ok = false;
    } else errFor('subject').textContent = '';

    // Message
    if (!message || message.length < 10) {
      errFor('message').textContent = 'Please enter at least 10 characters.';
      ok = false;
    } else errFor('message').textContent = '';

    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('', '');
    if (!validate()) return;

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim(),
      ts: new Date().toISOString(),
    };

    try {
      // Försök POSTa till backend (lägg ev. till route /api/contact)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAlert('Thanks! Your message has been sent.', 'success');
        form.reset();
        return;
      }

      // Fallback: öppna e-postklient med mailto
      fallbackMailto(payload);
      setAlert('We opened your email client as a fallback. You can send the message from there.', 'success');
      form.reset();
    } catch (err) {
      // Fallback vid nätverksfel
      fallbackMailto(payload);
      setAlert('We opened your email client as a fallback. You can send the message from there.', 'success');
      form.reset();
    }
  });

  function fallbackMailto({ name, email, subject, message }) {
    const TO = 'support@example.com'; // <-- byt till din riktiga supportadress
    const s  = encodeURIComponent(`[Fresho] ${subject}`);
    const b  = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— Sent from Fresho Contact Page`
    );
    window.location.href = `mailto:${TO}?subject=${s}&body=${b}`;
  }

  // Rensa alert på reset
  form.addEventListener('reset', () => setAlert('', ''));
});
