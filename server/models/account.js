import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // OK att ha unikt e-post
  },
  password: {
    type: String,
    required: true,
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  cart: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }]
});

// Se till att Mongoose inte försöker skapa modellen två gånger
const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);

export default Account;
