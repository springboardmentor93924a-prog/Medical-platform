import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { CheckCircle, Truck, Clock } from 'lucide-react';

export const SupplierOrdersView = () => {
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        try {
            // For now, supplier sees ALL orders (In a real app, backend would filter by supplier ID)
            const data = await adminService.getPurchaseOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await adminService.updatePurchaseOrderStatus(id, newStatus);
            fetchOrders(); // Refresh table
        } catch (err) {
            alert("Failed: " + err.message);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">My Purchase Orders</h1>
            
            <div className="bg-white rounded-xl border shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4">PO Number</th>
                            <th className="p-4">Total Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td className="p-4 font-mono">{order.orderNumber}</td>
                                <td className="p-4 font-bold">₹{order.totalAmount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        order.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                                        order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>{order.status}</span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    {order.status === 'PENDING' && (
                                        <button onClick={() => updateStatus(order.id, 'ACCEPTED')} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 inline-flex">
                                            <CheckCircle size={14} /> Accept Order
                                        </button>
                                    )}
                                    {order.status === 'ACCEPTED' && (
                                        <button onClick={() => updateStatus(order.id, 'RECEIVED')} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 inline-flex">
                                            <Truck size={14} /> Mark as Delivered
                                        </button>
                                    )}
                                    {order.status === 'RECEIVED' && (
                                        <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                                            <CheckCircle size={14} /> Completed
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};