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
    <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-3xl border border-slate-100 text-center">
      {success || user?.isEmailVerified ? (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Email Address Verified!</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your email has been successfully verified. You have full access to all features.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            Click the button below to confirm and verify your email address.
          </p>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition active:scale-[0.98]"
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">MyFinance</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Email Verification
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}

