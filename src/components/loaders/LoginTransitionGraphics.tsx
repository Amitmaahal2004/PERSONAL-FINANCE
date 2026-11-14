import React from 'react';

// ==============================================================================
// 1. DYNAMIC THEME-HARMONIZED 3D FINANCIAL HOURGLASS / VAULT
// ==============================================================================
export function FinancialVaultHourglassGraphic() {
  return (
    <svg
      width="150"
      height="220"
      viewBox="0 0 150 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="login-loader-central-svg"
      aria-hidden="true"
    >
      <defs>
        {/* Dynamic Theme Glass Refraction Gradient */}
        <linearGradient id="vaultGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--loader-primary)" stopOpacity="0.45" />
          <stop offset="25%" stopColor="var(--loader-secondary)" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="75%" stopColor="var(--loader-secondary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--loader-primary)" stopOpacity="0.5" />
        </linearGradient>

        {/* Metallic Rims Gradient */}
        <linearGradient id="vaultMetalRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--loader-primary)" />
          <stop offset="20%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="var(--loader-secondary)" />
          <stop offset="80%" stopColor="#D1FAE5" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Dynamic Sand Particles Gradient */}
        <linearGradient id="vaultSandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="40%" stopColor="var(--loader-primary)" />
          <stop offset="100%" stopColor="var(--loader-secondary)" />
        </linearGradient>

        {/* Dynamic Financial Bar Chart Gradient */}
        <linearGradient id="vaultBarChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="var(--loader-primary)" />
        </linearGradient>

        {/* Dynamic Theme Glow Filter */}
        <filter id="vaultThemeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* TOP METALLIC RIM */}
      <ellipse cx="75" cy="18" rx="46" ry="10" fill="url(#vaultMetalRimGrad)" stroke="var(--loader-primary)" strokeWidth="1.5" />
      <ellipse cx="75" cy="16" rx="42" ry="7" fill="#064E3B" />
      <ellipse cx="75" cy="15" rx="38" ry="5" fill="var(--loader-secondary)" opacity="0.6" />

      {/* MAIN GLASS BULB CONTOUR */}
      <path
        d="M33 22 
           C33 55, 62 88, 70 106 
           C73 112, 73 112, 70 118 
           C62 136, 33 169, 33 202 
           L117 202 
           C117 169, 88 136, 80 118 
           C77 112, 77 112, 80 106 
           C88 88, 117 55, 117 22 
           Z"
        fill="url(#vaultGlassGrad)"
        stroke="var(--loader-primary)"
        strokeWidth="1.5"
      />

      {/* UPPER BULB: LUMINOUS FLOWING PARTICLES RESERVOIR */}
      <path
        d="M40 38 
           C48 65, 64 88, 72 105 
           L78 105 
           C86 88, 102 65, 110 38 
           C98 44, 52 44, 40 38 Z"
        fill="url(#vaultSandGrad)"
        filter="url(#vaultThemeGlow)"
        opacity="0.9"
      />

      {/* UPPER PARTICLES SURFACE CURVE */}
      <ellipse cx="75" cy="38" rx="35" ry="7" fill="#A7F3D0" opacity="0.85" />

      {/* FALLING LUMINOUS PARTICLES STREAM IN THE NECK */}
      <line
        x1="75"
        y1="104"
        x2="75"
        y2="185"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#vaultThemeGlow)"
      />
      <circle cx="75" cy="115" r="2" fill="#FFFFFF" />
      <circle cx="73" cy="130" r="1.5" fill="#34D399" />
      <circle cx="77" cy="145" r="2" fill="#FFFFFF" />
      <circle cx="74" cy="160" r="1.5" fill="#6EE7B7" />
      <circle cx="76" cy="175" r="2" fill="#A7F3D0" />

      {/* LOWER BULB: 3D FINANCIAL BAR-CHART COLUMNS */}
      <g filter="url(#vaultThemeGlow)">
        {/* Column 1 (Shortest - Left) */}
        <rect x="52" y="166" width="9" height="26" rx="2" fill="url(#vaultBarChartGrad)" />
        <rect x="52" y="165" width="9" height="3" rx="1.5" fill="#FFFFFF" opacity="0.95" />

        {/* Column 2 (Medium - Center-Left) */}
        <rect x="65" y="152" width="10" height="40" rx="2" fill="url(#vaultBarChartGrad)" />
        <rect x="65" y="151" width="10" height="3.5" rx="1.5" fill="#FFFFFF" opacity="0.95" />

        {/* Column 3 (Tallest - Center-Right) */}
        <rect x="79" y="136" width="11" height="56" rx="2" fill="url(#vaultBarChartGrad)" />
        <rect x="79" y="135" width="11" height="4" rx="2" fill="#FFFFFF" opacity="0.98" />

        {/* Column 4 (Mid-Tall - Right) */}
        <rect x="93" y="148" width="9" height="44" rx="2" fill="url(#vaultBarChartGrad)" />
        <rect x="93" y="147" width="9" height="3" rx="1.5" fill="#FFFFFF" opacity="0.95" />
      </g>

      {/* LOWER BULB: ACCUMULATING PARTICLES POOL */}
      <path
        d="M38 194 
           C46 182, 60 180, 75 180 
           C90 180, 104 182, 112 194 
           C115 198, 116 200, 116 202 
           L34 202 
           C34 200, 35 198, 38 194 Z"
        fill="url(#vaultSandGrad)"
        opacity="0.85"
        filter="url(#vaultThemeGlow)"
      />
      <ellipse cx="75" cy="188" rx="34" ry="7" fill="#34D399" opacity="0.65" />

      {/* GLASS SPECULAR HIGHLIGHT REFLECTIONS */}
      <path
        d="M37 26 C37 54, 58 84, 66 100"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M37 198 C37 172, 58 142, 66 124"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M113 26 C113 54, 92 84, 84 100"
        stroke="var(--loader-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M113 198 C113 172, 92 142, 84 124"
        stroke="var(--loader-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* BOTTOM METALLIC RIM & BASE */}
      <ellipse cx="75" cy="204" rx="46" ry="10" fill="url(#vaultMetalRimGrad)" stroke="var(--loader-primary)" strokeWidth="1.5" />
      <ellipse cx="75" cy="206" rx="48" ry="9" fill="var(--loader-secondary)" opacity="0.7" />
    </svg>
  );
}

