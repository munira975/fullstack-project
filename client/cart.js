// client/cart.js
document.addEventListener('DOMContentLoaded', async () => {
  const listEl = document.getElementById('cartList');

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

  const renderEmpty = (msg='Your cart is empty.') => {
    listEl.innerHTML = `<p>${msg}</p>`;
  };

  try {
    const sessionRes = await fetch('/api/account/session', { credentials:'include' });
    if (!sessionRes.ok) { window.location.href='account.html'; return; }

    const res = await fetch('/api/cart', { credentials:'include' });
    if (!res.ok) throw new Error('Could not fetch cart');
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) { renderEmpty(); return; }

    listEl.innerHTML = '';
    let total = 0;

    products.forEach(p => {
      total += Number(p.price)||0;

      const row = document.createElement('div');
      row.className = 'cart-row';

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

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        try {
          const r = await fetch(`/api/products/${p._id}/cart`, { method:'PATCH', credentials:'include' });
          if (r.ok) location.reload();
        } catch {}
      });

      row.appendChild(img);
      row.appendChild(name);
      row.appendChild(price);
      row.appendChild(removeBtn);
      listEl.appendChild(row);
    });

    // Visa total om du har ett element för det (lägg till i cart.html om saknas)
    let totalEl = document.getElementById('totalPrice');
    if (!totalEl) {
      totalEl = document.createElement('div');
      totalEl.id = 'totalPrice';
      totalEl.className = 'cart-total';
      listEl.insertAdjacentElement('afterend', totalEl);
    }
    totalEl.textContent = `Total: ${asKr(total)}`;
  } catch (err) {
    console.error('Failed to load cart:', err);
    renderEmpty('You must be logged in to view your cart.');
  }
});
