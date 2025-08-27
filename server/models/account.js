// server/models/account.js
import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      // Username is NOT unique (allowed to be the same for different emails)
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [40, 'Username must not be longer than 40 characters'],
      match: [/^[a-zA-Z0-9_.-]+$/, 'Invalid username (letters, numbers, . _ - only)'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // Only email must be unique
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      // NOTE: stored in plain text for course/lab; do NOT do this in production!
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
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

// No manual schema.index(...) to avoid duplicate index warnings.
// Mongoose will create the unique index for "email" from the field definition.

const Account =
  mongoose.models.Account || mongoose.model('Account', AccountSchema);

export default Account;
