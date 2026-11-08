// Login.jsx - User login form component validating credentials and initiating OTP verification
import React, { useState } from 'react';
import { loginApi } from '../api';

function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handles input changes for the login email field.
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Handles input changes for the login password field.
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  // Submits email and password to backend to initiate OTP dispatch.
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage('Email address is required.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await loginApi({
        email: trimmedEmail,
        password: password,
      });

      onLoginSuccess({
        email: response.email || trimmedEmail,
        purpose: 'login',
      });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-brand-header">
          <span className="auth-brand-badge">PBL</span>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">
            Sign in to access your personal tasks, track deadlines, and monitor your score.
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
            <label className="auth-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="name@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="auth-field-group">
            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="auth-input"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign In with Email OTP'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
