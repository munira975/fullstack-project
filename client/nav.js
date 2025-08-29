// client/cart.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('cartList');
  const countEl = document.getElementById('cartCount');   // valfritt i HTML
  const totalEl = document.getElementById('cartTotal');   // valfritt i HTML

  /* ---------- helpers ---------- */
  const asKr = (n) => `${(Number(n) || 0).toFixed(2).replace(/\.00$/, '')} kr`;

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
  function buildImgUrl(image) {
    if (!image) return getFallbackSvg();
    let s = String(image).trim()
      .replace(/^https?:\/\/[^/]+/i, '')
      .replace(/^\/?public\/image\/products\//i, '')
      .replace(/^\/?image\/products\//i, '')
      .replace(/^\/?image\//i, '')
      .replace(/^\/+/, '');
    return `/public/image/products/${s}`;
  }
  function attachImgFallback(img) {
    let used = false;
    img.addEventListener('error', () => {
      if (!used) { used = true; img.src = getFallbackSvg(); }
    });
  }
  function renderEmpty(msg = 'Your cart is empty.') {
    if (listEl) listEl.innerHTML = `<p>${msg}</p>`;
    if (countEl) countEl.textContent = '0 items';
    if (totalEl) totalEl.textContent = asKr(0);
  }

  /* ---------- load session & cart ---------- */
  try {
    const sessionRes = await fetch('/api/account/session', { credentials: 'include' });
    if (!sessionRes.ok) { window.location.href = 'account.html'; return; }

    const res = await fetch('/api/cart', { credentials: 'include' });
    if (!res.ok) throw new Error('Could not fetch cart');
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      renderEmpty();
      return;
    }

    // render cards in a responsive grid (matches cart.css)
    listEl.innerHTML = '';
    let total = 0;

    const removeFromCart = async (id, card) => {
      try {
        const r = await fetch(`/api/cart/${id}`, { method: 'PATCH', credentials: 'include' });
        if (!r.ok) throw new Error('Failed to update cart');
        // remove card from DOM and recalc
        card.remove();
        recalc();
      } catch (e) {
        console.error(e);
        alert(e.message || 'Failed to update cart');
      }
    };

    products.forEach(p => {
      total += Number(p.price) || 0;

      const card = document.createElement('article');
      card.className = 'cart-item';

      const img = document.createElement('img');
      img.src = buildImgUrl(p.image);
      img.alt = p.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (img.src.startsWith('/public/')) attachImgFallback(img);

      const name = document.createElement('h3');
      name.textContent = p.name;

      const price = document.createElement('p');
      price.className = 'price';
      price.textContent = asKr(p.price);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => removeFromCart(p._id, card));

      actions.appendChild(removeBtn);

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(actions);
      listEl.appendChild(card);
    });

    // initial totals
    if (countEl) countEl.textContent = `${products.length} ${products.length === 1 ? 'item' : 'items'}`;
    if (totalEl) totalEl.textContent = asKr(total);

    // recalc totals after removals
    function recalc() {
      const cards = Array.from(listEl.querySelectorAll('.cart-item'));
      if (cards.length === 0) { renderEmpty(); return; }

      const prices = cards.map(c => c.querySelector('.price')?.textContent || '0');
      const sum = prices.reduce((acc, txt) => {
        const num = Number(String(txt).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        return acc + num;
      }, 0);

      if (countEl) countEl.textContent = `${cards.length} ${cards.length === 1 ? 'item' : 'items'}`;
      if (totalEl) totalEl.textContent = asKr(sum);
    }
  } catch (err) {
    console.error('Failed to load cart:', err);
    renderEmpty('You must be logged in to view your cart.');
  }
});
