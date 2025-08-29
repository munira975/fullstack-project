// server/models/account.js
import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      // Username is NOT unique (same username allowed for different emails)
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [40, 'Username must not be longer than 40 characters'],
      match: [/^[a-zA-Z0-9_.-]+$/, 'Invalid username (letters, numbers, . _ - only)'],
      // not unique on purpose
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // only email must be unique
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      // NOTE: plain text for lab; never do this in production
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: undefined }],
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: undefined }],
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

/**
 * Backfill username for legacy accounts that don't have it.
 * Runs on create and on save of existing documents.
 */
AccountSchema.pre('validate', function (next) {
  if (!this.username || !String(this.username).trim()) {
    const local = (this.email || '').split('@')[0] || 'user';
    // Trim to 40 chars and ensure it matches the allowed pattern
    let candidate = local.slice(0, 40).replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!candidate) candidate = 'user';
    this.username = candidate;
  }
  next();
});

// Mongoose will create the unique index for email from the field definition
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
export default Account;
