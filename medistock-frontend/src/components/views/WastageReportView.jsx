
import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    Trash2,
    TrendingDown,
    IndianRupee,
    Package,
    PieChart as PieIcon,
    BarChart3,
    RefreshCw,
    Flag,
    CheckCircle,
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { adminService } from '../../services/adminService';

const REASON_COLORS = {
    EXPIRED: '#ef4444',
    DAMAGED: '#f59e0b',
    RECALLED: '#8b5cf6',
    CONTAMINATED: '#ec4899',
};

export const WastageReportView = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await adminService.getWastageReport();
            setReport(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load wastage report: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleFlag = async (id, reason) => {
        const input = window.prompt(
            "Reason (EXPIRED / DAMAGED / RECALLED / CONTAMINATED):",
            reason || "DAMAGED"
        );
        if (!input) return;
        const upper = input.trim().toUpperCase();
        if (!["EXPIRED", "DAMAGED", "RECALLED", "CONTAMINATED"].includes(upper)) {
            alert("Invalid reason. Use EXPIRED, DAMAGED, RECALLED or CONTAMINATED.");
            return;
        }
        setBusy(true);
        try {
            await adminService.flagWastage(id, upper);
            await fetchReport();
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleUnflag = async (id) => {
        if (!window.confirm("Remove the wastage flag from this item?")) return;
        setBusy(true);
        try {
            await adminService.unflagWastage(id);
            await fetchReport();
        } catch (err) {
            alert("Failed: " + err.message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center gap-4 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    <RefreshCw size={25} className="animate-spin" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                        Loading wastage report
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        Preparing your inventory loss overview...
                    </p>
                </div>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-rose-500" />
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    <AlertTriangle size={30} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800 dark:text-white">
                    Unable to load report
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Something went wrong while retrieving wastage data.
                </p>
                <button
                    onClick={fetchReport}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
                >
                    <RefreshCw size={14} />
                    Try Again
                </button>
            </div>
        );
    }

    const pieData = report.lossByReason || [];
    const barData = report.monthlyTrend || [];
    const items = report.items || [];

    const statCards = [
        {
            title: 'Total Loss',
            value: `₹${report.totalLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            description: 'From expired + flagged items',
            icon: IndianRupee,
            color: 'rose',
        },
        {
            title: 'Expired Batches',
            value: report.expiredCount,
            description: 'Already past expiry date',
            icon: Package,
            color: 'amber',
        },
        {
            title: 'Flagged Wasted',
            value: report.damagedCount,
            description: 'Manually reported by staff',
            icon: Flag,
            color: 'purple',
        },
        {
            title: 'At-Risk Value',
            value: `₹${report.nearExpiryRisk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            description: `${report.nearExpiryCount} items expiring in 45 days`,
            icon: TrendingDown,
            color: 'blue',
        },
    ];

    const statStyles = {
        rose: {
            surface: 'bg-rose-50 dark:bg-rose-500/10',
            icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
            label: 'text-rose-700 dark:text-rose-300',
            value: 'text-rose-700 dark:text-rose-300',
            glow: 'bg-rose-500',
        },
        amber: {
            surface: 'bg-amber-50 dark:bg-amber-500/10',
            icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
            label: 'text-amber-700 dark:text-amber-300',
            value: 'text-amber-700 dark:text-amber-300',
            glow: 'bg-amber-500',
        },
        purple: {
            surface: 'bg-purple-50 dark:bg-purple-500/10',
            icon: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
            label: 'text-purple-700 dark:text-purple-300',
            value: 'text-purple-700 dark:text-purple-300',
            glow: 'bg-purple-500',
        },
        blue: {
            surface: 'bg-blue-50 dark:bg-blue-500/10',
            icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
            label: 'text-blue-700 dark:text-blue-300',
            value: 'text-blue-700 dark:text-blue-300',
            glow: 'bg-blue-500',
        },
    };

    const getReasonStyle = (reason) => {
        const color = REASON_COLORS[reason] || '#64748b';

        return {
            backgroundColor: `${color}18`,
            color,
            borderColor: `${color}45`,
        };
    };

    return (
        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-7">

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-rose-50 p-5 shadow-sm dark:border-slate-700/70 dark:from-[#111c32] dark:via-[#111b30] dark:to-[#321d30] sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-rose-400/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-sm dark:bg-rose-500/15 dark:text-rose-300 sm:h-14 sm:w-14">
                            <AlertTriangle size={27} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                    Wastage Report
                                </h1>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                    Loss Monitoring
                                </span>
                            </div>

                            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                                Track expired, damaged and lost inventory — understand the financial impact on your stock.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchReport}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 sm:self-center"
                    >
                        <RefreshCw size={15} />
                        Refresh Report
                    </button>
                </div>

                <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200/80 pt-4 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                        <IndianRupee size={14} className="text-rose-500" />
                        Financial loss tracking
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Package size={14} className="text-amber-500" />
                        Inventory monitoring
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Flag size={14} className="text-purple-500" />
                        Wastage classification
                    </span>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    const styles = statStyles[stat.color];

                    return (
                        <div
                            key={stat.title}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/70 sm:p-5"
                        >
                            <div className={`absolute -right-5 -top-5 h-24 w-24 rounded-full opacity-[0.07] blur-2xl transition-transform duration-500 group-hover:scale-150 ${styles.glow}`} />

                            <div className="relative flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={`text-[11px] font-bold uppercase tracking-wider ${styles.label}`}>
                                        {stat.title}
                                    </p>
                                    <h3 className={`mt-2 break-words text-2xl font-black tracking-tight ${styles.value} sm:text-3xl`}>
                                        {stat.value}
                                    </h3>
                                    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                                        {stat.description}
                                    </p>
                                </div>

                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                {/* Pie Chart */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                            <PieIcon size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Loss Distribution
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                Financial loss by wastage reason
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        {pieData.length === 0 ? (
                            <div className="flex h-72 flex-col items-center justify-center text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <CheckCircle size={27} />
                                </div>
                                <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                    No wastage recorded
                                </p>
                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    Good news! No losses to display.
                                </p>
                            </div>
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="loss"
                                            nameKey="reason"
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={58}
                                            outerRadius={94}
                                            paddingAngle={3}
                                            label={({ reason, loss }) => `${reason}: ₹${loss.toLocaleString()}`}
                                        >
                                            {pieData.map((entry, idx) => (
                                                <Cell
                                                    key={idx}
                                                    fill={REASON_COLORS[entry.reason] || '#94a3b8'}
                                                    stroke="transparent"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 8px 25px rgba(15,23,42,0.10)',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{
                                                fontSize: '11px',
                                                paddingTop: '8px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
                            <BarChart3 size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Wastage Trend
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                Monthly financial loss · Last 6 months
                            </p>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={barData}
                                    margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
                                >
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={55}
                                    />
                                    <Tooltip
                                        formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 8px 25px rgba(15,23,42,0.10)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <Bar
                                        dataKey="loss"
                                        fill="#8b5cf6"
                                        radius={[7, 7, 0, 0]}
                                        maxBarSize={48}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wastage Items */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">

                {/* Table Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                            <Trash2 size={19} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                Wastage Items
                            </h3>
                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                Expired or manually flagged inventory
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                        <Package size={13} />
                        {items.length} items
                    </span>
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[1050px] text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
                                {[
                                    'Medicine',
                                    'Batch',
                                    'Qty',
                                    'Unit Price',
                                    'Loss (₹)',
                                    'Expiry',
                                    'Reason',
                                    'Actions',
                                ].map((heading, index) => (
                                    <th
                                        key={heading}
                                        className={`px-4 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${[2, 3, 4, 7].includes(index) ? 'text-right' : ''}`}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                            <CheckCircle size={29} />
                                        </div>
                                        <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                            No wastage recorded
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                            All stock is within expiry and healthy.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                items.map(item => (
                                    <tr
                                        key={item.id}
                                        className="group transition-colors hover:bg-rose-50/30 dark:hover:bg-rose-500/[0.035]"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="max-w-[190px] truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={item.name}>
                                                {item.name}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                {item.batchNumber}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                            {item.quantity}
                                        </td>

                                        <td className="px-4 py-4 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
                                            ₹{item.unitPrice?.toFixed(2)}
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <span className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">
                                                ₹{item.totalLoss.toLocaleString('en-IN')}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                                            {item.expiryDate || '—'}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className="inline-flex rounded-lg border px-2.5 py-1.5 text-[10px] font-bold"
                                                style={getReasonStyle(item.reason)}
                                            >
                                                {item.reason}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end">
                                                {item.flagged ? (
                                                    <button
                                                        onClick={() => handleUnflag(item.id)}
                                                        disabled={busy}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                    >
                                                        <Trash2 size={12} />
                                                        Remove Flag
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleFlag(item.id, item.reason)}
                                                        disabled={busy}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                                                    >
                                                        <Flag size={12} />
                                                        Flag
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

                {/* Mobile / Tablet Cards */}
                <div className="space-y-3 bg-slate-50/50 p-3 dark:bg-slate-950/20 lg:hidden">
                    {items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                            <CheckCircle size={30} className="mx-auto text-emerald-500" />
                            <p className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                No wastage recorded
                            </p>
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                All stock is within expiry and healthy.
                            </p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div
                                key={item.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h4 className="break-words text-sm font-bold text-slate-900 dark:text-white">
                                            {item.name}
                                        </h4>
                                        <p className="mt-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                            Batch: {item.batchNumber}
                                        </p>
                                    </div>

                                    <span
                                        className="shrink-0 rounded-lg border px-2 py-1 text-[9px] font-bold"
                                        style={getReasonStyle(item.reason)}
                                    >
                                        {item.reason}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Quantity
                                        </p>
                                        <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                                            {item.quantity}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Unit Price
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            ₹{item.unitPrice?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Expiry
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {item.expiryDate || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Total Loss
                                        </p>
                                        <p className="mt-1 text-sm font-black text-rose-600 dark:text-rose-400">
                                            ₹{item.totalLoss.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex justify-end">
                                    {item.flagged ? (
                                        <button
                                            onClick={() => handleUnflag(item.id)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                        >
                                            <Trash2 size={13} />
                                            Remove Flag
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleFlag(item.id, item.reason)}
                                            disabled={busy}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                                        >
                                            <Flag size={13} />
                                            Flag Wastage
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-1 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Showing <span className="font-bold text-slate-800 dark:text-slate-200">{items.length}</span> wastage items
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Inventory loss overview
                    </p>
                </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/[0.06]">
                <div className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400">
                    <AlertTriangle size={15} />
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-200">
                    Wastage includes expired stock + manually flagged damaged/recalled/contaminated items.
                    Near-expiry values are informational (not yet a loss).
                </p>
            </div>
        </div>
    );
};
