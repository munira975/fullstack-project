// server/routes/wishlist.js
import express from 'express';
import Account from '../models/account.js';
import Product from '../models/product.js';

const router = express.Router();

// GET /api/wishlist – Hämta produkter i önskelistan
router.get('/', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(403).json({ error: 'Inte inloggad' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ error: 'Kontot finns inte' });

    const products = await Product.find({
      _id: { $in: account.wishlist }
    });

    res.json(products);
  } catch (err) {
    console.error('❌ Fel vid hämtning av wishlist:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// PATCH /api/wishlist/:id – Ta bort en produkt från wishlist
router.patch('/:id', async (req, res) => {
  const email = req.session.user?.email;
  const productId = req.params.id;
  if (!email) return res.status(403).json({ error: 'Inte inloggad' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ error: 'Kontot finns inte' });

    const index = account.wishlist.indexOf(productId);
    if (index !== -1) {
      account.wishlist.splice(index, 1);
      await account.save();
    }

    res.json({ message: 'Borttagen från wishlist' });
  } catch (err) {
    console.error('❌ Fel vid borttagning från wishlist:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// DELETE /api/wishlist/clear – Töm hela wishlist
router.delete('/clear', async (req, res) => {
  const email = req.session.user?.email;
  if (!email) return res.status(403).json({ error: 'Inte inloggad' });

  try {
    const account = await Account.findOne({ email });
    if (!account) return res.status(404).json({ error: 'Kontot finns inte' });

    account.wishlist = [];
    await account.save();

    res.json({ message: 'Wishlist tömd' });
  } catch (err) {
    console.error('❌ Fel vid rensning av wishlist:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

export default router;
