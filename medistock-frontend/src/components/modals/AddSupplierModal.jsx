import React, { useState, useEffect } from 'react';
import { X, Truck, Check, Key } from 'lucide-react';

export const AddSupplierModal = ({ isOpen, onClose, onSave, initialData }) => {
    const defaultState = {
        name: '',
        contactPerson: '',
        email: '',
        password: '',      // NEW
        phone: '',
        address: '',
        licenseNumber: `FDA-DIST-${Math.floor(1000 + Math.random() * 9000)}`,
        leadTimeDays: 2,
        rating: 5.0
    };

    const [formData, setFormData] = useState(defaultState);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? initialData : defaultState);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const isEditMode = !!initialData;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate password only when creating
        if (!isEditMode && formData.password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Truck size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {isEditMode ? 'Edit Distributor Details' : 'Onboard Pharmaceutical Distributor'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {isEditMode ? 'Update supplier information.' : 'Register certified supplier & create their login account.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Distributor Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Cardinal Health Specialty"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Representative</label>
                            <input
                                type="text"
                                placeholder="e.g. Dr. Jordan Reed"
                                value={formData.contactPerson || ''}
                                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">FDA / DEA License #</label>
                            <input
                                type="text"
                                value={formData.licenseNumber || ''}
                                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-teal-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone</label>
                            <input
                                type="text"
                                placeholder="+1 (800) 555-0199"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={formData.leadTimeDays || 2}
                                onChange={e => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 2 })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address *</label>
                        <input
                            type="email"
                            required
                            placeholder="orders@distributor.com"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Distribution Hub Address</label>
                        <input
                            type="text"
                            placeholder="Street, City, State, ZIP"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                        />
                    </div>

                    {/* NEW: Password field only shows when creating a new supplier */}
                    {!isEditMode && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                                <Key size={12} /> Set Login Password for Supplier *
                            </label>
                            <input
                                type="password"
                                required
                                minLength="6"
                                placeholder="Minimum 6 characters"
                                value={formData.password || ''}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                            />
                            <p className="text-[10px] text-amber-700 mt-1">
                                The supplier will use this email + password to log in. Share these credentials with them securely.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                        >
                            <Check size={14} />
                            <span>{isEditMode ? 'Save Changes' : 'Create Supplier & Account'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};