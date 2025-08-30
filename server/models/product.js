// server/models/product.js
import mongoose from 'mongoose';

export const ALLOWED_CATEGORIES = ['Snacks', 'Juice', 'Seafood', 'Meat', 'Grains', 'Fruits'];

const productSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    price:  { type: Number, required: true, min: 0 },
    stock:  { type: Number, required: true, min: 0 },
    category_id: { type: String, required: true, enum: ALLOWED_CATEGORIES, index: true },

    image: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /\.(png|jpe?g|webp|gif)$/i.test(v),
        message: 'image måste vara ett filnamn med .png/.jpg/.jpeg/.webp/.gif',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

productSchema.index({ category_id: 1, name: 1 });
productSchema.index({ name: 'text' });

productSchema.statics.findAvailableByCategory = function (category) {
  const filter = { stock: { $gt: 0 } };
  if (category) filter.category_id = category;
  return this.find(filter).sort({ name: 1 });
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
