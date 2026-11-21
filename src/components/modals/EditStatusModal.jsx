import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';

export const EditStatusModal = ({ isOpen, onClose, order, onSave }) => {
    const [status, setStatus] = useState(order?.status || 'PENDING');

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Edit size={18}/> Update Status</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500">Update status for <strong>{order.orderNumber}</strong>:</p>
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="RECEIVED">RECEIVED</option>
                        <option value="CANCELLED">CANCELLED</option>
                    </select>
                    <button 
                        onClick={() => { onSave(order.id, status); onClose(); }}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};