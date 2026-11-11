import React from 'react';
import { X, Eye } from 'lucide-react';

export const ViewPOModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Eye size={18}/> Order Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-slate-500 text-xs">PO Number</p><p className="font-bold">{order.orderNumber}</p></div>
                        <div><p className="text-slate-500 text-xs">Supplier</p><p className="font-bold">{order.supplierName}</p></div>
                        <div><p className="text-slate-500 text-xs">Total Amount</p><p className="font-bold">₹{order.totalAmount}</p></div>
                        <div><p className="text-slate-500 text-xs">Status</p><p className="font-bold">{order.status}</p></div>
                    </div>
                    <div className="border-t pt-4">
                        <p className="text-sm font-bold mb-2">Ordered Items</p>
                        <ul className="space-y-2">
                            {order.items?.map((item, idx) => (
                                <li key={idx} className="flex justify-between text-sm bg-slate-50 p-2 rounded">
                                    <span>{item.medicineName}</span>
                                    <span className="font-bold">{item.quantity} x ₹{item.unitPrice}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};