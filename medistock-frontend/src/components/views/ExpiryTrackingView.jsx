import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services/adminService';
import {
    AlertTriangle,
    Clock,
    CalendarDays,
    XCircle,
    FileSpreadsheet,
    Search,
    RefreshCw,
    Package,
    ChevronDown,
    ArrowUpDown,
    ArrowUpRight,
    ShieldCheck,
    Activity,
    CheckCircle2,
    AlertCircle,
    X,
    Download,
    Pill,
    SlidersHorizontal,
    TrendingUp,
    Boxes,
    RotateCcw,
    CalendarClock,
    SearchX,
    CircleHelp,
} from 'lucide-react';

const DAY_MS = 1000 * 60 * 60 * 24;

const FILTERS = [
    { id: 'ALL', label: 'All medicines' },
    { id: 'EXPIRED', label: 'Expired' },
    { id: 'CRITICAL', label: '0–30 days' },
    { id: 'WARNING', label: '31–60 days' },
    { id: 'UPCOMING', label: '61–90 days' },
    { id: 'SAFE', label: '90+ days' },
];

const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;

    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) return null;

    // Compare calendar dates instead of elapsed hours to avoid timezone errors.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil((expiry.getTime() - today.getTime()) / DAY_MS);
};

const getRisk = (days) => {
    if (days === null) {
        return {
            label: 'Unknown',
            description: 'Expiry date unavailable',
            tone: 'slate',
            rank: 5,
        };
    }

    if (days < 0) {
        return {
            label: 'Expired',
            description: 'Immediate action required',
            tone: 'rose',
            rank: 0,
        };
    }

    if (days <= 30) {
        return {
            label: 'Critical',
            description: 'Expires within 30 days',
            tone: 'amber',
            rank: 1,
        };
    }

    if (days <= 60) {
        return {
            label: 'Warning',
            description: 'Expires within 31–60 days',
            tone: 'orange',
            rank: 2,
        };
    }

    if (days <= 90) {
        return {
            label: 'Upcoming',
            description: 'Expires within 61–90 days',
            tone: 'blue',
            rank: 3,
        };
    }

    return {
        label: 'Healthy',
        description: 'More than 90 days remaining',
        tone: 'emerald',
        rank: 4,
    };
};

const formatDate = (value) => {
    if (!value || Number.isNaN(new Date(value).getTime())) {
        return 'Not available';
    }

    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getMedicineId = (medicine) =>
    medicine.id ?? medicine.medicineId ?? medicine.medicine_id ?? '—';

const getBatch = (medicine) =>
    medicine.batchNumber ?? medicine.batchNo ?? medicine.batch_number ?? 'N/A';

const getQuantity = (medicine) => {
    const quantity = Number(medicine.quantity ?? medicine.stockQuantity ?? 0);
    return Number.isFinite(quantity) ? quantity : 0;
};

const escapeCsv = (value) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

const exportCsv = (medicines) => {
    const headers = [
        'Medicine ID',
        'Medicine Name',
        'Batch Number',
        'Expiry Date',
        'Days Remaining',
        'Stock Quantity',
        'Risk Status',
    ];

    const rows = medicines.map((medicine) => [
        getMedicineId(medicine),
        medicine.name ?? 'Unnamed medicine',
        getBatch(medicine),
        medicine.expiryDate ? formatDate(medicine.expiryDate) : 'Not available',
        medicine.daysRemaining ?? 'Unknown',
        getQuantity(medicine),
        medicine.risk.label,
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\r\n');

    const blob = new Blob(['\uFEFF', csv], {
        type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `medistock-expiry-audit-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const toneStyles = {
    rose: {
        card: 'border-rose-200/80 dark:border-rose-900/60',
        icon: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
        text: 'text-rose-700 dark:text-rose-300',
        badge: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
        dot: 'bg-rose-500',
        bar: 'bg-rose-500',
    },
    amber: {
        card: 'border-amber-200/80 dark:border-amber-900/60',
        icon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        text: 'text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
    },
    orange: {
        card: 'border-orange-200/80 dark:border-orange-900/60',
        icon: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
        text: 'text-orange-700 dark:text-orange-300',
        badge: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/20',
        dot: 'bg-orange-500',
        bar: 'bg-orange-500',
    },
    blue: {
        card: 'border-blue-200/80 dark:border-blue-900/60',
        icon: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
        dot: 'bg-blue-500',
        bar: 'bg-blue-500',
    },
    emerald: {
        card: 'border-emerald-200/80 dark:border-emerald-900/60',
        icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        text: 'text-emerald-700 dark:text-emerald-300',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
    },
    slate: {
        card: 'border-slate-200 dark:border-slate-700',
        icon: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        text: 'text-slate-600 dark:text-slate-300',
        badge: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
        dot: 'bg-slate-400',
        bar: 'bg-slate-400',
    },
};

function RiskBadge({ risk }) {
    const style = toneStyles[risk.tone] ?? toneStyles.slate;

    return (
        <span
            title={risk.description}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold ring-1 ring-inset ${style.badge}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {risk.label}
        </span>
    );
}

function SummaryCard({ title, count, subtitle, icon: Icon, tone, selected, onClick }) {
    const style = toneStyles[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`group relative min-w-0 overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-900 dark:shadow-none sm:p-5 ${style.card} ${
                selected ? 'ring-2 ring-blue-500/60 dark:ring-blue-400/60' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                        {title}
                    </p>
                    <p className={`mt-3 text-3xl font-extrabold tracking-tight ${style.text}`}>
                        {count}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                </div>

                <span className={`rounded-xl p-2.5 transition group-hover:scale-105 ${style.icon}`}>
                    <Icon size={20} strokeWidth={2} />
                </span>
            </div>

            <div className={`absolute inset-x-0 bottom-0 h-0.5 ${style.bar} opacity-70`} />
        </button>
    );
}

function LoadingState() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                ))}
            </div>
            <div className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-72 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
    );
}

