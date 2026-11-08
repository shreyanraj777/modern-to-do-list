// models/Otp.js - Mongoose Schema for single-use hashed OTP verification records
import mongoose from 'mongoose';

// Schema definition for OTP verification records with expiration and attempt limiting.
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'login'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: {
        expires: 0,
      },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Exports the Otp model for database operations.
const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
