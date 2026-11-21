import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { CheckCircle, Truck, Clock, Package } from 'lucide-react';

export default function SupplierDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await adminService.getSupplierOrders();
            setOrders(data);
        } catch (err) {
            console.error("Failed to load supplier orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await adminService.updatePurchaseOrderStatus(id, status);
            fetchOrders();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading your orders...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Package className="text-blue-600" /> Supplier Portal
                </h1>
                <p className="text-slate-500 text-sm">Manage incoming Purchase Orders from the hospital.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-xs font-bold text-amber-600 uppercase">Pending Action</p>
                    <p className="text-2xl font-black text-amber-700">{orders.filter(o => o.status === 'PENDING').length}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase">Accepted / Processing</p>
                    <p className="text-2xl font-black text-blue-700">{orders.filter(o => o.status === 'ACCEPTED').length}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-600 uppercase">Delivered</p>
                    <p className="text-2xl font-black text-emerald-700">{orders.filter(o => o.status === 'RECEIVED').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4">PO Number</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Items</th>
                            <th className="p-4">Total</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">No orders assigned to you yet.</td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id}>
                                <td className="p-4 font-mono font-bold">{order.orderNumber}</td>
                                <td className="p-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                                <td className="p-4 text-xs">
                                    {order.items?.map(i => `${i.medicineName} (${i.quantity})`).join(", ")}
                                </td>
                                <td className="p-4 font-bold">₹{order.totalAmount}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        order.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                                        order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>{order.status}</span>
                                </td>
                                <td className="p-4 text-right">
                                    {order.status === 'PENDING' && (
                                        <button onClick={() => updateStatus(order.id, 'ACCEPTED')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ml-auto">
                                            <CheckCircle size={14} /> Accept Order
                                        </button>
                                    )}
                                    {order.status === 'ACCEPTED' && (
                                        <button onClick={() => updateStatus(order.id, 'RECEIVED')} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 ml-auto">
                                            <Truck size={14} /> Mark Delivered
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
}