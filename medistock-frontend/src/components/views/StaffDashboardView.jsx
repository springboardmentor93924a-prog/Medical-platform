
import React, { useCallback, useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import {
    Boxes, Clock, ClipboardCheck, AlertTriangle, ArrowRight,
    CheckCircle, Package, CheckSquare, Circle, RefreshCw,
    ListTodo, ShieldCheck, User, Activity, Truck,
    CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';

// ─── Reusable Stat Card ─────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40 dark:hover:shadow-black/20"
        >
            <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <ArrowRight
                    size={17}
                    className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600"
                />
            </div>

            <div className="mt-4">
                <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {value}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                    {title}
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {subtitle}
                </p>
            </div>
        </button>
    );
};

// ─── Section Header ─────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, action, color = 'blue' }) => {
    const iconColors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    };

    return (
        <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors[color]}`}>
                    <Icon size={19} />
                </div>
                <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 dark:text-white">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action}
        </div>
    );
};

// ─── Empty State ───────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-9 text-center dark:border-slate-700 dark:bg-slate-800/30">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800 dark:text-slate-500">
            <Icon size={22} />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {title}
        </p>
        <p className="mt-1 max-w-xs text-xs text-slate-400 dark:text-slate-500">
            {description}
        </p>
    </div>
);

// ─── Main Staff Dashboard ───────────────────────────────────────────
export const StaffDashboardView = ({ medicines = [], onNavigate }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState(null);
    const [error, setError] = useState('');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError('');

        try {
            const [deliveriesData, tasksData] = await Promise.all([
                adminService.getStaffDeliveries(),
                adminService.getMyTasks()
            ]);

            setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
            setTasks(Array.isArray(tasksData) ? tasksData : []);
        } catch (err) {
            console.error('Staff dashboard fetch error:', err);
            setError('Unable to load the latest dashboard data. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCompleteTask = async (taskId) => {
        if (!window.confirm('Mark this task as completed?')) return;

        try {
            setCompletingTaskId(taskId);
            await adminService.updateTaskStatus(taskId, 'COMPLETED');
            await fetchData(true);
        } catch (err) {
            console.error('Task completion error:', err);
            setError('Unable to update task status. Please try again.');
        } finally {
            setCompletingTaskId(null);
        }
    };

    // Inventory statistics
    const totalMedicines = medicines.length;

    const lowStock = medicines.filter(
        m => m.quantity <= m.minQuantity && m.quantity > 0
    ).length;

    const outOfStock = medicines.filter(
        m => m.quantity === 0
    ).length;

    const expiringSoon = medicines.filter(m => {
        if (!m.expiryDate) return false;
        const days = Math.ceil(
            (new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        return days >= 0 && days <= 45;
    }).length;

    const expired = medicines.filter(m => {
        if (!m.expiryDate) return false;
        return new Date(m.expiryDate) < new Date();
    }).length;

    const pendingDeliveries = deliveries.filter(
        d => d.status === 'APPROVED'
    ).length;

    const pendingTasks = tasks.filter(
        t => t.status !== 'COMPLETED'
    ).length;

    const completedTasks = tasks.filter(
        t => t.status === 'COMPLETED'
    ).length;

    const taskProgress = tasks.length
        ? Math.round((completedTasks / tasks.length) * 100)
        : 0;

    const stockAlerts = medicines.filter(
        m => m.quantity <= m.minQuantity
    );

    const priorityStyle = (priority) => {
        switch (priority) {
            case 'URGENT':
                return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20';
            case 'HIGH':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">

            {/* ─── Dashboard Hero ─────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 p-5 shadow-sm dark:border-blue-900/50 dark:from-[#0f1c38] dark:via-[#142951] dark:to-[#0e7490] sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl dark:bg-cyan-400/10" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl dark:bg-blue-400/10" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="max-w-xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200">
                            <Activity size={12} />
                            Staff Workspace
                        </div>

                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Your Daily Overview
                        </h1>

                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-blue-100/70">
                            Manage assigned tasks, monitor inventory and keep daily operations running smoothly.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <div className="hidden h-14 w-14 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-blue-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-cyan-200 sm:flex">
                            <ShieldCheck size={29} />
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                        >
                            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-blue-200/70 pt-4 dark:border-white/10 sm:max-w-lg">
                    <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {pendingTasks}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-blue-100/60">
                            Tasks to complete
                        </p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {completedTasks}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-blue-100/60">
                            Tasks completed
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Error Message ──────────────────────────────────── */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button
                        type="button"
                        onClick={() => fetchData(true)}
                        className="shrink-0 font-bold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ─── Overview Statistics ────────────────────────────── */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <Activity size={17} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Inventory Overview
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Medicines"
                        value={totalMedicines}
                        subtitle="Available medicine records"
                        icon={Package}
                        color="blue"
                        onClick={() => onNavigate?.('medicines')}
                    />
                    <StatCard
                        title="Low / Out of Stock"
                        value={lowStock + outOfStock}
                        subtitle={`${lowStock} low stock · ${outOfStock} out of stock`}
                        icon={AlertTriangle}
                        color="amber"
                        onClick={() => onNavigate?.('inventory')}
                    />
                    <StatCard
                        title="Expiry Alerts"
                        value={expiringSoon + expired}
                        subtitle={`${expiringSoon} expiring · ${expired} expired`}
                        icon={Clock}
                        color="rose"
                        onClick={() => onNavigate?.('expiry')}
                    />
                    <StatCard
                        title="Incoming Deliveries"
                        value={pendingDeliveries}
                        subtitle="Approved orders awaiting receipt"
                        icon={Truck}
                        color="emerald"
                        onClick={() => onNavigate?.('receive')}
                    />
                </div>
            </section>

            {/* ─── Task Management ────────────────────────────────── */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {/* Task Header */}
                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-sky-50/40 p-5 dark:border-slate-800 dark:from-blue-950/30 dark:to-slate-900 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                                <ListTodo size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                    My Assigned Tasks
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Stay on top of your assigned work
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                {pendingTasks} Pending
                            </span>
                            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                {completedTasks} Completed
                            </span>
                        </div>
                    </div>

                    {/* Task Progress */}
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Overall task progress
                            </span>
                            <span className="font-black text-blue-700 dark:text-blue-300">
                                {taskProgress}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-700">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500 dark:from-blue-500 dark:to-cyan-400"
                                style={{ width: `${taskProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="space-y-3 p-4 sm:p-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="animate-pulse rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                            >
                                <div className="flex gap-3">
                                    <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                                        <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : tasks.length === 0 ? (
                        <EmptyState
                            icon={Sparkles}
                            title="You're all caught up!"
                            description="There are no tasks assigned to you right now. New assignments will appear here."
                        />
                    ) : (
                        tasks.slice(0, 6).map(task => {
                            const isCompleted = task.status === 'COMPLETED';
                            const isCompleting = completingTaskId === task.id;

                            return (
                                <div
                                    key={task.id}
                                    className={`group flex flex-col gap-3 rounded-xl border p-4 transition-all duration-200 sm:flex-row sm:items-center ${
                                        isCompleted
                                            ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/15 dark:bg-emerald-500/5'
                                            : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-500/30'
                                    }`}
                                >
                                    <div className="flex min-w-0 flex-1 items-start gap-3">
                                        <div className="mt-0.5 shrink-0">
                                            {isCompleted ? (
                                                <CheckCircle2
                                                    size={21}
                                                    className="text-emerald-600 dark:text-emerald-400"
                                                />
                                            ) : (
                                                <Circle
                                                    size={21}
                                                    className="text-slate-300 dark:text-slate-600"
                                                />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className={`text-sm font-bold ${
                                                    isCompleted
                                                        ? 'text-slate-500 line-through dark:text-slate-500'
                                                        : 'text-slate-900 dark:text-white'
                                                }`}>
                                                    {task.title}
                                                </h3>

                                                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${priorityStyle(task.priority)}`}>
                                                    {task.priority || 'NORMAL'}
                                                </span>
                                            </div>

                                            {task.description && (
                                                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                    <User size={12} />
                                                    Assigned by {task.assignedByName || 'Admin'}
                                                </span>

                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                                    isCompleted
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-amber-600 dark:text-amber-400'
                                                }`}>
                                                    {isCompleted ? (
                                                        <CheckCircle size={12} />
                                                    ) : (
                                                        <Clock size={12} />
                                                    )}
                                                    {isCompleted ? 'Completed' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCompleted && (
                                        <button
                                            type="button"
                                            onClick={() => handleCompleteTask(task.id)}
                                            disabled={isCompleting || completingTaskId !== null}
                                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
                                        >
                                            {isCompleting ? (
                                                <>
                                                    <RefreshCw size={14} className="animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} />
                                                    Mark Done
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {!loading && tasks.length > 6 && (
                        <p className="pt-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                            Showing 6 of {tasks.length} assigned tasks
                        </p>
                    )}
                </div>
            </section>

            {/* ─── Stock Alerts & Deliveries ──────────────────────── */}
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                {/* Stock Alerts */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <SectionHeader
                        icon={AlertTriangle}
                        title="Stock Alerts"
                        subtitle={`${stockAlerts.length} medicines need attention`}
                        color="amber"
                        action={
                            <button
                                type="button"
                                onClick={() => onNavigate?.('inventory')}
                                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                View All <ArrowRight size={14} />
                            </button>
                        }
                    />

                    <div className="space-y-2">
                        {stockAlerts.length === 0 ? (
                            <EmptyState
                                icon={CheckCircle2}
                                title="All stock levels are healthy"
                                description="No medicines are currently below their minimum stock level."
                            />
                        ) : (
                            stockAlerts.slice(0, 5).map(med => (
                                <div
                                    key={med.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3 transition hover:bg-amber-50 dark:border-amber-500/15 dark:bg-amber-500/5 dark:hover:bg-amber-500/10"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 dark:bg-slate-800 dark:text-amber-400">
                                            <Package size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {med.name}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                                Batch: {med.batchNumber || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black ${
                                        med.quantity === 0
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                    }`}>
                                        {med.quantity === 0 ? 'OUT OF STOCK' : `${med.quantity} LEFT`}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Incoming Deliveries */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <SectionHeader
                        icon={Boxes}
                        title="Incoming Deliveries"
                        subtitle={`${pendingDeliveries} approved orders awaiting receipt`}
                        color="blue"
                        action={
                            <button
                                type="button"
                                onClick={() => onNavigate?.('receive')}
                                className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                                View All <ArrowRight size={14} />
                            </button>
                        }
                    />

                    <div className="space-y-2">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                                />
                            ))
                        ) : deliveries.length === 0 ? (
                            <EmptyState
                                icon={Truck}
                                title="No incoming deliveries"
                                description="Approved purchase orders will appear here when they are ready for receipt."
                            />
                        ) : (
                            deliveries.slice(0, 5).map(order => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-500/15 dark:bg-blue-500/5"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 dark:bg-slate-800 dark:text-blue-400">
                                            <ClipboardCheck size={17} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-mono text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {order.orderNumber}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                                {order.items?.length || 0} items
                                            </p>
                                        </div>
                                    </div>

                                    <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black ${
                                        order.status === 'APPROVED'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Footer Status ──────────────────────────────────── */}
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <ShieldCheck size={16} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            Staff Workspace Active
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Inventory and task overview
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    Dashboard ready
                </div>
            </div>
        </div>
    );
};
