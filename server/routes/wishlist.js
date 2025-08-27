// server/routes/wishlist.js
import express from 'express';
import mongoose from 'mongoose';
import Account from '../models/account.js';
import Product from '../models/product.js';

const router = express.Router();

const toValidObjectIds = (list) => {
  if (!Array.isArray(list)) return [];
  const ids = list
    .map((v) => (v ? String(v).trim() : ''))
    .filter((v) => mongoose.isValidObjectId(v))
    .map((v) => new mongoose.Types.ObjectId(v));
  return ids;
};

/* GET /api/wishlist – hämta wishlist */
router.get('/', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const ids = toValidObjectIds(account.wishlist);
    if (!ids.length) return res.json([]);

    const products = await Product.find({ _id: { $in: ids } })
      .sort({ name: 1 })
      .lean();

    return res.json(products);
  } catch (err) {
    console.error('❌ Error fetching wishlist:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* PATCH /api/wishlist/:id – toggle */
router.patch('/:id', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  const pid = req.params.id;
  if (!mongoose.isValidObjectId(pid)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const i = (account.wishlist || []).findIndex((x) => String(x) === pid);
    let heart;
    if (i === -1) {
      account.wishlist = Array.isArray(account.wishlist) ? account.wishlist : [];
      account.wishlist.push(new mongoose.Types.ObjectId(pid));
      heart = true;
    } else {
      account.wishlist.splice(i, 1);
      heart = false;
    }
    await account.save();
    return res.json({ heart });
  } catch (err) {
    console.error('❌ Error updating wishlist:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* DELETE /api/wishlist/clear – rensa wishlist */
router.delete('/clear', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    account.wishlist = [];
    await account.save();

    return res.json({ message: 'Wishlist cleared' });
  } catch (err) {
    console.error('❌ Error clearing wishlist:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
