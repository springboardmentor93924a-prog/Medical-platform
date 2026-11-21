import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MediStockLogo } from '../common/MediStockLogo';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import TermsPolicyModal from '../modals/TermsPolicyModal';

export const LoginView = ({ onNavigateToRegister, onLoginSuccess }) => {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [email, setEmail] = useState('admin@medistock.com');
    const [password, setPassword] = useState('password123');
    const [role, setRole] = useState('Chief Pharmacist');
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState('terms');

    const openTerms = (tab = 'terms') => {
        setTermsModalTab(tab);
        setTermsModalOpen(true);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password, role);
            showToast(`Signed in successfully as ${role}`, 'success');
            if (onLoginSuccess) onLoginSuccess();
        } catch (err) {
            showToast('Authentication failed. Check credentials.', 'error');
        }
    };

    const handleQuickRole = (r, em) => {
        setRole(r);
        setEmail(em);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-100 rounded-full blur-3xl pointer-events-none opacity-60" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-100 rounded-full blur-3xl pointer-events-none opacity-60" />

            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl backdrop-blur-xl relative z-10 space-y-6">
                <div className="text-center flex flex-col items-center">
                    <MediStockLogo size="lg" />
                    <h2 className="text-xl font-extrabold text-slate-900 mt-4">Clinical Staff Authentication</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Secure Role-Based Access for Pharmacy & Medical Personnel
                    </p>
                </div>

                {/* Quick Persona Selector */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Quick Demo Clinical Persona:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickRole('Chief Pharmacist', 'admin@medistock.com')}
                            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                                role === 'Chief Pharmacist'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            Pharmacist
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickRole('Clinical Nurse', 'nurse@medistock.com')}
                            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                                role === 'Clinical Nurse'
                                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-sm'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            Nurse
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickRole('Inventory Clerk', 'clerk@medistock.com')}
                            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                                role === 'Inventory Clerk'
                                    ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-sm'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            Clerk
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Practitioner Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Access Passcode</label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        <span>Access Clinical Console</span>
                        <ArrowRight size={15} />
                    </button>

                    {/* Terms & Conditions Notice */}
                    <p className="mt-3 text-center text-xs text-slate-500 leading-relaxed">
                        By logging in, you agree to our{' '}
                        <button
                            type="button"
                            onClick={() => openTerms('terms')}
                            className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900 cursor-pointer"
                        >
                            Terms &amp; Conditions
                        </button>{' '}
                        and{' '}
                        <button
                            type="button"
                            onClick={() => openTerms('privacy')}
                            className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900 cursor-pointer"
                        >
                            Privacy Policy
                        </button>.
                    </p>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500">
                    Need new staff credential?{' '}
                    <button
                        onClick={onNavigateToRegister}
                        className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                    >
                        Register Medical Staff
                    </button>
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={() => openTerms('terms')}
                        className="hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                        Terms of Service
                    </button>
                    <span>•</span>
                    <button
                        type="button"
                        onClick={() => openTerms('privacy')}
                        className="hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                        Privacy Policy
                    </button>
                </div>
            </div>

            {/* Terms & Policy Modal */}
            <TermsPolicyModal
                isOpen={termsModalOpen}
                onClose={() => setTermsModalOpen(false)}
                initialTab={termsModalTab}
            />
        </div>
    );
};
