import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import {
    Search,
    RefreshCw,
    FileText,
    Receipt,
    IndianRupee,
    ShoppingBag,
    CreditCard,
    Banknote,
    Smartphone,
    CalendarDays,
    X,
    ArrowUpRight,
    TrendingUp,
    Clock,
    UserRound,
    Filter,
    ChevronDown
} from 'lucide-react';

export const SalesHistoryView = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('ALL');

    const fetchSales = async () => {
        try {
            setLoading(true);
            const data = await adminService.getSalesHistory();

            if (Array.isArray(data)) {
                setSales(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    // Preserve the existing search behavior and searchable fields.
    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const term = search.toLowerCase().trim();

            const matchesSearch =
                s.invoiceNumber?.toLowerCase().includes(term) ||
                s.customerName?.toLowerCase().includes(term) ||
                s.customerPhone?.toLowerCase().includes(term);

            const matchesPayment =
                paymentFilter === 'ALL' ||
                s.paymentMethod === paymentFilter;

            return (!term || matchesSearch) && matchesPayment;
        });
    }, [sales, search, paymentFilter]);

    // Summary figures are calculated from the existing sales data.
    const summary = useMemo(() => {
        const totalRevenue = sales.reduce(
            (sum, sale) => sum + (Number(sale.grandTotal) || 0),
            0
        );

        const totalDiscount = sales.reduce(
            (sum, sale) => sum + (Number(sale.discountAmount) || 0),
            0
        );

        const averageSale = sales.length
            ? totalRevenue / sales.length
            : 0;

        return {
            totalRevenue,
            totalDiscount,
            totalTransactions: sales.length,
            averageSale
        };
    }, [sales]);

    const formatCurrency = (amount) =>
        `₹${(Number(amount) || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const formatDate = (date) => {
        if (!date) return 'Date unavailable';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Date unavailable';
        }

        return parsedDate.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const paymentStyles = (method) => {
        switch (method) {
            case 'CASH':
                return {
                    badge: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
                    icon: Banknote
                };
            case 'UPI':
                return {
                    badge: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/20',
                    icon: Smartphone
                };
            default:
                return {
                    badge: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20',
                    icon: CreditCard
                };
        }
    };

    const paymentMethods = useMemo(() => {
        return [...new Set(sales.map(s => s.paymentMethod).filter(Boolean))];
    }, [sales]);

    const clearFilters = () => {
        setSearch('');
        setPaymentFilter('ALL');
    };

    return (
        <div className="min-h-screen space-y-6 bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-[#080d1b] dark:text-slate-100 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111a2d] sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 right-1/3 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                            <Receipt size={24} />
                        </div>
                        <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    Sales History
                                </h1>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                    Transactions
                                </span>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Review completed sales, customer details, payment methods, and invoice records.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={fetchSales}
                        disabled={loading}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-700"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Refreshing...' : 'Refresh records'}
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Revenue"
                    value={formatCurrency(summary.totalRevenue)}
                    subtitle="Across all loaded sales"
                    icon={IndianRupee}
                    iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
                    accent="from-emerald-500/10"
                />

                <SummaryCard
                    title="Transactions"
                    value={summary.totalTransactions.toLocaleString('en-IN')}
                    subtitle="Total recorded sales"
                    icon={ShoppingBag}
                    iconClass="bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300"
                    accent="from-blue-500/10"
                />

                <SummaryCard
                    title="Average Sale"
                    value={formatCurrency(summary.averageSale)}
                    subtitle="Revenue per transaction"
                    icon={TrendingUp}
                    iconClass="bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300"
                    accent="from-violet-500/10"
                />

                <SummaryCard
                    title="Discounts Given"
                    value={formatCurrency(summary.totalDiscount)}
                    subtitle="Combined recorded discounts"
                    icon={ArrowUpRight}
                    iconClass="bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
                    accent="from-amber-500/10"
                />
            </div>

            {/* Search and filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2d] sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Transaction records
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Search invoices or narrow results by payment method.
                        </p>
                    </div>

                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {loading ? 'Loading...' : `${filteredSales.length} of ${sales.length} records`}
                    </span>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search invoice number, customer name, or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-900"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                title="Clear search"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    <div className="relative lg:w-60">
                        <Filter
                            size={16}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                            value={paymentFilter}
                            onChange={e => setPaymentFilter(e.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="ALL">All payment methods</option>
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {(search || paymentFilter !== 'ALL') && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <X size={15} />
                            Clear filters
                        </button>
                    )}
                </div>
            </div>

            {/* Transactions table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111a2d]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Completed transactions
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Invoice and payment summary
                            </p>
                        </div>
                    </div>
                    <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-400 sm:flex">
                        <Clock size={13} />
                        Latest available records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4">Invoice</th>
                                <th className="px-5 py-4">Date & time</th>
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4">Sold by</th>
                                <th className="px-5 py-4">Payment</th>
                                <th className="px-5 py-4 text-right">Total paid</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        {Array.from({ length: 6 }).map((__, cell) => (
                                            <td key={cell} className="px-5 py-5">
                                                <div className="h-4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                            {search || paymentFilter !== 'ALL' ? (
                                                <Search size={24} />
                                            ) : (
                                                <Receipt size={24} />
                                            )}
                                        </div>
                                        <h4 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {search || paymentFilter !== 'ALL'
                                                ? 'No matching transactions'
                                                : 'No sales recorded yet'}
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {search || paymentFilter !== 'ALL'
                                                ? 'Try a different search term or clear your filters.'
                                                : 'Completed sales will appear here.'}
                                        </p>
                                        {(search || paymentFilter !== 'ALL') && (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map(sale => {
                                    const payment = paymentStyles(sale.paymentMethod);
                                    const PaymentIcon = payment.icon;

                                    return (
                                        <tr
                                            key={sale.id}
                                            className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-400/[0.04]"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-blue-700 dark:text-blue-300">
                                                            {sale.invoiceNumber || '—'}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                                            Invoice
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-2">
                                                    <CalendarDays size={15} className="mt-0.5 shrink-0 text-slate-400" />
                                                    <span className="whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-300">
                                                        {formatDate(sale.saleDate)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                        <UserRound size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {sale.customerName || 'Walk-in Customer'}
                                                        </p>
                                                        {sale.customerPhone && (
                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                {sale.customerPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <UserRound size={13} />
                                                    Admin
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 ring-inset ${payment.badge}`}>
                                                    <PaymentIcon size={13} />
                                                    {sale.paymentMethod || 'OTHER'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <p className="whitespace-nowrap text-base font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(sale.grandTotal)}
                                                </p>
                                                {Number(sale.discountAmount) > 0 && (
                                                    <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-slate-400">
                                                        Discount: −{formatCurrency(sale.discountAmount)}
                                                    </p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredSales.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredSales.length}</span> transaction{filteredSales.length === 1 ? '' : 's'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Filtered sales total:{' '}
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(
                                    filteredSales.reduce(
                                        (sum, sale) => sum + (Number(sale.grandTotal) || 0),
                                        0
                                    )
                                )}
                            </span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, subtitle, icon: Icon, iconClass, accent }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-[#111a2d]">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} to-transparent opacity-70`} />

        <div className="relative flex items-start justify-between gap-3">
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {title}
                </p>
                <p className="mt-3 break-words text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {value}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {subtitle}
                </p>
            </div>

            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconClass}`}>
                <Icon size={21} />
            </div>
        </div>
    </div>
);
