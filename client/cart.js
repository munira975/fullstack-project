// client/cart.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl   = document.getElementById('cartList');
  const countEl  = document.getElementById('cartCount');
  const totalEl  = document.getElementById('cartTotal');
  const clearBtn = document.getElementById('clearCartBtn');
  const summary  = document.getElementById('cartSummary');

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

  const showEmpty = (msg = 'Your cart is empty.') => {
    listEl.innerHTML = `<p>${msg}</p>`;
    countEl.textContent = '0 items';
    totalEl.textContent = '0 kr';
    summary.style.display = 'none';
  };

  const render = (products) => {
    listEl.innerHTML = '';
    let total = 0;

    products.forEach((p) => {
      total += Number(p.price) || 0;

      const card = document.createElement('article');
      card.className = 'cart-card';

      const img = document.createElement('img');
      img.src = buildImgUrl(p.image);
      img.alt = p.name;
      if (img.src.startsWith('/public/')) attachImgFallback(img);

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = p.name;

      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = asKr(p.price);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        try {
          const r = await fetch(`/api/cart/${p._id}`, { method: 'PATCH', credentials: 'include' });
          if (!r.ok) throw new Error('Failed to update cart');
          card.remove();
          // Update counters
          const left = listEl.querySelectorAll('.cart-card').length;
          if (left === 0) { showEmpty(); return; }
          total -= Number(p.price) || 0;
          countEl.textContent = `${left} ${left === 1 ? 'item' : 'items'}`;
          totalEl.textContent = asKr(total);
        } catch (e) {
          console.error(e);
          alert('Could not remove item from cart.');
        }
      });

      actions.appendChild(removeBtn);
      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(actions);
      listEl.appendChild(card);
    });

    countEl.textContent = `${products.length} ${products.length === 1 ? 'item' : 'items'}`;
    totalEl.textContent = asKr(total);
    summary.style.display = 'flex';
  };

  try {
    // Require login
    const sessionRes = await fetch('/api/account/session', { credentials: 'include' });
    if (!sessionRes.ok) { window.location.href = 'account.html'; return; }

    // Load cart
    const res = await fetch('/api/cart', { credentials: 'include' });
    if (!res.ok) throw new Error('Could not fetch cart');
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) { showEmpty(); }
    else { render(products); }

    // Clear cart (bottom)
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Clear the entire cart?')) return;
      try {
        const r = await fetch('/api/cart/clear', { method: 'DELETE', credentials: 'include' });
        if (!r.ok) throw new Error('Failed to clear cart');
        showEmpty();
      } catch (e) {
        console.error(e);
        alert('Could not clear cart.');
      }
    });
  } catch (err) {
    console.error('Failed to load cart:', err);
    showEmpty('You must be logged in to view your cart.');
  }
});
