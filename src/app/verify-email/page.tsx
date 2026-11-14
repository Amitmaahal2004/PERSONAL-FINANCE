'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TrendingUp, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');

    try {
      const url = token ? `/api/auth/verify-email?token=${token}` : '/api/auth/verify-email';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        await refreshUser();
      } else {
        setError(data.error || 'Verification failed.');
      }
    } catch {
      setError('An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleVerify();
    }
  }, [token]);

  return (
    <div className="auth-card" style={{ textAlign: 'center' }}>
      {success || user?.isEmailVerified ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 9999, backgroundColor: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <CheckCircle2 style={{ width: 24, height: 24 }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Email Address Verified!</h3>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Your email has been successfully verified. You have full access to all features.
          </p>
          <Link
            href="/dashboard"
            className="auth-btn-submit"
            style={{ textDecoration: 'none', marginTop: 12 }}
          >
            <span>Go to Dashboard</span>
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div className="auth-alert-error" style={{ textAlign: 'left' }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
            Click the button below to confirm and verify your email address.
          </p>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="auth-btn-submit"
          >
            {loading ? 'Verifying...' : 'Verify My Email'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
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
            Email Verification
          </h2>
        </div>

        <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}

