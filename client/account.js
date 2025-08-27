// client/account.js

// Helpers
const $ = (id) => document.getElementById(id);
const setMsg = (text, isErr = false) => {
  const m = $('message');
  if (!m) return;
  m.textContent = text || '';
  m.style.color = isErr ? '#b00020' : '#1f2937';
};
const setBusy = (btnId, v) => { const b = $(btnId); if (b) b.disabled = !!v; };
const parseErr = async (res) => {
  try {
    const d = await res.json();
    return d?.error?.message || d?.message || `Fel ${res.status}`;
  } catch {
    return `Fel ${res.status}`;
  }
};

// ===== Login =====
const loginForm = $('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    setBusy('loginBtn', true);

    const email = $('loginEmail')?.value.trim().toLowerCase();
    const password = $('loginPassword')?.value;

    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return setMsg(await parseErr(res), true);

      const data = await res.json(); // { message, email, username }
      localStorage.setItem('email', data.email || '');
      localStorage.setItem('username', data.username || '');
      location.href = 'index.html';
    } catch {
      setMsg('Network error. Try again.', true);
    } finally {
      setBusy('loginBtn', false);
    }
  });
}

// ===== Create Account (med username + bekräfta lösenord) =====
const createForm = $('createForm');
if (createForm) {
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');
    setBusy('createBtn', true);

    const username = $('createUsername')?.value.trim();
    const email = $('createEmail')?.value.trim().toLowerCase();
    const password = $('createPassword')?.value;
    const confirmPassword = $('createPasswordConfirm')?.value;

    // Klientside-validering
    if (!username || !email || !password || !confirmPassword) {
      setMsg('Fill in all fields.', true);
      setBusy('createBtn', false);
      return;
    }
    if (password !== confirmPassword) {
      setMsg('Passwords do not match.', true);
      setBusy('createBtn', false);
      return;
    }

    try {
      const res = await fetch('/api/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // Skicka med confirmPassword också – servern validerar om det finns
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });
      if (!res.ok) return setMsg(await parseErr(res), true);

      const data = await res.json(); // { message, email, username }
      localStorage.setItem('email', data.email || '');
      localStorage.setItem('username', data.username || '');
      location.href = 'index.html';
    } catch {
      setMsg('Network error. Try again.', true);
    } finally {
      setBusy('createBtn', false);
    }
  });
}

// (valfritt) Hämta session vid sidladdning
(async () => {
  try {
    const r = await fetch('/api/account/session', { credentials: 'include' });
    if (r.ok) {
      const s = await r.json();
      localStorage.setItem('email', s.email || '');
      localStorage.setItem('username', s.username || '');
    }
  } catch {}
})();
