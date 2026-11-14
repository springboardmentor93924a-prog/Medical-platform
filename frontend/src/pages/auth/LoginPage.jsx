import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, ShieldAlert, CheckCircle, Shield, Stethoscope, UserCheck, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get('role');
  const queryEmail = searchParams.get('email');

  const [selectedRole, setSelectedRole] = useState(queryRole || 'ADMIN');
  const [email, setEmail] = useState(queryEmail || '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update role if query parameter changes
  useEffect(() => {
    if (queryRole && ['ADMIN', 'PHARMACIST', 'STAFF', 'SUPPLIER'].includes(queryRole.toUpperCase())) {
      setSelectedRole(queryRole.toUpperCase());
    }
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryRole, queryEmail]);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter token & new password
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Admin bootstrap setup modal state
  const [isAdminSetupOpen, setIsAdminSetupOpen] = useState(false);
  const [setupKey, setSetupKey] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSetupLoading, setAdminSetupLoading] = useState(false);

  const { login } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await login(email, password, selectedRole);
      addToast(`Welcome back, ${user.fullName || user.email}! Signed in as ${user.role}.`, 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      addToast(res.message, 'info');
      if (res.data) {
        setForgotToken(res.data); // Prefill in development/test mode
      }
      setForgotStep(2);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error processing password reset request', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('Password must be at least 8 characters long', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await authService.resetPassword(forgotToken, newPassword, confirmNewPassword);
      setForgotSuccessMsg(res.message || 'Password updated successfully! You can now log in.');
      addToast('Password successfully reset', 'success');
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setForgotSuccessMsg('');
        setPassword(newPassword);
        setEmail(forgotEmail);
      }, 2000);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleAdminSetupSubmit = async (e) => {
    e.preventDefault();
    setAdminSetupLoading(true);
    try {
      await authService.adminSetup({
        setupKey,
        fullName: adminFullName,
        email: adminEmail,
        password: adminPassword,
      });
      addToast('Primary administrator initialized! You can now log in.', 'success');
      setIsAdminSetupOpen(false);
      setEmail(adminEmail);
      setPassword(adminPassword);
    } catch (err) {
      addToast(err.response?.data?.message || 'Administrator initialization failed', 'error');
    } finally {
      setAdminSetupLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-slate-500 mt-1">
          Access your MediStock inventory, orders, and management dashboard
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-4 gap-2 mb-1">
            {[
              { id: 'ADMIN', label: 'Admin', icon: Shield },
              { id: 'PHARMACIST', label: 'Pharmacist', icon: Stethoscope },
              { id: 'STAFF', label: 'Staff', icon: UserCheck },
              { id: 'SUPPLIER', label: 'Supplier', icon: Building2 },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRole(r.id);
                  setErrorMsg('');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  selectedRole === r.id
                    ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold ring-2 ring-brand-500/10 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                <r.icon className="w-4 h-4" />
                <span className="text-[11px]">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@medistock.com"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-white"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">Password</label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setIsForgotModalOpen(true);
              }}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-white"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full shadow-md"
        >
          Sign In to MediStock <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      {/* Registration and Setup links */}
      <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Need an account?</span>
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
            Register new account
          </Link>
        </div>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsAdminSetupOpen(true)}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            System Admin First-Time Setup
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Follow the verified secure token process to recover your account"
      >
        {forgotSuccessMsg ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center text-sm font-medium">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            {forgotSuccessMsg}
          </div>
        ) : forgotStep === 1 ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter the email address registered with your MediStock account. We will issue a secure, time-limited password reset token.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsForgotModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={forgotLoading}>
                Generate Reset Token
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter your reset token and your desired new password.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reset Token</label>
              <input
                type="text"
                required
                value={forgotToken}
                onChange={(e) => setForgotToken(e.target.value)}
                placeholder="Paste your reset token here"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setForgotStep(1)}>
                Back
              </Button>
              <Button type="submit" variant="primary" isLoading={forgotLoading}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* First-Time Admin Setup Modal */}
      <Modal
        isOpen={isAdminSetupOpen}
        onClose={() => setIsAdminSetupOpen(false)}
        title="Initialize System Administrator"
        subtitle="One-time system initialization using your platform setup key"
      >
        <form onSubmit={handleAdminSetupSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Setup Key</label>
            <input
              type="password"
              required
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder="Enter master setup key"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Full Name</label>
            <input
              type="text"
              required
              value={adminFullName}
              onChange={(e) => setAdminFullName(e.target.value)}
              placeholder="e.g. Chief Administrator"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@medistock.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password (min 8 chars)</label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsAdminSetupOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={adminSetupLoading}>
              Initialize Administrator
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LoginPage;
