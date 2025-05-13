document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((data) => alert(data.message))
    .catch(() => alert("Login failed"));
});

  function createUser() {
    const form = document.getElementById('loginForm');

    // Validera formuläret manuellt
    if (!form.checkValidity()) {
      form.reportValidity(); // Visar HTML5-validationsfel
      return;
    }

    // Hämta värden
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Skicka till servern (exempel med fetch)
    fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => alert(data.message))
    .catch(err => console.error(err));
  }
  