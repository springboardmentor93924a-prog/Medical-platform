import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MediStockLogo } from '../common/MediStockLogo';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';

export const RegisterView = ({ onNavigateToLogin, onRegisterSuccess }) => {
    const { register: registerAuth } = useAuth();
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Chief Pharmacist');
    const [license, setLicense] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await registerAuth({ name, email, password, role, license });
            showToast(`Registered and signed in as ${name} (${role})`, 'success');
            if (onRegisterSuccess) onRegisterSuccess();
        } catch (err) {
            showToast('Registration failed.', 'error');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl pointer-events-none opacity-60" />

            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl backdrop-blur-xl relative z-10 space-y-6">
                <div className="text-center flex flex-col items-center">
                    <MediStockLogo size="lg" />
                    <h2 className="text-xl font-extrabold text-slate-900 mt-4">Staff Credential Registration</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Enroll authorized healthcare personnel into MediStock formulary system
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                            <input
                                type="text"
                                required
                                placeholder="Dr. Jane Watson"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                            <input
                                type="email"
                                required
                                placeholder="jane.watson@hospital.org"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Role</label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                            >
                                <option value="Chief Pharmacist">Chief Pharmacist</option>
                                <option value="Clinical Nurse">Clinical Nurse</option>
                                <option value="Inventory Clerk">Inventory Clerk</option>
                                <option value="Super Administrator">Super Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">License / DEA #</label>
                            <input
                                type="text"
                                placeholder="RPh-88201"
                                value={license}
                                onChange={e => setLicense(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
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
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                        <span>Enroll Practitioner</span>
                        <ArrowRight size={15} />
                    </button>
                </form>

                <div className="pt-2 text-center text-xs text-slate-500">
                    Already registered?{' '}
                    <button
                        onClick={onNavigateToLogin}
                        className="text-teal-700 font-semibold hover:underline cursor-pointer"
                    >
                        Sign In Here
                    </button>
                </div>
            </div>
        </div>
    );
};
