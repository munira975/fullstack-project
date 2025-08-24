// client/wishlist.js
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('wishlistItems'); // matchar wishlist.html

  function buildImgUrl(image) {
    if (!image) return getFallbackSvg();
    let s = String(image).trim();
    s = s
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/?public\/image\/products\//i, '')
      .replace(/^\/?image\/products\//i, '')
      .replace(/^\/?image\//i, '')
      .replace(/^\/+/, '');
    const url = `/public/image/products/${s}`;
    return url;
  }
  function getFallbackSvg() {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
        <rect width="100%" height="100%" fill="#f2f2f2"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              fill="#9ca3af" font-family="Arial,Helvetica,sans-serif" font-size="18">
          No image
        </text>
      </svg>`
    );
  }
  function attachImgFallback(img) {
    let used = false;
    img.addEventListener('error', () => { if (!used) { used = true; img.src = getFallbackSvg(); }});
  }
  const asKr = (n) => `${(Number(n)||0).toFixed(2).replace(/\.00$/,'')} kr`;

  const render = (items=[]) => {
    grid.innerHTML = '';
    if (!items.length) {
      grid.innerHTML = `<p>Your wishlist is empty.</p>`;
      return;
    }
    items.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';

      const img = document.createElement('img');
      img.alt = p.name;
      img.loading = 'lazy';
      img.src = buildImgUrl(p.image);
      if (img.src.startsWith('/public/')) attachImgFallback(img);

      const name = document.createElement('h3');
      name.textContent = p.name;

      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = asKr(p.price);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const heart = document.createElement('button');
      heart.className = 'heart on';
      heart.title = 'Remove from wishlist';
      heart.textContent = '❤️';

      const cart = document.createElement('button');
      cart.className = 'cart' + (p.inCart ? ' on' : '');
      cart.title = 'Toggle cart';
      cart.textContent = p.inCart ? '🛒✓' : '🛒';

      heart.addEventListener('click', async () => {
        try {
          const r = await fetch(`/api/products/${p._id}/heart`, { method:'PATCH', credentials:'include' });
          if (r.ok) location.reload();
        } catch {}
      });
      cart.addEventListener('click', async () => {
        try {
          const r = await fetch(`/api/products/${p._id}/cart`, { method:'PATCH', credentials:'include' });
          if (r.ok) location.reload();
        } catch {}
      });

      actions.appendChild(heart);
      actions.appendChild(cart);

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(actions);
      grid.appendChild(card);
    });
  };

  try {
    const sessionRes = await fetch('/api/account/session', { credentials:'include' });
    if (!sessionRes.ok) { window.location.href='account.html'; return; }

    const res = await fetch('/api/wishlist', { credentials:'include' });
    if (!res.ok) throw new Error('Could not fetch wishlist');
    const data = await res.json();
    render(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Failed to load wishlist:', err);
    grid.innerHTML = `<p>Could not load wishlist.</p>`;
  }
});
