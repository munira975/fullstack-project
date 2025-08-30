// server.js
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// API routes
import accountRoutes from './server/routes/account.js';
import productRoutes from './server/routes/products.js';
import wishlistRoutes from './server/routes/wishlist.js';
import cartRoutes from './server/routes/cart.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ---- CORS origins ---- */
const rawOrigins =
  process.env.FRONTEND_ORIGINS ||
  process.env.CORS_ORIGINS ||
  [
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].join(',');

const ORIGINS = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin requests have no Origin
    if (ORIGINS.includes(origin)) return cb(null, true);
    console.warn(`🚫 CORS blocked: ${origin} (allowed: ${ORIGINS.join(', ')})`);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---- Session cookie ---- */
const SECURE_COOKIES = String(process.env.SECURE_COOKIES || '').toLowerCase() === 'true';
if (SECURE_COOKIES) app.set('trust proxy', 1);

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'dev_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: SECURE_COOKIES ? 'none' : 'lax',
    secure: SECURE_COOKIES,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

/* ---- Static directories ---- */
const CLIENT_DIR = path.join(__dirname, 'client');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PUBLIC_IMAGE_DIR = path.join(PUBLIC_DIR, 'image');

// Fallback candidates if images ended up under client/
const CLIENT_PUBLIC_IMAGE_DIR = path.join(CLIENT_DIR, 'public', 'image');
const CLIENT_IMAGE_DIR        = path.join(CLIENT_DIR, 'image');

// Log where we serve static assets from
console.log('🗂  Static roots:');
console.log('  /public            ->', PUBLIC_DIR);
console.log('  /public/image (*)  ->', PUBLIC_IMAGE_DIR, fs.existsSync(PUBLIC_IMAGE_DIR) ? '(exists)' : '(missing)');
console.log('  /public/image (alt)->', CLIENT_PUBLIC_IMAGE_DIR, fs.existsSync(CLIENT_PUBLIC_IMAGE_DIR) ? '(exists)' : '(missing)');
console.log('  /public/image (alt)->', CLIENT_IMAGE_DIR,        fs.existsSync(CLIENT_IMAGE_DIR) ? '(exists)' : '(missing)');

// Static mounts
app.use('/public', express.static(PUBLIC_DIR));
app.use('/image', express.static(PUBLIC_IMAGE_DIR));
app.use('/public/image', express.static(PUBLIC_IMAGE_DIR));
app.use('/public/image', express.static(CLIENT_PUBLIC_IMAGE_DIR));
app.use('/public/image', express.static(CLIENT_IMAGE_DIR));

// Serve client assets (html/css/js)
app.use(express.static(CLIENT_DIR));

/* ---- Explicit client page routes (fixes navigation to about/products/etc.) ---- */
const sendClient = (page) => (_req, res) => res.sendFile(path.join(CLIENT_DIR, page));
app.get('/', sendClient('index.html'));
app.get('/index.html', sendClient('index.html'));
app.get('/about.html', sendClient('about.html'));
app.get('/products.html', sendClient('products.html'));
app.get('/contact.html', sendClient('contact.html'));
app.get('/account.html', sendClient('account.html'));
app.get('/cart.html', sendClient('cart.html'));
app.get('/wishlist.html', sendClient('wishlist.html'));
app.get('/payment.html', sendClient('payment.html'));

/* ---- API ---- */
app.use('/api/account', accountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message, ts } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  console.log('📬 Contact message received:', { name, email, subject, message, ts });

  return res.status(204).end(); 
});

/* Healthcheck & 404 */
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/*', (_req, res) => res.status(404).json({ message: 'Not found' }));

/* Global error handler */
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err?.message || err);
  res.status(500).json({ message: 'Server error' });
});

/* ---- Start ---- */
(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is missing in .env');
      process.exit(1);
    }
    // Remove deprecated options; driver v4+ ignores them anyway
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log('🌐 CORS allowlist:', ORIGINS.join(', '));
      console.log('🔐 Cookies:', `sameSite=${SECURE_COOKIES ? 'none' : 'lax'}, secure=${SECURE_COOKIES}`);
      console.log('🏷️ NODE_ENV:', NODE_ENV);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
})();
