// server/routes/account.js
import express from 'express';
import Account from '../models/account.js';

const router = express.Router();
const COOKIE_NAME = 'sid';

const normEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/* POST /api/account/create – skapa konto och logga in */
router.post('/create', async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email och lösenord krävs' });
  }

  try {
    const existing = await Account.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Kontot finns redan' });

    const account = new Account({ email, password, wishlist: [], cart: [] });
    await account.save();

    req.session.user = { email: account.email };
    return res.status(201).json({ message: 'Konto skapat', email: account.email });
  } catch (err) {
    console.error('Fel vid skapande:', err);
    return res.status(500).json({ message: 'Serverfel' });
  }
});

/* POST /api/account – logga in */
router.post('/', async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email och lösenord krävs' });
  }

  try {
    const account = await Account.findOne({ email });
    if (!account || account.password !== password) {
      return res.status(401).json({ message: 'Fel e-post eller lösenord' });
    }

    req.session.user = { email: account.email };
    return res.json({ message: 'Inloggad', email: account.email });
  } catch (err) {
    console.error('Inloggningsfel:', err);
    return res.status(500).json({ message: 'Serverfel' });
  }
});

/* GET /api/account/session – kontrollera inloggning */
router.get('/session', (req, res) => {
  const email = req.session?.user?.email;
  if (email) return res.json({ email });
  return res.status(401).json({ message: 'Inte inloggad' });
});

/* POST /api/account/logout – logga ut */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie(COOKIE_NAME);
    return res.json({ message: 'Utloggad' });
  });
});

/* DELETE /api/account – radera inloggat konto */
router.delete('/', async (req, res) => {
  try {
    const email = req.session?.user?.email;
    if (!email) return res.status(401).json({ message: 'Inte inloggad' });

    const confirmText = req.body?.confirmText;
    if (confirmText !== 'DELETE') {
      return res.status(400).json({ message: 'Bekräftelsetexten måste vara DELETE' });
    }

    await Account.deleteOne({ email });

    req.session.destroy(() => {
      res.clearCookie(COOKIE_NAME);
      return res.status(200).json({ message: 'Konto raderat', success: true });
    });
  } catch (err) {
    console.error('Delete account failed:', err);
    return res.status(500).json({ message: 'Serverfel' });
  }
});

export default router;
