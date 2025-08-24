// client/account.js

const el = (id) => document.getElementById(id);
const setMsg = (text, isError = false) => {
  const m = el('message');
  if (!m) return;
  m.textContent = text || '';
  m.style.color = isError ? '#c0392b' : '#2c3e50';
};

const setBusy = (btnId, busy) => {
  const btn = el(btnId);
  if (btn) btn.disabled = !!busy;
};

/* ===== Inloggning ===== */
el('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');
  setBusy('loginBtn', true);

  const email = el('loginEmail')?.value?.trim();
  const password = el('loginPassword')?.value;

  try {
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('email', data.email || '');
      window.location.href = 'index.html';
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.message || 'Inloggningen misslyckades', true);
    }
  } catch (err) {
    console.error('Fel vid inloggning:', err);
    setMsg('Nätverksfel. Försök igen.', true);
  } finally {
    setBusy('loginBtn', false);
  }
});

/* ===== Skapa konto ===== */
el('createForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');
  setBusy('createBtn', true);

  const email = el('createEmail')?.value?.trim();
  const password = el('createPassword')?.value;

  try {
    const res = await fetch('/api/account/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('email', data.email || '');
      window.location.href = 'index.html';
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.message || 'Konto kunde inte skapas', true);
    }
  } catch (err) {
    console.error('Fel vid skapande av konto:', err);
    setMsg('Nätverksfel. Försök igen.', true);
  } finally {
    setBusy('createBtn', false);
  }
});

/* ===== Delete account ===== */
(() => {
  const understand = el('confirmUnderstand');
  const confirmText = el('confirmText');
  const deleteBtn = el('deleteBtn');
  const form = el('deleteForm');

  const updateState = () => {
    const ok = understand?.checked && confirmText?.value?.trim() === 'DELETE';
    if (deleteBtn) deleteBtn.disabled = !ok;
  };

  understand?.addEventListener('change', updateState);
  confirmText?.addEventListener('input', updateState);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    setBusy('deleteBtn', true);

    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmText: confirmText.value.trim() }),
      });

      if (res.ok) {
        localStorage.removeItem('email');
        window.location.href = 'index.html';
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.message || 'Kunde inte radera konto', true);
      }
    } catch (err) {
      console.error('Fel vid radering:', err);
      setMsg('Nätverksfel. Försök igen.', true);
    } finally {
      setBusy('deleteBtn', false);
    }
  });
})();
