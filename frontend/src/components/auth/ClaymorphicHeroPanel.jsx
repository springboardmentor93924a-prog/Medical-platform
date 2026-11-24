import React from 'react';
import './ClaymorphicHeroPanel.css';

/**
 * 3D Claymorphic Hero Panel Component
 * Pixel-perfect adaptation of the MediStock reference design in aesthetic Light Green palette.
 */
export default function ClaymorphicHeroPanel({ mode = 'signup' }) {
  const isSignup = mode === 'signup';

  const signupFeatures = [
    {
      id: 'secure',
      title: 'Secure &',
      subtitle: 'Reliable',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    },
    {
      id: 'analytics',
      title: 'Smart',
      subtitle: 'Analytics',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      )
    },
    {
      id: 'alerts',
      title: 'Real-Time',
      subtitle: 'Alerts',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    },
    {
      id: 'healthcare',
      title: 'Better',
      subtitle: 'Healthcare',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 11V7a4 4 0 0 0-8 0v4M4 11h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
        </svg>
      )
    }
  ];

  const loginFeatures = [
    {
      id: 'fefo',
      title: 'FEFO',
      subtitle: 'Management',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="12 8 12 12 14 14" />
        </svg>
      )
    },
    {
      id: 'ai',
      title: 'AI',
      subtitle: 'Forecasting',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )
    },
    {
      id: 'analytics',
      title: 'Real-Time',
      subtitle: 'Analytics',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      id: 'notifications',
      title: 'Instant',
      subtitle: 'Notifications',
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    }
  ];

  const features = isSignup ? signupFeatures : loginFeatures;

  return (
    <div className="clay-hero-panel">
      {/* Background Floating Plus Crosses */}
      <div className="clay-bg-decorations" aria-hidden="true">
        <span className="clay-cross cross-1">+</span>
        <span className="clay-cross cross-2">+</span>
        <span className="clay-cross cross-3">+</span>
        <span className="clay-cross cross-4">+</span>
        <span className="clay-cross cross-5">+</span>
        <span className="clay-cross cross-6">+</span>
      </div>

      {/* Top Brand Header */}
      <div className="clay-brand-header">
        <div className="clay-brand-logo-wrap">
          <div className="clay-3d-capsule-badge">
            <svg viewBox="0 0 64 64" width="44" height="44" fill="none" className="capsule-svg">
              <defs>
                <linearGradient id="greenCapsuleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="whiteCapsuleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
                <filter id="clayDropShadow" x="-20%" y="-20%" width="150%" height="150%">
                  <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#059669" floodOpacity="0.35" />
                </filter>
              </defs>
              <g transform="rotate(-40 32 32)" filter="url(#clayDropShadow)">
                {/* Capsule Left Half (Green) */}
                <path d="M14 22 C14 14, 24 14, 28 14 L28 42 C24 42, 14 42, 14 34 Z" fill="url(#greenCapsuleGrad)" />
                {/* Capsule Right Half (White/Mint) */}
                <path d="M28 14 L38 14 C46 14, 52 20, 52 28 C52 36, 46 42, 38 42 L28 42 Z" fill="url(#whiteCapsuleGrad)" />
                {/* Capsule Highlight */}
                <path d="M18 18 C22 16, 40 16, 46 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
              </g>
              {/* Medical Plus Cross Badge */}
              <g transform="translate(36, 32)">
                <circle cx="10" cy="10" r="10" fill="#10B981" />
                <path d="M10 5 v10 M5 10 h10" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          <div className="clay-brand-text">
            <h2 className="clay-brand-title">MediStock</h2>
            <p className="clay-brand-tagline">Smart Medicine Inventory for a Healthier Tomorrow</p>
          </div>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="clay-hero-titles">
        <h1 className="clay-main-heading">
          {isSignup ? 'Create Account' : 'Welcome Back!'}
        </h1>
        <p className="clay-sub-heading">
          {isSignup 
            ? 'Join MediStock and be part of a smarter healthcare system' 
            : 'Manage • Monitor • Care'}
        </p>
      </div>

      {/* Central 3D Rendered Medicine Artwork (Light Green Palette) */}
      <div className="clay-3d-art-stage" role="img" aria-label="3D Medicine Inventory Illustration">
        <svg viewBox="0 0 380 260" width="100%" height="240" fill="none" className="clay-art-svg">
          <defs>
            {/* Gradients for Bottle */}
            <linearGradient id="bottleBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#F8FAFC" />
              <stop offset="70%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="bottleCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="bottleLabelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            {/* Gradients for Shield */}
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id="softGlowShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#059669" floodOpacity="0.25" />
            </filter>
            <filter id="subtleFloorShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
              <feOffset dx="0" dy="14" />
              <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Floor Shadow Under All 3D Elements */}
          <ellipse cx="190" cy="228" rx="140" ry="18" fill="rgba(5, 150, 105, 0.12)" />

          {/* 1. Blister Pack (Back Layer) */}
          <g transform="translate(195, 60) rotate(14)" filter="url(#subtleFloorShadow)">
            <rect x="0" y="0" width="105" height="145" rx="14" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2.5" />
            <rect x="0" y="0" width="105" height="145" rx="14" fill="url(#bottleBodyGrad)" opacity="0.6" />
            {/* Blister Branding Text */}
            <text x="52" y="24" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold" letterSpacing="2">MEDISTOCK</text>
            {/* 3x3 Pill Bubbles */}
            {[0, 1, 2].map(row => (
              [0, 1, 2].map(col => (
                <g key={`${row}-${col}`} transform={`translate(${16 + col * 28}, ${36 + row * 34})`}>
                  <circle cx="10" cy="10" r="10" fill="#E2E8F0" />
                  <circle cx="10" cy="9" r="8" fill="#FFFFFF" />
                  <circle cx="9" cy="8" r="6" fill="#ECFDF5" />
                  <ellipse cx="8" cy="7" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.9" />
                </g>
              ))
            ))}
          </g>

          {/* 2. Medicine Bottle (Center Pillar) */}
          <g transform="translate(80, 55)" filter="url(#subtleFloorShadow)">
            {/* Bottle Neck */}
            <rect x="42" y="28" width="46" height="16" rx="4" fill="url(#bottleBodyGrad)" />
            {/* Bottle Cap (Mint Ribbed) */}
            <rect x="36" y="8" width="58" height="24" rx="7" fill="url(#bottleCapGrad)" filter="url(#softGlowShadow)" />
            <line x1="46" y1="12" x2="46" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="12" x2="56" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="66" y1="12" x2="66" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="76" y1="12" x2="76" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <line x1="86" y1="12" x2="86" y2="28" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />

            {/* Bottle Shoulder & Body */}
            <path d="M25 46 Q25 40 42 40 L88 40 Q105 40 105 46 L110 148 Q110 156 95 156 L35 156 Q20 156 20 148 Z" fill="url(#bottleBodyGrad)" />
            {/* Bottle Left Specular Highlight */}
            <path d="M26 50 L26 146" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.8" />

            {/* Green Clinical Label Belt */}
            <path d="M20 72 L110 72 L110 134 L20 134 Z" fill="url(#bottleLabelGrad)" />
            <path d="M20 72 Q65 76 110 72 L110 74 Q65 78 20 74 Z" fill="rgba(255,255,255,0.3)" />

            {/* White Cross on Bottle Label */}
            <g transform="translate(65, 103)">
              <rect x="-6" y="-18" width="12" height="36" rx="3" fill="#FFFFFF" />
              <rect x="-18" y="-6" width="36" height="12" rx="3" fill="#FFFFFF" />
            </g>
          </g>

          {/* 3. Security Check Shield (Front Right) */}
          <g transform="translate(240, 125)" filter="url(#softGlowShadow)">
            <path d="M35 0 C65 0 70 15 70 35 C70 65 35 88 35 88 C35 88 0 65 0 35 C0 15 5 0 35 0 Z" fill="url(#shieldGrad)" />
            <path d="M35 4 C60 4 64 17 64 35 C64 61 35 81 35 81 C35 81 6 61 6 35 C6 17 10 4 35 4 Z" fill="#10B981" opacity="0.3" />
            {/* White Checkmark */}
            <path d="M22 42 L31 52 L50 30" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* 4. Capsule Pill 1 (Foreground Left) */}
          <g transform="translate(50, 160) rotate(-28)" filter="url(#softGlowShadow)">
            {/* Green half */}
            <path d="M0 12 C0 5 7 0 14 0 L32 0 L32 24 L14 24 C7 24 0 19 0 12 Z" fill="url(#bottleCapGrad)" />
            {/* White half */}
            <path d="M32 0 L50 0 C57 0 64 5 64 12 C64 19 57 24 50 24 L32 24 Z" fill="#FFFFFF" />
            <ellipse cx="48" cy="12" rx="8" ry="7" fill="#F1F5F9" opacity="0.6" />
            {/* Pill Shine */}
            <path d="M8 6 L52 6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          </g>

          {/* 5. Capsule Pill 2 (Foreground Center-Right) */}
          <g transform="translate(170, 190) rotate(12)" filter="url(#softGlowShadow)">
            <path d="M0 10 C0 4 5 0 11 0 L25 0 L25 20 L11 20 C5 20 0 16 0 10 Z" fill="#FFFFFF" />
            <path d="M25 0 L39 0 C45 0 50 4 50 10 C50 16 45 20 39 20 L25 20 Z" fill="url(#bottleCapGrad)" />
            <path d="M6 5 L44 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </g>
        </svg>
      </div>

      {/* Bottom 4 Feature Cards (Squircle Badges in Light Green) */}
      <div className="clay-features-grid">
        {features.map(feat => (
          <div className="clay-feature-card" key={feat.id}>
            <div className="clay-feature-icon-badge">
              {feat.icon}
            </div>
            <div className="clay-feature-text">
              <span className="feat-title">{feat.title}</span>
              <span className="feat-subtitle">{feat.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Handwritten Script Motto */}
      <div className="clay-bottom-script">
        <span className="script-text">
          {isSignup ? 'Together for a Healthier Community' : 'Better Care Together'}
        </span>
      </div>
    </div>
  );
}

