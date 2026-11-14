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

      {/* 2. HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          <div className="landing-badge">
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>Tagline: Your Money. Your Records. Your Control.</span>
          </div>

          <h1 className="landing-headline">
            Take Control of <span>Your Money.</span>
          </h1>

          <p className="landing-subheading">
            Track your income, manage expenses, plan savings and understand where every rupee goes.
          </p>

          <div className="landing-hero-actions">
            <Link
              href="/signup"
              className="landing-btn-hero-primary"
            >
              <span>Start Free Personal Account</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link
              href="/login"
              className="landing-btn-hero-secondary"
            >
              Login to Workspace
            </Link>
          </div>

          {/* 6. DASHBOARD PREVIEW SECTION */}
          <div className="landing-preview-wrapper">
            <div className="landing-preview-card">
              <div className="landing-preview-topbar">
                <div className="landing-window-dots">
                  <div className="landing-window-dot landing-window-dot-red" />
                  <div className="landing-window-dot landing-window-dot-amber" />
                  <div className="landing-window-dot landing-window-dot-green" />
                  <span className="landing-window-url">myfinance.app/dashboard</span>
                </div>
                <span className="landing-preview-tag">
                  Sample Financial Preview
                </span>
              </div>

              {/* Sample Dashboard UI Mock */}
              <div className="landing-preview-content">
                {/* KPI row */}
                <div className="landing-preview-kpis">
                  <div className="landing-preview-kpi">
                    <span className="landing-preview-kpi-label">Available Balance</span>
                    <div className="landing-preview-kpi-value">₹1,84,500.00</div>
                    <span className="landing-preview-kpi-sub" style={{ color: '#059669' }}>Across 3 accounts</span>
                  </div>
                  <div className="landing-preview-kpi landing-preview-kpi-green">
                    <span className="landing-preview-kpi-label" style={{ color: '#047857' }}>Monthly Income</span>
                    <div className="landing-preview-kpi-value" style={{ color: '#047857' }}>₹95,000.00</div>
                    <span className="landing-preview-kpi-sub" style={{ color: '#059669' }}>+8.4% from last mo.</span>
                  </div>
                  <div className="landing-preview-kpi landing-preview-kpi-rose">
                    <span className="landing-preview-kpi-label" style={{ color: '#be123c' }}>Monthly Expenses</span>
                    <div className="landing-preview-kpi-value" style={{ color: '#be123c' }}>₹34,220.00</div>
                    <span className="landing-preview-kpi-sub">36% of monthly budget</span>
                  </div>
                  <div className="landing-preview-kpi landing-preview-kpi-blue">
                    <span className="landing-preview-kpi-label" style={{ color: '#1d4ed8' }}>Total Savings</span>
                    <div className="landing-preview-kpi-value" style={{ color: '#1d4ed8' }}>₹4,20,000.00</div>
                    <span className="landing-preview-kpi-sub" style={{ color: '#2563eb' }}>3 active goals</span>
                  </div>
                </div>

                {/* Sample Chart and Transactions preview */}
                <div className="landing-preview-middle">
                  <div className="landing-preview-chart-card">
                    <div className="landing-preview-chart-header">
                      <span>Income vs Expense (6-Month Trend)</span>
                      <span style={{ color: '#059669', fontSize: 11, fontWeight: 500 }}>Net positive: +₹60,780</span>
                    </div>
                    {/* Simulated chart bars */}
                    <div className="landing-preview-chart-bars">
                      {[
                        { mo: 'Jun', inc: 70, exp: 40 },
                        { mo: 'Jul', inc: 75, exp: 45 },
                        { mo: 'Aug', inc: 80, exp: 35 },
                        { mo: 'Sep', inc: 85, exp: 50 },
                        { mo: 'Oct', inc: 90, exp: 38 },
                        { mo: 'Nov', inc: 95, exp: 34 },
                      ].map((item, idx) => (
                        <div key={idx} className="landing-preview-bar-col">
                          <div className="landing-preview-bar-track">
                            <div className="landing-preview-bar-income" style={{ height: `${item.inc}%` }} />
                            <div className="landing-preview-bar-expense" style={{ height: `${item.exp}%` }} />
                          </div>
                          <span className="landing-preview-bar-label">{item.mo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div className="landing-preview-recent-card">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'block' }}>Recent Records</span>
                    <div className="landing-preview-recent-list">
                      <div className="landing-preview-recent-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="landing-preview-recent-icon landing-preview-recent-icon-income">
                            ₹
                          </div>
                          <div>
                            <div className="landing-preview-recent-title">Salary Deposit</div>
                            <div className="landing-preview-recent-sub">Main Bank • UPI</div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: '#059669' }}>+₹85,000</span>
                      </div>

                      <div className="landing-preview-recent-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="landing-preview-recent-icon landing-preview-recent-icon-expense">
                            ₹
                          </div>
                          <div>
                            <div className="landing-preview-recent-title">Fresh Grocery</div>
                            <div className="landing-preview-recent-sub">Cash Wallet • Dining</div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>-₹2,450</span>
                      </div>

                      <div className="landing-preview-recent-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="landing-preview-recent-icon landing-preview-recent-icon-expense">
                            ₹
                          </div>
                          <div>
                            <div className="landing-preview-recent-title">Electric Bill</div>
                            <div className="landing-preview-recent-sub">Utilities • NetBanking</div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>-₹1,820</span>
                      </div>
                    </div>
                    <span className="landing-preview-recent-footer">100% private to your account</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

