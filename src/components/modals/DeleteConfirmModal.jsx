import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertTriangle size={24} />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div>
                    <h3 className="text-base font-bold text-slate-900">
                        {title || 'Confirm Deletion'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {message || 'This action cannot be undone. An entry will be recorded in the compliance audit trail.'}
                    </p>
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
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                    >
                        Delete Record
                    </button>
                </div>
            </div>
        </div>
    );
};
