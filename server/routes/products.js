// server/routes/products.js
import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/product.js';
import Account from '../models/account.js';

const router = express.Router();

/* ---------------- Helpers ---------------- */
const CATEGORY_MAP = {
  snacks: 'Snacks',
  juice: 'Juice',
  seafood: 'Seafood',
  meat: 'Meat',
  grains: 'Grains',
  fruits: 'Fruits',   // <-- 6:e kategorin
};

const sanitizeLimit = (v, def = 100, max = 200) => {
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n <= 0) return def;
  return Math.min(n, max);
};

const escapeRegExp = (s = '') =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normCategory = (c) => {
  if (!c) return null;
  const key = String(c).toLowerCase();
  return CATEGORY_MAP[key] || c;
};

/* --------------- Toggle wishlist (❤️) --------------- */
router.patch('/:id/heart', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  const productId = req.params.id;
  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const idx = (account.wishlist || []).findIndex((x) => String(x) === productId);
    let heart;
    if (idx === -1) {
      account.wishlist.push(new mongoose.Types.ObjectId(productId));
      heart = true;
    } else {
      account.wishlist.splice(idx, 1);
      heart = false;
    }
    await account.save();
    return res.status(200).json({ heart });
  } catch (err) {
    console.error('❌ Error toggling heart:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ---------------- Toggle cart (🛒) ---------------- */
router.patch('/:id/cart', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(401).json({ message: 'Not logged in' });

  const productId = req.params.id;
  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const idx = (account.cart || []).findIndex((x) => String(x) === productId);
    let inCart;
    if (idx === -1) {
      account.cart.push(new mongoose.Types.ObjectId(productId));
      inCart = true;
    } else {
      account.cart.splice(idx, 1);
      inCart = false;
    }
    await account.save();
    return res.status(200).json({ inCart });
  } catch (err) {
    console.error('❌ Error updating cart:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/products
 * Stöd:
 *  - ?q=term (regex i name, case-insensitive)
 *  - ?category=Snacks|Juice|Seafood|Meat|Grains|Fruits (även kommaseparerad)
 *  - ?categories=Snacks,Meat,Grains,Fruits           (flerval—rekommenderat)
 *  - ?limit=50  (max 200)
 * Inloggad användare får per-produkt: { heart, inCart }.
 */
router.get('/', async (req, res) => {
  try {
    const { q, search, category: rawCategory, categories: rawCategories, limit: rawLimit } = req.query;

    // 1) Läs ev. flera kategorier via ?categories=Snacks,Meat
    let cats = [];
    if (rawCategories) {
      cats = String(rawCategories)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(normCategory);
    }

    // 2) Stöd även för ?category=Snacks eller ?category=snacks,meat
    if (rawCategory) {
      const parts = String(rawCategory)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(normCategory);
      cats.push(...parts);
    }

    cats = [...new Set(cats.filter(Boolean))];

    const limit = sanitizeLimit(rawLimit);
    const filter = {};

    if (cats.length === 1) {
      filter.category_id = cats[0];
    } else if (cats.length > 1) {
      filter.category_id = { $in: cats };
    }

    const term = (q || search || '').trim();
    if (term) {
      const rx = new RegExp(escapeRegExp(term), 'i');
      filter.name = rx;
    }

    const products = await Product.find(filter).sort({ name: 1 }).limit(limit);

    const email = req.session.user?.email;
    if (!email) return res.status(200).json(products);

    const account = await Account.findOne({ email });
    if (!account) return res.status(200).json(products);

    const wl = new Set((account.wishlist || []).map((id) => id.toString()));
    const cartSet = new Set((account.cart || []).map((id) => id.toString()));

    const payload = products.map((p) => {
      const obj = p.toObject();
      obj.heart = wl.has(p._id.toString());
      obj.inCart = cartSet.has(p._id.toString());
      return obj;
    });

    return res.status(200).json(payload);
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ---- Kategorilista (namn + antal) ---- */
router.get('/categories/list', async (_req, res) => {
  try {
    const data = await Product.aggregate([
      { $group: { _id: '$category_id', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { category: 1 } },
    ]);
    return res.json(data);
  } catch (err) {
    console.error('❌ Error aggregating categories:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/* ---- Förslag (autosuggest) ----
   GET /api/products/suggest?prefix=a&limit=8&categories=Snacks,Meat
   Matchar ORDSTART: \bprefix (så "ju" hittar "Apple Juice")
*/
router.get('/suggest', async (req, res) => {
  try {
    const prefix = String(req.query.prefix || '').trim();
    if (!prefix) return res.json([]);

    const limit = sanitizeLimit(req.query.limit, 8, 50);

    let cats = [];
    if (req.query.categories) {
      cats = String(req.query.categories)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(normCategory);
      cats = [...new Set(cats.filter(Boolean))];
    }

    const wordsRx = new RegExp('\\b' + escapeRegExp(prefix), 'i');

    const filter = { name: wordsRx };
    if (cats.length === 1) filter.category_id = cats[0];
    else if (cats.length > 1) filter.category_id = { $in: cats };

    const docs = await Product.find(filter, { name: 1, image: 1 })
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error('❌ Error in suggest:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
