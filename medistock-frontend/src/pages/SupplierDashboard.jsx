import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import {
    ClipboardList,
    CheckCircle2,
    Truck,
    Clock3,
    ArrowUpRight,
    Package,
    RefreshCw,
    CalendarDays,
    CircleDollarSign,
    Activity,
    PackageCheck,
    AlertCircle,
    ChevronRight,
    Boxes
} from 'lucide-react';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(Number(amount || 0));

const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';

    return parsedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const getStatusConfig = (status) => {
    switch (status) {
        case 'RECEIVED':
            return {
                label: 'Delivered',
                className:
                    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
                dot: 'bg-emerald-500'
            };

        case 'APPROVED':
            return {
                label: 'Approved',
                className:
                    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
                dot: 'bg-blue-500'
            };

        case 'REJECTED':
            return {
                label: 'Rejected',
                className:
                    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
                dot: 'bg-rose-500'
            };

        default:
            return {
                label: 'Pending',
                className:
                    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
                dot: 'bg-amber-500'
            };
    }
};

// Reusable Stat Card
const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    iconStyle,
    valueStyle,
    onClick
}) => (
    <button
        type="button"
        onClick={onClick}
        className="group w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-slate-700 transition-all duration-200"
    >
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {title}
                </p>

                <h3 className={`text-2xl font-bold tracking-tight mt-3 ${valueStyle || 'text-slate-900 dark:text-white'}`}>
                    {value}
                </h3>

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {description}
                </p>
            </div>

            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconStyle}`}>
                <Icon size={21} strokeWidth={2} />
            </div>
        </div>

        <div className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight size={16} className="text-blue-500" />
        </div>
    </button>
);

export const SupplierDashboard = ({ onNavigate }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await adminService.getSupplierOrders();
            setOrders(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error('Failed to load supplier orders:', err);
            setError('Unable to load your orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Dashboard statistics
    const pendingApproval = orders.filter(
        order => order.status === 'PENDING'
    ).length;

    const readyToShip = orders.filter(
        order => order.status === 'APPROVED'
    ).length;

    const delivered = orders.filter(
        order => order.status === 'RECEIVED'
    ).length;

    const totalDeliveredValue = orders
        .filter(order => order.status === 'RECEIVED')
        .reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
        );

    const totalItems = orders.reduce(
        (sum, order) => sum + (order.items?.length || 0),
        0
    );

    const recentOrders = [...orders]
        .sort((a, b) => {
            return new Date(b.orderDate || 0) - new Date(a.orderDate || 0);
        })
        .slice(0, 5);

    const navigateTo = (tab) => {
        if (onNavigate) onNavigate(tab);
    };

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

            <div className="max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-7">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                                Supplier Workspace
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Dashboard
                        </h1>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Monitor your purchase orders, deliveries and business activity.
                        </p>
                    </div>

                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? 'animate-spin' : ''}
                        />
                        Refresh
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
                            <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                                {error}
                            </p>
                        </div>

                        <button
                            onClick={fetchOrders}
                            className="text-sm font-bold text-rose-700 dark:text-rose-300 hover:underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && orders.length === 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(item => (
                                <div
                                    key={item}
                                    className="h-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {[1, 2].map(item => (
                                <div
                                    key={item}
                                    className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                        Business Overview
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Your order performance at a glance
                                    </p>
                                </div>

                                <Activity size={19} className="text-slate-400" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                                <StatCard
                                    title="Pending Approval"
                                    value={pendingApproval}
                                    description="Waiting for admin approval"
                                    icon={Clock3}
                                    iconStyle="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                                    valueStyle="text-amber-600 dark:text-amber-400"
                                    onClick={() => navigateTo('orders')}
                                />

                                <StatCard
                                    title="Ready to Ship"
                                    value={readyToShip}
                                    description="Approved purchase orders"
                                    icon={Truck}
                                    iconStyle="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                    valueStyle="text-blue-600 dark:text-blue-400"
                                    onClick={() => navigateTo('orders')}
                                />

                                <StatCard
                                    title="Completed Deliveries"
                                    value={delivered}
                                    description="Orders marked as received"
                                    icon={PackageCheck}
                                    iconStyle="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    valueStyle="text-emerald-600 dark:text-emerald-400"
                                    onClick={() => navigateTo('order-history')}
                                />

                                <StatCard
                                    title="Delivered Value"
                                    value={formatCurrency(totalDeliveredValue)}
                                    description="Total value of received orders"
                                    icon={CircleDollarSign}
                                    iconStyle="bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                                    valueStyle="text-slate-900 dark:text-white"
                                    onClick={() => navigateTo('billing-payments')}
                                />

                            </div>
                        </section>

                        {/* Main Content */}
                        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                            {/* Ready to Ship */}
                            <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <Truck size={20} />
                                        </div>

                                        <div>
                                            <h2 className="font-bold text-slate-900 dark:text-white">
                                                Ready to Ship
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Approved orders awaiting fulfilment
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigateTo('orders')}
                                        className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    >
                                        View All
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                <div className="p-5 sm:p-6">

                                    {orders.filter(o => o.status === 'APPROVED').length > 0 ? (
                                        <div className="space-y-3">

                                            {orders
                                                .filter(o => o.status === 'APPROVED')
                                                .slice(0, 4)
                                                .map(order => (
                                                    <div
                                                        key={order.id}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-200 dark:hover:border-blue-900/60 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                                <Package size={19} />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                                    {order.orderNumber || 'Purchase Order'}
                                                                </p>

                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                        <Boxes size={12} />
                                                                        {order.items?.length || 0} items
                                                                    </span>

                                                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                        <CalendarDays size={12} />
                                                                        {formatDate(order.orderDate)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-4">
                                                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                                                {formatCurrency(order.totalAmount)}
                                                            </p>

                                                            <button
                                                                onClick={() => navigateTo('orders')}
                                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm shadow-blue-600/20"
                                                            >
                                                                Manage
                                                                <ArrowUpRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                <PackageCheck size={25} className="text-slate-400" />
                                            </div>

                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                                No orders ready to ship
                                            </h3>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                                Approved purchase orders will appear here when they are ready for fulfilment.
                                            </p>

                                            <button
                                                onClick={() => navigateTo('orders')}
                                                className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Explore Purchase Orders
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                            <ClipboardList size={20} />
                                        </div>

                                        <div>
                                            <h2 className="font-bold text-slate-900 dark:text-white">
                                                Order Summary
                                            </h2>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Overall order statistics
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 space-y-5">

                                    {/* Total Orders */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                                <ClipboardList size={17} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                Total Orders
                                            </span>
                                        </div>

                                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                                            {orders.length}
                                        </span>
                                    </div>

                                    {/* Total Items */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Boxes size={17} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                Order Line Items
                                            </span>
                                        </div>

                                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                                            {totalItems}
                                        </span>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-800" />

                                    {/* Progress */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                Delivery Progress
                                            </span>

                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                {orders.length
                                                    ? Math.round((delivered / orders.length) * 100)
                                                    : 0}%
                                            </span>
                                        </div>

                                        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                                style={{
                                                    width: `${orders.length
                                                        ? (delivered / orders.length) * 100
                                                        : 0}%`
                                                }}
                                            />
                                        </div>

                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            {delivered} of {orders.length} orders received
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => navigateTo('order-history')}
                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                                    >
                                        View Order History
                                        <ArrowUpRight size={15} />
                                    </button>

                                </div>
                            </div>

                        </section>

                        {/* Recent Activity */}
                        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <Activity size={20} />
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-slate-900 dark:text-white">
                                            Recent Order Activity
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            Latest updates on your purchase orders
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigateTo('orders')}
                                    className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    All Orders
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {recentOrders.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">

                                    {recentOrders.map(order => {
                                        const status = getStatusConfig(order.status);

                                        return (
                                            <div
                                                key={order.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                        <Package size={18} className="text-slate-500 dark:text-slate-400" />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                                            {order.orderNumber || 'Purchase Order'}
                                                        </p>

                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                            <CalendarDays size={12} />
                                                            {formatDate(order.orderDate)}
                                                            <span className="mx-1">·</span>
                                                            {order.items?.length || 0} items
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-4 pl-13 sm:pl-0">
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                        {formatCurrency(order.totalAmount)}
                                                    </span>

                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ring-1 ring-inset ${status.className}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <ClipboardList size={30} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />

                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        No order activity yet
                                    </p>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Your purchase orders will appear here.
                                    </p>
                                </div>
                            )}

                        </section>
                    </>
                )}

                {/* Footer */}
                <div className="flex items-center justify-center gap-2 pt-1 pb-2 text-xs text-slate-400 dark:text-slate-600">
                    <Activity size={13} />
                    <span>Supplier Portal · MediStock</span>
                </div>

            </div>
        </div>
    );
};