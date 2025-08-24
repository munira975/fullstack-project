// client/products.js
document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('productsGrid');
  const title = document.getElementById('pageTitle');

  // Normaliserar DB-värdet till /public/image/products/<filnamn>
  function buildImgUrl(image) {
    if (!image) return getFallbackSvg();
    let s = String(image).trim();
    s = s
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/?public\/image\/products\//i, '')
      .replace(/^\/?image\/products\//i, '')
      .replace(/^\/?image\//i, '')
      .replace(/^\/+/, '');
    return `/public/image/products/${s}`;
  }

  // Inline SVG – ingen nätverksbegäran
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

  // Sätt EN gång – ingen 404-spam
  function attachImgFallback(img) {
    let used = false;
    img.addEventListener('error', () => {
      if (used) return;
      used = true;
      img.src = getFallbackSvg();
    });
  }

  const params = new URLSearchParams(window.location.search);
  const q = (params.get('q') || '').trim();
  const categories = (params.get('categories') || params.get('category') || '').trim();

  if (title) {
    if (categories && q) title.textContent = `Our Products — ${categories} — “${q}”`;
    else if (categories)  title.textContent = `Our Products — ${categories}`;
    else if (q)           title.textContent = `Our Products — “${q}”`;
    else                  title.textContent = 'Our Products';
  }

  const buildApiUrl = () => {
    const u = new URL('/api/products', window.location.origin);
    if (categories) u.searchParams.set('categories', categories);
    if (q) u.searchParams.set('q', q);
    return u.toString();
  };

  const asKr = (n) => `${(Number(n)||0).toFixed(2).replace(/\.00$/,'')} kr`;

  const render = (items=[]) => {
    if (!grid) return;
    grid.innerHTML = '';
    if (!items.length) {
      grid.innerHTML = `<p>No products found.</p>`;
      return;
    }
    items.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';

      const img = document.createElement('img');
      img.alt = p.name;
      img.loading = 'lazy';
      img.src = buildImgUrl(p.image);
      // om /public/... inte finns -> inline
      if (img.src.startsWith('/public/')) attachImgFallback(img);

      const name = document.createElement('h3');
      name.textContent = p.name;

      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = asKr(p.price);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const heart = document.createElement('button');
      heart.className = 'heart' + (p.heart ? ' on' : '');
      heart.title = 'Toggle wishlist';
      heart.textContent = p.heart ? '❤️' : '🤍';

      const cart = document.createElement('button');
      cart.className = 'cart' + (p.inCart ? ' on' : '');
      cart.title = 'Toggle cart';
      cart.textContent = p.inCart ? '🛒✓' : '🛒';

      heart.addEventListener('click', async () => {
        try {
          const r = await fetch(`/api/products/${p._id}/heart`, { method:'PATCH', credentials:'include' });
        if (!r.ok) throw 0;
          const data = await r.json();
          p.heart = !!data.heart;
          heart.textContent = p.heart ? '❤️' : '🤍';
          heart.classList.toggle('on', p.heart);
        } catch {}
      });

      cart.addEventListener('click', async () => {
        try {
          const r = await fetch(`/api/products/${p._id}/cart`, { method:'PATCH', credentials:'include' });
          if (!r.ok) throw 0;
          const data = await r.json();
          p.inCart = !!data.inCart;
          cart.textContent = p.inCart ? '🛒✓' : '🛒';
          cart.classList.toggle('on', p.inCart);
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
    const res = await fetch(buildApiUrl(), { credentials:'include' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    render(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('Error loading products:', e);
    if (grid) grid.innerHTML = `<p>Failed to load products.</p>`;
  }
});
