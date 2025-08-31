// server/routes/account.js
import express from 'express';
import Account from '../models/account.js';

const router = express.Router();
const COOKIE_NAME = 'sid';

const norm = (v) => (typeof v === 'string' ? v.trim() : '');
const normEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const isValidUsername = (u) => /^[a-zA-Z0-9_.-]{3,40}$/.test(u);

function sendErr(res, code, message, details) {
  return res.status(code).json({ error: { code, message, details } });
}

/* Create account */
router.post('/create', async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = norm(req.body?.password);
  const confirmPassword = norm(req.body?.confirmPassword); 
  const username = norm(req.body?.username);

  if (!email || !password || !username) {
    return sendErr(res, 400, 'Email, username and password are required');
  }
  if (!isValidUsername(username)) {
    return sendErr(
      res,
      400,
      'Invalid username (3–40 characters; a–z, 0–9, . _ -)'
    );
  }
  if (confirmPassword && password !== confirmPassword) {
    return sendErr(res, 400, 'Passwords do not match');
  }

  try {
    const existing = await Account.findOne({ email }).lean();
    if (existing) {
      return sendErr(res, 409, 'Email already in use.');
    }

    const account = new Account({
      email,
      password,
      username,
      wishlist: [],
      cart: [],
    });
    await account.save();

    req.session.user = { email: account.email, username: account.username };
    return res.status(201).json({
      message: 'Account created',
      email: account.email,
      username: account.username,
    });
  } catch (err) {
    console.error('Error during creation:', err);
    if (err?.code === 11000) {
      if (err.keyPattern?.email) return sendErr(res, 409, 'Email already in use.');
      return sendErr(res, 409, 'Already in use.');
    }
    if (err?.name === 'ValidationError') {
      const details = Object.values(err.errors).map((e) => e.message);
      return sendErr(res, 400, 'Invalid field values', details);
    }
    return sendErr(res, 500, 'Server error');
  }
});

/*Login*/
router.post('/', async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = norm(req.body?.password);

  if (!email || !password) {
    return sendErr(res, 400, 'Email and password are required');
  }

  try {
    const account = await Account.findOne({ email }).lean();
    if (!account || account.password !== password) {
      return sendErr(res, 401, 'Incorrect email or password');
    }

    req.session.user = { email: account.email, username: account.username };
    return res.json({
      message: 'Logged in',
      email: account.email,
      username: account.username,
    });
  } catch (err) {
    console.error('Login error:', err);
    return sendErr(res, 500, 'Server error');
  }
});

/*Session*/
router.get('/session', (req, res) => {
  const u = req.session?.user;
  if (u?.email) return res.json({ authenticated: true, email: u.email, username: u.username });
  return res.json({ authenticated: false });
});

/*Logout*/
router.post('/logout', (req, res) => {
  const secureCookies = String(process.env.SECURE_COOKIES || '').toLowerCase() === 'true';
  req.session.destroy(() => {
    res.clearCookie('sid', {
      httpOnly: true,
      sameSite: secureCookies ? 'none' : 'lax',
      secure: secureCookies,
      path: '/',          
    });
    return res.json({ message: 'Logged out' });
  });
});


export default router;
