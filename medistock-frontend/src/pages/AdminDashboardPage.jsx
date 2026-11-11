
import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';
import {
    Pill,
    DollarSign,
    ShoppingCart,
    Users,
    AlertTriangle,
    ArrowRight,
    Plus,
    Receipt,
    RefreshCw,
    FileText,
    Clock,
    CheckCircle2,
    Activity,
    Package,
    TrendingUp,
    CalendarDays,
    ShieldCheck,
    ChevronRight,
    Boxes,
    CircleDollarSign,
    ClipboardList
} from 'lucide-react';

const cardBase =
    'rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 dark:border-slate-800 dark:bg-slate-900';

const sectionTitle =
    'text-base font-extrabold tracking-tight text-slate-900 dark:text-white';

const mutedText =
    'text-xs leading-5 text-slate-500 dark:text-slate-400';

const tableHead =
    'border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400';

const tableCell =
    'border-b border-slate-100 px-3 py-3 text-xs dark:border-slate-800';

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getStatusStyle = (status) => {
    const normalized = String(status || '').toUpperCase();

    if (['APPROVED', 'RECEIVED', 'COMPLETED'].includes(normalized)) {
        return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
    }

    if (['PENDING', 'PROCESSING'].includes(normalized)) {
        return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20';
    }

    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20';
};

const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    tone,
    onClick,
    action
}) => {
    const tones = {
        blue: {
            icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
            glow: 'group-hover:border-blue-300 dark:group-hover:border-blue-500/40',
            action: 'text-blue-600 dark:text-blue-400'
        },
        emerald: {
            icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
            glow: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-500/40',
            action: 'text-emerald-600 dark:text-emerald-400'
        },
        purple: {
            icon: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
            glow: 'group-hover:border-purple-300 dark:group-hover:border-purple-500/40',
            action: 'text-purple-600 dark:text-purple-400'
        },
        amber: {
            icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
            glow: 'group-hover:border-amber-300 dark:group-hover:border-amber-500/40',
            action: 'text-amber-600 dark:text-amber-400'
        },
        rose: {
            icon: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
            glow: 'group-hover:border-rose-300 dark:group-hover:border-rose-500/40',
            action: 'text-rose-600 dark:text-rose-400'
        }
    };

    const style = tones[tone] || tones.blue;

    return (
        <div
            onClick={onClick}
            onKeyDown={(e) => {
                if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick();
                }
            }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={`${cardBase} group relative overflow-hidden p-5 ${
                onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' : ''
            } ${style.glow}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.icon}`}>
                    <Icon size={21} strokeWidth={2} />
                </div>

                <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Overview
                </span>
            </div>

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {title}
            </p>

            <h3 className="mt-1.5 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {value}
            </h3>

            <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {description}
                </p>

                {action && (
                    <span className={`flex shrink-0 items-center gap-1 text-[10px] font-bold ${style.action}`}>
                        {action}
                        <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </span>
                )}
            </div>
        </div>
    );
};

