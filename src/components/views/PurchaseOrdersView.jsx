import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { GeneratePOModal } from '../modals/GeneratePOModal';
import { ViewPOModal } from '../modals/ViewPOModal';
import { DeletePOModal } from '../modals/DeletePOModal';

export const PurchaseOrdersView = ({ role }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal states
    const [isGenOpen, setIsGenOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPurchaseOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleDelete = async (id) => {
        await adminService.deletePurchaseOrder(id);
        setIsDeleteOpen(false);
        fetchOrders();
    };

    const handleStatusUpdate = async (id, status) => {
        await adminService.updatePurchaseOrderStatus(id, status);
        fetchOrders();
    };

    const filteredOrders = orders.filter(o => 
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || 
        o.supplierName?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'RECEIVED': return 'bg-emerald-100 text-emerald-700';
            case 'APPROVED': return 'bg-blue-100 text-blue-700';
            case 'REJECTED': return 'bg-rose-100 text-rose-700';
            default: return 'bg-amber-100 text-amber-700'; // PENDING
        }
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
                {role === 'PHARMACIST' && (
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                        Pharmacist Mode: Create & Track
                    </span>
                )}
                {role === 'ADMIN' && (
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                        Admin Mode: Approve / Reject
                    </span>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full max-w-xl">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" placeholder="Search orders..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                </div>
                
                {/* ONLY PHARMACIST CAN GENERATE A PO */}
                {role === 'PHARMACIST' && (
                    <button 
                        onClick={() => setIsGenOpen(true)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md flex items-center gap-2"
                    >
                        <Plus size={16} /> Generate PO
                    </button>
                )}
            </div>

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
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">No orders found.</td></tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-400">#{order.id}</td>
                                    <td className="px-6 py-4 font-mono font-semibold">{order.orderNumber}</td>
                                    <td className="px-6 py-4">{order.supplierName}</td>
                                    <td className="px-6 py-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-bold">₹{order.totalAmount?.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${getStatusStyle(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            
                                            {/* VIEW BUTTON (Everyone) */}
                                            <button onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg" title="View Details">
                                                <Eye size={16} />
                                            </button>

                                            {/* ADMIN ACTIONS: APPROVE / REJECT (Only if PENDING) */}
                                            {role === 'ADMIN' && order.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(order.id, 'APPROVED')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button onClick={() => handleStatusUpdate(order.id, 'REJECTED')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Reject">
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}

                                            {/* ADMIN DELETE (Always) */}
                                            {role === 'ADMIN' && (
                                                <button onClick={() => { setSelectedOrder(order); setIsDeleteOpen(true); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <GeneratePOModal 
                isOpen={isGenOpen} 
                onClose={() => setIsGenOpen(false)} 
                onSave={async (data) => {
                    try {
                        await adminService.createPurchaseOrder(data);
                        setIsGenOpen(false);
                        fetchOrders();
                    } catch (err) {
                        alert("Error: " + err.message);
                    }
                }}
            />
            
            <ViewPOModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} order={selectedOrder} />
            <DeletePOModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} order={selectedOrder} onConfirm={handleDelete} />
        </div>
    );
};