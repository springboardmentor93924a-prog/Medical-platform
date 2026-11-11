
import React, { useState, useEffect } from 'react';
import {
    Search,
    Truck,
    CheckCircle2,
    Clock3,
    Eye,
    XCircle,
    Package,
    CalendarDays,
    RefreshCw,
    ClipboardList,
    ArrowUpRight,
    X,
    Boxes,
    IndianRupee,
    AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(Number(amount || 0));

const formatDate = (date) => {
    if (!date) return 'N/A';

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
        ? 'N/A'
        : parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
};

const statusConfig = {
    PENDING: {
        label: 'Pending Approval',
        icon: Clock3,
        style: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        dot: 'bg-amber-500'
    },
    APPROVED: {
        label: 'Approved',
        icon: CheckCircle2,
        style: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
        dot: 'bg-blue-500'
    },
    RECEIVED: {
        label: 'Delivered',
        icon: CheckCircle2,
        style: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        dot: 'bg-emerald-500'
    },
    REJECTED: {
        label: 'Rejected',
        icon: XCircle,
        style: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
        dot: 'bg-rose-500'
    }
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ring-inset ${config.style}`}>
            <Icon size={13} />
            {config.label}
        </span>
    );
};

export const SupplierOrdersView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveringId, setDeliveringId] = useState(null);
    const [error, setError] = useState('');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await adminService.getSupplierOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load orders:', err);
            setError('Unable to load purchase orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDeliver = async (id) => {
        if (!window.confirm(
            'Confirm that this order has been delivered to the pharmacy? Only confirm after actual receipt verification.'
        )) return;

        try {
            setDeliveringId(id);

            await adminService.updatePurchaseOrderStatus(id, 'RECEIVED');

            await fetchOrders();

            setSelectedOrder(null);
        } catch (err) {
            alert('Failed to mark as delivered: ' + err.message);
        } finally {
            setDeliveringId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.orderNumber || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            filterStatus === 'ALL' || order.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const counts = {
        ALL: orders.length,
        PENDING: orders.filter(o => o.status === 'PENDING').length,
        APPROVED: orders.filter(o => o.status === 'APPROVED').length,
        RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
        REJECTED: orders.filter(o => o.status === 'REJECTED').length
    };

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Order Management
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Purchase Orders
                        </h1>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            View and manage purchase orders assigned to your company.
                        </p>
                    </div>

                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh Orders
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                        <div className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
                            <AlertCircle size={18} />
                            {error}
                        </div>

                        <button
                            onClick={fetchOrders}
                            className="text-sm font-bold text-rose-700 dark:text-rose-300 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        {
                            label: 'Total Orders',
                            value: counts.ALL,
                            icon: ClipboardList,
                            color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        },
                        {
                            label: 'Pending',
                            value: counts.PENDING,
                            icon: Clock3,
                            color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        },
                        {
                            label: 'Ready to Ship',
                            value: counts.APPROVED,
                            icon: Truck,
                            color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        },
                        {
                            label: 'Delivered',
                            value: counts.RECEIVED,
                            icon: CheckCircle2,
                            color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {item.label}
                                    </p>

                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                                        <Icon size={18} />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                                    {item.value}
                                </h3>
                            </div>
                        );
                    })}
                </div>

                {/* Main Orders Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Panel Header */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">
                                    All Purchase Orders
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Search, filter and review your assigned orders.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search */}
                                <div className="relative flex-1 sm:w-64">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder="Search PO number..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="PENDING">Pending Approval</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="RECEIVED">Delivered</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            </div>
                        </div>

                        {/* Status Quick Filters */}
                        <div className="flex gap-2 overflow-x-auto pt-5 pb-1">
                            {[
                                { id: 'ALL', label: 'All Orders' },
                                { id: 'PENDING', label: 'Pending' },
                                { id: 'APPROVED', label: 'Approved' },
                                { id: 'RECEIVED', label: 'Delivered' },
                                { id: 'REJECTED', label: 'Rejected' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                        filterStatus === tab.id
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                        filterStatus === tab.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}>
                                        {counts[tab.id]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[760px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 sm:px-6 py-4 font-semibold">Purchase Order</th>
                                    <th className="px-5 sm:px-6 py-4 font-semibold">Order Date</th>
                                    <th className="px-5 sm:px-6 py-4 font-semibold">Items</th>
                                    <th className="px-5 sm:px-6 py-4 font-semibold">Total Amount</th>
                                    <th className="px-5 sm:px-6 py-4 font-semibold">Status</th>
                                    <th className="px-5 sm:px-6 py-4 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <RefreshCw size={22} className="animate-spin text-blue-500 mx-auto mb-3" />
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Loading your purchase orders...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                                <Package size={25} className="text-slate-400" />
                                            </div>

                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                No orders found
                                            </p>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Try changing your search or status filter.
                                            </p>

                                            {(search || filterStatus !== 'ALL') && (
                                                <button
                                                    onClick={() => {
                                                        setSearch('');
                                                        setFilterStatus('ALL');
                                                    }}
                                                    className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map(order => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-5 sm:px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                        <ClipboardList size={17} />
                                                    </div>

                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100">
                                                            {order.orderNumber || 'Purchase Order'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            ID: {order.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 sm:px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <CalendarDays size={14} className="text-slate-400" />
                                                    {formatDate(order.orderDate)}
                                                </span>
                                            </td>

                                            <td className="px-5 sm:px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                    <Boxes size={14} className="text-slate-400" />
                                                    {order.items?.length || 0} items
                                                </span>
                                            </td>

                                            <td className="px-5 sm:px-6 py-4">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(order.totalAmount)}
                                                </span>
                                            </td>

                                            <td className="px-5 sm:px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>

                                            <td className="px-5 sm:px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View Order Details"
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:border-blue-200 dark:hover:text-blue-400 dark:hover:border-blue-900 transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {order.status === 'APPROVED' && (
                                                        <button
                                                            onClick={() => handleDeliver(order.id)}
                                                            disabled={deliveringId === order.id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                                                        >
                                                            {deliveringId === order.id ? (
                                                                <RefreshCw size={13} className="animate-spin" />
                                                            ) : (
                                                                <Truck size={13} />
                                                            )}
                                                            {deliveringId === order.id ? 'Updating...' : 'Mark Delivered'}
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

                    {/* Table Footer */}
                    {!loading && filteredOrders.length > 0 && (
                        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredOrders.length}</span> of{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{orders.length}</span> orders
                            </p>

                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                MediStock Supplier Portal
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedOrder(null);
                    }}
                >
                    <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">

                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Package size={20} />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                        {selectedOrder.orderNumber || 'Purchase Order'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Purchase Order Details
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-6">

                            {/* Amount and Status */}
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 p-4">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Total Order Amount
                                </p>

                                <div className="flex items-center justify-between gap-3 mt-2">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(selectedOrder.totalAmount)}
                                    </h2>

                                    <StatusBadge status={selectedOrder.status} />
                                </div>
                            </div>

                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <CalendarDays size={15} />
                                        <span className="text-xs">Order Date</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {formatDate(selectedOrder.orderDate)}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                        <Boxes size={15} />
                                        <span className="text-xs">Total Items</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {selectedOrder.items?.length || 0} medicines
                                    </p>
                                </div>
                            </div>

                            {/* Medicines */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Ordered Medicines
                                    </h4>

                                    <span className="text-xs text-slate-400">
                                        {selectedOrder.items?.length || 0} items
                                    </span>
                                </div>

                                {selectedOrder.items?.length > 0 ? (
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div
                                                    key={item.id || idx}
                                                    className="flex items-center justify-between gap-3 p-4"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                            <Package size={16} className="text-slate-500 dark:text-slate-400" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                {item.medicineName || 'Medicine'}
                                                            </p>

                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                {item.quantity} × {formatCurrency(item.unitPrice)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                                                        {formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        No medicine details available.
                                    </p>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Close
                                </button>

                                {selectedOrder.status === 'APPROVED' && (
                                    <button
                                        onClick={() => handleDeliver(selectedOrder.id)}
                                        disabled={deliveringId === selectedOrder.id}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                                    >
                                        <Truck size={16} />
                                        {deliveringId === selectedOrder.id ? 'Updating...' : 'Mark Delivered'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
