// server.js
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// API-routes
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
    if (!origin) return cb(null, true);             
    if (ORIGINS.includes(origin)) return cb(null, true);
    console.warn(`CORS blocked: ${origin} (allow: ${ORIGINS.join(', ')})`);
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
  secret: process.env.SESSION_SECRET || 'hemlig_sesionsnyckel',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: SECURE_COOKIES ? 'none' : 'lax',
    secure: SECURE_COOKIES,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

/* ---- API ---- */
app.use('/api/account', accountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);

/* Healthcheck & 404 */
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/*', (_req, res) => res.status(404).json({ message: 'Not found' }));

/* Global felhanterare */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err?.message || err);
  res.status(500).json({ message: 'Server error' });
});

/* ---- Start ---- */
(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI saknas i .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log('CORS allowlist:', ORIGINS.join(', '));
      console.log('Cookies:', `sameSite=${SECURE_COOKIES ? 'none' : 'lax'}, secure=${SECURE_COOKIES}`);
      console.log('NODE_ENV:', NODE_ENV);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
})();
