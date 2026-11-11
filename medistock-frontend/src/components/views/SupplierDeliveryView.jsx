
import React, { useState, useEffect, useMemo } from 'react';
import {
    Truck,
    Package,
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    CalendarDays,
    IndianRupee,
    PackageCheck,
    ClipboardList,
    AlertCircle,
    X
} from 'lucide-react';
import { adminService } from '../../services/adminService';

const formatCurrency = (amount = 0) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = (date) => {
    if (!date) return '—';

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
        ? '—'
        : parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
};

const DeliveryStatus = ({ status }) => {
    const isApproved = status === 'APPROVED';
    const isReceived = status === 'RECEIVED';

    const style = isApproved
        ? 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
        : isReceived
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
            : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';

    const label = isApproved
        ? 'Ready to Dispatch'
        : isReceived
            ? 'Received'
            : status || 'Pending';

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${style}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
        </span>
    );
};

const SummaryCard = ({ title, value, subtitle, icon: Icon, color, loading }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {title}
                    </p>

                    {loading ? (
                        <div className="h-8 w-16 mt-3 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ) : (
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                            {value}
                        </h3>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {subtitle}
                    </p>
                </div>

                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
};

const DeliveryCard = ({ order }) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const visibleItems = items.slice(0, 4);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200">

            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <Truck size={21} />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                            Purchase Order
                        </p>
                        <h3 className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                            {order.orderNumber || '—'}
                        </h3>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <CalendarDays size={13} />
                            {formatDate(order.orderDate)}
                        </p>
                    </div>
                </div>

                <DeliveryStatus status={order.status} />
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Package size={14} />
                        Total Items
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {items.length}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <IndianRupee size={14} />
                        Order Value
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {formatCurrency(order.totalAmount)}
                    </p>
                </div>
            </div>

            {/* Medicine List */}
            <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <ClipboardList size={15} />
                        Medicine Details
                    </h4>

                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {items.length} products
                    </span>
                </div>

                {items.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-3">
                        No medicine details available.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {visibleItems.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                                        <PackageCheck size={14} />
                                    </div>

                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                        {item.medicineName || 'Medicine'}
                                    </span>
                                </div>

                                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                    × {item.quantity ?? 0}
                                </span>
                            </div>
                        ))}

                        {items.length > 4 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold pt-1">
                                +{items.length - 4} more medicines
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {order.status === 'APPROVED' ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                        <Clock size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
                                Ready for Dispatch
                            </p>
                            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                                This order is approved. Prepare the medicines and coordinate dispatch.
                            </p>
                        </div>
                    </div>
                ) : order.status === 'RECEIVED' ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                        <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Delivery receipt confirmed
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                        <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Awaiting order processing
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const SupplierDeliveryView = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await adminService.getSupplierDeliveries();
            setDeliveries(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load deliveries:', err);
            setError('Unable to load delivery information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const approvedCount = deliveries.filter(o => o.status === 'APPROVED').length;
    const receivedCount = deliveries.filter(o => o.status === 'RECEIVED').length;

    const filtered = useMemo(() => {
        return deliveries.filter(order => {
            const orderNumber = String(order.orderNumber || '').toLowerCase();
            const searchValue = search.toLowerCase().trim();

            const matchesSearch = orderNumber.includes(searchValue);

            const matchesStatus =
                filterStatus === 'ALL' || order.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [deliveries, search, filterStatus]);

    const filters = [
        { label: 'All Deliveries', value: 'ALL', count: deliveries.length },
        { label: 'Ready to Dispatch', value: 'APPROVED', count: approvedCount },
        { label: 'Received', value: 'RECEIVED', count: receivedCount }
    ];

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Truck size={23} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Deliveries
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Manage approved orders and track delivery status.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchDeliveries}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-500/10">
                        <div className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-400">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                        <button
                            onClick={fetchDeliveries}
                            className="text-sm font-bold text-rose-700 dark:text-rose-400 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SummaryCard
                        title="Total Deliveries"
                        value={deliveries.length}
                        subtitle="All delivery records"
                        icon={Package}
                        color="blue"
                        loading={loading}
                    />

                    <SummaryCard
                        title="Ready to Dispatch"
                        value={approvedCount}
                        subtitle="Approved by Admin"
                        icon={Truck}
                        color="amber"
                        loading={loading}
                    />

                    <SummaryCard
                        title="Received Orders"
                        value={receivedCount}
                        subtitle="Receipt confirmed"
                        icon={CheckCircle}
                        color="emerald"
                        loading={loading}
                    />
                </div>

                {/* Delivery List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Search and Filters */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Delivery Overview
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Review medicines and purchase order details.
                                </p>
                            </div>

                            <div className="relative w-full lg:w-72">
                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search PO number..."
                                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                />

                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 mt-5 overflow-x-auto pb-1">
                            {filters.map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => setFilterStatus(filter.value)}
                                    className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                        filterStatus === filter.value
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {filter.label}

                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                        filterStatus === filter.value
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                    }`}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="p-5 sm:p-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Truck size={28} />
                                </div>

                                <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-white">
                                    {deliveries.length === 0
                                        ? 'No delivery records yet'
                                        : 'No matching deliveries'}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {deliveries.length === 0
                                        ? 'Approved purchase orders will appear here.'
                                        : 'Try another search or status filter.'}
                                </p>

                                {(search || filterStatus !== 'ALL') && (
                                    <button
                                        onClick={() => {
                                            setSearch('');
                                            setFilterStatus('ALL');
                                        }}
                                        className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {filtered.map((order, index) => (
                                    <DeliveryCard
                                        key={order.id ?? `${order.orderNumber}-${index}`}
                                        order={order}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length}</span> of{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{deliveries.length}</span> delivery records
                            </p>
                        </div>
                    )}
                </div>

                {/* Workflow Note */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-500/5">
                    <PackageCheck size={19} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                            Delivery verification
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                            After dispatch, the pharmacy team verifies the received quantity,
                            batch number and expiry details before confirming receipt and updating inventory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
