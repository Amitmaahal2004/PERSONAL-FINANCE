'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials.');
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
            Sign in to your finances
          </h2>
          <p className="auth-description">
            Your Money. Your Records. Your Control.
          </p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="auth-alert-error">
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

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

            {/* Password */}
            <div className="auth-form-group">
              <div className="auth-form-header">
                <label className="auth-form-label">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="auth-form-link"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
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

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-submit"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don&apos;t have an account yet?</span>
            <Link href="/signup" className="auth-footer-link">
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

