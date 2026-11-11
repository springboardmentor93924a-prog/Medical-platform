
import React, { useEffect, useState } from 'react';
import {
    ClipboardCheck,
    Package,
    CheckCircle,
    Clock,
    AlertTriangle,
    Eye,
    RefreshCw,
    CalendarDays,
    Truck,
    X,
    ShieldCheck,
    Hash,
    IndianRupee,
    ListChecks
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const ReceiveMedicinesView = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [confirmedItems, setConfirmedItems] = useState([]);

    const fetchDeliveries = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const data = await adminService.getStaffDeliveries();
            setDeliveries(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch deliveries:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const openVerification = (order) => {
        setSelectedOrder(order);
        setConfirmedItems([]);
    };

    const closeVerification = () => {
        setSelectedOrder(null);
        setConfirmedItems([]);
    };

    const toggleItem = (index) => {
        setConfirmedItems((prev) =>
            prev.includes(index)
                ? prev.filter((item) => item !== index)
                : [...prev, index]
        );
    };

    const formatDate = (date) => {
        if (!date) return 'Date unavailable';

        const parsedDate = new Date(date);
        return Number.isNaN(parsedDate.getTime())
            ? 'Date unavailable'
            : parsedDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
    };

    const formatAmount = (amount) =>
        Number(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    const allItemsConfirmed =
        selectedOrder?.items?.length > 0 &&
        confirmedItems.length === selectedOrder.items.length;

    const handleConfirmReceipt = () => {
        if (!allItemsConfirmed) return;

        alert('Delivery received! The Admin will be notified to update inventory.');
        closeVerification();
        fetchDeliveries();
    };

    const getStatusStyle = (status) => {
        if (status === 'APPROVED') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
        }

        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    };

    return (
        <div className="min-h-full bg-slate-50/60 dark:bg-[#080f1e] p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-7">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                <ClipboardCheck size={19} className="text-emerald-600 dark:text-emerald-400" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Inventory Operations
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Receive Medicines
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Verify incoming deliveries and confirm quantities before receiving stock.
                        </p>
                    </div>

                    <button
                        onClick={() => fetchDeliveries(true)}
                        disabled={loading || refreshing}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Refresh Deliveries
                    </button>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Deliveries</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {loading ? '—' : deliveries.length}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                <Package className="text-blue-600 dark:text-blue-400" size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Ready to Receive</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {loading ? '—' : deliveries.filter(order => order.status === 'APPROVED').length}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                <Truck className="text-emerald-600 dark:text-emerald-400" size={21} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Awaiting Approval</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {loading ? '—' : deliveries.filter(order => order.status !== 'APPROVED').length}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                                <Clock className="text-amber-600 dark:text-amber-400" size={21} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Incoming Purchase Orders
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Review and verify medicines received from suppliers.
                            </p>
                        </div>
                        {!loading && (
                            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {deliveries.length} Orders
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 animate-pulse"
                                >
                                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-7" />
                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded mb-3" />
                                    <div className="h-3 w-2/3 bg-slate-100 dark:bg-slate-800 rounded mb-7" />
                                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-5 py-14 text-center">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Package size={29} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white">
                                No incoming deliveries
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                                New deliveries will appear here when the Admin approves purchase orders.
                            </p>
                            <button
                                onClick={() => fetchDeliveries(true)}
                                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                <RefreshCw size={14} /> Check again
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {deliveries.map((order) => (
                                <div
                                    key={order.id}
                                    className="group rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />

                                    <div className="p-5 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                                                    Purchase Order
                                                </p>
                                                <h3 className="font-mono text-base font-extrabold text-blue-700 dark:text-blue-400 mt-1 truncate">
                                                    {order.orderNumber || `Order #${order.id}`}
                                                </h3>
                                            </div>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-extrabold tracking-wide ${getStatusStyle(order.status)}`}>
                                                {order.status || 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-4">
                                            <CalendarDays size={14} />
                                            <span>{formatDate(order.orderDate)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-5">
                                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/70 p-3">
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                    <Package size={13} />
                                                    <span className="text-[11px] font-medium">Items</span>
                                                </div>
                                                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                                                    {order.items?.length || 0}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700/70 p-3">
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                    <IndianRupee size={13} />
                                                    <span className="text-[11px] font-medium">Order Value</span>
                                                </div>
                                                <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                                                    ₹{formatAmount(order.totalAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 pb-5">
                                        <button
                                            onClick={() => openVerification(order)}
                                            className="w-full py-3 rounded-xl bg-slate-400 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                        >
                                            <Eye size={16} />
                                            View & Verify Delivery
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Verification Modal */}
                {selectedOrder && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) closeVerification();
                        }}
                    >
                        <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">

                            {/* Modal Header */}
                            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                            <ClipboardCheck size={21} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                                                Delivery Verification
                                            </p>
                                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 break-words">
                                                {selectedOrder.orderNumber || `Order #${selectedOrder.id}`}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Verify all items before confirming receipt.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={closeVerification}
                                        aria-label="Close verification"
                                        className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition"
                                    >
                                        <X size={19} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-3 mt-5">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Verification progress
                                    </span>
                                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {confirmedItems.length}/{selectedOrder.items?.length || 0} verified
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 mt-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                        style={{
                                            width: `${selectedOrder.items?.length
                                                ? (confirmedItems.length / selectedOrder.items.length) * 100
                                                : 0}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                                <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                            Before confirming receipt
                                        </p>
                                        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90 mt-1">
                                            Physically count each medicine and verify its batch number and quantity against the purchase order. Contact the Admin if you find any mismatch.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                                        <ListChecks size={17} className="text-blue-600 dark:text-blue-400" />
                                        Items to Verify
                                    </h4>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {selectedOrder.items?.length || 0} items
                                    </span>
                                </div>

                                {selectedOrder.items?.length ? (
                                    selectedOrder.items.map((item, idx) => {
                                        const isConfirmed = confirmedItems.includes(idx);

                                        return (
                                            <div
                                                key={item.id || idx}
                                                className={`rounded-xl border p-4 transition-all ${
                                                    isConfirmed
                                                        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/5'
                                                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white break-words">
                                                            {item.medicineName || 'Unnamed Medicine'}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            Ordered quantity: <span className="font-bold text-slate-700 dark:text-slate-200">{item.quantity} units</span>
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-extrabold">
                                                        × {item.quantity}
                                                    </span>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3">
                                                    <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={isConfirmed}
                                                            onChange={() => toggleItem(idx)}
                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
                                                        />
                                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                            Physically verified
                                                        </span>
                                                    </label>

                                                    {isConfirmed && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle size={13} /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                                        No order items found.
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    Verify every item before signing off.
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={closeVerification}
                                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                    >
                                        Cancel
                                    </button>
                                   

<button
    onClick={async () => {
        try {
            const result = await adminService.receivePurchaseOrder(selectedOrder.id);
            alert(`✅ ${result.message}\n\nThe stock has been updated in inventory.`);
            setSelectedOrder(null);
            fetchDeliveries();
        } catch (err) {
            alert("Failed to receive order: " + (err.response?.data?.message || err.message));
        }
    }}
    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2"
>
    <CheckCircle size={16} /> Confirm Receipt & Update Stock
</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
