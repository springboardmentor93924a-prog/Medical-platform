import React, { useState, useEffect } from 'react';
import { X, Truck, Check } from 'lucide-react';

export const AddSupplierModal = ({ isOpen, onClose, onSave, initialData }) => {
    // 1. Setup a default empty state
    const defaultState = {
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        licenseNumber: `FDA-DIST-${Math.floor(1000 + Math.random() * 9000)}`,
        leadTimeDays: 2,
        rating: 5.0
    };

    const [formData, setFormData] = useState(defaultState);

    // 2. When the modal opens, check if we are editing
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData); // Edit mode: fill form
            } else {
                setFormData(defaultState); // Add mode: empty form
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            <Truck size={18} />
                        </div>
                        <div>
                            {/* Change title based on Edit vs Add */}
                            <h3 className="text-base font-bold text-slate-900">
                                {initialData ? 'Edit Distributor Details' : 'Onboard Pharmaceutical Distributor'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {initialData ? 'Update supplier information.' : 'Register certified supplier and distribution terms.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Distributor Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Cardinal Health Specialty"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
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
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">FDA / DEA License #</label>
                            <input
                                type="text"
                                value={formData.licenseNumber || ''}
                                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
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
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
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
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
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
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Distribution Hub Address</label>
                        <input
                            type="text"
                            placeholder="Street, City, State, ZIP"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check size={14} />
                            <span>{initialData ? 'Save Changes' : 'Save Supplier'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};