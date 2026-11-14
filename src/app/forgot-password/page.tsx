'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        if (data.resetUrl) {
          setResetUrl(data.resetUrl);
        }
      } else {
        setError(data.error || 'Failed to submit request.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
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
            Reset Your Password
          </h2>
          <p className="auth-description">
            Enter your email to generate a secure, time-limited reset link.
          </p>
        </div>

        <div className="auth-card">
          {submitted ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 9999, backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <CheckCircle2 style={{ width: 24, height: 24 }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Check Your Instructions</h3>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                If an account exists with this email, password reset instructions have been generated.
              </p>
              {resetUrl && (
                <div style={{ padding: 12, backgroundColor: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0', fontSize: 12, textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, color: '#065f46', display: 'block', marginBottom: 4 }}>Direct Reset Link:</span>
                  <Link href={resetUrl} style={{ color: '#047857', textDecoration: 'underline', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    Click here to reset your password now
                  </Link>
                </div>
              )}
              <Link
                href="/login"
                className="auth-form-link"
                style={{ marginTop: 12, display: 'inline-block' }}
              >
                Back to Login
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

              <button
                type="submit"
                disabled={loading}
                className="auth-btn-submit"
              >
                {loading ? (
                  <span>Generating token...</span>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>

              <div className="auth-footer" style={{ marginTop: 12 }}>
                <Link href="/login" className="auth-form-link" style={{ color: '#64748b' }}>
                  Cancel and return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

