// models/User.js - Mongoose Schema for User accounts with email verification and password hashing
import mongoose from 'mongoose';

// Schema definition for registered user accounts.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helper transform function to format User document JSON output without exposing sensitive password hash.
const transformUserJson = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret.password;
  delete ret.__v;
  return ret;
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: transformUserJson,
});

// Exports the User model for database operations.
const User = mongoose.model('User', userSchema);

export default User;
