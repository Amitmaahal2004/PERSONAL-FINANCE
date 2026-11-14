import React from 'react';

// 1. WELCOME HERO ILLUSTRATION (Money bag with ₹, gold coins, growth trend arrow & leaves)
export function HeroFintechIllustration() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="dashboard-hero-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#10B981" floodOpacity="0.25" />
        </filter>
        <filter id="coinShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#78350F" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Background Soft Glow */}
      <circle cx="110" cy="70" r="45" fill="rgba(16, 185, 129, 0.12)" />

      {/* Upward Growth Arrow Curve */}
      <path
        d="M130 95 C145 75, 160 55, 185 30"
        stroke="url(#arrowGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        filter="url(#softGlow)"
      />
      <polygon points="188,26 172,31 182,42" fill="#059669" />

      {/* Plant Sprig / Leaves */}
      <g transform="translate(68, 42)">
        <path d="M12 25 C10 12, 2 2, -6 0 C-4 12, 4 22, 12 25 Z" fill="url(#leafGrad)" />
        <path d="M10 26 C16 16, 26 10, 32 10 C30 18, 20 26, 10 26 Z" fill="#34D399" opacity="0.9" />
      </g>

      {/* Money Bag */}
      <g filter="url(#softGlow)">
        {/* Bag Neck Tie */}
        <ellipse cx="110" cy="38" rx="16" ry="6" fill="#B45309" />
        <polygon points="100,32 110,24 120,32 114,38 106,38" fill="url(#bagGrad)" />
        {/* Bag Main Body */}
        <path
          d="M86 52 C86 42, 96 38, 110 38 C124 38, 134 42, 134 52 C142 68, 142 88, 132 98 C122 106, 98 106, 88 98 C78 88, 78 68, 86 52 Z"
          fill="url(#bagGrad)"
        />
        {/* Rupee Symbol ₹ */}
        <text
          x="110"
          y="82"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="24"
          fontWeight="bold"
          fontFamily="sans-serif"
          opacity="0.95"
        >
          ₹
        </text>
      </g>

      {/* Gold Coins Stack (Foreground & Base) */}
      <g filter="url(#coinShadow)">
        {/* Coin 1 (Left) */}
        <ellipse cx="68" cy="98" rx="12" ry="5" fill="#D97706" />
        <rect x="56" y="93" width="24" height="5" fill="#F59E0B" />
        <ellipse cx="68" cy="93" rx="12" ry="5" fill="url(#coinGrad)" />

        {/* Coin 2 (Stacked above 1) */}
        <rect x="56" y="87" width="24" height="5" fill="#F59E0B" />
        <ellipse cx="68" cy="87" rx="12" ry="5" fill="url(#coinGrad)" />

        {/* Coin 3 (Middle-left lean) */}
        <ellipse cx="85" cy="101" rx="14" ry="6" fill="#D97706" />
        <rect x="71" y="96" width="28" height="5" fill="#F59E0B" />
        <ellipse cx="85" cy="96" rx="14" ry="6" fill="url(#coinGrad)" />

        {/* Coin 4 (Right base) */}
        <ellipse cx="145" cy="100" rx="12" ry="5" fill="#D97706" />
        <rect x="133" y="95" width="24" height="5" fill="#F59E0B" />
        <ellipse cx="145" cy="95" rx="12" ry="5" fill="url(#coinGrad)" />

        {/* Coin 5 (Stacked right) */}
        <rect x="133" y="90" width="24" height="5" fill="#F59E0B" />
        <ellipse cx="145" cy="90" rx="12" ry="5" fill="url(#coinGrad)" />
      </g>
    </svg>
  );
}

