// client/products.js
document.addEventListener('DOMContentLoaded', async () => {
  const productList = document.getElementById('productList');

  let isLoggedIn = false;
  let userEmail = null;

  // Kontrollera om användaren är inloggad
  try {
    const sessionRes = await fetch('/api/account/session', { credentials: 'include' });
    if (sessionRes.ok) {
      const data = await sessionRes.json();
      isLoggedIn = true;
      userEmail = data.email;
      document.getElementById('userEmail').textContent = userEmail;
      document.getElementById('logoutBtn').style.display = 'inline-block';
    }
  } catch (err) {
    console.error('Failed to check session:', err);
  }

  try {
    const res = await fetch('/api/products', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const products = await res.json();

    if (products.length === 0) {
      productList.innerHTML = '<p>No products available.</p>';
      return;
    }

    productList.innerHTML = '';
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const img = document.createElement('img');
      img.src = `/image_products/${product.image}`;
      img.alt = product.name;

      const name = document.createElement('h3');
      name.textContent = product.name;

      const price = document.createElement('p');
      price.textContent = `${product.price} kr`;

      const iconContainer = document.createElement('div');
      iconContainer.className = 'icon-container';

      const heartIcon = document.createElement('span');
      heartIcon.className = 'heart-icon';
      heartIcon.innerHTML = isLoggedIn && product.hjärta === 'on' ? '❤️' : '🤍';

      heartIcon.addEventListener('click', async () => {
        if (!isLoggedIn) {
          alert('You must be logged in to use the wishlist.');
          return;
        }

        try {
          const toggleRes = await fetch(`/api/products/${product._id}/heart`, {
            method: 'PATCH',
            credentials: 'include'
          });

          if (toggleRes.ok) {
            const result = await toggleRes.json();
            product.hjärta = result.hjärta;
            heartIcon.innerHTML = product.hjärta === 'on' ? '❤️' : '🤍';
          } else {
            alert('Could not update wishlist.');
          }
        } catch (err) {
          console.error('Error updating heart:', err);
        }
      });

      const cartIcon = document.createElement('span');
      cartIcon.className = 'cart-icon';
      cartIcon.innerHTML = isLoggedIn && product.cart === 'on' ? '🛍️' : '🛒';

      cartIcon.addEventListener('click', async () => {
        if (!isLoggedIn) {
          alert('You must be logged in to use the cart.');
          return;
        }

        try {
          const toggleRes = await fetch(`/api/products/${product._id}/cart`, {
            method: 'PATCH',
            credentials: 'include'
          });

          if (toggleRes.ok) {
            const result = await toggleRes.json();
            product.cart = result.cart;
            cartIcon.innerHTML = product.cart === 'on' ? '🛍️' : '🛒';
          } else {
            alert('Could not update cart.');
          }
        } catch (err) {
          console.error('Error updating cart:', err);
        }
      });

      iconContainer.appendChild(heartIcon);
      iconContainer.appendChild(cartIcon);

      card.appendChild(img);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(iconContainer);

      productList.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading products:', err);
    productList.innerHTML = '<p>Something went wrong.</p>';
  }
});
