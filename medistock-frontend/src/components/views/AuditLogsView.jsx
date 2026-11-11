
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services/adminService';
import {
    History,
    Search,
    Filter,
    RefreshCw,
    ShieldCheck,
    Activity,
    Users,
    ClipboardList,
    Clock3,
    CalendarDays,
    UserRound,
    ChevronDown,
    X,
    FileSearch,
    AlertCircle,
    Loader2,
    LogIn,
    Plus,
    Pencil,
    Trash2,
    PackageCheck,
    ArrowUpRight,
} from 'lucide-react';

const ACTION_OPTIONS = [
    { value: 'ALL', label: 'All Actions' },
    { value: 'LOGIN', label: 'Logins' },
    { value: 'CREATE_MEDICINE', label: 'Medicine Created' },
    { value: 'UPDATE_MEDICINE', label: 'Medicine Updated' },
    { value: 'DELETE_MEDICINE', label: 'Medicine Deleted' },
    { value: 'CREATE_PURCHASE_ORDER', label: 'PO Created' },
    { value: 'UPDATE_PO_STATUS', label: 'PO Status' },
    { value: 'CREATE_USER', label: 'User Created' },
    { value: 'ASSIGN_TASK', label: 'Task Assigned' },
];

const getActionConfig = (action = '') => {
    const value = action.toUpperCase();

    if (value.includes('DELETE')) {
        return {
            icon: Trash2,
            label: 'Deletion',
            style: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
            dot: 'bg-rose-500',
        };
    }

    if (value.includes('CREATE')) {
        return {
            icon: Plus,
            label: 'Creation',
            style: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
            dot: 'bg-emerald-500',
        };
    }

    if (value.includes('UPDATE')) {
        return {
            icon: Pencil,
            label: 'Update',
            style: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
            dot: 'bg-amber-500',
        };
    }

    if (value.includes('LOGIN')) {
        return {
            icon: LogIn,
            label: 'Authentication',
            style: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
            dot: 'bg-blue-500',
        };
    }

    if (value.includes('RECEIVE')) {
        return {
            icon: PackageCheck,
            label: 'Receiving',
            style: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/20',
            dot: 'bg-purple-500',
        };
    }

    return {
        icon: Activity,
        label: 'Activity',
        style: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600',
        dot: 'bg-slate-400',
    };
};

