import { Link } from 'react-router-dom';
import AuthBrandingPanel from '../../components/auth/AuthBrandingPanel';
import avatarImg from '../../assets/pending-avatar.jpg';
import './AuthPages.css';

/**
 * MediStock Account Pending Approval Page
 * Pixel-accurate to the MediStock design mockup (bottom-right screen).
 */
export default function PendingApprovalPage() {
  return (
    <div className="medistock-auth-viewport">
      <div className="medistock-auth-split-grid">
        {/* Left Side: Soft Teal Shield & Notice */}
        <AuthBrandingPanel variant="pending" />

        {/* Right Side: Thank you card with healthcare avatar */}
        <main className="medistock-auth-form-panel">
          <div className="medistock-auth-card pending-card-clean">
            <div className="pending-avatar-container">
              <img
                src={avatarImg}
                alt="Healthcare Professional with Clock"
                className="pending-avatar-image"
              />
            </div>

            <h2 className="pending-thank-title">Thank you for signing up!</h2>
            <p className="pending-thank-subtitle">We'll get back to you soon.</p>

            <div className="pending-action-box">
              <Link to="/login" className="auth-primary-btn link-btn-wrap">
                Back to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
