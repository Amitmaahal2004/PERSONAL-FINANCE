'use client';

import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Wallet,
  HandCoins,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Target,
  Sparkles,
  CreditCard,
  Calendar,
  Check,
  AlertCircle,
  BarChart3,
  Layers,
  Repeat,
} from 'lucide-react';

interface HeroVisualProps {
  slideIndex: number;
}

export default function HeroVisual({ slideIndex }: HeroVisualProps) {
  return (
    <div className="hero-carousel-visual">
      {/* Dynamic Ambient Background Glows */}
      <div className="hero-carousel-ambient hero-carousel-ambient-top" aria-hidden="true" />
      <div className="hero-carousel-ambient hero-carousel-ambient-bottom" aria-hidden="true" />
      <div className="hero-carousel-ambient hero-carousel-ambient-accent" aria-hidden="true" />

      {/* Device Mockups Assembly */}
      <div className="hero-carousel-devices">
        {/* ============================================================== */}
        {/* 1. LARGE REALISTIC LAPTOP FRAME */}
        {/* ============================================================== */}
        <div className="hero-carousel-laptop">
          {/* Top Lid / Screen Bezel */}
          <div className="laptop-screen-bezel">
            {/* Camera & Sensor Notch */}
            <div className="laptop-camera-notch">
              <span className="laptop-camera-lens" />
              <span className="laptop-camera-sensor" />
            </div>

            {/* Laptop Display Content */}
            <div className="laptop-screen-content">
              {slideIndex === 0 && (
                <div className="laptop-slide-view laptop-slide-dashboard">
                  <img
                    src="/images/dashboard-preview.png"
                    alt="MyFinance Desktop Dashboard"
                    className="laptop-screen-img"
                  />
                  {/* Subtle glossy glass reflection line across screen */}
                  <div className="laptop-screen-glare" />
                </div>
              )}

              {slideIndex === 1 && (
                <div className="laptop-slide-view laptop-slide-udhaar">
                  <div className="mock-ui-header">
                    <div className="mock-brand">
                      <div className="mock-logo-badge">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <span className="mock-title">MyFinance</span>
                      <span className="mock-badge">UDHAAR MODULE</span>
                    </div>
                    <div className="mock-status">
                      <span className="mock-status-dot" />
                      <span>Ledger Synced</span>
                    </div>
                  </div>

                  {/* Udhaar Top KPI Tiles */}
                  <div className="mock-udhaar-kpis">
                    <div className="mock-kpi-card lent">
                      <span className="mock-kpi-label">Total Money Lent</span>
                      <span className="mock-kpi-val">₹10,000.00</span>
                      <span className="mock-kpi-sub">1 Active Record</span>
                    </div>
                    <div className="mock-kpi-card borrowed">
                      <span className="mock-kpi-label">Total Borrowed</span>
                      <span className="mock-kpi-val">₹6,000.00</span>
                      <span className="mock-kpi-sub">0 Pending Repayments</span>
                    </div>
                    <div className="mock-kpi-card pending">
                      <span className="mock-kpi-label">Pending Receivables</span>
                      <span className="mock-kpi-val highlight">₹7,000.00</span>
                      <span className="mock-kpi-sub">₹3,000 Repaid (30%)</span>
                    </div>
                  </div>

                  {/* Udhaar Interactive Ledger Row */}
                  <div className="mock-udhaar-ledger">
                    <div className="mock-ledger-head">
                      <span>Person</span>
                      <span>Category</span>
                      <span>Progress</span>
                      <span>Remaining</span>
                      <span>Action</span>
                    </div>
                    <div className="mock-ledger-row">
                      <div className="mock-person-cell">
                        <div className="mock-person-avatar">AS</div>
                        <div>
                          <div className="mock-person-name">Aarav Sharma</div>
                          <div className="mock-person-phone">+91 98765 43210</div>
                        </div>
                      </div>
                      <div className="mock-tag lent">Lent</div>
                      <div className="mock-progress-cell">
                        <div className="mock-bar-track">
                          <div className="mock-bar-fill" style={{ width: '30%' }} />
                        </div>
                        <span className="mock-bar-pct">30%</span>
                      </div>
                      <div className="mock-amount-cell">
                        <span className="remaining">₹7,000</span>
                        <span className="original">of ₹10,000</span>
                      </div>
                      <div className="mock-action-btn">Repay</div>
                    </div>
                  </div>
                  <div className="laptop-screen-glare" />
                </div>
              )}

              {slideIndex === 2 && (
                <div className="laptop-slide-view laptop-slide-budgets">
                  <div className="mock-ui-header">
                    <div className="mock-brand">
                      <div className="mock-logo-badge">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <span className="mock-title">MyFinance</span>
                      <span className="mock-badge">BUDGETS & GOALS</span>
                    </div>
                    <div className="mock-status">
                      <span className="mock-status-dot" />
                      <span>Smart Tracking</span>
                    </div>
                  </div>

                  {/* Budgets & Goals Grid */}
                  <div className="mock-budget-grid">
                    <div className="mock-budget-card">
                      <div className="mock-budget-top">
                        <div className="mock-budget-icon food">
                          <PieChart className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="mock-budget-name">Food & Dining</div>
                          <div className="mock-budget-stat">₹4,500 of ₹5,000 spent</div>
                        </div>
                        <span className="mock-alert-tag warning">90%</span>
                      </div>
                      <div className="mock-bar-track">
                        <div className="mock-bar-fill alert" style={{ width: '90%' }} />
                      </div>
                      <div className="mock-budget-foot">
                        <span>Remaining: ₹500.00</span>
                        <span className="mock-alert-txt">Threshold Alert!</span>
                      </div>
                    </div>

                    <div className="mock-budget-card">
                      <div className="mock-budget-top">
                        <div className="mock-budget-icon savings">
                          <Target className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <div className="mock-budget-name">Emergency Savings</div>
                          <div className="mock-budget-stat">₹15,000 of ₹50,000 saved</div>
                        </div>
                        <span className="mock-alert-tag safe">30%</span>
                      </div>
                      <div className="mock-bar-track">
                        <div className="mock-bar-fill safe" style={{ width: '30%' }} />
                      </div>
                      <div className="mock-budget-foot">
                        <span>Target: Dec 2026</span>
                        <span className="mock-safe-txt">On Track</span>
                      </div>
                    </div>
                  </div>

                  {/* Recurring Bill Strip */}
                  <div className="mock-recurring-strip">
                    <div className="mock-rec-icon">
                      <Repeat className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="mock-rec-details">
                      <span className="mock-rec-name">High-Speed Fiber Internet</span>
                      <span className="mock-rec-date">Next due: 28 Nov 2026 • Monthly</span>
                    </div>
                    <span className="mock-rec-amount">₹999.00 / mo</span>
                  </div>
                  <div className="laptop-screen-glare" />
                </div>
              )}
            </div>
          </div>

          {/* Laptop Base & Trackpad Chassis */}
          <div className="laptop-base-chassis">
            <div className="laptop-notch-lip" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. SLEEK MOBILE PHONE FRAME (iPhone 15 Pro Style) */}
        {/* ============================================================== */}
        <div className="hero-carousel-mobile">
          <div className="mobile-phone-outer">
            {/* Dynamic Island Pill */}
            <div className="mobile-dynamic-island">
              <span className="island-camera" />
              <span className="island-sensor" />
            </div>

            {/* Mobile Screen UI */}
            <div className="mobile-screen-content">
              {/* Status bar */}
              <div className="mobile-status-bar">
                <span className="mobile-time">9:41</span>
                <div className="mobile-indicators">
                  <span className="indicator-signal" />
                  <span className="indicator-wifi" />
                  <span className="indicator-battery" />
                </div>
              </div>

              {/* Mobile App Header */}
              <div className="mobile-app-header">
                <div className="mobile-brand">
                  <div className="mobile-logo-icon">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                  <span className="mobile-logo-text">MyFinance</span>
                </div>
                <div className="mobile-avatar">S</div>
              </div>

              {/* Mobile Slide Specific Content */}
              {slideIndex === 0 && (
                <div className="mobile-slide-inner">
                  <div className="mobile-balance-card">
                    <span className="mobile-balance-label">Total Balance</span>
                    <div className="mobile-balance-value">₹30,000.00</div>
                    <span className="mobile-balance-accounts">2 Active Accounts</span>
                  </div>

                  <div className="mobile-quick-row">
                    <div className="mobile-quick-btn">
                      <div className="btn-icon income">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      </div>
                      <span>Income</span>
                    </div>
                    <div className="mobile-quick-btn">
                      <div className="btn-icon expense">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                      <span>Expense</span>
                    </div>
                    <div className="mobile-quick-btn">
                      <div className="btn-icon transfer">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <span>Transfer</span>
                    </div>
                  </div>

                  <div className="mobile-recent-section">
                    <span className="mobile-section-heading">Recent Records</span>
                    <div className="mobile-record-item">
                      <div className="record-left">
                        <div className="record-badge income">₹</div>
                        <div>
                          <div className="record-name">Salary</div>
                          <div className="record-sub">Main Bank</div>
                        </div>
                      </div>
                      <span className="record-val income">+₹10,500</span>
                    </div>
                    <div className="mobile-record-item">
                      <div className="record-left">
                        <div className="record-badge expense">₹</div>
                        <div>
                          <div className="record-name">Food & Dining</div>
                          <div className="record-sub">Cash Wallet</div>
                        </div>
                      </div>
                      <span className="record-val expense">-₹350</span>
                    </div>
                  </div>
                </div>
              )}

              {slideIndex === 1 && (
                <div className="mobile-slide-inner">
                  <div className="mobile-udhaar-card">
                    <span className="mobile-balance-label">Pending Receivables</span>
                    <div className="mobile-balance-value highlight">₹7,000.00</div>
                    <span className="mobile-balance-accounts">From Aarav Sharma</span>
                  </div>

                  <div className="mobile-repay-badge">
                    <HandCoins className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Last Repayment: ₹3,000 received</span>
                  </div>

                  <div className="mobile-account-list">
                    <div className="account-row">
                      <span>Main Bank (SBI)</span>
                      <span className="acc-val">₹65,500</span>
                    </div>
                    <div className="account-row">
                      <span>Cash Wallet</span>
                      <span className="acc-val">₹5,000</span>
                    </div>
                  </div>
                </div>
              )}

              {slideIndex === 2 && (
                <div className="mobile-slide-inner">
                  <div className="mobile-goal-ring-card">
                    <div className="ring-header">
                      <span>Emergency Savings</span>
                      <span className="ring-pct">30%</span>
                    </div>
                    <div className="ring-amount">₹15,000 / ₹50,000</div>
                    <div className="mock-bar-track">
                      <div className="mock-bar-fill safe" style={{ width: '30%' }} />
                    </div>
                  </div>

                  <div className="mobile-budget-alert-card">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <div>
                      <div className="alert-title">Food Budget Alert</div>
                      <div className="alert-sub">₹4,500 of ₹5,000 used (90%)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Bottom Bar */}
              <div className="mobile-bottom-bar">
                <div className="nav-item active">
                  <div className="nav-dot" />
                  <span>Home</span>
                </div>
                <div className="nav-item">
                  <span>Udhaar</span>
                </div>
                <div className="nav-item add-btn">
                  <span>+</span>
                </div>
                <div className="nav-item">
                  <span>Budgets</span>
                </div>
                <div className="nav-item">
                  <span>Profile</span>
                </div>
              </div>

              {/* iPhone Home Bar */}
              <div className="mobile-home-indicator" />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. FLOATING GLASSMORPHIC CARDS & FINANCIAL BADGES */}
        {/* ============================================================== */}
        {slideIndex === 0 && (
          <>
            <div className="hero-carousel-float-card float-card-top-left">
              <div className="float-card-icon emerald">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="float-card-label">Available Balance</span>
                <div className="float-card-val">₹30,000.00</div>
                <span className="float-card-sub">All active accounts</span>
              </div>
            </div>

            <div className="hero-carousel-float-card float-card-bottom-right">
              <div className="float-card-icon teal">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="float-card-label">Security & Isolation</span>
                <div className="float-card-val" style={{ fontSize: 13, color: '#047857' }}>
                  100% Private Ledger
                </div>
                <span className="float-card-sub">Strict Document-Level Auth</span>
              </div>
            </div>
          </>
        )}

        {slideIndex === 1 && (
          <>
            <div className="hero-carousel-float-card float-card-top-left">
              <div className="float-card-icon teal">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <span className="float-card-label">Udhaar Lent</span>
                <div className="float-card-val">₹10,000.00</div>
                <span className="float-card-sub" style={{ color: '#059669' }}>
                  ₹3,000 Repaid • ₹7,000 Pending
                </span>
              </div>
            </div>

            <div className="hero-carousel-float-card float-card-bottom-right">
              <div className="float-card-icon blue">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="float-card-label">Internal Transfer</span>
                <div className="float-card-val" style={{ fontSize: 13 }}>
                  Bank → Cash: ₹5,000
                </div>
                <span className="float-card-sub">Zero False Income/Expense</span>
              </div>
            </div>
          </>
        )}

        {slideIndex === 2 && (
          <>
            <div className="hero-carousel-float-card float-card-top-left">
              <div className="float-card-icon emerald">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="float-card-label">Savings Target</span>
                <div className="float-card-val">₹15,000 / ₹50,000</div>
                <span className="float-card-sub" style={{ color: '#059669' }}>
                  Emergency Fund (30%)
                </span>
              </div>
            </div>

            <div className="hero-carousel-float-card float-card-bottom-right">
              <div className="float-card-icon amber">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="float-card-label">Budget Threshold</span>
                <div className="float-card-val" style={{ fontSize: 13, color: '#b45309' }}>
                  Food & Dining at 90%
                </div>
                <span className="float-card-sub">Alert Before Overspending</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

