// OtpVerification.jsx - Verification component for 6-digit email OTP with live countdown and resend cooldown
import React, { useState, useEffect } from 'react';
import { verifyOtpApi, resendOtpApi } from '../api';

function OtpVerification({ email, purpose, onVerificationSuccess, onBackToAuth }) {
  const [otp, setOtp] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(300); // 5 minutes
  const [cooldownSeconds, setCooldownSeconds] = useState(60); // 60s cooldown
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Formats seconds into MM:SS display format.
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  // Timer effect to decrement expiration countdown and resend cooldown every second.
  useEffect(() => {
    // Helper function that ticks both expiration and cooldown clocks.
    const tickClock = () => {
      setExpiresInSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });

      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    };

    const timerId = setInterval(tickClock, 1000);

    // Cleans up the timer interval when the component unmounts.
    return () => {
      clearInterval(timerId);
    };
  }, []);

  // Handles input updates restricting entry to 6 numeric characters.
  const handleOtpChange = (e) => {
    const rawValue = e.target.value;
    const sanitizedDigits = rawValue.replace(/\D/g, '').slice(0, 6);
    setOtp(sanitizedDigits);

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Submits the entered OTP to the backend server for cryptographic verification.
  const handleVerifySubmit = async (e) => {
    e.preventDefault();

    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      setErrorMessage('Please enter your 6-digit verification code.');
      return;
    }

    if (trimmedOtp.length !== 6) {
      setErrorMessage('Verification code must be exactly 6 digits.');
      return;
    }

    if (expiresInSeconds <= 0) {
      setErrorMessage('Verification code has expired. Please request a new code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await verifyOtpApi({
        email: email,
        otp: trimmedOtp,
        purpose: purpose,
      });

      onVerificationSuccess(response.user);
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Requests a fresh OTP code respecting backend 60-second cooldown limits.
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await resendOtpApi({
        email: email,
        purpose: purpose,
      });

      setSuccessMessage(response.message || 'A fresh code has been sent to your email.');
      setOtp('');
      setExpiresInSeconds(300);
      setCooldownSeconds(60);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isExpired = expiresInSeconds <= 0;
  const isRegistration = purpose === 'registration';

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand-header">
          <span className="auth-brand-badge">PBL</span>
          <h2 className="auth-title">Verify Your Email</h2>
          <p className="auth-subtitle">
            Enter the 6-digit code sent to <strong>{email}</strong> to complete your{' '}
            {isRegistration ? 'registration' : 'login'}.
          </p>
        </div>

        {errorMessage && (
          <div className="auth-error-banner" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-success-banner" role="status">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleVerifySubmit}>
          <div className="otp-input-container">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              className="otp-digit-input"
              placeholder="••••••"
              value={otp}
              onChange={handleOtpChange}
              disabled={isLoading}
              autoFocus
              maxLength={6}
              aria-label="6-Digit Verification Code"
            />

            <div className="otp-meta-row">
              <span
                className={`otp-timer-pill ${isExpired ? 'otp-timer-expired' : ''}`}
                title="Code expiration countdown"
              >
                ⏱️ {isExpired ? 'Code expired' : `Expires in ${formatTime(expiresInSeconds)}`}
              </span>

              <button
                type="button"
                className="btn-resend-otp"
                onClick={handleResendOtp}
                disabled={cooldownSeconds > 0 || isResending}
              >
                {cooldownSeconds > 0 ? `Resend (${cooldownSeconds}s)` : 'Resend Code'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn-submit"
            disabled={isLoading || otp.length !== 6 || isExpired}
          >
            {isLoading ? 'Verifying Code...' : 'Verify & Continue'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="auth-link-btn"
            onClick={onBackToAuth}
            disabled={isLoading}
          >
            ← Back to Sign In / Change Email
          </button>
        </div>
      </div>
    </div>
  );
}

export default OtpVerification;
