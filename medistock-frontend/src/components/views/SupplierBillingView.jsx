
import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
    Wallet,
    TrendingUp,
    Clock,
    FileText,
    Download,
    DollarSign,
    Search,
    RefreshCw,
    PackageCheck,
    Receipt,
    ArrowUpRight,
    CircleAlert,
    CalendarDays,
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

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
        ? '—'
        : parsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
};

const statusConfig = {
    RECEIVED: {
        label: 'Delivered',
        style: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
    },
    APPROVED: {
        label: 'Approved',
        style: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
    },
    REJECTED: {
        label: 'Rejected',
        style: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'
    }
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || {
        label: status || 'Pending',
        style: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${config.style}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
        </span>
    );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, loading }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {title}
                    </p>

                    {loading ? (
                        <div className="h-8 w-32 mt-3 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ) : (
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                            {value}
                        </h3>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {subtitle}
                    </p>
                </div>

                <div className={`p-3 rounded-xl shrink-0 ${colors[color]}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
};

export const SupplierBillingView = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError('');

            const [deliveries, history] = await Promise.all([
                adminService.getSupplierDeliveries(),
                adminService.getSupplierHistory()
            ]);

            setOrders([
                ...(Array.isArray(deliveries) ? deliveries : []),
                ...(Array.isArray(history) ? history : [])
            ]);
        } catch (err) {
            console.error('Failed to load supplier billing data:', err);
            setError('Unable to load billing data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Financial summary
    const completedOrders = orders.filter(o => o.status === 'RECEIVED');
    const pendingOrders = orders.filter(o => o.status === 'APPROVED');
    const rejectedOrders = orders.filter(o => o.status === 'REJECTED');

    const totalRevenue = completedOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0), 0
    );

    const pendingRevenue = pendingOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || 0), 0
    );

    const avgOrderValue = completedOrders.length
        ? totalRevenue / completedOrders.length
        : 0;

    // Search and filter
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const orderNumber = String(order.orderNumber || '').toLowerCase();
            const searchValue = search.toLowerCase().trim();

            const matchesSearch =
                orderNumber.includes(searchValue) ||
                `inv-${orderNumber}`.includes(searchValue);

            const matchesStatus =
                filterStatus === 'ALL' || order.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [orders, search, filterStatus]);

    // Download order summary

const handleDownloadInvoice = (order) => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const items = Array.isArray(order.items) ? order.items : [];

    const primary = [79, 70, 229];
    const dark = [30, 41, 59];
    const muted = [100, 116, 139];
    const light = [241, 245, 249];

    const money = (amount) =>
        `Rs. ${Number(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    // Header background
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 48, 'F');

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(23);
    doc.text('MEDISTOCK', margin, 21);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('MEDICAL INVENTORY MANAGEMENT PLATFORM', margin, 29);

    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, 21, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('ORDER SUMMARY', pageWidth - margin, 29, { align: 'right' });

    // Invoice details
    let y = 62;

    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE DETAILS', margin, y);

    y += 9;

    doc.setFillColor(...light);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');

    doc.text('Invoice Reference', margin + 7, y + 10);
    doc.text('Order Number', margin + 7, y + 23);

    doc.text('Order Date', pageWidth / 2 + 5, y + 10);
    doc.text('Order Status', pageWidth / 2 + 5, y + 23);

    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');

    doc.text(`INV-${order.orderNumber || order.id}`, margin + 43, y + 10);
    doc.text(`PO-${order.orderNumber || '—'}`, margin + 43, y + 23);

    doc.text(formatDate(order.orderDate), pageWidth / 2 + 35, y + 10);
    doc.text(order.status || '—', pageWidth / 2 + 35, y + 23);

    // Items section
    y += 49;

    doc.setFontSize(10);
    doc.text('ORDER ITEMS', margin, y);

    y += 8;

    // Table header
    doc.setFillColor(...primary);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 11, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.text('ITEM DESCRIPTION', margin + 4, y + 7);
    doc.text('QTY', 112, y + 7, { align: 'center' });
    doc.text('UNIT PRICE', 145, y + 7, { align: 'right' });
    doc.text('AMOUNT', pageWidth - margin - 4, y + 7, { align: 'right' });

    y += 11;

    // Item rows
    items.forEach((item, index) => {
        if (y > 245) {
            doc.addPage();
            y = 25;
        }

        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const amount = quantity * unitPrice;

        if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y, pageWidth - margin * 2, 12, 'F');
        }

        doc.setTextColor(...dark);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        const medicineName = doc.splitTextToSize(
            String(item.medicineName || 'Medicine'),
            72
        );

        doc.text(medicineName[0], margin + 4, y + 7);
        doc.text(String(quantity), 112, y + 7, { align: 'center' });
        doc.text(money(unitPrice), 145, y + 7, { align: 'right' });
        doc.text(money(amount), pageWidth - margin - 4, y + 7, { align: 'right' });

        y += 12;
    });

    if (y > 250) {
        doc.addPage();
        y = 25;
    }

    // Total section
    y += 10;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);

    y += 12;

    doc.setTextColor(...muted);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Order Value', pageWidth - margin - 65, y);

    doc.setTextColor(...primary);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    doc.text(
        money(order.totalAmount),
        pageWidth - margin,
        y + 1,
        { align: 'right' }
    );

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    doc.setTextColor(...muted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    doc.text(
        'Thank you for your business!',
        pageWidth / 2,
        pageHeight - 17,
        { align: 'center' }
    );

    doc.setFontSize(7);
    doc.text(
        'Generated by MediStock | This document is an order summary, not a tax invoice or payment receipt.',
        pageWidth / 2,
        pageHeight - 11,
        { align: 'center' }
    );

    // Download PDF
    doc.save(`MediStock_Invoice_${order.orderNumber || order.id}.pdf`);
};


      


    const filterOptions = [
        { label: 'All Orders', value: 'ALL', count: orders.length },
        { label: 'Delivered', value: 'RECEIVED', count: completedOrders.length },
        { label: 'Approved', value: 'APPROVED', count: pendingOrders.length },
        { label: 'Rejected', value: 'REJECTED', count: rejectedOrders.length }
    ];

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Wallet size={22} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Billing & Payments
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    Track order values and access order summaries.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={fetchOrders}
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
                            <CircleAlert size={18} />
                            {error}
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="text-sm font-bold text-rose-700 dark:text-rose-400 hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Financial Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <StatCard
                        title="Delivered Order Value"
                        value={formatCurrency(totalRevenue)}
                        subtitle={`${completedOrders.length} completed deliveries`}
                        icon={TrendingUp}
                        color="emerald"
                        loading={loading}
                    />

                    <StatCard
                        title="Approved Order Value"
                        value={formatCurrency(pendingRevenue)}
                        subtitle={`${pendingOrders.length} approved orders`}
                        icon={Clock}
                        color="amber"
                        loading={loading}
                    />

                    <StatCard
                        title="Average Order Value"
                        value={formatCurrency(avgOrderValue)}
                        subtitle="Per completed order"
                        icon={DollarSign}
                        color="purple"
                        loading={loading}
                    />
                </div>

                {/* Information note */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-500/5">
                    <Receipt size={19} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                            Order value overview
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                            These amounts represent purchase order values based on order status.
                            They do not indicate payments received. Payment status will be shown
                            separately when payment records are available.
                        </p>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                    {/* Table Header */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText size={19} className="text-purple-500" />
                                    Order Statements
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    View order details and download summaries.
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
                                    placeholder="Search order number..."
                                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
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
                            {filterOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterStatus(option.value)}
                                    className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                                        filterStatus === option.value
                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {option.label}
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                                        filterStatus === option.value
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                                    }`}>
                                        {option.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/70 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="px-6 py-4 font-bold">Order / Invoice Ref.</th>
                                    <th className="px-6 py-4 font-bold">Order Date</th>
                                    <th className="px-6 py-4 font-bold">Items</th>
                                    <th className="px-6 py-4 font-bold">Order Value</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <tr key={index}>
                                            {Array.from({ length: 6 }).map((__, cell) => (
                                                <td key={cell} className="px-6 py-5">
                                                    <div className="h-4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-24" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <FileText size={25} />
                                            </div>

                                            <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-white">
                                                {orders.length === 0
                                                    ? 'No order records yet'
                                                    : 'No matching orders found'}
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {orders.length === 0
                                                    ? 'Your order statements will appear here.'
                                                    : 'Try changing your search or status filter.'}
                                            </p>

                                            {(search || filterStatus !== 'ALL') && (
                                                <button
                                                    onClick={() => {
                                                        setSearch('');
                                                        setFilterStatus('ALL');
                                                    }}
                                                    className="mt-4 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order, index) => (
                                        <tr
                                            key={order.id ?? `${order.orderNumber}-${index}`}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    PO-{order.orderNumber || '—'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                                                    INV-{order.orderNumber || '—'}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <CalendarDays size={14} className="text-slate-400" />
                                                    {formatDate(order.orderDate)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <PackageCheck size={15} className="text-slate-400" />
                                                    {Array.isArray(order.items) ? order.items.length : 0} Items
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                    {formatCurrency(order.totalAmount)}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDownloadInvoice(order)}
                                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-purple-300 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                                                >
                                                    <Download size={14} />
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {!loading && filteredOrders.length > 0 && (
                        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredOrders.length}</span> of{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-200">{orders.length}</span> orders
                            </p>

                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                Amounts displayed in INR (₹)
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom note */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <ArrowUpRight size={13} />
                    Downloaded documents are order summaries, not official tax invoices.
                </div>
            </div>
        </div>
    );
};