const getRoleConfig = (role = '') => {
    const value = role.toUpperCase();

    const styles = {
        ADMIN: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
        PHARMACIST: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
        SUPPLIER: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20',
        STAFF: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    };

    return styles[value] || 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600';
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'Date unavailable';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const formatAction = (action = '') => {
    return action.replace(/_/g, ' ');
};

const StatCard = ({ icon: Icon, label, value, description, color }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/70 sm:p-5">
        <div className={`absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-[0.08] blur-xl transition-transform duration-500 group-hover:scale-150 ${color.bg}`} />

        <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                    {label}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {value}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {description}
                </p>
            </div>

            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color.icon}`}>
                <Icon size={19} />
            </div>
        </div>
    </div>
);

const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-3 p-5">
        {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="hidden h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700 sm:block" />
            </div>
        ))}
    </div>
);

export const AuditLogsView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('ALL');

    const fetchLogs = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError('');

        try {
            const data = await adminService.getAuditLogs();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            setError('Unable to load audit logs. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();

        return logs.filter((log) => {
            const matchesSearch =
                !query ||
                log.userEmail?.toLowerCase().includes(query) ||
                log.details?.toLowerCase().includes(query) ||
                log.action?.toLowerCase().includes(query) ||
                log.userRole?.toLowerCase().includes(query);

            const matchesFilter =
                filterAction === 'ALL' || log.action === filterAction;

            return matchesSearch && matchesFilter;
        });
    }, [logs, search, filterAction]);

    const uniqueUsers = useMemo(
        () => new Set(logs.map((log) => log.userEmail).filter(Boolean)).size,
        [logs]
    );

    const loginCount = useMemo(
        () => logs.filter((log) => log.action?.includes('LOGIN')).length,
        [logs]
    );

    const changeCount = useMemo(
        () => logs.filter((log) =>
            ['CREATE', 'UPDATE', 'DELETE'].some((action) =>
                log.action?.includes(action)
            )
        ).length,
        [logs]
    );

    const hasFilters = search.trim() !== '' || filterAction !== 'ALL';

    const clearFilters = () => {
        setSearch('');
        setFilterAction('ALL');
    };

    return (
        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-7">

            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-violet-50 p-5 shadow-sm dark:border-slate-700/70 dark:from-[#111c32] dark:via-[#101b30] dark:to-[#202047] sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm dark:bg-violet-500/15 dark:text-violet-300 sm:h-14 sm:w-14">
                            <History size={27} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                    Audit Trail
                                </h1>
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Activity Monitor
                                </span>
                            </div>

                            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                                Monitor system activity, track user actions and review important security events.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => fetchLogs(true)}
                        disabled={loading || refreshing}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 dark:hover:text-violet-300 sm:self-center"
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Logs'}
                    </button>
                </div>

                <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200/80 pt-4 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        System activity history
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} className="text-violet-500" />
                        Timestamped events
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Activity size={14} className="text-blue-500" />
                        User action tracking
                    </span>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={ClipboardList}
                    label="Total Events"
                    value={logs.length}
                    description="Recorded system activities"
                    color={{
                        bg: 'bg-violet-500',
                        icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
                    }}
                />
                <StatCard
                    icon={Users}
                    label="Active Users"
                    value={uniqueUsers}
                    description="Unique users in audit history"
                    color={{
                        bg: 'bg-blue-500',
                        icon: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
                    }}
                />
                <StatCard
                    icon={LogIn}
                    label="Login Events"
                    value={loginCount}
                    description="Recorded login activities"
                    color={{
                        bg: 'bg-emerald-500',
                        icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
                    }}
                />
                <StatCard
                    icon={Pencil}
                    label="Data Changes"
                    value={changeCount}
                    description="Create, update and delete events"
                    color={{
                        bg: 'bg-amber-500',
                        icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
                    }}
                />
            </div>

            {/* Logs Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">

                {/* Section heading */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                            <Activity size={17} className="text-violet-500" />
                            Activity Records
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            Search and filter recorded system events
                        </p>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        {filtered.length} results
                    </div>
                </div>

                {/* Search and filters */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:flex-row sm:items-center">
                    <div className="group relative flex-1">
                        <Search
                            size={17}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-violet-500"
                        />
                        <input
                            type="text"
                            placeholder="Search user, action, role or details..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                aria-label="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="relative sm:w-64">
                        <Filter
                            size={15}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-violet-500"
                        >
                            {ACTION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                        >
                            <X size={14} />
                            Clear
                        </button>
                    )}
                </div>

                {/* Error state */}
                {error && (
                    <div className="m-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                            <AlertCircle size={17} />
                            {error}
                        </div>
                        <button
                            onClick={() => fetchLogs()}
                            className="text-xs font-bold text-rose-700 underline underline-offset-4 dark:text-rose-300"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? null : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <FileSearch size={30} />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                            {logs.length === 0 ? 'No activity recorded yet' : 'No matching records found'}
                        </h3>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                            {logs.length === 0
                                ? 'System activities will appear here as users interact with MediStock.'
                                : 'Try changing your search term or selecting a different action filter.'}
                        </p>
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[850px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
                                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Timestamp
                                        </th>
                                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            User
                                        </th>
                                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Role
                                        </th>
                                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Action
                                        </th>
                                        <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Details
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.map((log, index) => {
                                        const action = getActionConfig(log.action);
                                        const ActionIcon = action.icon;

                                        return (
                                            <tr
                                                key={log.id ?? `${log.timestamp}-${index}`}
                                                className="group transition-colors hover:bg-violet-50/40 dark:hover:bg-violet-500/[0.04]"
                                            >
                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            <CalendarDays size={15} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                                {formatDate(log.timestamp)}
                                                            </p>
                                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                                Event #{log.id ?? '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-0 items-center gap-2.5">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                                            <UserRound size={15} />
                                                        </div>
                                                        <span className="max-w-[190px] truncate text-xs font-semibold text-slate-700 dark:text-slate-200" title={log.userEmail}>
                                                            {log.userEmail || 'Unknown user'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ring-inset ${getRoleConfig(log.userRole)}`}>
                                                        {log.userRole || 'UNKNOWN'}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ring-inset ${action.style}`}>
                                                        <ActionIcon size={12} />
                                                        {formatAction(log.action || 'UNKNOWN')}
                                                    </span>
                                                </td>

                                                <td className="max-w-[300px] px-5 py-4">
                                                    <p
                                                        className="truncate text-xs text-slate-600 dark:text-slate-400"
                                                        title={log.details || ''}
                                                    >
                                                        {log.details || 'No additional details'}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="space-y-3 p-3 md:hidden">
                            {filtered.map((log, index) => {
                                const action = getActionConfig(log.action);
                                const ActionIcon = action.icon;

                                return (
                                    <div
                                        key={log.id ?? `${log.timestamp}-${index}`}
                                        className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-violet-500/30"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                                    <UserRound size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                                                        {log.userEmail || 'Unknown user'}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-slate-400">
                                                        {log.userRole || 'UNKNOWN'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${action.style}`}>
                                                <ActionIcon size={11} />
                                                {formatAction(log.action || 'UNKNOWN')}
                                            </span>
                                        </div>

                                        <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
                                            <p className="break-words text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                {log.details || 'No additional details'}
                                            </p>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <span className={`rounded-md px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getRoleConfig(log.userRole)}`}>
                                                {log.userRole || 'UNKNOWN'}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
                                                <Clock3 size={12} />
                                                {formatDate(log.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Footer */}
                {!loading && !error && logs.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> of{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">{logs.length}</span> audit entries
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck size={13} />
                            Audit history overview
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
