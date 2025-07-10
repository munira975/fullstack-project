// server/routes/products.js
import express from 'express';
import Product from '../models/product.js';
import Account from '../models/account.js';

const router = express.Router();

// PATCH /api/products/:id/heart – toggle hjärta och uppdatera account.wishlist
router.patch('/:id/heart', async (req, res) => {
  const email = req.session.user?.email;
  const productId = req.params.id;

  if (!email) return res.status(401).json({ error: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Toggle hjärta
    const isOn = product.hjärta === 'on';
    product.hjärta = isOn ? 'off' : 'on';
    await product.save();

    // Lägg till eller ta bort produkt-ID i account.wishlist
    const index = account.wishlist.indexOf(productId);
    if (!isOn && index === -1) {
      account.wishlist.push(productId);
    } else if (isOn && index !== -1) {
      account.wishlist.splice(index, 1);
    }

    await account.save();

    res.status(200).json({ hjärta: product.hjärta });
  } catch (err) {
    console.error('❌ Error toggling heart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/products/:id/cart – toggle cart och uppdatera account.cart
router.patch('/:id/cart', async (req, res) => {
  const email = req.session.user?.email;
  const productId = req.params.id;

  if (!email) return res.status(401).json({ error: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Toggle cart
    const isOn = product.cart === 'on';
    product.cart = isOn ? 'off' : 'on';
    await product.save();

    // Lägg till eller ta bort från account.cart
    const index = account.cart.indexOf(productId);
    if (!isOn && index === -1) {
      account.cart.push(productId);
    } else if (isOn && index !== -1) {
      account.cart.splice(index, 1);
    }

    await account.save();

    res.status(200).json({ cart: product.cart });
  } catch (err) {
    console.error('❌ Error toggling cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/products – hämta alla produkter
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
