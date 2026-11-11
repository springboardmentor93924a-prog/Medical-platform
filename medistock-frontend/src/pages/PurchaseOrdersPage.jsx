import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const data = await adminService.getPurchaseOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const filteredOrders = orders.filter(o => 
        o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1500px] mx-auto space-y-6 bg-slate-50 min-h-screen">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Purchase Orders</h1>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search orders by PO#, supplier name, or creator..." 
                        className="w-full text-sm outline-none bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium shadow-sm outline-none">
                    <option>All Statuses</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                </select>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-500 shadow-md">
                    <Plus size={16} /> Generate PO
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">PO Number</th>
                            <th className="px-6 py-4">Supplier Vendor</th>
                            <th className="px-6 py-4">Order Date</th>
                            <th className="px-6 py-4">Total Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((o, index) => (
                            <tr key={o.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">#{index + 1}</td>
                                <td className="px-6 py-4 font-bold text-blue-600">{o.orderNumber || `PO-${o.id}`}</td>
                                <td className="px-6 py-4 text-slate-700">{o.supplier?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900">
                                    ₹{o.totalAmount?.toLocaleString() || '0.00'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        o.status === 'RECEIVED' || o.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                        o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {o.status || 'RECEIVED'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-md"><Eye size={16} /></button>
<button 
    onClick={async () => {
        const newStatus = prompt("Update status (PENDING, ACCEPTED, RECEIVED, CANCELLED):", order.status);
        if (newStatus && newStatus !== order.status) {
            try {
                await adminService.updatePurchaseOrderStatus(order.id, newStatus);
                fetchOrders(); // Refresh table
            } catch (err) {
                alert("Failed to update status");
            }
        }
    }} 
    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100"
>
    <Edit size={16} />
</button>                                    <button className="p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-md"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}