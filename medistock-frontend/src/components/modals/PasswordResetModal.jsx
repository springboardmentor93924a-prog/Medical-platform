import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const PasswordResetModal = ({ isOpen, onClose }) => {
    const { showToast } = useToast();
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            showToast('New passwords do not match!', 'error');
            return;
        }
        if (newPass.length < 8) {
            showToast('Password must be at least 8 characters long.', 'warning');
            return;
        }
        showToast('Clinical access password updated successfully.', 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                            <KeyRound size={18} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Reset Account Password</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                        <input
                            type="password"
                            required
                            value={currentPass}
                            onChange={e => setCurrentPass(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password</label>
                        <input
                            type="password"
                            required
                            value={newPass}
                            onChange={e => setNewPass(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                        >
                            Update Credentials
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
