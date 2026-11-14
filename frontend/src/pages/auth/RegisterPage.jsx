import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Building2,
  Stethoscope,
  Shield,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';

export const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState('PHARMACIST');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');

  // Supplier-specific fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match.');
      addToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      addToast('Password too short (minimum 8 characters)', 'error');
      return;
    }

    setIsLoading(true);

    const payload = {
      role: selectedRole,
      fullName: selectedRole === 'SUPPLIER' ? (contactPerson || companyName) : fullName,
      email,
      phone,
      password,
      confirmPassword,
      address,
      companyName: selectedRole === 'SUPPLIER' ? companyName : undefined,
      contactPerson: selectedRole === 'SUPPLIER' ? contactPerson : undefined,
      businessRegistrationNumber: selectedRole === 'SUPPLIER' ? businessRegistrationNumber : undefined,
    };

    try {
      const res = await register(payload);
      addToast('Registration submitted successfully!', 'success');
      setSuccessInfo({
        role: selectedRole,
        email,
        status: res.data?.status || (selectedRole === 'SUPPLIER' ? 'PENDING' : 'ACTIVE'),
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check form values.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (successInfo) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Registration Complete</h2>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Account created for <span className="font-semibold text-slate-900">{successInfo.email}</span> with role{' '}
          <span className="font-semibold text-brand-600">{successInfo.role}</span>.
        </p>

        {successInfo.status === 'PENDING' ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left mb-6 leading-relaxed">
            <p className="font-bold mb-1">Pending Administrator Approval</p>
            Your account has been submitted and is currently awaiting administrator review. You will be able to log in
            as soon as your account is activated.
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left mb-6 leading-relaxed">
            <p className="font-bold mb-1">Account Active</p>
            Your registration is active. You can now immediately sign in to your dashboard.
          </div>
        )}

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full" 
          onClick={() => navigate(`/login?role=${encodeURIComponent(successInfo.role)}&email=${encodeURIComponent(successInfo.email)}`)}
        >
          Go to Sign In <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
        <p className="text-sm text-slate-500 mt-1">Select your organizational role to proceed with registration</p>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {[
          { id: 'ADMIN', label: 'Admin', icon: Shield },
          { id: 'PHARMACIST', label: 'Pharmacist', icon: Stethoscope },
          { id: 'STAFF', label: 'Staff', icon: UserCheck },
          { id: 'SUPPLIER', label: 'Supplier', icon: Building2 },
        ].map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedRole(r.id)}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
              selectedRole === r.id
                ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold shadow-xs ring-2 ring-brand-500/10'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                selectedRole === r.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <r.icon className="w-4 h-4" />
            </div>
            <span className="text-xs">{r.label}</span>
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          {selectedRole === 'SUPPLIER' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Health Logistics"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Registration Details</label>
                <input
                  type="text"
                  value={businessRegistrationNumber}
                  onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                  placeholder="e.g. REG-US-9948271"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Alex Mercer"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full physical/business address"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password (min 8 chars) *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {selectedRole === 'SUPPLIER' && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-relaxed">
              <strong>Notice:</strong> Supplier registrations are initially placed in a PENDING status and require system
              administrator verification before you can access purchase order fulfillment.
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full shadow-md mt-2">
            Complete {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()} Registration
          </Button>
        </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
          Sign in here
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
