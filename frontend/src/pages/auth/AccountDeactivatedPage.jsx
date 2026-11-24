import { Link } from 'react-router-dom';
import AuthBrandingPanel from '../../components/auth/AuthBrandingPanel';
import {
  IconShieldCheck,
  IconAlertCircle,
  IconArrowLeft,
  MediStockLogoBadge
} from '../../components/icons/Icons';
import './AuthPages.css';

/**
 * MediStock Account Deactivated Page
 * Secure, generic status page for inactive accounts without exposing private details.
 */
export default function AccountDeactivatedPage() {
  return (
    <div className="medistock-auth-viewport">
      <div className="medistock-auth-split-grid">
        <AuthBrandingPanel />

        <main className="medistock-auth-form-panel">
          <div className="medistock-auth-card">
            <div className="auth-card-top-brand">
              <MediStockLogoBadge size={38} />
              <div className="auth-card-brand-titles">
                <span className="auth-card-brand-name">MediStock</span>
                <span className="auth-card-brand-tag">Access Status</span>
              </div>
            </div>

            <div className="auth-status-hero">
              <div className="auth-status-icon-box auth-status-icon-box--deactivated">
                <IconAlertCircle size={32} />
              </div>
              <h2 className="auth-card-title">Account Access Inactive</h2>
              <p className="auth-card-subtitle">
                Access to this MediStock inventory profile has been suspended or deactivated.
              </p>
            </div>

            <div className="deactivated-info-box">
              <div className="info-title-row">
                <IconShieldCheck size={16} />
                <strong>Security & Policy Notice</strong>
              </div>
              <p>
                In accordance with medical inventory chain-of-custody policies, accounts that are
                inactive, undergoing department re-assignment, or pending administrative review
                are temporarily restricted.
              </p>
            </div>

            <div className="approval-contact-card">
              <div className="contact-card-header">
                <strong>Next Steps to Restore Access:</strong>
              </div>
              <p>
                Please contact your hospital department head or pharmacy IT system administrator:
              </p>
              <div className="contact-mini-row">
                <span>IT Desk: <strong>admin@medistock.com</strong></span>
                <span>Pharmacy Desk: <strong>Ext. #4402</strong></span>
              </div>
            </div>

            <div className="auth-state-actions">
              <Link to="/login" className="auth-primary-btn link-btn-wrap">
                Return to Sign In
              </Link>
            </div>

            <footer className="auth-card-footer">
              <Link to="/login" className="back-link">
                <IconArrowLeft size={16} />
                <span>Return to Login Screen</span>
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