export function ExpiryTrackingView() {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('risk');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showFilters, setShowFilters] = useState(false);

    const fetchMedicines = useCallback(async () => {
        setLoading(true);
        setLoadError('');

        try {
            const data = await adminService.getAllMedicines();

            if (!Array.isArray(data)) {
                throw new Error('The medicines service returned an unexpected response.');
            }

            setMedicines(data);
        } catch (error) {
            console.error('Failed to load expiry data:', error);
            setLoadError(
                error?.response?.data?.message ||
                error?.message ||
                'Unable to load medicine expiry information.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedicines();
    }, [fetchMedicines]);

    const processedMeds = useMemo(() => {
        return medicines.map((medicine) => {
            const daysRemaining = getDaysRemaining(medicine.expiryDate);

            return {
                ...medicine,
                daysRemaining,
                risk: getRisk(daysRemaining),
            };
        });
    }, [medicines]);

    const stats = useMemo(() => {
        const count = (predicate) => processedMeds.filter(predicate).length;

        return {
            expired: count((medicine) => medicine.daysRemaining !== null && medicine.daysRemaining < 0),
            critical: count((medicine) => medicine.daysRemaining !== null && medicine.daysRemaining >= 0 && medicine.daysRemaining <= 30),
            warning: count((medicine) => medicine.daysRemaining !== null && medicine.daysRemaining > 30 && medicine.daysRemaining <= 60),
            upcoming: count((medicine) => medicine.daysRemaining !== null && medicine.daysRemaining > 60 && medicine.daysRemaining <= 90),
            healthy: count((medicine) => medicine.daysRemaining !== null && medicine.daysRemaining > 90),
            unknown: count((medicine) => medicine.daysRemaining === null),
            total: processedMeds.length,
        };
    }, [processedMeds]);

    const filteredMeds = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        const filtered = processedMeds.filter((medicine) => {
            const name = String(medicine.name ?? '').toLowerCase();
            const batch = String(getBatch(medicine)).toLowerCase();
            const id = String(getMedicineId(medicine)).toLowerCase();

            const matchesSearch =
                !query ||
                name.includes(query) ||
                batch.includes(query) ||
                id.includes(query);

            if (!matchesSearch) return false;

            const days = medicine.daysRemaining;

            switch (filter) {
                case 'EXPIRED':
                    return days !== null && days < 0;
                case 'CRITICAL':
                    return days !== null && days >= 0 && days <= 30;
                case 'WARNING':
                    return days !== null && days > 30 && days <= 60;
                case 'UPCOMING':
                    return days !== null && days > 60 && days <= 90;
                case 'SAFE':
                    return days !== null && days > 90;
                default:
                    return true;
            }
        });

        const direction = sortDirection === 'asc' ? 1 : -1;

        return [...filtered].sort((a, b) => {
            let comparison = 0;

            if (sortBy === 'name') {
                comparison = String(a.name ?? '').localeCompare(String(b.name ?? ''));
            } else if (sortBy === 'expiry') {
                comparison = (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
            } else if (sortBy === 'stock') {
                comparison = getQuantity(a) - getQuantity(b);
            } else {
                comparison = (a.risk.rank ?? 5) - (b.risk.rank ?? 5);
                if (comparison === 0) {
                    comparison = (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
                }
            }

            return comparison * direction;
        });
    }, [processedMeds, searchTerm, filter, sortBy, sortDirection]);

    const riskExposure = stats.total
        ? Math.round(((stats.expired + stats.critical) / stats.total) * 100)
        : 0;

    const clearFilters = () => {
        setSearchTerm('');
        setFilter('ALL');
        setSortBy('risk');
        setSortDirection('asc');
    };

    const toggleSort = (column) => {
        if (sortBy === column) {
            setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
        }
    };

    const activeFilterLabel = FILTERS.find((item) => item.id === filter)?.label ?? 'All medicines';

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 transition-colors duration-200 dark:bg-[#080d18] dark:text-slate-100 sm:px-6 sm:py-7 xl:px-8">
            <div className="mx-auto max-w-[1600px] space-y-6">

                {/* Header */}
                <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                            <CalendarClock size={23} />
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    Expiry Intelligence
                                </h1>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20">
                                    Inventory control
                                </span>
                            </div>

                           

                            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <Activity size={13} />
                                Expiry monitoring
                                <span>·</span>
                                {stats.total} medicine records
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={fetchMedicines}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => exportCsv(filteredMeds)}
                            disabled={loading || filteredMeds.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download size={16} />
                            Export audit
                        </button>
                    </div>
                </header>

                {loading ? (
                    <LoadingState />
                ) : loadError ? (
                    <section className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900/50 dark:bg-slate-900">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            <AlertCircle size={26} />
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                            Couldn’t load expiry data
                        </h2>
                        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                            {loadError}
                        </p>
                        <button
                            type="button"
                            onClick={fetchMedicines}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            <RefreshCw size={15} />
                            Try again
                        </button>
                    </section>
                ) : (
                    <>
                        {/* Priority overview */}
                        <section>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        Expiry risk overview
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Select a card to filter the inventory below.
                                    </p>
                                </div>
                                <span className="hidden rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 sm:inline-flex">
                                    <ShieldCheck size={14} className="mr-1.5 text-emerald-500" />
                                    Live inventory snapshot
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard
                                    title="Already expired"
                                    count={stats.expired}
                                    subtitle="Remove from usable stock"
                                    icon={XCircle}
                                    tone="rose"
                                    selected={filter === 'EXPIRED'}
                                    onClick={() => setFilter(filter === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
                                />
                                <SummaryCard
                                    title="Critical · 0–30 days"
                                    count={stats.critical}
                                    subtitle="Prioritize immediate action"
                                    icon={AlertTriangle}
                                    tone="amber"
                                    selected={filter === 'CRITICAL'}
                                    onClick={() => setFilter(filter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
                                />
                                <SummaryCard
                                    title="Warning · 31–60 days"
                                    count={stats.warning}
                                    subtitle="Review and plan stock rotation"
                                    icon={Clock}
                                    tone="orange"
                                    selected={filter === 'WARNING'}
                                    onClick={() => setFilter(filter === 'WARNING' ? 'ALL' : 'WARNING')}
                                />
                                <SummaryCard
                                    title="Upcoming · 61–90 days"
                                    count={stats.upcoming}
                                    subtitle="Monitor upcoming expiry"
                                    icon={CalendarDays}
                                    tone="blue"
                                    selected={filter === 'UPCOMING'}
                                    onClick={() => setFilter(filter === 'UPCOMING' ? 'ALL' : 'UPCOMING')}
                                />
                            </div>
                        </section>

                        {/* Risk exposure banner */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:p-6">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Inventory risk exposure
                                        </h2>
                                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                            Share of medicine records that are expired or within the next 30 days of expiry.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            High-priority records
                                        </span>
                                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            {riskExposure}%
                                        </span>
                                    </div>
                                    <div
                                        className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                                        role="progressbar"
                                        aria-label="High-priority expiry exposure"
                                        aria-valuenow={riskExposure}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    >
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-500"
                                            style={{ width: `${riskExposure}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        <span>{stats.expired + stats.critical} high-priority records</span>
                                        <span>{stats.healthy} healthy · {stats.unknown} unknown expiry</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Filters and table */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
                                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Boxes size={18} className="text-blue-600 dark:text-blue-400" />
                                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                                Medicine expiry register
                                            </h2>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Search, filter and review individual medicine records.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative min-w-0 sm:w-72">
                                            <Search
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="search"
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                placeholder="Search medicine, ID or batch..."
                                                aria-label="Search medicine, ID or batch"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-950"
                                            />
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchTerm('')}
                                                    aria-label="Clear search"
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowFilters((current) => !current)}
                                            aria-expanded={showFilters}
                                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                                                showFilters
                                                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                        >
                                            <SlidersHorizontal size={15} />
                                            Sort
                                            <ChevronDown size={14} className={`transition ${showFilters ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                                    {FILTERS.map((item) => {
                                        const active = filter === item.id;
                                        const countByFilter = {
                                            ALL: stats.total,
                                            EXPIRED: stats.expired,
                                            CRITICAL: stats.critical,
                                            WARNING: stats.warning,
                                            UPCOMING: stats.upcoming,
                                            SAFE: stats.healthy,
                                        }[item.id];

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => setFilter(item.id)}
                                                aria-pressed={active}
                                                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                                                    active
                                                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {item.label}
                                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                                    active
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-white text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                    {countByFilter}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {showFilters && (
                                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:items-center">
                                        <label className="flex flex-1 items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                            Sort records
                                            <select
                                                value={sortBy}
                                                onChange={(event) => setSortBy(event.target.value)}
                                                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:max-w-xs"
                                            >
                                                <option value="risk">Highest risk first</option>
                                                <option value="expiry">Expiry date</option>
                                                <option value="name">Medicine name</option>
                                                <option value="stock">Stock quantity</option>
                                            </select>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                        >
                                            <ArrowUpDown size={14} />
                                            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:px-5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredMeds.length}</span> of{' '}
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{stats.total}</span> records
                                    <span className="mx-1.5">·</span>
                                    {activeFilterLabel}
                                </p>

                                {(filter !== 'ALL' || searchTerm || sortBy !== 'risk' || sortDirection !== 'asc') && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        <RotateCcw size={13} />
                                        Reset view
                                    </button>
                                )}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[920px] text-left text-sm">
                                    <thead className="bg-white dark:bg-slate-900">
                                        <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                            <th className="px-5 py-4">Medicine / ID</th>
                                            <th className="px-4 py-4">Batch</th>
                                            <th className="px-4 py-4">
                                                <button type="button" onClick={() => toggleSort('expiry')} className="inline-flex items-center gap-1.5 hover:text-blue-600">
                                                    Expiry date <ArrowUpDown size={12} />
                                                </button>
                                            </th>
                                            <th className="px-4 py-4">Shelf life</th>
                                            <th className="px-4 py-4">
                                                <button type="button" onClick={() => toggleSort('stock')} className="inline-flex items-center gap-1.5 hover:text-blue-600">
                                                    Stock <ArrowUpDown size={12} />
                                                </button>
                                            </th>
                                            <th className="px-4 py-4">Risk status</th>
                                            <th className="px-4 py-4">Priority</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredMeds.map((medicine) => {
                                            const days = medicine.daysRemaining;
                                            const style = toneStyles[medicine.risk.tone] ?? toneStyles.slate;
                                            const quantity = getQuantity(medicine);

                                            return (
                                                <tr
                                                    key={`${getMedicineId(medicine)}-${getBatch(medicine)}`}
                                                    className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-500/15 dark:group-hover:text-blue-300">
                                                                <Pill size={18} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="max-w-[230px] truncate font-bold text-slate-800 dark:text-slate-100">
                                                                    {medicine.name || 'Unnamed medicine'}
                                                                </p>
                                                                <p className="mt-1 text-[11px] text-slate-400">
                                                                    MED-{getMedicineId(medicine)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex max-w-[150px] truncate rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {getBatch(medicine)}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <p className="whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                                                            {formatDate(medicine.expiryDate)}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {days === null ? (
                                                            <span className="text-xs text-slate-400">Unknown</span>
                                                        ) : (
                                                            <div>
                                                                <p className={`whitespace-nowrap text-xs font-bold ${style.text}`}>
                                                                    {days < 0
                                                                        ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
                                                                        : `${days} day${days === 1 ? '' : 's'} left`}
                                                                </p>
                                                                <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                                    <div
                                                                        className={`h-full rounded-full ${style.bar}`}
                                                                        style={{ width: `${Math.max(4, Math.min(100, days < 0 ? 100 : (days / 180) * 100))}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Package size={15} className="text-slate-400" />
                                                            <span className={`font-bold ${quantity <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {quantity.toLocaleString('en-IN')}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">units</span>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <RiskBadge risk={medicine.risk} />
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                                {medicine.risk.rank === 0 ? 'Immediate' :
                                                                    medicine.risk.rank === 1 ? 'High' :
                                                                        medicine.risk.rank === 2 ? 'Medium' :
                                                                            medicine.risk.rank === 3 ? 'Monitor' :
                                                                                medicine.risk.rank === 4 ? 'Low' : 'Review'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile-friendly record cards */}
                            <div className="space-y-3 p-3 md:hidden">
                                {filteredMeds.map((medicine) => {
                                    const days = medicine.daysRemaining;
                                    const style = toneStyles[medicine.risk.tone] ?? toneStyles.slate;

                                    return (
                                        <article
                                            key={`${getMedicineId(medicine)}-${getBatch(medicine)}`}
                                            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    <Pill size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">
                                                        {medicine.name || 'Unnamed medicine'}
                                                    </h3>
                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        MED-{getMedicineId(medicine)}
                                                    </p>
                                                    <div className="mt-2">
                                                        <RiskBadge risk={medicine.risk} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Batch number</p>
                                                    <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        {getBatch(medicine)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expiry date</p>
                                                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                                        {formatDate(medicine.expiryDate)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shelf life</p>
                                                    <p className={`mt-1 text-xs font-bold ${style.text}`}>
                                                        {days === null ? 'Unknown' : days < 0 ? `${Math.abs(days)} days overdue` : `${days} days left`}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current stock</p>
                                                    <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        {getQuantity(medicine).toLocaleString('en-IN')} units
                                                    </p>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {filteredMeds.length === 0 && (
                                <div className="px-5 py-16 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                        {searchTerm || filter !== 'ALL' ? <SearchX size={25} /> : <Package size={25} />}
                                    </div>
                                    <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {searchTerm || filter !== 'ALL' ? 'No matching medicines' : 'No medicine records yet'}
                                    </h3>
                                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                                        {searchTerm || filter !== 'ALL'
                                            ? 'Try another search term or change the expiry filter to see more records.'
                                            : 'Medicine records will appear here once inventory data is available.'}
                                    </p>
                                    {(searchTerm || filter !== 'ALL') && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                                        >
                                            <RotateCcw size={13} />
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            )}

                            {filteredMeds.length > 0 && (
                                <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                    <span>Displaying {filteredMeds.length} record{filteredMeds.length === 1 ? '' : 's'}</span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <CircleHelp size={12} />
                                        Expiry risk is based on the medicine expiry date.
                                    </span>
                                </div>
                            )}
                        </section>

                        {/* Guidance */}
                        <section className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-500/5 sm:p-5">
                            <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                    Expiry handling reminder
                                </h3>
                                <p className="mt-1 text-xs leading-5 text-blue-800/80 dark:text-blue-200/70">
                                    Verify batch details before taking action. Expired medicines should be segregated from usable stock and handled according to your pharmacy’s approved disposal procedures. This page reports expiry risk; it does not automatically change stock quantities or dispose of medicines.
                                </p>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
