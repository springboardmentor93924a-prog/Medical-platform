import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser, forgotPassword } from '../../services/api';
import { normalizeRole, DEMO_ACCOUNTS, getRoleDashboardPath, ROLES } from '../../utils/roles';
import AuthHeroPanel from '../../components/auth/AuthHeroPanel';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Check,
  LogIn,
  User,
  ShieldAlert,
  Loader2,
  Sparkles,
  Pill,
  Users,
  Truck
} from 'lucide-react';
import './LoginPage.css';

/**
 * Roles configuration matching Image 2 MediStock Reference Design
 */
const LOGIN_ROLE_OPTIONS = [
  {
    key: ROLES.ADMIN,
    roleId: 1,
    title: 'Admin',
    subtitle: 'System Administrator',
    icon: ShieldCheck,
    demoEmail: 'admin@medistock.com',
  },
  {
    key: ROLES.PHARMACIST,
    roleId: 2,
    title: 'Pharmacist',
    subtitle: 'Pharmacy Operations',
    icon: Pill,
    demoEmail: 'pharmacist@medistock.com',
  },
  {
    key: ROLES.STAFF,
    roleId: 3,
    title: 'Staff',
    subtitle: 'Inventory Support',
    icon: Users,
    demoEmail: 'staff@medistock.com',
  },
  {
    key: ROLES.SUPPLIER,
    roleId: 4,
    title: 'Supplier',
    subtitle: 'Supplier Management',
    icon: Truck,
    demoEmail: 'supplier@medistock.com',
  },
];