// 2. GOALS PROGRESS DARTBOARD / TARGET ILLUSTRATION
export function GoalsTargetIllustration() {
  return (
    <svg
      width="130"
      height="130"
      viewBox="0 0 130 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="dashboard-target-svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="targetOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </radialGradient>
        <radialGradient id="targetMid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </radialGradient>
        <linearGradient id="arrowStem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <filter id="targetShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Outer 3D Target Rings (Perspective Tilt) */}
      <g filter="url(#targetShadow)" transform="translate(65, 70)">
        {/* Ring 1 (Base Outermost) */}
        <ellipse cx="0" cy="0" rx="54" ry="34" fill="url(#targetOuter)" stroke="#BAE6FD" strokeWidth="2" />
        {/* Ring 2 */}
        <ellipse cx="0" cy="0" rx="42" ry="26" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
        {/* Ring 3 */}
        <ellipse cx="0" cy="0" rx="30" ry="18" fill="url(#targetMid)" stroke="#3B82F6" strokeWidth="1.5" />
        {/* Ring 4 */}
        <ellipse cx="0" cy="0" rx="18" ry="11" fill="#FFFFFF" stroke="#60A5FA" strokeWidth="1.5" />
        {/* Bullseye */}
        <ellipse cx="0" cy="0" rx="8" ry="5" fill="#10B981" />
      </g>

      {/* Arrow hitting Bullseye */}
      <g>
        {/* Arrow Shaft */}
        <line x1="102" y1="20" x2="65" y2="70" stroke="url(#arrowStem)" strokeWidth="4" strokeLinecap="round" />
        {/* Arrow Feathers / Fletching */}
        <path d="M102 20 L115 15 L108 26 Z" fill="#10B981" />
        <path d="M102 20 L96 8 L106 17 Z" fill="#34D399" />
        {/* Arrow Tip Impact */}
        <circle cx="65" cy="70" r="3" fill="#047857" />
        {/* Impact Sparkle */}
        <circle cx="62" cy="67" r="1.5" fill="#FDE68A" />
      </g>
    </svg>
  );
}

// 3. PIGGY BANK ILLUSTRATION (Savings Goals Empty / Placeholder)
export function PiggyBankIllustration() {
  return (
    <svg
      width="72"
      height="60"
      viewBox="0 0 72 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="dashboard-mini-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="piggyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE7F3" />
          <stop offset="60%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>
      {/* Piggy Body */}
      <ellipse cx="36" cy="34" rx="22" ry="18" fill="url(#piggyGrad)" />
      {/* Snout */}
      <ellipse cx="14" cy="36" rx="6" ry="7" fill="#F472B6" />
      <circle cx="13" cy="34" r="1.5" fill="#BE185D" />
      <circle cx="13" cy="38" r="1.5" fill="#BE185D" />
      {/* Ear */}
      <polygon points="24,20 30,10 34,22" fill="#F472B6" />
      {/* Eye */}
      <circle cx="24" cy="28" r="2" fill="#831843" />
      {/* Feet */}
      <rect x="22" y="48" width="6" height="7" rx="3" fill="#F472B6" />
      <rect x="42" y="48" width="6" height="7" rx="3" fill="#F472B6" />
      {/* Coin Slot */}
      <rect x="32" y="15" width="10" height="2.5" rx="1" fill="#DB2777" />
      {/* Gold Coin entering slot */}
      <ellipse cx="37" cy="11" rx="5" ry="3.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
    </svg>
  );
}

// 4. CALENDAR ILLUSTRATION (Upcoming Payments Empty / Placeholder)
export function CalendarDuesIllustration() {
  return (
    <svg
      width="64"
      height="60"
      viewBox="0 0 64 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="dashboard-mini-svg"
      aria-hidden="true"
    >
      <rect x="8" y="12" width="48" height="42" rx="10" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="2" />
      <path d="M8 24 L56 24" stroke="#86EFAC" strokeWidth="2" />
      <rect x="18" y="6" width="4" height="10" rx="2" fill="#10B981" />
      <rect x="42" y="6" width="4" height="10" rx="2" fill="#10B981" />
      {/* Checkmark inside */}
      <path
        d="M24 38 L30 44 L42 32"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

