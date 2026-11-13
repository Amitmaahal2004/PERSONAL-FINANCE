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
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">MyFinance</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Personal Control
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition">How It Works</a>
            <a href="#security" className="hover:text-emerald-600 transition">Privacy & Security</a>
            <a href="#faq" className="hover:text-emerald-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-emerald-600 px-3.5 py-2 transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold mb-6 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tagline: Your Money. Your Records. Your Control.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
            Take Control of <span className="text-emerald-600">Your Money.</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Track your income, manage expenses, plan savings and understand where every rupee goes.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Start Free Personal Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200 shadow-subtle transition flex items-center justify-center"
            >
              Login to Workspace
            </Link>
          </div>

          {/* 6. DASHBOARD PREVIEW SECTION */}
          <div className="mt-14 sm:mt-20 max-w-5xl mx-auto">
            <div className="relative rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-2xl shadow-slate-200/50">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="ml-2 font-mono text-[11px] text-slate-500 hidden sm:inline">myfinance.app/dashboard</span>
                </div>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 text-[11px]">
                  Sample Financial Preview
                </span>
              </div>

              {/* Sample Dashboard UI Mock */}
              <div className="pt-4 text-left space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500">Available Balance</span>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₹1,84,500.00</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">Across 3 accounts</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[11px] font-medium text-emerald-700">Monthly Income</span>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">₹95,000.00</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">+8.4% from last mo.</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                    <span className="text-[11px] font-medium text-rose-700">Monthly Expenses</span>
                    <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">₹34,220.00</div>
                    <span className="text-[10px] text-slate-500">36% of monthly budget</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <span className="text-[11px] font-medium text-blue-700">Total Savings</span>
                    <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">₹4,20,000.00</div>
                    <span className="text-[10px] text-blue-600 font-semibold">3 active goals</span>
                  </div>
                </div>

                {/* Sample Chart and Transactions preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800">Income vs Expense (6-Month Trend)</span>
                      <span className="text-[11px] text-emerald-600 font-medium">Net positive: +₹60,780</span>
                    </div>
                    {/* Simulated chart bars */}
                    <div className="h-32 flex items-end justify-between gap-3 pt-4 px-2">
                      {[
                        { mo: 'Jun', inc: 70, exp: 40 },
                        { mo: 'Jul', inc: 75, exp: 45 },
                        { mo: 'Aug', inc: 80, exp: 35 },
                        { mo: 'Sep', inc: 85, exp: 50 },
                        { mo: 'Oct', inc: 90, exp: 38 },
                        { mo: 'Nov', inc: 95, exp: 34 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="w-full flex items-end justify-center gap-1 h-24">
                            <div className="w-3 bg-emerald-500 rounded-t" style={{ height: `${item.inc}%` }}></div>
                            <div className="w-3 bg-rose-400 rounded-t" style={{ height: `${item.exp}%` }}></div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">{item.mo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-800 mb-2">Recent Records</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                            ₹
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Salary Deposit</div>
                            <div className="text-[10px] text-slate-400">Main Bank • UPI</div>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-600">+₹85,000</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                            ₹
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Fresh Grocery</div>
                            <div className="text-[10px] text-slate-400">Cash Wallet • Dining</div>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800">-₹2,450</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                            ₹
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Electric Bill</div>
                            <div className="text-[10px] text-slate-400">Utilities • NetBanking</div>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800">-₹1,820</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2 block text-center">100% private to your account</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FEATURES SECTION */}
      <section id="features" className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              Comprehensive Financial Engine
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to master your personal economy.
            </h3>
            <p className="mt-4 text-base text-slate-600">
              Built intentionally for independent individuals who demand complete clarity, security, and mobile speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition shadow-subtle hover:shadow-hover">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Multiple Financial Accounts</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Manage Cash, Bank accounts, UPI IDs, digital wallets, and cards. Track accurate real-time balances calculated straight from your verified ledger.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition shadow-subtle hover:shadow-hover">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Zero-Impact Internal Transfers</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transfer money from Cash to SBI or UPI to Bank without false income or expense inflation. Balances update atomically and accurately.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition shadow-subtle hover:shadow-hover">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Category-Wise Budgets</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Set monthly limits for Food, Travel, Shopping, and Rent. Receive early visual threshold alerts at 70%, 90%, and 100% before you overspend.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition shadow-subtle hover:shadow-hover">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Savings Goals with Contributions</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Plan funds for an Emergency Fund, New Laptop, or Vacation. Track deposits from your accounts without double-counting your expense records.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition shadow-subtle hover:shadow-hover">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Lending & Borrowed Money</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track personal loans lent to friends or money borrowed. Record partial repayments, track due dates, and monitor overdue receivables.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition shadow-subtle hover:shadow-hover">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Mobile-First PWA</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Engineered with a native bottom bar, 1-tap quick expense logger, responsive charts, and Add to Home Screen installability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              Simple 3-Step Flow
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Start tracking in under 60 seconds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-subtle">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-lg">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Create Your Account</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign up with your email. Your personal financial workspace is immediately provisioned with default Indian categories and cash/bank accounts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-subtle">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-lg">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Record Income & Expenses</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tap the (+) button on your mobile or desktop to quickly log transactions, attach bill screenshots, and assign payment methods.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-subtle">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-lg">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base mb-2">Gain True Financial Clarity</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Watch your net savings grow, inspect category trends, export PDF/Excel reports, and stay completely in control of your financial future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PRIVACY AND SECURITY SECTION */}
      <section id="security" className="py-20 sm:py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero Cross-User Data Exposure</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Your Finances Are Yours Alone.
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                Unlike corporate ERPs and ad-driven trackers, MyFinance does not sell your transactional data or share records. Every database query enforces verified server-side session identity, ensuring no other user or administrator can access your private balances.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bcrypt salted password encryption</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Secure HTTP-Only session cookies</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Strict multi-user document isolation</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Decimal-accurate financial calculations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              Got Questions?
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition shadow-subtle"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:text-emerald-700 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-base">MyFinance</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-6">
            <Link href="/login" className="hover:text-emerald-600 transition">Login</Link>
            <Link href="/signup" className="hover:text-emerald-600 transition">Sign Up</Link>
            <Link href="/dashboard" className="hover:text-emerald-600 transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

