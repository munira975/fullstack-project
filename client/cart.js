// client/cart.js
document.addEventListener('DOMContentLoaded', async () => {
  const cartList = document.getElementById('cartList');

  try {
    // Kontrollera session först
    const sessionRes = await fetch('/api/account/session', { credentials: 'include' });
    if (!sessionRes.ok) throw new Error('Not logged in');

    const res = await fetch('/api/cart', {
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Failed to fetch cart');
    const products = await res.json();

    if (products.length === 0) {
      cartList.innerHTML = '<p>Your cart is empty.</p>';
      return;
    }

    cartList.innerHTML = '';
    products.forEach(product => {
      const item = document.createElement('div');
      item.className = 'cart-item';

      const img = document.createElement('img');
      img.src = `/image_products/${product.image}`;
      img.alt = product.name;

      const name = document.createElement('h3');
      name.textContent = product.name;

      const price = document.createElement('p');
      price.textContent = `${product.price} kr`;

      item.appendChild(img);
      item.appendChild(name);
      item.appendChild(price);

      cartList.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading cart:', err);
    cartList.innerHTML = '<p>You must be logged in to view your cart.</p>';
  }
});