// ==============================================================================
// 2. CONCENTRIC CYBERNETIC PEDESTAL BASE
// ==============================================================================
export function HologramPedestalGraphic() {
  return (
    <svg
      width="250"
      height="90"
      viewBox="0 0 250 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="login-loader-pedestal-svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="pedestalCoreTheme" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--loader-primary)" stopOpacity="0.8" />
          <stop offset="40%" stopColor="var(--loader-secondary)" stopOpacity="0.4" />
          <stop offset="80%" stopColor="#064E3B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="pedestalThemeBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Ambient Floor Glow Disc */}
      <ellipse cx="125" cy="45" rx="115" ry="36" fill="url(#pedestalCoreTheme)" />

      {/* Outermost Concentric Neon Ring */}
      <ellipse
        cx="125"
        cy="45"
        rx="106"
        ry="30"
        stroke="var(--loader-primary)"
        strokeWidth="1.5"
        opacity="0.65"
        filter="url(#pedestalThemeBlur)"
      />

      {/* Rotating Radial Ticks / Cyber Track */}
      <ellipse
        cx="125"
        cy="45"
        rx="94"
        ry="25"
        stroke="var(--loader-primary)"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        opacity="0.85"
      />

      {/* Mid Secondary Ring */}
      <ellipse
        cx="125"
        cy="45"
        rx="80"
        ry="20"
        stroke="var(--loader-secondary)"
        strokeWidth="1.5"
        opacity="0.75"
        filter="url(#pedestalThemeBlur)"
      />

      {/* Core Glowing Pedestal Cylinder */}
      <ellipse cx="125" cy="45" rx="60" ry="14" fill="var(--loader-secondary)" opacity="0.6" />
      <ellipse
        cx="125"
        cy="44"
        rx="58"
        ry="13"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        opacity="0.9"
        filter="url(#pedestalThemeBlur)"
      />
      <ellipse cx="125" cy="43" rx="46" ry="9" fill="var(--loader-primary)" opacity="0.75" />
    </svg>
  );
}

// ==============================================================================
// 3. BOTTOM CYBERNETIC MESH LANDSCAPE
// ==============================================================================
export function ParticleMeshLandscape() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '190px',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.85,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="landscapePrimaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--loader-primary)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="var(--loader-secondary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--loader-primary)" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="landscapeSecondaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--loader-secondary)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#34D399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--loader-primary)" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Ambient Glow Horizon */}
        <path
          d="M0 160 C320 80, 560 210, 880 120 C1140 50, 1320 140, 1440 100 L1440 220 L0 220 Z"
          fill="url(#landscapePrimaryGrad)"
          opacity="0.22"
        />

        {/* Smooth Cyber Wave 1 */}
        <path
          d="M0 180 C260 90, 520 220, 840 130 C1100 60, 1300 170, 1440 120"
          stroke="url(#landscapePrimaryGrad)"
          strokeWidth="2.5"
          opacity="0.8"
        />

        {/* Smooth Cyber Wave 2 */}
        <path
          d="M0 140 C280 200, 600 70, 920 180 C1180 120, 1340 70, 1440 150"
          stroke="url(#landscapeSecondaryGrad)"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Wave 3 Accent Base */}
        <path
          d="M0 200 C300 150, 640 190, 960 140 C1200 100, 1380 180, 1440 160"
          stroke="var(--loader-primary)"
          strokeWidth="1.5"
          opacity="0.45"
        />

        {/* Dotted Matrix Points along wave peaks */}
        <g opacity="0.65">
          <circle cx="180" cy="130" r="2.5" fill="var(--loader-primary)" />
          <circle cx="260" cy="98" r="3" fill="#E0F2FE" />
          <circle cx="340" cy="140" r="2" fill="var(--loader-secondary)" />
          <circle cx="480" cy="180" r="2.5" fill="#34D399" />
          <circle cx="680" cy="110" r="3" fill="#A7F3D0" />
          <circle cx="840" cy="130" r="3" fill="#FFFFFF" />
          <circle cx="980" cy="150" r="2.5" fill="var(--loader-primary)" />
          <circle cx="1100" cy="65" r="3.5" fill="#E0F2FE" />
          <circle cx="1220" cy="115" r="2.5" fill="var(--loader-primary)" />
          <circle cx="1340" cy="90" r="3" fill="var(--loader-secondary)" />
        </g>
      </svg>
    </div>
  );
}

