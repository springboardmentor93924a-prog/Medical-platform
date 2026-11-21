import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const DeletePOModal = ({ isOpen, onClose, order, onConfirm }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden text-center p-6">
                <div className="mx-auto w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Purchase Order?</h3>
                <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <strong>{order.orderNumber}</strong>? This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                    <button onClick={() => { onConfirm(order.id); onClose(); }} className="flex-1 py-2 bg-rose-600 text-white rounded-lg font-bold">Delete</button>
                </div>
            </div>
        </div>
    );
};