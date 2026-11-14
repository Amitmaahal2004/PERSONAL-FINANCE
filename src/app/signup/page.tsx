'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Mail, User, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CURRENCY_MAP } from '@/lib/currency';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const res = await signup({
      name,
      email,
      password,
      confirmPassword,
      preferredCurrency,
    });

    if (!res.success) {
      setError(res.error || 'Signup failed.');
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-container">
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            <div className="auth-logo-icon">
              <TrendingUp style={{ width: 20, height: 20 }} />
            </div>
            <span className="auth-logo-text">MyFinance</span>
          </Link>
          <h2 className="auth-title">
            Create Your Private Financial Account
          </h2>
          <p className="auth-description">
            Your personal data is isolated and protected with bank-grade encryption.
          </p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSignup} className="auth-form">
            {error && (
              <div className="auth-alert-error">
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            {/* Preferred Currency */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Preferred Currency
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="auth-input"
                style={{ paddingLeft: 14 }}
              >
                {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                  <option key={code} value={code}>
                    {code} - {info.name} ({info.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Password (min 8 characters)
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <label className="auth-form-label">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-submit"
            >
              {loading ? (
                <span>Provisioning Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link href="/login" className="auth-footer-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

