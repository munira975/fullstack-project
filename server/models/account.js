// server/models/account.js
import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    wishlist: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    cart: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

AccountSchema.index({ email: 1 }, { unique: true });

const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
export default Account;
