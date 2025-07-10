// server.js
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Importera routes
import accountRoutes from './server/routes/account.js';
import productRoutes from './server/routes/products.js';
import wishlistRoutes from './server/routes/wishlist.js';
import cartRoutes from './server/routes/cart.js';

// Miljövariabler
dotenv.config();

// __dirname-lösning för ES-moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session-hantering
app.use(session({
  secret: 'hemlig_sesionsnyckel',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // sätt true med HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 dag
  },
}));

// Statisk mapp (serva HTML och bilder)
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static(path.join(__dirname, 'public')));

// API-routes
app.use('/api/account', accountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);

// Starta servern
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
