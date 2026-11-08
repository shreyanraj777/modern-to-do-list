// utils/otpHelpers.js - Cryptographic generation, secure hashing, and server-side verification of OTPs
import crypto from 'crypto';
import Otp from '../models/Otp.js';
import { sendOtpEmail } from './emailService.js';

// Generates a cryptographically secure 6-digit numeric OTP string.
export const generateSixDigitOtp = () => {
  const randomValue = crypto.randomInt(100000, 1000000);
  return randomValue.toString();
};

// Generates a secure SHA-256 hash of the plain OTP string for database storage.
export const hashOtp = (plainOtp) => {
  const hash = crypto.createHash('sha256');
  hash.update(plainOtp);
  return hash.digest('hex');
};

// Creates a new OTP record with a 60-second cooldown check and sends it via email.
export const createAndSendOtp = async (email, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  // Find any existing active OTP for this email and purpose to enforce cooldown.
  const existingOtp = await Otp.findOne({
    email: normalizedEmail,
    purpose: purpose,
  });

  if (existingOtp) {
    const elapsedSeconds = Math.floor((now.getTime() - existingOtp.lastSentAt.getTime()) / 1000);
    const cooldownPeriod = 60;

    if (elapsedSeconds < cooldownPeriod) {
      const waitTime = cooldownPeriod - elapsedSeconds;
      const cooldownError = new Error(`Please wait ${waitTime} seconds before requesting a new code.`);
      cooldownError.status = 429;
      throw cooldownError;
    }

    // Invalidate existing OTP record before issuing a new one.
    await Otp.deleteOne({
      _id: existingOtp._id,
    });
  }

  const plainOtp = generateSixDigitOtp();
  const hashedOtp = hashOtp(plainOtp);
  const fiveMinutesMs = 5 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + fiveMinutesMs);

  const newOtpRecord = new Otp({
    email: normalizedEmail,
    otpHash: hashedOtp,
    purpose: purpose,
    expiresAt: expiresAt,
    attempts: 0,
    lastSentAt: now,
  });

  await newOtpRecord.save();

  // Attempt to deliver the OTP to user's registered email.
  try {
    await sendOtpEmail(normalizedEmail, plainOtp, purpose);
  } catch (emailError) {
    // If sending fails, remove the newly created OTP record so user is not locked out.
    await Otp.deleteOne({
      _id: newOtpRecord._id,
    });
    throw emailError;
  }

  return {
    success: true,
    message: 'OTP sent to your email successfully.',
  };
};

// Verifies the user-entered OTP against the stored hash and enforces attempt limits and expiration.
export const verifyOtpCode = async (email, enteredOtp, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: purpose,
  });

  if (!otpRecord) {
    return {
      isValid: false,
      error: 'Verification code not found or expired. Please request a new code.',
      status: 400,
    };
  }

  // Check if the OTP has exceeded its 5-minute lifespan.
  if (otpRecord.expiresAt < now) {
    await Otp.deleteOne({
      _id: otpRecord._id,
    });
    return {
      isValid: false,
      error: 'Verification code has expired. Please request a new code.',
      status: 400,
    };
  }

  // Check if incorrect attempt limit of 5 has been reached.
  const maxAttempts = 5;
  if (otpRecord.attempts >= maxAttempts) {
    await Otp.deleteOne({
      _id: otpRecord._id,
    });
    return {
      isValid: false,
      error: 'Too many incorrect attempts. This verification code has been invalidated. Please request a new code.',
      status: 429,
    };
  }

  const hashedInput = hashOtp(enteredOtp.trim());

  if (hashedInput !== otpRecord.otpHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remainingAttempts = maxAttempts - otpRecord.attempts;

    if (remainingAttempts <= 0) {
      await Otp.deleteOne({
        _id: otpRecord._id,
      });
      return {
        isValid: false,
        error: 'Too many incorrect attempts. Code invalidated. Please request a new code.',
        status: 429,
      };
    }

    return {
      isValid: false,
      error: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
      status: 400,
    };
  }

  // Single-use: delete immediately upon successful verification.
  await Otp.deleteOne({
    _id: otpRecord._id,
  });

  return {
    isValid: true,
  };
};
