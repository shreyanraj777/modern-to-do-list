// Register.jsx - User registration form component with client validation and OTP trigger
import React, { useState } from 'react';
import { registerApi } from '../api';

function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handles input changes for the name field.
  const handleNameChange = (e) => {
    setName(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Handles input changes for the email field.
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Handles input changes for the password field.
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Handles input changes for the confirm password field.
  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Validates registration form inputs and invokes backend registration API.
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await registerApi({
        name: trimmedName,
        email: trimmedEmail,
        password: password,
        confirmPassword: confirmPassword,
      });

      onRegisterSuccess({
        email: response.email || trimmedEmail,
        purpose: 'registration',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand-header">
          <span className="auth-brand-badge">PBL</span>
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">
            Sign up with your email to start organizing tasks, tracking deadlines, and building streaks.
          </p>
        </div>

        {errorMessage && (
          <div className="auth-error-banner" role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="register-name">
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              className="auth-input"
              placeholder="e.g. Shreyan Raj"
              value={name}
              onChange={handleNameChange}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="register-email">
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              className="auth-input"
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              className="auth-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              className="auth-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account & Sending OTP...' : 'Register with Email OTP'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
