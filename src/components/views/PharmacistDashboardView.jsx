
import React, { useEffect, useMemo, useState } from 'react';
import {
    Pill,
    AlertTriangle,
    Clock,
    Truck,
    ShoppingCart,
    ArrowRight,
    CheckCircle2,
    Package,
    TrendingUp,
    Activity,
    CalendarDays,
    RefreshCw,
    Boxes,
    ShieldCheck,
    CircleAlert,
    ChevronRight,
    ClipboardList,
    PackageCheck,
    Sparkles,
    Phone,
    Mail,
    ArrowUpRight,
    XCircle,
    LoaderCircle,
    BarChart3,
    Zap,
} from 'lucide-react';

import { adminService } from '../../services/adminService';

// --------------------------------------------------
// Reusable UI components
// --------------------------------------------------

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    accent,
    iconBg,
    badge,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
        <div
            className={`absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.07] blur-2xl transition-all duration-300 group-hover:scale-150 ${accent}`}
        />

        <div className="relative flex items-start justify-between gap-3">
            <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}
            >
                <Icon size={22} strokeWidth={1.8} />
            </div>

            {badge && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {badge}
                </span>
            )}
        </div>

        <div className="relative mt-5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {title}
            </p>

            <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {value}
                </span>
                <ArrowUpRight
                    size={16}
                    className="text-slate-300 transition-colors group-hover:text-blue-500"
                />
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
            </p>
        </div>
    </button>
);

const SectionHeader = ({
    icon: Icon,
    title,
    description,
    action,
    onAction,
    iconColor = 'text-blue-600',
    iconBg = 'bg-blue-50 dark:bg-blue-500/10',
}) => (
    <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                <Icon size={19} />
            </div>

            <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                    {title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {description}
                </p>
            </div>
        </div>

        {action && (
            <button
                type="button"
                onClick={onAction}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
                {action}
                <ArrowRight size={14} />
            </button>
        )}
    </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Icon size={23} />
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {title}
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
        </p>
    </div>
);

const Panel = ({ children, className = '' }) => (
    <section
        className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}
    >
        {children}
    </section>
);

