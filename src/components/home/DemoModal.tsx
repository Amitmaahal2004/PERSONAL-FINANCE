'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Play,
  TrendingUp,
  ShieldCheck,
  Wallet,
  HandCoins,
  PieChart,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'udhaar' | 'budgets'>('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="hero-demo-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="hero-demo-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="hero-demo-modal-header">
          <div className="hero-demo-modal-brand">
            <div className="hero-demo-modal-icon">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="hero-demo-modal-title">MyFinance Interactive Product Walkthrough</h3>
              <p className="hero-demo-modal-subtitle">Your Money. Your Records. Your Control.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hero-demo-modal-close"
            aria-label="Close interactive demo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="hero-demo-tabs">
          <button
            className={`hero-demo-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Wallet className="w-4 h-4" />
            <span>1. Financial Dashboard</span>
          </button>
          <button
            className={`hero-demo-tab ${activeTab === 'udhaar' ? 'active' : ''}`}
            onClick={() => setActiveTab('udhaar')}
          >
            <HandCoins className="w-4 h-4" />
            <span>2. Udhaar & Loans</span>
          </button>
          <button
            className={`hero-demo-tab ${activeTab === 'budgets' ? 'active' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            <PieChart className="w-4 h-4" />
            <span>3. Budgets & Goals</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="hero-demo-body">
          {activeTab === 'overview' && (
            <div className="hero-demo-view">
              <div className="hero-demo-screen-wrap">
                <img
                  src="/images/dashboard-preview.png"
                  alt="MyFinance Personal Dashboard Preview"
                  className="hero-demo-image"
                />
              </div>
              <div className="hero-demo-features-summary">
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real-time balance calculated straight from verified ledger records.</span>
                </div>
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Income vs Expense 6-month historical cashflow bar charts.</span>
                </div>
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Category-wise expense breakdown donut with center analytics.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'udhaar' && (
            <div className="hero-demo-view">
              <div className="hero-demo-card-preview">
                <div className="hero-demo-udhaar-header">
                  <div className="hero-demo-udhaar-pill lent">Lent to Friends: ₹10,000</div>
                  <div className="hero-demo-udhaar-pill borrowed">Borrowed: ₹6,000</div>
                  <div className="hero-demo-udhaar-pill active">Pending Receivables: ₹7,000</div>
                </div>
                <div className="hero-demo-udhaar-record">
                  <div className="record-head">
                    <span className="record-id">UDH-2026-0891</span>
                    <span className="record-status partial">Partially Repaid</span>
                  </div>
                  <div className="record-person">Aarav Sharma • +91 98765 43210</div>
                  <div className="record-progress-track">
                    <div className="record-progress-bar" style={{ width: '30%' }} />
                  </div>
                  <div className="record-amounts">
                    <span>Paid: ₹3,000</span>
                    <span className="remaining">Remaining: ₹7,000 of ₹10,000</span>
                  </div>
                </div>
              </div>
              <div className="hero-demo-features-summary">
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Partial installments with auto settlement duration calculation.</span>
                </div>
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Linked accounts automatically credit/debit balances in real-time.</span>
                </div>
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Overdue alerts and cleared history archive preserving all receipts.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="hero-demo-view">
              <div className="hero-demo-card-preview">
                <div className="hero-demo-budget-item">
                  <div className="budget-info">
                    <span className="budget-name">Food & Dining Budget</span>
                    <span className="budget-pct alert">90% Spent</span>
                  </div>
                  <div className="budget-track">
                    <div className="budget-fill alert" style={{ width: '90%' }} />
                  </div>
                  <div className="budget-nums">
                    <span>Spent: ₹4,500</span>
                    <span>Limit: ₹5,000 (Remaining: ₹500)</span>
                  </div>
                </div>

                <div className="hero-demo-goal-item">
                  <div className="goal-info">
                    <span className="goal-name">Emergency Savings Fund</span>
                    <span className="goal-target">Target: ₹50,000</span>
                  </div>
                  <div className="goal-track">
                    <div className="goal-fill" style={{ width: '30%' }} />
                  </div>
                  <div className="goal-nums">
                    <span>Saved: ₹15,000 (30%)</span>
                    <span>12 contributions recorded</span>
                  </div>
                </div>
              </div>
              <div className="hero-demo-features-summary">
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Configurable category limits with 70%, 90%, and 100% threshold alerts.</span>
                </div>
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Savings contributions safely linked without double-counting expenses.</span>
                </div>
                <div className="hero-demo-feature">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Recurring payments with calendar projections and automated ledger entries.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="hero-demo-modal-footer">
          <div className="hero-demo-footer-info">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Private • Free Personal Account • No Credit Card Required</span>
          </div>
          <div className="hero-demo-footer-actions">
            <button onClick={onClose} className="hero-demo-btn-secondary">
              Close Preview
            </button>
            <Link href="/signup" className="hero-demo-btn-primary" onClick={onClose}>
              <span>Start Free Personal Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