export default function LoginPage() {
  const [selectedRoleKey, setSelectedRoleKey] = useState(ROLES.PHARMACIST);
  const [identifier, setIdentifier] = useState('pharmacist@medistock.com');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoBanner, setInfoBanner] = useState('');

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Inspect query params for notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const regEmail = params.get('email');
    const roleParam = params.get('role');

    if (roleParam) {
      const normalized = normalizeRole(roleParam);
      if (normalized) {
        setSelectedRoleKey(normalized);
        const demoAcc = Object.values(DEMO_ACCOUNTS).find((acc) => acc.role === normalized);
        if (demoAcc && !regEmail) {
          setIdentifier(demoAcc.email);
          setPassword('password123');
        }
      }
    }

    if (regEmail) {
      setIdentifier(regEmail);
      setPassword('');
    }

    if (params.get('sessionExpired') === 'true') {
      setInfoBanner('Your session has expired. Please sign in again to continue.');
    } else if (params.get('registered') === 'true') {
      setInfoBanner(
        regEmail
          ? `Account registered successfully for ${regEmail}! Please enter your password to sign in.`
          : 'Account registered successfully! You may now sign in with your credentials.'
      );
    } else if (params.get('reset') === 'true') {
      setInfoBanner('Your password was successfully reset. Please sign in with your new password.');
    } else if (params.get('deactivated') === 'true') {
      setErrorMsg('This account is currently deactivated. Please contact your hospital administrator.');
    }
  }, [location.search]);

  // Current active role metadata
  const currentRole = LOGIN_ROLE_OPTIONS.find((r) => r.key === selectedRoleKey) || LOGIN_ROLE_OPTIONS[1];

  function handleSelectRole(option) {
    setSelectedRoleKey(option.key);
    setRoleDropdownOpen(false);
    setErrorMsg('');

    // Pre-populate with demo account if identifier was default or empty
    const isCurrentDemo = Object.values(DEMO_ACCOUNTS).some(
      (acc) => acc.email.toLowerCase() === identifier.trim().toLowerCase()
    );

    if (!identifier.trim() || isCurrentDemo) {
      setIdentifier(option.demoEmail);
      setPassword('password123');
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setErrorMsg('');
    setInfoBanner('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(identifier.trim(), password);

      if (!result || !result.token) {
        throw new Error('Authentication failed: No security token returned by the server.');
      }

      const rawRole = result.role;
      const userRole = normalizeRole(rawRole);
      const fullName = result.fullName || identifier.trim().split('@')[0];

      localStorage.setItem('medistock_token', result.token);

      const userSession = {
        userId: result.userId,
        fullName,
        email: result.email || identifier.trim(),
        role: userRole,
      };

      if (rememberMe) {
        localStorage.setItem('medistock_remember', 'true');
      } else {
        localStorage.removeItem('medistock_remember');
      }

      localStorage.setItem('medistock_user', JSON.stringify(userSession));
      const targetPath = getRoleDashboardPath(userRole);
      navigate(targetPath, { replace: true });
    } catch (err) {
      const msg = err.message || '';
      const trimmedEmail = identifier.trim().toLowerCase();

      // Offline development fallback for demo accounts
      if (
        (msg.toLowerCase().includes('reach') ||
          msg.toLowerCase().includes('failed') ||
          msg.toLowerCase().includes('connect') ||
          msg.toLowerCase().includes('fetch')) &&
        DEMO_ACCOUNTS[trimmedEmail]
      ) {
        const demoUser = DEMO_ACCOUNTS[trimmedEmail];
        const userSession = {
          userId: demoUser.role === ROLES.ADMIN ? 1 : 2,
          fullName: demoUser.fullName,
          email: demoUser.email,
          role: demoUser.role,
          department: demoUser.department,
        };
        localStorage.setItem('medistock_token', 'demo_jwt_token_' + demoUser.role.toLowerCase());
        localStorage.setItem('medistock_user', JSON.stringify(userSession));
        const targetPath = getRoleDashboardPath(demoUser.role);
        navigate(targetPath, { replace: true });
        return;
      }

      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPasswordSubmit(e) {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    setForgotStatus(null);
    try {
      const res = await forgotPassword(forgotInput.trim());
      setForgotStatus({
        type: 'success',
        message: res.message || 'Password reset link sent to your email.',
      });
    } catch (err) {
      setForgotStatus({
        type: 'error',
        message: err.message || 'Could not send reset link. Please verify the email.',
      });
    } finally {
      setForgotLoading(false);
    }
  }

  const RoleIcon = currentRole.icon;

  return (
    <div className="clay-auth-page-wrapper">
      {/* Soft Ambient Light Green Radial Glows */}
      <div className="clay-ambient-glow glow-top-left" />
      <div className="clay-ambient-glow glow-bottom-right" />

      {/* Main Dual-Card Container */}
      <div className="clay-dual-card-container">
        
        {/* Hero Section: Live Healthcare Operations Preview */}
        <AuthHeroPanel mode="login" />

        {/* RIGHT CARD: Interactive Login Form Panel */}
        <div className="clay-form-panel">

          {/* Top Segmented Pill Toggle Switch matching Image 2 */}
          <div className="clay-pill-switcher">
            <div className="pill-btn pill-btn-active">
              <Lock size={16} />
              <span>Login</span>
            </div>
            <Link to="/signup" className="pill-btn pill-btn-inactive">
              <User size={16} />
              <span>Sign Up</span>
            </Link>
          </div>

          {/* Form Header Titles */}
          <div className="clay-form-header">
            <h2 className="clay-form-title">Login to MediStock</h2>
            <p className="clay-form-subtitle">Access your dashboard and manage inventory efficiently</p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="clay-alert clay-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoBanner && (
            <div className="clay-alert clay-alert-success" role="status">
              <CheckCircle2 size={18} />
              <span>{infoBanner}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="clay-auth-form" noValidate>

            {/* Select Role * — Interactive Custom Card Picker matching Image 2 */}
            <div className="clay-form-group" ref={dropdownRef}>
              <label className="clay-label">
                Select Role <span className="req-star">*</span>
              </label>

              <div className="clay-role-picker-wrapper">
                {/* Active Selected Role Card */}
                <div 
                  className={`clay-role-selected-card ${roleDropdownOpen ? 'open' : ''}`}
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                >
                  <div className="role-card-left">
                    <div className="role-card-icon-pill">
                      <RoleIcon size={18} />
                    </div>
                    <div className="role-card-info">
                      <span className="role-card-title">{currentRole.title}</span>
                      <span className="role-card-desc">{currentRole.subtitle}</span>
                    </div>
                  </div>
                  <ChevronDown size={19} className={`chevron-icon ${roleDropdownOpen ? 'open' : ''}`} />
                </div>

                {/* Dropdown Options List matching Image 2 */}
                {roleDropdownOpen && (
                  <div className="clay-role-options-menu">
                    {LOGIN_ROLE_OPTIONS.map((opt) => {
                      const IconComp = opt.icon;
                      const isSelected = selectedRoleKey === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`clay-role-option-row ${isSelected ? 'active-row' : ''}`}
                          onClick={() => handleSelectRole(opt)}
                        >
                          <div className="option-row-left">
                            <div className="option-icon-box">
                              <IconComp size={18} />
                            </div>
                            <div className="option-text-meta">
                              <span className="option-name">{opt.title}</span>
                              <span className="option-sub">{opt.subtitle}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="option-check-circle">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="clay-form-group">
              <label className="clay-label" htmlFor="email">
                Email Address <span className="req-star">*</span>
              </label>
              <div className="clay-input-box">
                <span className="input-icon"><Mail size={19} /></span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMsg('');
                  }}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="clay-form-group">
              <label className="clay-label" htmlFor="password">
                Password <span className="req-star">*</span>
              </label>
              <div className="clay-input-box">
                <span className="input-icon"><Lock size={19} /></span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password Row */}
            <div className="clay-login-meta-row">
              <label className="clay-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-text">Remember Me</span>
              </label>

              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => {
                  setForgotInput(identifier);
                  setForgotStatus(null);
                  setForgotModalOpen(true);
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Big Login Pill Button in Vibrant Light Green Gradient */}
            <button
              type="submit"
              className="clay-submit-pill-btn"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={20} className="spin" /> Authenticating...</>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Login</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="clay-or-divider">
              <span>Or continue with</span>
            </div>

            {/* Social & Healthcare Organization SSO Buttons */}
            <div className="clay-sso-buttons-row">
              <button
                type="button"
                className="clay-sso-btn google-btn"
                onClick={() => {
                  setInfoBanner("Connecting to Google Single Sign-On...");
                  setTimeout(() => {
                    localStorage.setItem('medistock_token', 'demo_jwt_google_user');
                    localStorage.setItem('medistock_user', JSON.stringify({
                      userId: 2,
                      fullName: 'Alex Rivera (Google)',
                      email: 'alex.rivera@medistock.com',
                      role: 'PHARMACIST'
                    }));
                    navigate('/pharmacist');
                  }, 800);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="clay-sso-btn org-btn"
                onClick={() => {
                  setInfoBanner("Connecting to Healthcare Institution Domain (.org)...");
                  setTimeout(() => {
                    localStorage.setItem('medistock_token', 'demo_jwt_org_admin');
                    localStorage.setItem('medistock_user', JSON.stringify({
                      userId: 1,
                      fullName: 'System Administrator (.org)',
                      email: 'admin@medistock.com',
                      role: 'ADMIN'
                    }));
                    navigate('/admin');
                  }, 800);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 21V3h6v18"/>
                </svg>
                <span>Organization (.org)</span>
              </button>
            </div>
          </form>

          {/* Bottom Footer Prompt matching Image 2 */}
          <div className="clay-footer-prompt">
            Don't have an account?{" "}
            <Link to="/signup" className="login-link">
              Sign Up &gt;
            </Link>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="clay-modal-overlay" onClick={() => setForgotModalOpen(false)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Your Password</h3>
              <p className="modal-desc">Enter your registered email address to receive secure reset instructions.</p>
            </div>

            {forgotStatus && (
              <div className={`clay-alert clay-alert-${forgotStatus.type}`}>
                {forgotStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{forgotStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="clay-auth-form">
              <div className="clay-form-group">
                <label className="clay-label">Email Address</label>
                <div className="clay-input-box">
                  <span className="input-icon"><Mail size={18} /></span>
                  <input
                    type="email"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="name@medistock.com"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-submit-pill-btn modal-submit-btn"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? <Loader2 size={16} className="spin" /> : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
