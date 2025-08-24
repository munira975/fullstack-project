// server/routes/cart.js
import express from 'express';
import mongoose from 'mongoose';
import Account from '../models/account.js';
import Product from '../models/product.js';

const router = express.Router();

const toValidObjectIds = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((v) => (v ? String(v).trim() : ''))
    .filter((v) => mongoose.isValidObjectId(v))
    .map((v) => new mongoose.Types.ObjectId(v));
};


router.get('/', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const ids = toValidObjectIds(account.cart);
    if (!ids.length) return res.json([]);

    const items = await Product.find({ _id: { $in: ids } })
      .sort({ name: 1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.patch('/:id', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  const productId = req.params.id;
  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const list = Array.isArray(account.cart) ? account.cart : [];
    const idx = list.findIndex((id) => String(id) === productId);

    let inCart;
    if (idx === -1) {
      account.cart.push(new mongoose.Types.ObjectId(productId));
      inCart = true;
    } else {
      account.cart.splice(idx, 1);
      inCart = false;
    }

    await account.save();
    return res.json({ success: true, inCart });
  } catch (err) {
    console.error('Error updating cart:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/clear', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    account.cart = [];
    await account.save();
    return res.json({ message: 'Cart cleared' });
  } catch (err) {
    console.error('Error clearing cart:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
