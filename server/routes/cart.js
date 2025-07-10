// routes/cart.js
import express from 'express';
import Product from '../models/product.js';
import Account from '../models/account.js';

const router = express.Router();

// Hämta produkter i kundvagnen
router.get('/', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(403).json({ message: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const items = await Product.find({ _id: { $in: account.cart } });
    res.json(items);
  } catch (err) {
    console.error('❌ Error fetching cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lägg till/ta bort produkt i kundvagnen
router.patch('/:id', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(403).json({ message: 'Not logged in' });

  const productId = req.params.id;

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Toggle cart-status
    const index = account.cart.indexOf(productId);
    if (index === -1) {
      account.cart.push(productId);
      product.cart = 'on';
    } else {
      account.cart.splice(index, 1);
      product.cart = 'off';
    }

    await account.save();
    await product.save();

    res.json({ success: true, cart: product.cart });
  } catch (err) {
    console.error('❌ Error updating cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
