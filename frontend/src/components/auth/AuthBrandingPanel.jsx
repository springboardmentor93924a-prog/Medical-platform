import React from 'react';
import {
  MediStockCrossCapsuleLogo,
  IconPackage,
  IconShieldCheck,
  IconChartTrend,
} from '../icons/Icons';
import heroImg from '../../assets/hero.png';
import './AuthBrandingPanel.css';

/**
 * MediStock Clinical Branding Panel
 * Pixel-accurate reproduction of the MediStock visual design reference:
 * - Clean light medical teal and soft gradient background
 * - Official MediStock Cross & Capsule Logo
 * - Main clinical headings & subtitle
 * - Three circular feature highlights (Track Inventory, Ensure Safety, Optimize Supply)
 * - Professional pharmaceutical flat-lay with stethoscope, medicines, blister packs
 * - Curved teal decorative accent in the bottom left
 */
export default function AuthBrandingPanel({ variant = 'signup' }) {
  const isSignup = variant === 'signup';

  const headingText = isSignup ? (
    <>Create Your Account</>
  ) : (
    <>
      Smarter Inventory.
      <br />
      Healthier Tomorrow.
    </>
  );

  const subtitleText = isSignup
    ? 'Join MediStock for Smarter Healthcare Inventory Management'
    : 'Efficiently manage medicines, track stock, and ensure better healthcare services.';

  return (
    <aside className={`auth-branding-panel auth-branding-panel--${variant}`}>
      {/* Decorative Organic Corner Wave Elements */}
      <div className="auth-corner-wave-top-left" />
      <div className="auth-corner-wave-bottom-left" />

      <div className="auth-branding-content">
        {/* Top MediStock Brand Header */}
        <div className="auth-brand-header">
          <MediStockCrossCapsuleLogo size={58} className="auth-brand-logo-cross" />
          <div className="auth-brand-titles">
            <span className="auth-brand-name">MediStock</span>
            <span className="auth-brand-category">Medical Inventory Management System</span>
          </div>
        </div>

        {/* Hero Headings */}
        <div className="auth-hero-messaging">
          <h1 className="auth-hero-headline">{headingText}</h1>
          <p className="auth-hero-description">{subtitleText}</p>

          {/* Three Clinical Feature Circles */}
          <div className="auth-features-row">
            <div className="auth-feature-col">
              <div className="feature-circle-icon">
                <IconPackage size={22} />
              </div>
              <span className="feature-circle-label">
                Track
                <br />
                Inventory
              </span>
            </div>

            <div className="feature-divider-line" />

            <div className="auth-feature-col">
              <div className="feature-circle-icon">
                <IconShieldCheck size={22} />
              </div>
              <span className="feature-circle-label">
                Ensure
                <br />
                Safety
              </span>
            </div>

            <div className="feature-divider-line" />

            <div className="auth-feature-col">
              <div className="feature-circle-icon">
                <IconChartTrend size={22} />
              </div>
              <span className="feature-circle-label">
                Optimize
                <br />
                Supply
              </span>
            </div>
          </div>
        </div>

        {/* Pharmaceutical Flat-lay Visual Display */}
        <div className="auth-pharmacy-visual-container">
          <img
            src={heroImg}
            alt="Medical inventory, medicines, blister packs, and stethoscope"
            className="auth-pharmacy-image"
          />
        </div>
      </div>
    </aside>
  );
}
