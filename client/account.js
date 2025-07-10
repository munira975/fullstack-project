// client/account.js

// Inloggning
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;

  try {
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('email', data.email);
      window.location.href = 'index.html';
    } else {
      const errorData = await res.json();
      alert(errorData.message || 'Inloggningen misslyckades');
    }
  } catch (err) {
    console.error('Fel vid inloggning:', err);
  }
});

// Skapa konto
document.getElementById('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('createEmail')?.value;
  const password = document.getElementById('createPassword')?.value;

  try {
    const res = await fetch('/api/account/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('email', data.email);
      window.location.href = 'index.html';
    } else {
      const errorData = await res.json();
      alert(errorData.message || 'Konto kunde inte skapas');
    }
  } catch (err) {
    console.error('Fel vid skapande av konto:', err);
  }
});
