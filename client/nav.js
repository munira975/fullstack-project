// client/nav.js
document.addEventListener('DOMContentLoaded', async () => {
  const accountLink = document.getElementById('accountLink');
  const userEmailSpan = document.getElementById('userEmail');

  try {
    const res = await fetch('/api/account/session', {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('email', data.email);

      accountLink.innerHTML = 'Account <br /><strong>Logout</strong>';
      accountLink.href = '#';
      userEmailSpan.textContent = data.email;

      accountLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const logoutRes = await fetch('/api/account/logout', {
          method: 'POST',
          credentials: 'include',
        });
        if (logoutRes.ok) {
          localStorage.removeItem('email');
          window.location.href = 'index.html';
        }
      });
    } else {
      accountLink.innerHTML = 'Account <br /><strong>Login</strong>';
      accountLink.href = 'account.html';
      userEmailSpan.textContent = '';
    }
  } catch (err) {
    console.error('Fel vid kontroll av session:', err);
  }
});
