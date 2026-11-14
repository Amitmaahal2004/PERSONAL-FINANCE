'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Wallet,
  ArrowRight,
  PieChart,
  Target,
  Sparkles,
  Lock,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import HeroCarousel from '@/components/home/HeroCarousel';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Is MyFinance completely private and isolated for my personal use?',
      a: 'Yes. MyFinance implements strict document-level tenant isolation. Every transaction, account, budget, and note is cryptographically bound to your authenticated server session. No other registered user, including the platform administrator, can view your private financial records.',
    },
    {
      q: 'Can I track multiple bank accounts, cash wallets, and credit cards?',
      a: 'Absolutely. You can create unlimited accounts—including Cash, SBI, HDFC, digital wallets, credit cards, and investments—and record internal transfers between them without artificially inflating your income or expenses.',
    },
    {
      q: 'Does it support recurring bills and subscriptions?',
      a: 'Yes. You can schedule daily, weekly, monthly, and yearly recurring payments such as rent, internet bills, and subscriptions, with automatic due date projections.',
    },
    {
      q: 'Can I attach PDF bills and receipt photographs?',
      a: 'Yes. Every transaction supports optional receipt and bill attachments with instant in-browser previews and secure downloads.',
    },
    {
      q: 'Can I use MyFinance from my mobile smartphone?',
      a: 'Yes! MyFinance is designed mobile-first with a dedicated bottom navigation bar, quick 1-tap expense logging, touch-friendly forms, and PWA installability.',
    },
  ];

  return (
    <div className="landing">
      {/* 1. HEADER */}
      <header className="landing-header">
        <div className="landing-header-container">
          <Link href="/" className="landing-logo">
            <div className="landing-logo-icon">
              <TrendingUp style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <span className="landing-logo-title">MyFinance</span>
              <span className="landing-logo-badge">
                Personal Control
              </span>
            </div>
          </Link>

          <nav className="landing-nav">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
            <a href="#security" className="landing-nav-link">Privacy & Security</a>
            <a href="#faq" className="landing-nav-link">FAQ</a>
          </nav>

          <div className="landing-header-actions">
            <Link
              href="/login"
              className="landing-btn-login"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="landing-btn-signup"
            >
              <span>Get Started</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO CAROUSEL SECTION */}
      <HeroCarousel />

      {/* 7. FEATURES SECTION */}
      <section id="features" className="landing-features-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">
            Comprehensive Financial Engine
          </span>
          <h2 className="landing-section-title">
            Everything you need to master your personal economy.
          </h2>
          <p className="landing-section-desc">
            Built intentionally for independent individuals who demand complete clarity, security, and mobile speed.
          </p>
        </div>

        <div className="landing-features-grid">
          {/* Feature 1 */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Wallet style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="landing-feature-title">Multiple Financial Accounts</h3>
            <p className="landing-feature-desc">
              Manage Cash, Bank accounts, UPI IDs, digital wallets, and cards. Track accurate real-time balances calculated straight from your verified ledger.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <ArrowRight style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="landing-feature-title">Zero-Impact Internal Transfers</h3>
            <p className="landing-feature-desc">
              Transfer money from Cash to SBI or UPI to Bank without false income or expense inflation. Balances update atomically and accurately.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <PieChart style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="landing-feature-title">Category-Wise Budgets</h3>
            <p className="landing-feature-desc">
              Set monthly limits for Food, Travel, Shopping, and Rent. Receive early visual threshold alerts at 70%, 90%, and 100% before you overspend.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Target style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="landing-feature-title">Savings Goals with Contributions</h3>
            <p className="landing-feature-desc">
              Plan funds for an Emergency Fund, New Laptop, or Vacation. Track deposits from your accounts without double-counting your expense records.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <BarChart3 style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="landing-feature-title">Lending & Borrowed Money</h3>
            <p className="landing-feature-desc">
              Track personal loans lent to friends or money borrowed. Record partial repayments, track due dates, and monitor overdue receivables.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Smartphone style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="landing-feature-title">Mobile-First PWA</h3>
            <p className="landing-feature-desc">
              Engineered with a native bottom bar, 1-tap quick expense logger, responsive charts, and Add to Home Screen installability.
            </p>
          </div>
        </div>
      </section>

      {/* 8. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-how-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">
            Simple 3-Step Flow
          </span>
          <h2 className="landing-section-title">
            Start tracking in under 60 seconds
          </h2>
        </div>

        <div className="landing-how-grid">
          <div className="landing-how-card">
            <div className="landing-how-step">1</div>
            <h3 className="landing-how-title">Create Your Account</h3>
            <p className="landing-how-desc">
              Sign up with your email. Your personal financial workspace is immediately provisioned with default Indian categories and cash/bank accounts.
            </p>
          </div>

          <div className="landing-how-card">
            <div className="landing-how-step">2</div>
            <h3 className="landing-how-title">Record Income & Expenses</h3>
            <p className="landing-how-desc">
              Tap the (+) button on your mobile or desktop to quickly log transactions, attach bill screenshots, and assign payment methods.
            </p>
          </div>

          <div className="landing-how-card">
            <div className="landing-how-step">3</div>
            <h3 className="landing-how-title">Gain True Financial Clarity</h3>
            <p className="landing-how-desc">
              Watch your net savings grow, inspect category trends, export PDF/Excel reports, and stay completely in control of your financial future.
            </p>
          </div>
        </div>
      </section>

      {/* 10. PRIVACY AND SECURITY SECTION */}
      <section id="security" className="landing-security-section">
        <div className="landing-security-card">
          <div>
            <div className="landing-security-tag">
              <Lock style={{ width: 14, height: 14 }} />
              <span>Zero Cross-User Data Exposure</span>
            </div>
            <h2 className="landing-security-title">
              Your Finances Are Yours Alone.
            </h2>
            <p className="landing-security-desc">
              Unlike corporate ERPs and ad-driven trackers, MyFinance does not sell your transactional data or share records. Every database query enforces verified server-side session identity, ensuring no other user or administrator can access your private balances.
            </p>

            <div className="landing-security-grid">
              <div className="landing-security-item">
                <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
                <span>Bcrypt salted password encryption</span>
              </div>
              <div className="landing-security-item">
                <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
                <span>Secure HTTP-Only session cookies</span>
              </div>
              <div className="landing-security-item">
                <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
                <span>Strict multi-user document isolation</span>
              </div>
              <div className="landing-security-item">
                <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
                <span>Decimal-accurate financial calculations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section id="faq" className="landing-faq-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">
            Got Questions?
          </span>
          <h2 className="landing-section-title">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="landing-faq-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className="landing-faq-item">
              <button
                onClick={() => toggleFaq(idx)}
                className="landing-faq-question"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  style={{
                    width: 16,
                    height: 16,
                    color: openFaq === idx ? 'var(--color-primary, #10b981)' : '#94a3b8',
                    transform: openFaq === idx ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
              {openFaq === idx && (
                <div className="landing-faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-brand">
            <div className="landing-footer-icon">
              <TrendingUp style={{ width: 16, height: 16 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>MyFinance</span>
            <span className="landing-footer-copy">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="landing-footer-links">
            <Link href="/login" className="landing-footer-link">Login</Link>
            <Link href="/signup" className="landing-footer-link">Sign Up</Link>
            <Link href="/dashboard" className="landing-footer-link">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

