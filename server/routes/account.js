// server/routes/account.js
import express from 'express';
import Account from '../models/account.js';

const router = express.Router();

// Skapa konto
router.post('/create', async (req, res) => {
  const { email, password } = req.body;
  console.log('Skapar konto:', req.body);

  if (!email || !password)
    return res.status(400).json({ error: 'Email och lösenord krävs' });

  try {
    const existing = await Account.findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'Kontot finns redan' });

    const account = new Account({
      email,
      password,
      wishlist: [],
      cart: [],
    });

    await account.save();

    req.session.user = { email: account.email };
    res.status(201).json({ message: 'Konto skapat', email });
  } catch (err) {
    console.error('❌ Fel vid skapande:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Logga in
router.post('/', async (req, res) => {
  const { email, password } = req.body;
  console.log('Loggar in:', req.body);

  try {
    const account = await Account.findOne({ email });
    if (!account || account.password !== password) {
      return res.status(401).json({ error: 'Fel e-post eller lösenord' });
    }

    req.session.user = { email: account.email };
    res.json({ message: 'Inloggad', email: account.email });
  } catch (err) {
    console.error('❌ Inloggningsfel:', err);
    res.status(500).json({ error: 'Serverfel' });
  }
});

// Kolla session
router.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ email: req.session.user.email });
  } else {
    res.status(401).json({ error: 'Inte inloggad' });
  }
});

// Logga ut
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Utloggad' });
  });
});

export default router;