export default function AdminDashboardPage({ onNavigate }) {
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [statsData, usersData, ordersData] = await Promise.all([
                    adminService.getDashboardStats(),
                    adminService.getAllUsers(),
                    adminService.getPurchaseOrders
                        ? adminService.getPurchaseOrders()
                        : Promise.resolve([])
                ]);

                setStats(statsData);
                setUsers(usersData);

                if (Array.isArray(ordersData)) {
                    const sortedOrders = [...ordersData].sort(
                        (a, b) =>
                            new Date(b.orderDate) - new Date(a.orderDate)
                    );

                    setOrders(sortedOrders.slice(0, 4));
                } else {
                    setOrders([]);
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading || !stats) {
        return (
            <div className="min-h-[70vh] bg-slate-50 px-4 py-10 dark:bg-[#080d1b] sm:px-6">
                <div className="mx-auto max-w-[1600px] space-y-6">
                    <div className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                            />
                        ))}
                    </div>

                    <p className="text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                        Preparing your inventory overview...
                    </p>
                </div>
            </div>
        );
    }

    // Existing backend statistics and calculations preserved.
    const totalMeds = stats.totalMedicines || 0;
    const inStockCount = stats.inStockCount || 0;
    const lowStockCount = stats.lowStockCount || 0;
    const outOfStockCount = stats.outOfStockCount || 0;
    const expiredCount = stats.expiredCount || 0;

    const getPct = (count) =>
        totalMeds === 0 ? 0 : Math.round((count / totalMeds) * 100);

    const inStockPct = getPct(inStockCount);
    const lowStockPct = getPct(lowStockCount);
    const outOfStockPct = getPct(outOfStockCount);

    const pieData = [
        { name: 'In Stock', value: inStockCount, color: '#10b981' },
        { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
        { name: 'Out of Stock', value: outOfStockCount, color: '#ef4444' }
    ].filter((item) => item.value > 0);

    const supplierCount = users.filter(
        (u) => u.roles?.includes('SUPPLIER')
    ).length;

    return (
        <div className="min-h-full bg-slate-50 px-3 py-5 text-slate-900 transition-colors duration-300 dark:bg-[#080d1b] dark:text-slate-100 sm:px-5 lg:px-7 lg:py-7">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* Page heading */}
                <section className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-5 text-slate-800 shadow-xl shadow-sky-900/5 transition-colors duration-300 dark:border-blue-800/50 dark:bg-gradient-to-br dark:from-[#0f1c38] dark:via-[#142951] dark:to-[#0e7490] dark:text-white dark:shadow-blue-950/20 sm:p-7 lg:p-8">

    {/* Decorative Background */}
    <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl dark:bg-cyan-400/15" />
    <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-300/30 blur-3xl dark:bg-blue-400/20" />

    <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sky-800 backdrop-blur dark:border-white/15 dark:bg-white/10 dark:text-cyan-100">
                <Activity size={13} />
                Administration / Overview
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
                Welcome back, {user?.fullName || 'Admin'}
                <span className="text-sky-600 dark:text-cyan-300">.</span>
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600 dark:text-blue-100/85 sm:text-sm">
                Monitor inventory health, purchase orders, supplier activity and essential pharmacy operations.
            </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
            <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10 dark:shadow-none">
                <CalendarDays
                    size={16}
                    className="text-sky-600 dark:text-cyan-200"
                />
                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-blue-100/70">
                        Dashboard
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                        Live overview
                    </p>
                </div>
            </div>

            <div className="hidden h-11 w-11 items-center justify-center rounded-xl border border-sky-200 bg-white/70 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/10 dark:shadow-none sm:flex">
                <ShieldCheck
                    size={21}
                    className="text-emerald-600 dark:text-emerald-300"
                />
            </div>
        </div>
    </div>
</section>

                {/* Summary cards */}
                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h2 className={sectionTitle}>Pharmacy at a glance</h2>
                            <p className={mutedText}>Key inventory and procurement indicators</p>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            INVENTORY OVERVIEW
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            title="Total medicines"
                            value={totalMeds}
                            description="Registered inventory items"
                            icon={Pill}
                            tone="blue"
                            action="View catalogue"
                            onClick={() => onNavigate('inventory')}
                        />

                        <StatCard
                            title="Inventory value"
                            value={formatCurrency(stats.totalInventoryValue)}
                            description="Total inventory assets"
                            icon={CircleDollarSign}
                            tone="emerald"
                        />

                        <StatCard
                            title="Purchase orders"
                            value={orders.length}
                            description="Most recent orders"
                            icon={ShoppingCart}
                            tone="purple"
                            action="View orders"
                            onClick={() => onNavigate('purchase-orders')}
                        />

                        <StatCard
                            title="Suppliers"
                            value={supplierCount}
                            description="Registered supplier accounts"
                            icon={Users}
                            tone="amber"
                            action="View suppliers"
                            onClick={() => onNavigate('suppliers')}
                        />

                        <StatCard
                            title="Low stock items"
                            value={lowStockCount}
                            description="Items requiring attention"
                            icon={AlertTriangle}
                            tone="rose"
                            action="Review stock"
                            onClick={() => onNavigate('inventory')}
                        />
                    </div>
                </section>

                {/* Main dashboard panels */}
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

                    {/* Stock status chart */}
                    <div className={`${cardBase} p-5 sm:p-6`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className={sectionTitle}>Stock status</h3>
                                <p className={mutedText}>Current inventory distribution</p>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <Boxes size={19} />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                            <div className="relative h-44 w-full max-w-[190px] shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={
                                                pieData.length > 0
                                                    ? pieData
                                                    : [{ name: 'Empty', value: 1, color: '#cbd5e1' }]
                                            }
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={54}
                                            outerRadius={77}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {pieData.length > 0 ? (
                                                pieData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ))
                                            ) : (
                                                <Cell fill="#cbd5e1" />
                                            )}
                                        </Pie>

                                        <Tooltip
                                            formatter={(value) => [`${value} items`, '']}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '12px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                                        {inStockPct}%
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                        In stock
                                    </span>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                {[
                                    {
                                        label: 'In Stock',
                                        count: inStockCount,
                                        pct: inStockPct,
                                        color: 'bg-emerald-500',
                                        dot: 'bg-emerald-500'
                                    },
                                    {
                                        label: 'Low Stock',
                                        count: lowStockCount,
                                        pct: lowStockPct,
                                        color: 'bg-amber-500',
                                        dot: 'bg-amber-500'
                                    },
                                    {
                                        label: 'Out of Stock',
                                        count: outOfStockCount,
                                        pct: outOfStockPct,
                                        color: 'bg-rose-500',
                                        dot: 'bg-rose-500'
                                    }
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="mb-1.5 flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                                <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                                                {item.label}
                                            </span>

                                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                                {item.count}
                                                <span className="ml-1 font-medium text-slate-400">
                                                    ({item.pct}%)
                                                </span>
                                            </span>
                                        </div>

                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                                                style={{
                                                    width: `${Math.min(item.pct, 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Total medicines
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {totalMeds}
                            </span>
                        </div>

                        <div
                            className={`mt-3 flex items-center justify-center gap-2 rounded-xl p-3 text-center text-[11px] font-semibold ${
                                lowStockCount > 0 || outOfStockCount > 0
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                            }`}
                        >
                            {lowStockCount > 0 || outOfStockCount > 0 ? (
                                <>
                                    <AlertTriangle size={14} />
                                    Some items need your attention.
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={14} />
                                    All medicines are in stock. Great job!
                                </>
                            )}
                        </div>
                    </div>

                    {/* Expiry summary */}
                    <div className={`${cardBase} flex flex-col p-5 sm:p-6`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className={sectionTitle}>Expiry monitoring</h3>
                                <p className={mutedText}>Review medicines requiring attention</p>
                            </div>

                            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                                <Clock size={19} />
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <button
                                type="button"
                                onClick={() => onNavigate('expiry')}
                                className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-left transition hover:border-amber-300 hover:bg-amber-100/70 dark:border-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/10"
                            >
                                <div>
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                        Near expiry
                                    </p>
                                    <p className="mt-1 text-[10px] text-amber-700/80 dark:text-amber-400/80">
                                        Requires attention
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {expiredCount}
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-slate-900 dark:text-amber-400">
                                    <CalendarDays size={19} />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onNavigate('expiry')}
                                className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-left transition hover:border-rose-300 hover:bg-rose-100/70 dark:border-rose-500/20 dark:bg-rose-500/5 dark:hover:bg-rose-500/10"
                            >
                                <div>
                                    <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                                        Expired items
                                    </p>
                                    <p className="mt-1 text-[10px] text-rose-700/80 dark:text-rose-400/80">
                                        Already expired
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {expiredCount}
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm dark:bg-slate-900 dark:text-rose-400">
                                    <AlertTriangle size={19} />
                                </div>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate('expiry')}
                            className="mt-auto flex w-full items-center justify-between pt-5 text-xs font-bold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            View all expiry records
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Recent purchase orders */}
                    <div className={`${cardBase} overflow-hidden`}>
                        <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
                            <div>
                                <h3 className={sectionTitle}>Recent purchase orders</h3>
                                <p className={mutedText}>Latest supplier orders</p>
                            </div>

                            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                <ClipboardList size={19} />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className={tableHead}>
                                    <tr>
                                        <th className="px-4 py-3 font-bold">PO Number</th>
                                        <th className="px-4 py-3 font-bold">Supplier</th>
                                        <th className="px-4 py-3 text-right font-bold">Amount</th>
                                        <th className="px-4 py-3 text-right font-bold">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.length > 0 ? (
                                        orders.map((po) => (
                                            <tr
                                                key={po.id}
                                                tabIndex={0}
                                                onClick={() => onNavigate('purchase-orders')}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        onNavigate('purchase-orders');
                                                    }
                                                }}
                                                className="cursor-pointer transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-slate-800/60"
                                            >
                                                <td className={`${tableCell} whitespace-nowrap font-bold text-blue-600 dark:text-blue-400`}>
                                                    {po.orderNumber}
                                                </td>

                                                <td className={`${tableCell} max-w-[120px] truncate text-slate-600 dark:text-slate-300`}>
                                                    {po.supplier?.name || po.supplierName || 'Unknown'}
                                                </td>

                                                <td className={`${tableCell} whitespace-nowrap text-right font-bold text-slate-900 dark:text-white`}>
                                                    {formatCurrency(po.totalAmount)}
                                                </td>

                                                <td className={`${tableCell} text-right`}>
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${getStatusStyle(po.status)}`}>
                                                        {po.status || 'UNKNOWN'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-4 py-10 text-center text-xs text-slate-400"
                                            >
                                                <ShoppingCart size={22} className="mx-auto mb-2 opacity-50" />
                                                No recent orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            onClick={() => onNavigate('purchase-orders')}
                            className="flex w-full items-center justify-between border-t border-slate-100 px-5 py-4 text-xs font-bold text-blue-600 transition hover:bg-blue-50/70 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-blue-500/5 sm:px-6"
                        >
                            View all purchase orders
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </section>

                {/* Bottom panels */}
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                    {/* Existing Top Medicines list preserved */}
                    <div className={`${cardBase} overflow-hidden`}>
                        <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
                            <div>
                                <h3 className={sectionTitle}>Top medicines</h3>
                                <p className={mutedText}>Most stocked medicines</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onNavigate('inventory')}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                            >
                                View all
                                <ArrowRight size={13} />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className={tableHead}>
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Medicine</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                        <th className="px-4 py-3 text-right">Unit</th>
                                    </tr>
                                </thead>

                                <tbody className="text-xs">
                                    {[
                                        {
                                            name: 'Amoxicillin 250 mg',
                                            quantity: 110,
                                            color: 'text-blue-500'
                                        },
                                        {
                                            name: 'Atorvastatin 10 mg',
                                            quantity: 60,
                                            color: 'text-emerald-500'
                                        },
                                        {
                                            name: 'Albuterol Inhaler 90 mcg',
                                            quantity: 60,
                                            color: 'text-rose-500'
                                        }
                                    ].map((medicine, index) => (
                                        <tr
                                            key={medicine.name}
                                            className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                        >
                                            <td className={`${tableCell} w-12 text-slate-400`}>
                                                {index + 1}
                                            </td>

                                            <td className={`${tableCell} min-w-[190px] font-semibold text-slate-800 dark:text-slate-200`}>
                                                <span className="flex items-center gap-2">
                                                    <Pill size={14} className={medicine.color} />
                                                    {medicine.name}
                                                </span>
                                            </td>

                                            <td className={`${tableCell} text-right font-extrabold text-slate-900 dark:text-white`}>
                                                {medicine.quantity}
                                            </td>

                                            <td className={`${tableCell} text-right text-slate-500 dark:text-slate-400`}>
                                                units
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`${cardBase} p-5 sm:p-6`}>
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className={sectionTitle}>Quick actions</h3>
                                <p className={mutedText}>Shortcuts for everyday operations</p>
                            </div>

                            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <TrendingUp size={19} />
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[
                                {
                                    label: 'Add Medicine',
                                    description: 'Manage catalogue',
                                    icon: Plus,
                                    color: 'blue',
                                    tab: 'inventory'
                                },
                                {
                                    label: 'Billing / POS',
                                    description: 'Process billing',
                                    icon: Receipt,
                                    color: 'emerald',
                                    tab: 'billing'
                                },
                                {
                                    label: 'New Purchase Order',
                                    description: 'Manage procurement',
                                    icon: ShoppingCart,
                                    color: 'purple',
                                    tab: 'purchase-orders'
                                },
                                {
                                    label: 'Stock Adjustment',
                                    description: 'Review inventory',
                                    icon: RefreshCw,
                                    color: 'amber',
                                    tab: 'inventory'
                                },
                                {
                                    label: 'Generate Report',
                                    description: 'Export information',
                                    icon: FileText,
                                    color: 'rose',
                                    tab: 'reports'
                                }
                            ].map((action) => {
                                const Icon = action.icon;

                                const tones = {
                                    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500',
                                    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500',
                                    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-500/10 dark:text-purple-400 dark:group-hover:bg-purple-500',
                                    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white dark:bg-amber-500/10 dark:text-amber-400 dark:group-hover:bg-amber-500',
                                    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:group-hover:bg-rose-500'
                                };

                                return (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => onNavigate(action.tab)}
                                        className="group flex min-h-[116px] flex-col items-start rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-slate-700"
                                    >
                                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 ${tones[action.color]}`}>
                                            <Icon size={17} />
                                        </span>

                                        <span className="mt-3 text-[11px] font-extrabold leading-4 text-slate-800 dark:text-slate-100">
                                            {action.label}
                                        </span>

                                        <span className="mt-1 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                                            {action.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <Activity size={13} className="text-emerald-500" />
                        MediStock · Admin Overview
                    </span>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        Inventory metrics sourced from dashboard statistics
                    </span>
                </footer>
            </div>
        </div>
    );
}
