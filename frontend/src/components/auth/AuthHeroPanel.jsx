import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Clock, 
  Thermometer, 
  CheckCircle2, 
  Building2, 
  FileCheck2, 
  Lock 
} from 'lucide-react';
import './AuthHeroPanel.css';

/**
 * Human-designed clinical operations hero panel.
 * Replaces synthetic 3D mockups with authentic healthcare product evidence.
 */
export default function AuthHeroPanel({ mode = 'login' }) {
  const isSignup = mode === 'signup';

  return (
    <aside className="auth-hero-panel" aria-label="System Overview">
      {/* Brand Header */}
      <div className="hero-brand">
        <div className="brand-badge">
          <div className="brand-logo-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div>
            <div className="brand-name">MediStock</div>
            <div className="brand-tagline">Clinical Inventory &amp; Pharmacy OS</div>
          </div>
        </div>
        <div className="system-pill">
          <span className="pulse-dot" />
          <span>v2.4 Production • HIPAA Ready</span>
        </div>
      </div>

      {/* Hero Header Copy */}
      <div className="hero-header-copy">
        <span className="hero-eyebrow">
          {isSignup ? 'Healthcare Network Onboarding' : 'Clinical Verification Portal'}
        </span>
        <h1 className="hero-title">
          {isSignup 
            ? 'Connect your pharmacy to automated FEFO supply chains' 
            : 'Operational inventory intelligence for hospital pharmacies'}
        </h1>
        <p className="hero-subtitle">
          {isSignup 
            ? 'Create an authorized practitioner account to track batches, automate reorders, and maintain compliance.' 
            : 'Monitor real-time dispensary stock levels, temperature sensors, and multi-ward distribution.'}
        </p>
      </div>

      {/* Live Clinical Product Evidence Card */}
      <div className="clinical-telemetry-card">
        <div className="telemetry-top-bar">
          <div className="telemetry-status">
            <Activity size={15} className="telemetry-icon" />
            <span>Live Dispensary Telemetry</span>
          </div>
          <span className="telemetry-node">Central Pharmacy • Ward 3 ICU</span>
        </div>

        <div className="batch-row">
          <div className="batch-details">
            <div className="batch-sku-badge">High Velocity SKU</div>
            <div className="batch-drug-name">Amoxicillin &amp; Clavulanate Potassium</div>
            <div className="batch-specs">625 mg Oral Tablets • USP Standard • Batch #MC-8821</div>
          </div>
          <div className="fefo-alert-chip">
            <Clock size={13} />
            <span>FEFO: 21 Days Left</span>
          </div>
        </div>

        {/* Stock Level Metric Bar */}
        <div className="stock-progress-container">
          <div className="stock-progress-labels">
            <span>Central Stock: <strong>840 / 1,000 Units</strong></span>
            <span className="stock-percentage">84% Capacity</span>
          </div>
          <div className="stock-progress-track">
            <div className="stock-progress-fill" style={{ width: '84%' }} />
          </div>
        </div>

        {/* Real-time telemetry indicators */}
        <div className="telemetry-chips-grid">
          <div className="telemetry-chip">
            <Thermometer size={14} className="chip-icon temp" />
            <div>
              <div className="chip-label">Cold-Chain Storage</div>
              <div className="chip-value">4.2°C (Optimal)</div>
            </div>
          </div>

          <div className="telemetry-chip">
            <CheckCircle2 size={14} className="chip-icon verified" />
            <div>
              <div className="chip-label">Audit Custody</div>
              <div className="chip-value">Verified (R.Ph.)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Trust Pillars */}
      <div className="clinical-pillars-grid">
        <div className="pillar-item">
          <ShieldCheck size={16} className="pillar-icon" />
          <div className="pillar-text">
            <strong>FEFO Automatic Routing</strong>
            <span>Zero-waste first-expiry protocol</span>
          </div>
        </div>

        <div className="pillar-item">
          <FileCheck2 size={16} className="pillar-icon" />
          <div className="pillar-text">
            <strong>21 CFR Part 11 Audits</strong>
            <span>Immutable electronic signature log</span>
          </div>
        </div>

        <div className="pillar-item">
          <Lock size={16} className="pillar-icon" />
          <div className="pillar-text">
            <strong>Institutional SSO &amp; Security</strong>
            <span>Multi-factor biometric verification</span>
          </div>
        </div>

        <div className="pillar-item">
          <Building2 size={16} className="pillar-icon" />
          <div className="pillar-text">
            <strong>Multi-Ward Sync</strong>
            <span>Real-time hospital inventory mesh</span>
          </div>
        </div>
      </div>

      {/* Institutional Footer */}
      <div className="hero-institutional-footer">
        <p>Built for certified hospital pharmacies, health systems, and accredited medical suppliers.</p>
      </div>
    </aside>
  );
}

