'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Wallet,
  HandCoins,
  ArrowRight,
  Play,
  PieChart,
  Target,
  Sparkles,
  CreditCard,
  Calendar,
  CheckCircle2,
  BarChart3,
  Layers,
  Repeat,
} from 'lucide-react';

export interface SlideData {
  id: number;
  badge: string;
  badgeIcon: React.ReactNode;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineSuffix?: string;
  description: string;
  features: {
    icon: React.ReactNode;
    label: string;
  }[];
  primaryCta: string;
  secondaryCta: string;
}

export const SLIDES_DATA: SlideData[] = [
  {
    id: 1,
    badge: 'Your Personal Finance CRM',
    badgeIcon: <Sparkles className="w-3.5 h-3.5" />,
    headlinePrefix: 'Take Control of ',
    headlineHighlight: 'Your Money.',
    description:
      'Track your income, manage expenses, plan savings and understand where every rupee goes — in one simple, secure platform.',
    features: [
      { icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, label: 'Track Transactions' },
      { icon: <Wallet className="w-4 h-4 text-emerald-600" />, label: 'Manage Accounts' },
      { icon: <Target className="w-4 h-4 text-emerald-600" />, label: 'Set Savings Goals' },
      { icon: <BarChart3 className="w-4 h-4 text-emerald-600" />, label: 'Detailed Reports' },
    ],
    primaryCta: 'Start Free Personal Account',
    secondaryCta: 'Watch Demo',
  },
  {
    id: 2,
    badge: 'Complete Financial Management',
    badgeIcon: <HandCoins className="w-3.5 h-3.5" />,
    headlinePrefix: 'Know Where Every ',
    headlineHighlight: 'Rupee Goes.',
    description:
      'Manage your income, expenses, transfers, loans and Udhaar records with complete financial clarity.',
    features: [
      { icon: <Layers className="w-4 h-4 text-teal-600" />, label: 'Income & Expense Tracking' },
      { icon: <CreditCard className="w-4 h-4 text-teal-600" />, label: 'Multiple Accounts' },
      { icon: <HandCoins className="w-4 h-4 text-teal-600" />, label: 'Udhaar Management' },
      { icon: <Calendar className="w-4 h-4 text-teal-600" />, label: 'Loans & Borrowing' },
    ],
    primaryCta: 'Start Free Personal Account',
    secondaryCta: 'Watch Demo',
  },
  {
    id: 3,
    badge: 'Plan. Save. Grow.',
    badgeIcon: <Target className="w-3.5 h-3.5" />,
    headlinePrefix: 'Make Your Money ',
    headlineHighlight: 'Work Smarter.',
    description:
      'Create budgets, track savings goals, manage recurring payments and understand your financial progress.',
    features: [
      { icon: <PieChart className="w-4 h-4 text-emerald-600" />, label: 'Smart Budgets' },
      { icon: <Target className="w-4 h-4 text-emerald-600" />, label: 'Savings Goals' },
      { icon: <Repeat className="w-4 h-4 text-emerald-600" />, label: 'Recurring Payments' },
      { icon: <BarChart3 className="w-4 h-4 text-emerald-600" />, label: 'Financial Reports' },
    ],
    primaryCta: 'Start Free Personal Account',
    secondaryCta: 'Watch Demo',
  },
];

interface HeroSlideProps {
  slide: SlideData;
  isActive: boolean;
  onWatchDemo: () => void;
}

export default function HeroSlide({ slide, isActive, onWatchDemo }: HeroSlideProps) {
  return (
    <div
      className={`hero-carousel-content ${isActive ? 'active' : ''}`}
      aria-hidden={!isActive}
    >
      {/* Eyebrow Badge */}
      <div className="hero-carousel-badge">
        <span className="hero-carousel-badge-icon">{slide.badgeIcon}</span>
        <span className="hero-carousel-badge-text">{slide.badge}</span>
      </div>

      {/* Main Headline */}
      <h1 className="hero-carousel-title">
        {slide.headlinePrefix}
        <span className="hero-carousel-title-highlight">{slide.headlineHighlight}</span>
        {slide.headlineSuffix || ''}
      </h1>

      {/* Description */}
      <p className="hero-carousel-desc">{slide.description}</p>

      {/* 4 Feature Highlights Grid */}
      <div className="hero-carousel-features">
        {slide.features.map((feat, idx) => (
          <div key={idx} className="hero-carousel-feature-item">
            <div className="feature-icon-box">{feat.icon}</div>
            <span className="feature-label">{feat.label}</span>
          </div>
        ))}
      </div>

      {/* Call To Action Buttons */}
      <div className="hero-carousel-actions">
        <Link href="/signup" className="hero-carousel-btn-primary">
          <span>{slide.primaryCta}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={onWatchDemo}
          className="hero-carousel-btn-secondary"
        >
          <div className="play-icon-pill">
            <Play className="w-3.5 h-3.5 fill-current" />
          </div>
          <span>{slide.secondaryCta}</span>
        </button>
      </div>

      {/* Trust Pill */}
      <div className="hero-carousel-trust-pill">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>100% Private Ledger • Zero Business CRM Bloat • Free Forever</span>
      </div>
    </div>
  );
}

