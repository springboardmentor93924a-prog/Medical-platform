import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import AuthBrandingPanel from '../../components/auth/AuthBrandingPanel';
import {
  IconMail,
  IconAlertCircle,
  IconCheck,
  IconArrowLeft,
  IconSend,
} from '../../components/icons/Icons';
import './AuthPages.css';

/**
 * MediStock Forgot Password Page
 * Allows clinical staff to request a password-reset link.
 */
export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword(identifier.trim());
      setSuccessInfo({
        message: res.message || 'If an account matches your entry, a secure password-reset link has been dispatched.',
        resetToken: res.resetToken || '',
      });
    } catch (err) {
      setErrorMsg(err.message || 'Unable to process reset request. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="medistock-auth-viewport">
      <div className="medistock-auth-split-grid">
        <AuthBrandingPanel variant="forgot" />

        <main className="medistock-auth-form-panel">
          <div className="medistock-auth-card">
            <header className="auth-card-header">
              <h2 className="auth-card-title">Forgot Password</h2>
              <p className="auth-card-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </header>

            {errorMsg && (
              <div className="auth-notice auth-notice--error" role="alert">
                <IconAlertCircle size={18} className="notice-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successInfo ? (
              <div className="auth-state-box">
                <div className="auth-state-icon auth-state-icon--success">
                  <IconCheck size={30} />
                </div>
                <h3>Check Your Inbox</h3>
                <p className="auth-state-description">{successInfo.message}</p>

                {successInfo.resetToken && (
                  <div className="demo-reset-token-box">
                    <span className="token-label">Test Token Generated (Sandbox Preview):</span>
                    <Link
                      to={`/reset-password?token=${encodeURIComponent(successInfo.resetToken)}`}
                      className="demo-reset-link"
                    >
                      Proceed to Reset Password Screen →
                    </Link>
                  </div>
                )}

                <div className="auth-state-actions">
                  <Link to="/login" className="auth-primary-btn link-btn-wrap">
                    Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="forgot-identifier" className="field-label">
                    Email Address
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">https://127.0.0.1:49387/static/artifacts/1b0090a2-e3c3-47f2-94e7-defe5b76143b/.user_uploaded/media_1792943900176.png?csrf=803b1d0c-d580-4d80-85a0-e9b5b6300942
                      <IconMail size={18} />
                    </span>
                    <input
                      id="forgot-identifier"
                      type="text"
                      placeholder="Enter your email address"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading}
                  id="forgot-submit-btn"
                >
                  {loading ? (
                    <span className="btn-loading-state">
                      <span className="btn-spinner" />
                      Sending Link…
                    </span>
                  ) : (
                    <span className="btn-content-flex">
                      <IconSend size={16} />
                      <span>Send Reset Link</span>
                    </span>
                  )}
                </button>
              </form>
            )}

            <footer className="auth-card-footer">
              <Link to="/login" className="back-link">
                <IconArrowLeft size={16} />
                <span>Back to Login</span>
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