const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);

    if (Number.isNaN(expiry.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
};

const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return 'Invalid date';

    return parsed.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// --------------------------------------------------
// Main Pharmacist Dashboard
// --------------------------------------------------

export const PharmacistDashboardView = ({
    medicines = [],
    suppliers = [],
    onNavigate,
}) => {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [orderError, setOrderError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrderError(false);

        try {
            const data = await adminService.getPurchaseOrders();
            setOrders(Array.isArray(data) ? data : []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to fetch purchase orders:', error);
            setOrderError(true);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const inventoryStats = useMemo(() => {
        const lowStockItems = medicines.filter((medicine) => {
            const quantity = Number(medicine.quantity ?? 0);
            const minimum = Number(medicine.minQuantity ?? 0);

            return quantity <= minimum;
        });

        const expiringItems = medicines
            .map((medicine) => ({
                ...medicine,
                daysRemaining: getDaysUntilExpiry(medicine.expiryDate),
            }))
            .filter(
                (medicine) =>
                    medicine.daysRemaining !== null &&
                    medicine.daysRemaining >= 0 &&
                    medicine.daysRemaining <= 45
            )
            .sort((a, b) => a.daysRemaining - b.daysRemaining);

        const expiredItems = medicines.filter((medicine) => {
            const days = getDaysUntilExpiry(medicine.expiryDate);
            return days !== null && days < 0;
        });

        const healthyStock = medicines.filter((medicine) => {
            const quantity = Number(medicine.quantity ?? 0);
            const minimum = Number(medicine.minQuantity ?? 0);
            return quantity > minimum;
        });

        return {
            lowStockItems,
            expiringItems,
            expiredItems,
            healthyStock,
        };
    }, [medicines]);

    const pendingOrders = orders.filter(
        (order) => order.status === 'PENDING'
    );

    const approvedOrders = orders.filter(
        (order) => order.status === 'APPROVED'
    );

    const rejectedOrders = orders.filter(
        (order) => order.status === 'REJECTED'
    );

    const receivedOrders = orders.filter(
        (order) =>
            order.status === 'RECEIVED' ||
            order.status === 'COMPLETED'
    );

    const stockHealth = medicines.length
        ? Math.round(
              (inventoryStats.healthyStock.length / medicines.length) * 100
          )
        : 0;

    const today = new Date();

    const greeting =
        today.getHours() < 12
            ? 'Good morning'
            : today.getHours() < 17
              ? 'Good afternoon'
              : 'Good evening';

    const navigate = (page) => {
        if (onNavigate) onNavigate(page);
    };

    const refreshOrders = () => {
        fetchOrders();
    };

    return (
        <div className="min-h-screen bg-slate-50/80 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">

                {/* ------------------------------------ */}
                {/* HEADER */}
                {/* ------------------------------------ */}

                <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        

                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            {greeting}, Pharmacist
                            <span className="ml-2 inline-block">✦</span>
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Your inventory command center. Monitor stock,
                            manage purchase orders, and stay ahead of expiry
                            alerts.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                            <CalendarDays
                                size={16}
                                className="text-blue-600 dark:text-blue-400"
                            />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {today.toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={refreshOrders}
                            disabled={loadingOrders}
                            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={16}
                                className={loadingOrders ? 'animate-spin' : ''}
                            />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* ------------------------------------ */}
                {/* HERO / INVENTORY HEALTH */}
                {/* ------------------------------------ */}

 

<div className="mx-auto w-full max-w-4xl px-4">
<section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-white to-blue-100 p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-blue-950 sm:p-6">
  <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl dark:bg-cyan-500/10" />

  <div className="relative grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_240px]">

    {/* Left */}
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-300">
        <Activity size={15} />
        PHARMACIST DASHBOARD
      </div>

      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Inventory Overview
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate('inventory')}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
        >
          <Boxes size={16} />
          Manage Inventory
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => navigate('purchase-orders')}
          className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
        >
          <ClipboardList size={16} />
          Purchase Orders
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <span className="text-slate-600 dark:text-slate-300">
          Medicines :<strong className="ml-1 text-slate-900 dark:text-white">{inventoryStats.totalMeds}</strong>
        </span>
        <span className="text-amber-600 dark:text-amber-300">
          Low Stock <strong className="ml-1">{inventoryStats.lowStockItems.length}</strong>
        </span>
        <span className="text-rose-600 dark:text-rose-300">
          Expired <strong className="ml-1">{inventoryStats.expiredItems.length}</strong>
        </span>
      </div>
    </div>

    {/* Compact health card */}
    <div className="rounded-xl border border-blue-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Inventory Health
        </span>
        <ShieldCheck size={20} className="text-emerald-500" />
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {stockHealth}%
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">healthy stock</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, stockHealth))}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => navigate('expiry')}
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline dark:text-cyan-300"
      >
        Review Expiry <ArrowRight size={13} />
      </button>
    </div>

  </div>
</section>
</div>




                {/* ------------------------------------ */}
                {/* KPI CARDS */}
                {/* ------------------------------------ */}

                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Pharmacy at a glance
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Key inventory and procurement indicators
                            </p>
                        </div>

                        <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:flex">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Dashboard overview
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Medicines"
                            value={medicines.length}
                            subtitle="Medicines in current inventory"
                            icon={Pill}
                            accent="bg-blue-600"
                            iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            badge="Inventory"
                            onClick={() => navigate('inventory')}
                        />

                        <StatCard
                            title="Low Stock Items"
                            value={inventoryStats.lowStockItems.length}
                            subtitle="At or below minimum quantity"
                            icon={AlertTriangle}
                            accent="bg-amber-500"
                            iconBg="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            badge={inventoryStats.lowStockItems.length ? 'Action needed' : 'Healthy'}
                            onClick={() => navigate('inventory')}
                        />

                        <StatCard
                            title="Expiry Alerts"
                            value={
                                inventoryStats.expiringItems.length +
                                inventoryStats.expiredItems.length
                            }
                            subtitle="Expired or expiring within 45 days"
                            icon={Clock}
                            accent="bg-rose-500"
                            iconBg="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                            badge="Expiry watch"
                            onClick={() => navigate('expiry')}
                        />

                        <StatCard
                            title="Total Suppliers"
                            value={suppliers.length}
                            subtitle="Registered supplier records"
                            icon={Truck}
                            accent="bg-violet-500"
                            iconBg="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                            badge="Suppliers"
                            onClick={() => navigate('suppliers')}
                        />
                    </div>
                </section>

                {/* ------------------------------------ */}
                {/* ALERTS */}
                {/* ------------------------------------ */}

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                    {/* LOW STOCK */}

                    <Panel>
                        <SectionHeader
                            icon={AlertTriangle}
                            title="Stock replenishment"
                            description="Medicines that need your attention"
                            action="View inventory"
                            onAction={() => navigate('inventory')}
                            iconColor="text-amber-600"
                            iconBg="bg-amber-50 dark:bg-amber-500/10"
                        />

                        {inventoryStats.lowStockItems.length === 0 ? (
                            <EmptyState
                                icon={CheckCircle2}
                                title="All stock levels look good"
                                description="No medicines are currently at or below their minimum stock threshold."
                            />
                        ) : (
                            <div className="space-y-3">
                                {inventoryStats.lowStockItems
                                    .slice(0, 4)
                                    .map((medicine) => {
                                        const quantity = Number(
                                            medicine.quantity ?? 0
                                        );
                                        const minimum = Number(
                                            medicine.minQuantity ?? 0
                                        );

                                        const isOutOfStock = quantity <= 0;

                                        const percentage =
                                            minimum > 0
                                                ? Math.min(
                                                      100,
                                                      Math.max(
                                                          0,
                                                          (quantity / minimum) *
                                                              100
                                                      )
                                                  )
                                                : quantity <= 0
                                                  ? 0
                                                  : 100;

                                        return (
                                            <div
                                                key={medicine.id}
                                                className="group rounded-xl border border-slate-200 p-4 transition hover:border-amber-200 hover:bg-amber-50/40 dark:border-slate-800 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/[0.04]"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                            isOutOfStock
                                                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                                                        }`}>
                                                            <Package size={19} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                                                {medicine.name || 'Unnamed medicine'}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                Minimum stock: {minimum}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className={`text-lg font-extrabold ${
                                                            isOutOfStock
                                                                ? 'text-rose-600'
                                                                : 'text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                            {quantity}
                                                        </p>

                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                            In stock
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center gap-3">
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                isOutOfStock
                                                                    ? 'bg-rose-500'
                                                                    : 'bg-amber-500'
                                                            }`}
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                                                        {isOutOfStock
                                                            ? 'Out of stock'
                                                            : 'Low stock'}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('purchase-orders')}
                                                        className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-600 dark:bg-slate-700 dark:hover:bg-blue-600"
                                                    >
                                                        <ShoppingCart size={13} />
                                                        Reorder
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {inventoryStats.lowStockItems.length > 4 && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('inventory')}
                                        className="w-full rounded-xl border border-dashed border-slate-200 py-3 text-xs font-bold text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400"
                                    >
                                        View all {inventoryStats.lowStockItems.length} low-stock medicines
                                        <ChevronRight size={14} className="ml-1 inline" />
                                    </button>
                                )}
                            </div>
                        )}
                    </Panel>

                    {/* EXPIRY */}

                    <Panel>
                        <SectionHeader
                            icon={Clock}
                            title="Expiry watch"
                            description="Monitor upcoming and overdue expirations"
                            action="View expiry"
                            onAction={() => navigate('expiry')}
                            iconColor="text-rose-600"
                            iconBg="bg-rose-50 dark:bg-rose-500/10"
                        />

                        {inventoryStats.expiredItems.length === 0 &&
                        inventoryStats.expiringItems.length === 0 ? (
                            <EmptyState
                                icon={ShieldCheck}
                                title="No expiry alerts"
                                description="No expired medicines or medicines expiring within the next 45 days were found."
                            />
                        ) : (
                            <div className="space-y-3">
                                {[
                                    ...inventoryStats.expiredItems.map(
                                        (medicine) => ({
                                            ...medicine,
                                            daysRemaining: getDaysUntilExpiry(
                                                medicine.expiryDate
                                            ),
                                        })
                                    ),
                                    ...inventoryStats.expiringItems,
                                ]
                                    .slice(0, 4)
                                    .map((medicine) => {
                                        const expired =
                                            medicine.daysRemaining < 0;

                                        return (
                                            <div
                                                key={`${medicine.id}-${medicine.expiryDate}`}
                                                className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition ${
                                                    expired
                                                        ? 'border-rose-200 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/[0.06]'
                                                        : 'border-slate-200 hover:border-orange-200 dark:border-slate-800 dark:hover:border-orange-500/30'
                                                }`}
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                        expired
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                                                            : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                                                    }`}>
                                                        {expired ? (
                                                            <XCircle size={19} />
                                                        ) : (
                                                            <Clock size={19} />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                                            {medicine.name || 'Unnamed medicine'}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Batch: {medicine.batchNumber || 'N/A'}
                                                        </p>

                                                        <p className="mt-1 text-[11px] text-slate-400">
                                                            Expiry: {formatDate(medicine.expiryDate)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <span className={`inline-flex rounded-lg px-2 py-1.5 text-[10px] font-extrabold ${
                                                        expired
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                                                            : medicine.daysRemaining <= 7
                                                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                                                              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                    }`}>
                                                        {expired
                                                            ? `${Math.abs(medicine.daysRemaining)}d overdue`
                                                            : medicine.daysRemaining === 0
                                                              ? 'Expires today'
                                                              : `${medicine.daysRemaining}d left`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {(inventoryStats.expiringItems.length +
                                    inventoryStats.expiredItems.length) > 4 && (
                                    <button
                                        type="button"
                                        onClick={() => navigate('expiry')}
                                        className="w-full rounded-xl border border-dashed border-slate-200 py-3 text-xs font-bold text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400"
                                    >
                                        View all expiry alerts
                                        <ChevronRight size={14} className="ml-1 inline" />
                                    </button>
                                )}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ------------------------------------ */}
                {/* PROCUREMENT + SUPPLIERS */}
                {/* ------------------------------------ */}

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

                    {/* PURCHASE SUMMARY */}

                    <Panel className="xl:col-span-2">
                        <SectionHeader
                            icon={ShoppingCart}
                            title="Procurement overview"
                            description="Track purchase orders and replenishment activity"
                            action="Manage orders"
                            onAction={() => navigate('purchase-orders')}
                            iconColor="text-blue-600"
                            iconBg="bg-blue-50 dark:bg-blue-500/10"
                        />

                        {orderError && (
                            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                                <span>Unable to load purchase orders. Please try again.</span>
                                <button
                                    type="button"
                                    onClick={refreshOrders}
                                    className="shrink-0 font-bold underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 dark:border-amber-500/20 dark:from-amber-500/[0.08] dark:to-orange-500/[0.03]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                            Pending approval
                                        </p>
                                        <p className="mt-3 text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                                            {loadingOrders && orders.length === 0
                                                ? '—'
                                                : pendingOrders.length}
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                        <Clock size={21} />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-amber-800/70 dark:text-amber-200/60">
                                    Orders awaiting a decision
                                </p>

                                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-500/10">
                                    <div
                                        className="h-full rounded-full bg-amber-500"
                                        style={{
                                            width: `${orders.length ? (pendingOrders.length / orders.length) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 dark:border-emerald-500/20 dark:from-emerald-500/[0.08] dark:to-teal-500/[0.03]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                            Received / completed
                                        </p>
                                        <p className="mt-3 text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                            {loadingOrders && orders.length === 0
                                                ? '—'
                                                : receivedOrders.length}
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                        <PackageCheck size={21} />
                                    </div>
                                </div>

                                <p className="mt-3 text-xs leading-5 text-emerald-800/70 dark:text-emerald-200/60">
                                    Orders marked received or completed
                                </p>

                                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-500/10">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{
                                            width: `${orders.length ? (receivedOrders.length / orders.length) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                {
                                    label: 'All orders',
                                    value: orders.length,
                                    icon: ClipboardList,
                                    color: 'text-blue-600 dark:text-blue-400',
                                },
                                {
                                    label: 'Pending',
                                    value: pendingOrders.length,
                                    icon: Clock,
                                    color: 'text-amber-600 dark:text-amber-400',
                                },
                                {
                                    label: 'Approved',
                                    value: approvedOrders.length,
                                    icon: CheckCircle2,
                                    color: 'text-emerald-600 dark:text-emerald-400',
                                },
                                {
                                    label: 'Rejected',
                                    value: rejectedOrders.length,
                                    icon: CircleAlert,
                                    color: 'text-rose-600 dark:text-rose-400',
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon
                                            size={15}
                                            className={item.color}
                                        />
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                            {item.label}
                                        </span>
                                    </div>

                                    <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-white">
                                        {loadingOrders && orders.length === 0
                                            ? '—'
                                            : item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Activity size={15} />
                                {loadingOrders
                                    ? 'Updating order data...'
                                    : `Last refreshed at ${lastUpdated.toLocaleTimeString('en-IN', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })}`}
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate('purchase-orders')}
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                                Open procurement
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </Panel>

                    {/* SUPPLIER DIRECTORY */}

                    <Panel>
                        <SectionHeader
                            icon={Truck}
                            title="Supplier directory"
                            description="Your registered suppliers"
                            action="View all"
                            onAction={() => navigate('suppliers')}
                            iconColor="text-violet-600"
                            iconBg="bg-violet-50 dark:bg-violet-500/10"
                        />

                        <div className="mb-5 flex items-center gap-4 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50/70 p-4 dark:from-violet-500/[0.08] dark:to-blue-500/[0.06]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm dark:bg-slate-800 dark:text-violet-400">
                                <Truck size={23} />
                            </div>

                            <div>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {suppliers.length}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Registered suppliers
                                </p>
                            </div>
                        </div>

                        {suppliers.length === 0 ? (
                            <EmptyState
                                icon={Truck}
                                title="No suppliers found"
                                description="Registered suppliers will appear here."
                            />
                        ) : (
                            <div className="space-y-1">
                                {suppliers.slice(0, 5).map((supplier, index) => {
                                    const supplierName =
                                        supplier.name || 'Unnamed supplier';

                                    const contact =
                                        supplier.phone || supplier.email;

                                    return (
                                        <button
                                            type="button"
                                            key={supplier.id ?? `${supplierName}-${index}`}
                                            onClick={() => navigate('suppliers')}
                                            className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-sm font-extrabold text-violet-700 dark:from-violet-500/15 dark:to-blue-500/15 dark:text-violet-300">
                                                {supplierName
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    {supplierName}
                                                </p>

                                                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    {supplier.phone ? (
                                                        <Phone size={11} />
                                                    ) : supplier.email ? (
                                                        <Mail size={11} />
                                                    ) : null}

                                                    <span className="truncate">
                                                        {contact || 'No contact information'}
                                                    </span>
                                                </div>
                                            </div>

                                            <ChevronRight
                                                size={16}
                                                className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {suppliers.length > 0 && (
                            <button
                                type="button"
                                onClick={() => navigate('suppliers')}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-500/40 dark:hover:text-violet-400"
                            >
                                Explore suppliers
                                <ArrowRight size={14} />
                            </button>
                        )}
                    </Panel>
                </div>

                {/* ------------------------------------ */}
                {/* QUICK ACTIONS */}
                {/* ------------------------------------ */}

                <section>
                    <div className="mb-4">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            Quick actions
                        </h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Jump straight into your everyday pharmacy tasks
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                title: 'Inventory management',
                                description: 'Check quantities and stock levels',
                                icon: Boxes,
                                color: 'text-blue-600 dark:text-blue-400',
                                bg: 'bg-blue-50 dark:bg-blue-500/10',
                                page: 'inventory',
                            },
                            {
                                title: 'Purchase orders',
                                description: 'Review and manage replenishment',
                                icon: ShoppingCart,
                                color: 'text-violet-600 dark:text-violet-400',
                                bg: 'bg-violet-50 dark:bg-violet-500/10',
                                page: 'purchase-orders',
                            },
                            {
                                title: 'Expiry tracking',
                                description: 'Review upcoming expirations',
                                icon: Clock,
                                color: 'text-rose-600 dark:text-rose-400',
                                bg: 'bg-rose-50 dark:bg-rose-500/10',
                                page: 'expiry',
                            },
                            {
                                title: 'Supplier directory',
                                description: 'Find supplier contact details',
                                icon: Truck,
                                color: 'text-emerald-600 dark:text-emerald-400',
                                bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                                page: 'suppliers',
                            },
                        ].map((action) => (
                            <button
                                type="button"
                                key={action.page}
                                onClick={() => navigate(action.page)}
                                className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30 dark:hover:shadow-none"
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${action.bg} ${action.color} transition-transform group-hover:scale-105`}>
                                    <action.icon size={22} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {action.title}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        {action.description}
                                    </p>
                                </div>

                                <ArrowUpRight
                                    size={17}
                                    className="shrink-0 text-slate-300 transition group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                />
                            </button>
                        ))}
                    </div>
                </section>

                {/* ------------------------------------ */}
                {/* FOOTER */}
                {/* ------------------------------------ */}

                <footer className="flex flex-col justify-between gap-3 border-t border-slate-200/80 pt-5 text-xs text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        

                        
                    </div>

                    
                </footer>
            </div>
        </div>
    );
};
