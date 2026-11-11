
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ClipboardCheck, Plus, Trash2, CheckCircle, Clock,
    Search, RefreshCw, ListTodo, Users, AlertTriangle,
    CheckCircle2, ArrowRight, CalendarDays, User,
    Filter, FileText, Loader2, AlertCircle, X
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { AssignTaskModal } from '../modals/AssignTaskModal';

// ─── Priority Badge ─────────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
    const styles = {
        URGENT: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
        HIGH: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
        LOW: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600',
        NORMAL: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'
    };

    const value = priority || 'NORMAL';

    return (
        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${styles[value] || styles.NORMAL}`}>
            {value}
        </span>
    );
};

// ─── Status Badge ───────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const config = {
        COMPLETED: {
            style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
            icon: CheckCircle2,
            label: 'Completed'
        },
        IN_PROGRESS: {
            style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
            icon: Clock,
            label: 'In Progress'
        },
        DEFAULT: {
            style: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600',
            icon: AlertCircle,
            label: 'Pending'
        }
    };

    const item = config[status] || config.DEFAULT;
    const Icon = item.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-bold ${item.style}`}>
            <Icon size={12} />
            {item.label}
        </span>
    );
};

// ─── Summary Card ───────────────────────────────────────────────────
const SummaryCard = ({ title, value, subtitle, icon: Icon, color }) => {
    const themes = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {value}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        {subtitle}
                    </p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${themes[color]}`}>
                    <Icon size={21} />
                </div>
            </div>
        </div>
    );
};

// ─── Main Task Management ────────────────────────────────────────────
export const TaskManagementView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [error, setError] = useState('');

    const fetchTasks = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError('');

        try {
            const data = await adminService.getAllTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError('Unable to load tasks. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // ─── Statistics ────────────────────────────────────────────────
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const pendingTasks = tasks.filter(
        t => t.status !== 'COMPLETED' && t.status !== 'IN_PROGRESS'
    ).length;
    const urgentTasks = tasks.filter(
        t => t.priority === 'URGENT' && t.status !== 'COMPLETED'
    ).length;

    const completionRate = totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    // ─── Search and Filters ─────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tasks.filter(task => {
            const matchesSearch = !query || [
                task.title,
                task.description,
                task.assignedToName,
                task.assignedToEmail,
                task.assignedByName
            ].some(value => String(value || '').toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'PENDING' &&
                    task.status !== 'COMPLETED' &&
                    task.status !== 'IN_PROGRESS') ||
                task.status === statusFilter;

            const matchesPriority =
                priorityFilter === 'ALL' ||
                task.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [tasks, search, statusFilter, priorityFilter]);

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setPriorityFilter('ALL');
    };

    const hasFilters =
        search.trim() !== '' ||
        statusFilter !== 'ALL' ||
        priorityFilter !== 'ALL';

    // ─── Create Task ────────────────────────────────────────────────
    const handleCreateTask = async (data) => {
        await adminService.createTask(data);
        setIsModalOpen(false);
        await fetchTasks(true);
    };

    // ─── Delete Task ────────────────────────────────────────────────
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            setDeletingId(id);
            setError('');
            await adminService.deleteTask(id);
            await fetchTasks(true);
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError(err?.message || 'Unable to delete task. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';

        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return '—';

        return parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">

            {/* ─── Hero Header ─────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-5 shadow-sm dark:border-blue-900/50 dark:from-[#0f1c38] dark:via-[#142951] dark:to-[#172c4a] sm:p-7">
                <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-blue-300/25 blur-3xl dark:bg-cyan-400/10" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-44 w-44 rounded-full bg-indigo-300/20 blur-3xl dark:bg-blue-400/10" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="max-w-xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-cyan-200">
                            <ClipboardCheck size={12} />
                            Staff Operations
                        </div>

                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Task Management
                        </h1>

                        <p className="mt-2 text-sm text-slate-600 dark:text-blue-100/70">
                            Assign tasks to staff, set priorities and monitor work progress.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchTasks(true)}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-4 py-3 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-white disabled:opacity-60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                        >
                            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            <Plus size={16} />
                            Assign New Task
                        </button>
                    </div>
                </div>

                <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-blue-200/70 pt-4 text-xs dark:border-white/10">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-blue-100/70">
                        <ListTodo size={14} />
                        {totalTasks} Total Tasks
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={14} />
                        {completionRate}% Completion
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-300">
                        <AlertTriangle size={14} />
                        {urgentTasks} Urgent Tasks
                    </span>
                </div>
            </section>

            {/* ─── Error Message ───────────────────────────────────── */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button
                        type="button"
                        onClick={() => fetchTasks(true)}
                        className="shrink-0 font-bold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ─── Summary Cards ───────────────────────────────────── */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Tasks"
                    value={totalTasks}
                    subtitle="All assigned tasks"
                    icon={ClipboardCheck}
                    color="blue"
                />
                <SummaryCard
                    title="Pending"
                    value={pendingTasks}
                    subtitle="Waiting to be completed"
                    icon={Clock}
                    color="amber"
                />
                <SummaryCard
                    title="In Progress"
                    value={inProgressTasks}
                    subtitle="Currently being handled"
                    icon={Users}
                    color="rose"
                />
                <SummaryCard
                    title="Completed"
                    value={completedTasks}
                    subtitle={`${completionRate}% overall completion`}
                    icon={CheckCircle2}
                    color="emerald"
                />
            </section>

            {/* ─── Task List ───────────────────────────────────────── */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {/* List Heading */}
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <ListTodo size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-white">
                                All Assigned Tasks
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {filteredTasks.length} of {totalTasks} tasks shown
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30 md:grid-cols-3">
                    <div className="relative md:col-span-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search task or staff..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <Filter
                            size={14}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    <div className="relative">
                        <FlagIcon />
                        <select
                            value={priorityFilter}
                            onChange={e => setPriorityFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="NORMAL">Normal</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                </div>

                {/* Active Filter Summary */}
                {hasFilters && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing filtered results
                        </p>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Task Details</th>
                                <th className="px-5 py-4">Assigned To</th>
                                <th className="px-5 py-4">Priority</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Created</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={index}>
                                        <td colSpan="6" className="px-6 py-3">
                                            <div className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-14 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                            <ClipboardCheck size={22} />
                                        </div>
                                        <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {hasFilters ? 'No matching tasks found' : 'No tasks assigned yet'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                            {hasFilters
                                                ? 'Try changing your search or filters.'
                                                : 'Assign a new task to get started.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map(task => (
                                    <tr
                                        key={task.id}
                                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="max-w-[280px] px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <FileText size={15} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                                                        {task.title}
                                                    </p>
                                                    {task.description && (
                                                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                {task.assignedToName || '—'}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                                                {task.assignedToEmail || ''}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <PriorityBadge priority={task.priority} />
                                        </td>

                                        <td className="px-5 py-4">
                                            <StatusBadge status={task.status} />
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1.5">
                                                <CalendarDays size={13} />
                                                {formatDate(task.createdAt)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(task.id)}
                                                disabled={deletingId !== null}
                                                title="Delete task"
                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                            >
                                                {deletingId === task.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Task Cards */}
                <div className="space-y-3 p-4 md:hidden">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                            />
                        ))
                    ) : filteredTasks.length === 0 ? (
                        <div className="py-10 text-center">
                            <ClipboardCheck size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                {hasFilters ? 'No matching tasks found' : 'No tasks assigned yet'}
                            </p>
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                {hasFilters ? 'Try changing your filters.' : 'Assign a new task to get started.'}
                            </p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div
                                key={task.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(task.id)}
                                        disabled={deletingId !== null}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                    >
                                        {deletingId === task.id ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={15} />
                                        )}
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <PriorityBadge priority={task.priority} />
                                    <StatusBadge status={task.status} />
                                </div>

                                <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                        <User size={13} className="text-slate-400" />
                                        <span className="font-semibold">
                                            {task.assignedToName || 'Unassigned'}
                                        </span>
                                    </div>
                                    {task.assignedToEmail && (
                                        <p className="break-all pl-5 text-[10px] text-slate-400 dark:text-slate-500">
                                            {task.assignedToEmail}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                                        <CalendarDays size={12} />
                                        Created {formatDate(task.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {!loading && filteredTasks.length > 0 && (
                    <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/30 sm:flex-row sm:items-center">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} />
                            Task records up to date
                        </div>
                    </div>
                )}
            </section>

            {/* ─── Assign Modal ────────────────────────────────────── */}
            <AssignTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateTask}
            />
        </div>
    );
};

// Small icon for the priority filter
const FlagIcon = () => (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <AlertTriangle size={14} />
    </span>
);
