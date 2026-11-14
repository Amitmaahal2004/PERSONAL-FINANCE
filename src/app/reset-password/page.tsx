'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing from URL.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      {success ? (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 9999, backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <CheckCircle2 style={{ width: 24, height: 24 }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Password Reset Successfully</h3>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Your password has been updated. You can now log in using your new credentials.
          </p>
          <Link
            href="/login"
            className="auth-btn-submit"
            style={{ textDecoration: 'none', marginTop: 12 }}
          >
            <span>Proceed to Login</span>
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-alert-error">
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-form-group">
            <label className="auth-form-label">
              New Password (min 8 characters)
            </label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="auth-form-group">
            <label className="auth-form-label">
              Confirm New Password
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
              <span>Resetting Password...</span>
            ) : (
              <>
                <span>Set New Password</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
            Set Your New Password
          </h2>
          <p className="auth-description">
            Enter and confirm your new secure password below.
          </p>
        </div>

        <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

