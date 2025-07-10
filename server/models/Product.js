// models/product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category_id: { type: String, required: true },
  image: { type: String, required: true },
  hjärta: { type: String, default: 'off' }, // för wishlist
  cart: { type: String, default: 'off' },   // för kundvagn
});

const Product = mongoose.model('Product', productSchema);
export default Product;
