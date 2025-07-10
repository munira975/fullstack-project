// client/payment.js
document.addEventListener('DOMContentLoaded', async () => {
  const cartList = document.getElementById('cartList');
  const totalPriceEl = document.getElementById('totalPrice');

  try {
    const session = await fetch('/api/account/session', { credentials: 'include' });
    if (!session.ok) throw new Error('Not logged in');

    const res = await fetch('/api/cart', { credentials: 'include' });
    if (!res.ok) throw new Error('Could not fetch cart');

    const products = await res.json();
    if (products.length === 0) {
      cartList.innerHTML = '<p>Your cart is empty.</p>';
      totalPriceEl.textContent = 'Total: 0 kr';
      return;
    }

    let total = 0;
    cartList.innerHTML = '';

    products.forEach(product => {
      const div = document.createElement('div');
      div.className = 'cart-item';

      const name = document.createElement('span');
      name.textContent = product.name;

      const price = document.createElement('span');
      price.textContent = `${product.price} kr`;
      total += parseFloat(product.price);

      div.appendChild(name);
      div.appendChild(price);
      cartList.appendChild(div);
    });

    totalPriceEl.textContent = `Total: ${total} kr`;
  } catch (err) {
    console.error('Failed to load payment cart:', err);
    cartList.innerHTML = '<p>You must be logged in to view your cart.</p>';
    totalPriceEl.textContent = '';
  }
});
