import { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import AuthBrandingPanel from '../../components/auth/AuthBrandingPanel';
import {
  IconLock,
  IconEye,
  IconShieldCheck,
  IconAlertCircle,
  IconCheck,
  IconArrowLeft,
  MediStockLogoBadge
} from '../../components/icons/Icons';
import './AuthPages.css';

/**
 * MediStock Reset Password Page
 * Validates security token from URL and securely updates password in MariaDB via BCrypt.
 */
export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract reset token from URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Password requirements calculation
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLen: newPassword.length >= 8,
      hasUpperLower: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  // Password strength score
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: '#cbd5e1', percent: 0 };
    let metCount = 0;
    if (passwordCriteria.hasMinLen) metCount++;
    if (passwordCriteria.hasUpperLower) metCount++;
    if (passwordCriteria.hasNumber) metCount++;
    if (passwordCriteria.hasSpecial) metCount++;

    if (metCount === 1) return { score: 1, label: 'Weak', color: '#ef4444', percent: 25 };
    if (metCount === 2) return { score: 2, label: 'Fair', color: '#f59e0b', percent: 50 };
    if (metCount === 3) return { score: 3, label: 'Good', color: '#2a9d8f', percent: 75 };
    if (metCount === 4) return { score: 4, label: 'Strong', color: '#0d9488', percent: 100 };
    return { score: 1, label: 'Weak', color: '#ef4444', percent: 20 };
  }, [newPassword, passwordCriteria]);

  async function handleReset(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Password reset token is missing. Please request a new reset link.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (
      !passwordCriteria.hasUpperLower ||
      !passwordCriteria.hasNumber ||
      !passwordCriteria.hasSpecial
    ) {
      setErrorMsg('Password does not fulfill all required security criteria.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login?reset=true');
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

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
                <span className="auth-card-brand-tag">Password Reset</span>
              </div>
            </div>

            <header className="auth-card-header">
              <h2 className="auth-card-title">Set New Password</h2>
              <p className="auth-card-subtitle">
                Create a strong, secure password for your healthcare inventory profile.
              </p>
            </header>

            {!token && (
              <div className="auth-notice auth-notice--error">
                <IconAlertCircle size={18} className="notice-icon" />
                <span>
                  No reset token provided. Please request a reset link from the Forgot Password page.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="auth-notice auth-notice--error" role="alert">
                <IconAlertCircle size={18} className="notice-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success ? (
              <div className="auth-state-box">
                <div className="auth-state-icon auth-state-icon--success">
                  <IconCheck size={30} />
                </div>
                <h3>Password Updated!</h3>
                <p className="auth-state-description">
                  Your credentials have been securely updated. Redirecting you to sign in…
                </p>
                <div className="auth-redirect-loading">
                  <div className="btn-spinner" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="auth-form" noValidate>
                {/* New Password */}
                <div className="form-field">
                  <label htmlFor="reset-new-password" className="field-label">
                    New Password
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <IconLock size={18} />
                    </span>
                    <input
                      id="reset-new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="field-toggle-pwd"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      tabIndex={-1}
                    >
                      <IconEye size={17} />
                    </button>
                  </div>

                  {/* Strength Meter */}
                  {newPassword && (
                    <div className="pwd-strength-meter">
                      <div className="pwd-strength-header">
                        <span className="strength-caption">Strength:</span>
                        <span
                          className="strength-label"
                          style={{ color: passwordStrength.color }}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="pwd-strength-track">
                        <div
                          className="pwd-strength-bar"
                          style={{
                            width: `${passwordStrength.percent}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Requirements Checklist */}
                  <div className="password-requirements-panel">
                    <span className="requirements-title">Must satisfy:</span>
                    <ul className="requirements-list">
                      <li className={passwordCriteria.hasMinLen ? 'met' : 'unmet'}>
                        <span className="req-bullet">
                          {passwordCriteria.hasMinLen ? '✓' : '○'}
                        </span>
                        <span>8+ characters</span>
                      </li>
                      <li className={passwordCriteria.hasUpperLower ? 'met' : 'unmet'}>
                        <span className="req-bullet">
                          {passwordCriteria.hasUpperLower ? '✓' : '○'}
                        </span>
                        <span>Upper & lowercase</span>
                      </li>
                      <li className={passwordCriteria.hasNumber ? 'met' : 'unmet'}>
                        <span className="req-bullet">
                          {passwordCriteria.hasNumber ? '✓' : '○'}
                        </span>
                        <span>One number</span>
                      </li>
                      <li className={passwordCriteria.hasSpecial ? 'met' : 'unmet'}>
                        <span className="req-bullet">
                          {passwordCriteria.hasSpecial ? '✓' : '○'}
                        </span>
                        <span>Special character</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-field">
                  <label htmlFor="reset-confirm-password" className="field-label">
                    Confirm New Password
                  </label>
                  <div className="field-input-box">
                    <span className="field-icon">
                      <IconLock size={18} />
                    </span>
                    <input
                      id="reset-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="field-toggle-pwd"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label="Toggle confirm password visibility"
                      tabIndex={-1}
                    >
                      <IconEye size={17} />
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <span className="field-helper-error">Passwords do not match</span>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <span className="field-helper-success">✓ Passwords match</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading || !token}
                  id="reset-submit-btn"
                >
                  {loading ? (
                    <span className="btn-loading-state">
                      <span className="btn-spinner" />
                      Saving New Password…
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            )}

            <footer className="auth-card-footer">
              <Link to="/login" className="back-link">
                <IconArrowLeft size={16} />
                <span>Return to Sign In</span>
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
