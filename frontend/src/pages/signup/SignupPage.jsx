import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2,
  AlertCircle, ArrowRight, ChevronDown, Check, Loader2
} from "lucide-react";
import AuthHeroPanel from "../../components/auth/AuthHeroPanel";
import { registerUser } from "../../services/api";
import "./SignupPage.css";

const ROLES_LIST = [
  { value: "ADMIN", roleId: 1, label: "Admin", subtitle: "Full System & User Administration" },
  { value: "PHARMACIST", roleId: 2, label: "Pharmacist", subtitle: "Pharmacy Operations & Dispensing" },
  { value: "STAFF", roleId: 3, label: "Staff", subtitle: "Clinical Inventory Support" },
  { value: "SUPPLIER", roleId: 4, label: "Supplier", subtitle: "Medical Supply & Vendor Management" },
];

export default function SignupPage() {
  const navigate = useNavigate();

  // Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "PHARMACIST",
    acceptTerms: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // General Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setError("");
  };

  // Strong Password Evaluation
  const hasMinLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasLower = /[a-z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(form.password);
  const criteriaMetCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strengthLabel = "Weak";
  let strengthClass = "meter-weak";
  if (criteriaMetCount >= 5) {
    strengthLabel = "Maximum Security (Strong)";
    strengthClass = "meter-strong";
  } else if (criteriaMetCount >= 3) {
    strengthLabel = "Moderate (Needs Special Char)";
    strengthClass = "meter-moderate";
  }

  // Handle Signup Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 7) {
      setError("Please enter a valid mobile phone number.");
      return;
    }
    if (criteriaMetCount < 5) {
      setError("Password must contain at least 8 characters, uppercase, lowercase, number, and a special character.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }
    if (!form.acceptTerms) {
      setError("Please accept the Terms and Conditions to proceed.");
      return;
    }

    setLoading(true);
    try {
      const roleObj = ROLES_LIST.find((r) => r.value === form.role);
      await registerUser({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        role: form.role,
        roleId: roleObj ? roleObj.roleId : 2
      });

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate(`/login?registered=true&email=${encodeURIComponent(form.email.trim())}&role=${form.role.toLowerCase()}`);
      }, 1200);
    } catch (err) {
      setError(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES_LIST.find((r) => r.value === form.role) || ROLES_LIST[0];

  return (
    <div className="clay-auth-page-wrapper">
      <div className="clay-ambient-glow glow-top-left" />
      <div className="clay-ambient-glow glow-bottom-right" />

      <div className="clay-dual-card-container">
        {/* Left Clinical Telemetry Hero Panel */}
        <AuthHeroPanel mode="signup" />

        {/* Right Form Card */}
        <div className="clay-form-panel">
          
          {/* Top Segmented Navigation Switcher */}
          <div className="clay-pill-switcher">
            <Link to="/login" className="pill-btn pill-btn-inactive">
              <Lock size={15} />
              <span>Login</span>
            </Link>
            <div className="pill-btn pill-btn-active">
              <User size={15} />
              <span>Sign Up</span>
            </div>
          </div>

          {/* Header Title */}
          <div className="clay-form-header">
            <h2 className="clay-form-title">Create Your MediStock Account</h2>
            <p className="clay-form-subtitle">
              Join the automated healthcare dispensary network
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="clay-alert clay-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="clay-alert clay-alert-success" role="status">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="clay-auth-form" noValidate>
            
            {/* Full Name */}
            <div className="clay-form-group">
              <label className="clay-label" htmlFor="fullName">
                Full Name <span className="req-star">*</span>
              </label>
              <div className="clay-input-box">
                <span className="input-icon"><User size={18} /></span>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Dr. Jane Smith, R.Ph."
                  value={form.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="clay-form-group">
              <label className="clay-label" htmlFor="email">
                Email Address <span className="req-star">*</span>
              </label>
              <div className="clay-input-box">
                <span className="input-icon"><Mail size={18} /></span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@hospital.org or gmail.com"
                  value={form.email}
                  onChange={handleChange}
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
                <span className="input-icon"><Lock size={18} /></span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 chars with uppercase, number & symbol"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

              {/* Password Strength Meter */}
              {form.password && (
                <div className="clay-password-meter">
                  <div className="meter-header">
                    <span className="meter-caption">Security Level:</span>
                    <span className={`meter-status ${strengthClass}`}>{strengthLabel}</span>
                  </div>
                  <div className="meter-bar-track">
                    <div className={`meter-bar-fill ${strengthClass}`} style={{ width: `${(criteriaMetCount / 5) * 100}%` }} />
                  </div>
                  <div className="criteria-tags-row">
                    <span className={`crit-tag ${hasMinLength ? 'crit-pass' : ''}`}>8+ chars</span>
                    <span className={`crit-tag ${hasUpper ? 'crit-pass' : ''}`}>Uppercase</span>
                    <span className={`crit-tag ${hasLower ? 'crit-pass' : ''}`}>Lowercase</span>
                    <span className={`crit-tag ${hasNumber ? 'crit-pass' : ''}`}>Number</span>
                    <span className={`crit-tag ${hasSpecial ? 'crit-pass' : ''}`}>Special char (!@#$...)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="clay-form-group">
              <label className="clay-label" htmlFor="confirmPassword">
                Confirm Password <span className="req-star">*</span>
              </label>
              <div className="clay-input-box">
                <span className="input-icon"><Lock size={18} /></span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Mobile Phone Number */}
            <div className="clay-form-group">
              <label className="clay-label" htmlFor="phone">
                Mobile Phone <span className="req-star">*</span>
              </label>
              <div className="clay-input-box">
                <span className="input-icon"><Phone size={18} /></span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="clay-form-group">
              <label className="clay-label">
                Choose Role <span className="req-star">*</span>
              </label>
              <div className="clay-select-wrapper">
                <div 
                  className="clay-select-box"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                >
                  <span className="select-val">
                    <strong>{selectedRole.label}</strong> — <small>{selectedRole.subtitle}</small>
                  </span>
                  <ChevronDown size={18} className={`chevron-icon ${roleDropdownOpen ? 'open' : ''}`} />
                </div>

                {roleDropdownOpen && (
                  <div className="clay-dropdown-menu">
                    {ROLES_LIST.map((r) => (
                      <div
                        key={r.value}
                        className={`clay-dropdown-item ${form.role === r.value ? 'selected' : ''}`}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, role: r.value }));
                          setRoleDropdownOpen(false);
                        }}
                      >
                        <div className="item-text">
                          <span className="item-label">{r.label}</span>
                          <span className="item-sub">{r.subtitle}</span>
                        </div>
                        {form.role === r.value && <Check size={16} className="check-icon" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="clay-checkbox-group">
              <label className="clay-checkbox-label">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  required
                />
                <span className="checkbox-custom" />
                <span className="checkbox-text">
                  I agree to the <Link to="/terms" className="legal-link">Terms of Service</Link> and{" "}
                  <Link to="/privacy" className="legal-link">Privacy Policy</Link>
                </span>
              </label>
            </div>

            {/* Submit Pill Button */}
            <button
              type="submit"
              className="clay-submit-pill-btn"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={19} className="spin" /> Creating Account...</>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="clay-or-divider">
              <span>Or register with</span>
            </div>

            <div className="clay-sso-buttons-row">
              <button
                type="button"
                className="clay-sso-btn google-btn"
                onClick={() => {
                  setSuccess("Connecting to Google OAuth Secure Service...");
                  setTimeout(() => navigate('/login?provider=google'), 800);
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
                  setSuccess("Routing to Healthcare Organization / Institutional Portal (.org)...");
                  setTimeout(() => navigate('/login?provider=org'), 800);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M9 21V3h6v18"/>
                </svg>
                <span>Organization (.org)</span>
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="clay-footer-prompt">
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Login &gt;
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
