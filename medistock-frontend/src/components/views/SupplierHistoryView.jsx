
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    History, Search, Download, FileText, CheckCircle, XCircle,
    RefreshCw, Package, IndianRupee, CalendarDays, Filter,
    AlertCircle, ClipboardList, TrendingUp, RotateCcw
} from 'lucide-react';
import { adminService } from '../../services/adminService';

// Helpers
const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(date);
    return isNaN(parsed.getTime())
        ? '—'
        : parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
};

const escapeCSV = (value) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
};

// Status Badge
const StatusBadge = ({ status }) => {
    const received = status === 'RECEIVED';
    const rejected = status === 'REJECTED';

    const styles = received
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
        : rejected
            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600';

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide ${styles}`}>
            {received ? <CheckCircle size={13} /> :
                rejected ? <XCircle size={13} /> : <AlertCircle size={13} />}
            {status || 'UNKNOWN'}
        </span>
    );
};

// Summary Card
const SummaryCard = ({ title, value, subtitle, icon: Icon, gradient }) => (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-5 shadow-sm hover:shadow-md transition-all duration-300">
        <div className={`absolute -right-5 -top-5 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.10] blur-xl`} />

        <div className="relative flex items-start justify-between">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {title}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {value}
                </h3>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {subtitle}
                </p>
            </div>

            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                <Icon size={21} />
            </div>
        </div>
    </div>
);

// Loading Skeleton
const HistorySkeleton = () => (
    <div className="space-y-3 p-5">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse" />
        ))}
    </div>
);

export const SupplierHistoryView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const data = await adminService.getSupplierHistory();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Supplier history error:', err);
            setError(err?.message || 'Unable to load order history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filtered = useMemo(() => {
        return orders.filter(order => {
            const orderNumber = String(order.orderNumber || '').toLowerCase();
            const matchesSearch = orderNumber.includes(search.trim().toLowerCase());
            const matchesFilter = filter === 'ALL' || order.status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [orders, search, filter]);

    const stats = useMemo(() => ({
        total: orders.length,
        received: orders.filter(o => o.status === 'RECEIVED').length,
        rejected: orders.filter(o => o.status === 'REJECTED').length,
        totalValue: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    }), [orders]);

    const handleExportCSV = () => {
        if (!filtered.length) return;

        const headers = [
            'PO Number',
            'Order Date',
            'Status',
            'Total Amount',
            'Items'
        ];

        const rows = filtered.map(order => [
            order.orderNumber || '',
            formatDate(order.orderDate),
            order.status || '',
            Number(order.totalAmount || 0).toFixed(2),
            order.items?.length || 0
        ]);

        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\r\n');

        // BOM helps Excel display CSV correctly
        const blob = new Blob(['\uFEFF' + csvContent], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `Supplier_History_${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const filters = [
        { value: 'ALL', label: 'All Orders', count: stats.total },
        { value: 'RECEIVED', label: 'Delivered', count: stats.received },
        { value: 'REJECTED', label: 'Rejected', count: stats.rejected }
    ];

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-blue-500 to-violet-500 p-6 sm:p-8 shadow-lg shadow-blue-900/10">
                    <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute right-32 -bottom-24 h-48 w-48 rounded-full bg-violet-300/20 blur-2xl" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-white/15 border border-white/20 text-white">
                                    <History size={25} />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs font-semibold uppercase tracking-[0.18em]">
                                        Supplier Portal
                                    </p>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                        Order History
                                    </h1>
                                </div>
                            </div>

                            <p className="text-blue-100/90 text-sm mt-4 max-w-xl">
                                Track your completed and rejected purchase orders in one place.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={fetchHistory}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>

                            <button
                                onClick={handleExportCSV}
                                disabled={!filtered.length}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <SummaryCard
                        title="Total Orders"
                        value={stats.total}
                        subtitle="All historical orders"
                        icon={ClipboardList}
                        gradient="from-blue-500 to-indigo-600"
                    />
                    <SummaryCard
                        title="Delivered Orders"
                        value={stats.received}
                        subtitle="Successfully received"
                        icon={CheckCircle}
                        gradient="from-emerald-500 to-teal-600"
                    />
                    <SummaryCard
                        title="Rejected Orders"
                        value={stats.rejected}
                        subtitle="Orders not accepted"
                        icon={XCircle}
                        gradient="from-rose-500 to-pink-600"
                    />
                    <SummaryCard
                        title="Total Order Value"
                        value={formatCurrency(stats.totalValue)}
                        subtitle="Historical PO value"
                        icon={IndianRupee}
                        gradient="from-violet-500 to-purple-600"
                    />
                </div>

                {/* Main Content */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                    Purchase Order Records
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    View and export your order records.
                                </p>
                            </div>

                            <div className="relative w-full lg:max-w-sm">
                                <Search
                                    size={17}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Search by PO number..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />

                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                        aria-label="Clear search"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
                                <Filter size={14} />
                                FILTER:
                            </span>

                            {filters.map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => setFilter(item.value)}
                                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        filter === item.value
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {item.label}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                        filter === item.value
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                    }`}>
                                        {item.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error State */}
                    {error && !loading && (
                        <div className="m-5 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="text-rose-500 shrink-0" size={20} />
                                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                            </div>
                            <button
                                onClick={fetchHistory}
                                className="text-sm font-bold text-rose-600 dark:text-rose-400 hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                    <th className="px-6 py-4 font-bold">Purchase Order</th>
                                    <th className="px-6 py-4 font-bold">Order Date</th>
                                    <th className="px-6 py-4 font-bold">Items</th>
                                    <th className="px-6 py-4 font-bold">Total Amount</th>
                                    <th className="px-6 py-4 font-bold">Order Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5">
                                            <HistorySkeleton />
                                        </td>
                                    </tr>
                                ) : error ? null : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 mb-4">
                                                    <FileText size={30} className="text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                                                    No orders found
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    {search || filter !== 'ALL'
                                                        ? 'Try changing your search or filters.'
                                                        : 'Your completed order history will appear here.'}
                                                </p>

                                                {(search || filter !== 'ALL') && (
                                                    <button
                                                        onClick={() => {
                                                            setSearch('');
                                                            setFilter('ALL');
                                                        }}
                                                        className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(order => (
                                        <tr
                                            key={order.id}
                                            className="group hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                        <Package size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">
                                                            {order.orderNumber || '—'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            Purchase Order
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <CalendarDays size={15} className="text-slate-400" />
                                                    {formatDate(order.orderDate)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    <Package size={15} className="text-slate-400" />
                                                    {order.items?.length || 0}
                                                    <span className="font-normal text-slate-400">medicines</span>
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                    {formatCurrency(order.totalAmount)}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {!loading && !error && filtered.length > 0 && (
                        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length}</span> of{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{orders.length}</span> orders
                            </p>
                            <p className="text-[11px] text-slate-400">
                                Historical purchase order records
                            </p>
                        </div>
                    )}
                </div>

                {/* Information Note */}
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-500/5">
                    <TrendingUp size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                        <span className="font-bold">Note:</span> Total Order Value represents the historical purchase order amount. It does not necessarily represent payments received or outstanding balances.
                    </p>
                </div>
            </div>
        </div>
    );
};
