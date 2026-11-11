import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

export const AddUserModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        fullName: initialData?.fullName || '',
        email: initialData?.email || '',
        password: '',
        phone: initialData?.phone || '',
        role: initialData?.roles?.[0]?.replace('ROLE_', '') || 'STAFF'
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setFormData({ fullName: '', email: '', password: '', phone: '', role: 'STAFF' }); // Reset
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <UserPlus size={18} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Add New User</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                        <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                        <input type="password" required minLength="6" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">System Role *</label>
                        <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
                            <option value="STAFF">STAFF</option>
                            <option value="PHARMACIST">PHARMACIST</option>
                            <option value="SUPPLIER">SUPPLIER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">Cancel</button>
                        <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};