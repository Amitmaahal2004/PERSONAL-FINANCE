'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Wallet,
  Landmark,
  BarChart3,
  PieChart,
  Target,
  ShieldCheck,
  Check,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  FinancialVaultHourglassGraphic,
  HologramPedestalGraphic,
  ParticleMeshLandscape,
} from './LoginTransitionGraphics';

interface LoginTransitionLoaderProps {
  isReady?: boolean; // Set to true when dashboard stats & accounts have finished loading
}

export default function LoginTransitionLoader({ isReady = true }: LoginTransitionLoaderProps) {
  const [isActive, setIsActive] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [progress, setProgress] = useState(15);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState('Welcome back!');
  const [showFallback, setShowFallback] = useState(false);

  const completedRef = useRef(false);

  // Complete and dissolve the loader
  const completeTransition = () => {
    if (completedRef.current) return;
    completedRef.current = true;

    setProgress(100);
    setStage(3);
    setMessage('Your financial workspace is ready.');

    // Trigger finishing dissolve animation
    setTimeout(() => {
      setIsFinishing(true);
      setTimeout(() => {
        setIsActive(false);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }, 600);
    }, 400);
  };

  useEffect(() => {
    // 1. Check one-time login transition flag
    let shouldTrigger = false;
    try {
      if (typeof window !== 'undefined') {
        shouldTrigger = sessionStorage.getItem('myfinance_login_transition') === 'true';
        // Immediately consume and remove the flag so it never replays on refresh or internal routes!
        if (shouldTrigger) {
          sessionStorage.removeItem('myfinance_login_transition');
        }
      }
    } catch {
      shouldTrigger = false;
    }

    if (!shouldTrigger) {
      return;
    }

    // 2. Active login transition: lock scroll and mount full screen
    setIsActive(true);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // 3. Fallback timeout: after 5s allow user to proceed directly
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 5000);

    // 4. Smooth milestone progression
    let currentPct = 15;
    const interval = setInterval(() => {
      if (completedRef.current) {
        clearInterval(interval);
        return;
      }

      currentPct += Math.floor(Math.random() * 6) + 4;
      if (currentPct > 90) {
        currentPct = 90; // Wait for isReady to jump to 100%
      }

      setProgress(currentPct);

      if (currentPct < 35) {
        setStage(1);
        setMessage('Welcome back!');
      } else if (currentPct < 60) {
        setStage(2);
        setMessage('Securing your financial workspace...');
      } else if (currentPct < 78) {
        setStage(2);
        setMessage('Preparing your accounts...');
      } else {
        setStage(3);
        setMessage('Organizing your financial overview...');
      }
    }, 140);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // When dashboard is ready and loader is active, complete the transition
  useEffect(() => {
    if (isActive && isReady && !completedRef.current) {
      // Small pause to let progress reach natural curve before dissolving
      const timer = setTimeout(() => {
        completeTransition();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive, isReady]);

  if (!isActive) return null;

  return (
    <div
      className={`login-loader ${isFinishing ? 'loader-finishing' : ''}`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Secure workspace initialization"
    >
      {/* AMBIENT DYNAMIC THEME LIGHTING */}
      <div className="login-loader-ambient login-loader-ambient-left" aria-hidden="true" />
      <div className="login-loader-ambient-right login-loader-ambient" aria-hidden="true" />
      <div className="login-loader-ambient-center login-loader-ambient" aria-hidden="true" />

      {/* 1. TOP BRANDING */}
      <div className="login-loader-brand">
        <div className="login-loader-brand-header">
          <div className="login-loader-brand-icon">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="login-loader-brand-title">MyFinance</span>
        </div>
        <span className="login-loader-brand-tag">— PRIVATE & SECURE —</span>
      </div>

      {/* 2. CENTRAL ANIMATION: FINANCIAL UNIVERSE & SECURE WORKSPACE */}
      <div className="login-loader-stage">
        {/* Holographic Glowing Cybernetic Pedestal Base */}
        <div className="login-loader-pedestal">
          <HologramPedestalGraphic />
        </div>

        {/* 3D Dynamic Gyro Orbital Rings */}
        <div className="login-loader-orbit-ring login-loader-orbit-primary" aria-hidden="true" />
        <div className="login-loader-orbit-ring login-loader-orbit-secondary" aria-hidden="true" />

        {/* 6 Floating Glassmorphic Financial Icons (Accounts, Savings, Analytics, Budgets, Security) */}
        {/* Left Side */}
        <div className="login-loader-tile login-loader-tile-wallet" title="Accounts & Wallet">
          <Wallet className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="login-loader-tile login-loader-tile-bank" title="Banking Vault">
          <Landmark className="w-5 h-5 text-teal-300" />
        </div>
        <div className="login-loader-tile login-loader-tile-analytics" title="Financial Analytics">
          <BarChart3 className="w-5 h-5 text-emerald-200" />
        </div>

        {/* Right Side */}
        <div className="login-loader-tile login-loader-tile-pie" title="Budgets">
          <PieChart className="w-5 h-5 text-teal-300" />
        </div>
        <div className="login-loader-tile login-loader-tile-savings" title="Savings Targets">
          <Target className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="login-loader-tile login-loader-tile-security" title="Encrypted & Private">
          <ShieldCheck className="w-5 h-5 text-teal-200" />
        </div>

        {/* Central Luminous 3D Glass Object with Flowing Particles & Bar Charts */}
        <div className="login-loader-central-wrap">
          <FinancialVaultHourglassGraphic />
        </div>
      </div>

      {/* 3. BOTTOM CONTROLS: DYNAMIC MESSAGES, PROGRESS BAR & MILESTONES */}
      <div className="login-loader-controls">
        {/* Dynamic Loading Message */}
        <p className="login-loader-message">{message}</p>

        {/* Theme-Matched Glowing Gradient Progress Bar */}
        <div className="login-loader-progress-wrap">
          <div className="login-loader-progress-track">
            <div
              className="login-loader-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="login-loader-progress-pct">{progress}%</span>
        </div>

        {/* Three Status Milestones */}
        <div className="login-loader-milestones">
          {/* Milestone 1: Verifying Identity */}
          <div
            className={`login-loader-milestone-item ${
              stage > 1 ? 'login-loader-milestone-completed' : stage === 1 ? 'login-loader-milestone-active' : 'login-loader-milestone-pending'
            }`}
          >
            <div className="login-loader-milestone-icon">
              {stage > 1 ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : stage === 1 ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                '•'
              )}
            </div>
            <span>Securing Session</span>
          </div>

          <div className="login-loader-milestone-divider" />

          {/* Milestone 2: Preparing Dashboard */}
          <div
            className={`login-loader-milestone-item ${
              stage > 2 ? 'login-loader-milestone-completed' : stage === 2 ? 'login-loader-milestone-active' : 'login-loader-milestone-pending'
            }`}
          >
            <div className="login-loader-milestone-icon">
              {stage > 2 ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : stage === 2 ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                '•'
              )}
            </div>
            <span>Preparing Dashboard</span>
          </div>

          <div className="login-loader-milestone-divider" />

          {/* Milestone 3: Ready */}
          <div
            className={`login-loader-milestone-item ${
              progress === 100
                ? 'login-loader-milestone-completed'
                : stage === 3
                ? 'login-loader-milestone-active'
                : 'login-loader-milestone-pending'
            }`}
          >
            <div className="login-loader-milestone-icon">
              {progress === 100 ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : stage === 3 ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                '•'
              )}
            </div>
            <span>Workspace Ready</span>
          </div>
        </div>

        {/* Fallback button if network latency is high */}
        {showFallback && !isFinishing && (
          <button
            type="button"
            onClick={completeTransition}
            className="login-loader-fallback-btn"
          >
            <span>Enter Workspace</span>
            <ChevronRight className="w-3 h-3 inline-block ml-1" />
          </button>
        )}
      </div>

      {/* BOTTOM CYBERNETIC MESH WAVES */}
      <ParticleMeshLandscape />
    </div>
  );
}

