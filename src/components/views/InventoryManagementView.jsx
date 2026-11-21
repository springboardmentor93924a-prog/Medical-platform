import React, { useMemo, useState } from 'react';
import {
    Search,
    Plus,
    Minus,
    Edit,
    Trash2,
    Download,
    PackageOpen,
    Package,
    AlertTriangle,
    CalendarClock,
    Boxes,
    ArrowUpRight,
    ArrowDownRight,
    X,
    RefreshCw,
    SlidersHorizontal
} from 'lucide-react';

export const InventoryManagementView = ({
    medicines = [],
    onOpenAddModal,
    onEditMedicine,
    onDeleteMedicine,
    onAdjustStock
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const safeMedicines = Array.isArray(medicines) ? medicines : [];

    const filteredMeds = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return safeMedicines.filter((med) => {
            const matchesSearch =
                (med.name || '').toLowerCase().includes(query) ||
                (med.genericName || '').toLowerCase().includes(query) ||
                (med.batchNumber || '').toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === 'ALL' || med.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [safeMedicines, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: safeMedicines.length,
        inStock: safeMedicines.filter(m => m.status === 'IN_STOCK').length,
        lowStock: safeMedicines.filter(m => m.status === 'LOW_STOCK').length,
        attention: safeMedicines.filter(m =>
            ['OUT_OF_STOCK', 'EXPIRED', 'EXPIRING_SOON'].includes(m.status)
        ).length
    }), [safeMedicines]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
    };

    const exportCSV = () => {
        if (!filteredMeds.length) return;

        const headers = [
            'Medicine Name',
            'Generic Name',
            'Batch Number',
            'Quantity',
            'Minimum Quantity',
            'Expiry Date',
            'Storage Condition',
            'Unit Price',
            'Status'
        ];

        const escapeCSV = (value) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;

        const rows = filteredMeds.map(med => [
            med.name,
            med.genericName,
            med.batchNumber,
            med.quantity,
            med.minQuantity,
            med.expiryDate,
            med.storageCondition,
            med.unitPrice,
            med.status
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(escapeCSV).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'medistock-inventory.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const getStatusStyle = (status) => {
        const styles = {
            IN_STOCK:
                'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20',
            LOW_STOCK:
                'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20',
            OUT_OF_STOCK:
                'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20',
            EXPIRED:
                'bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-700/50 dark:text-slate-300 dark:ring-slate-500/30',
            EXPIRING_SOON:
                'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20'
        };

        return styles[status] ||
            'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/30';
    };

    const formatStatus = (status) =>
        (status || 'UNKNOWN').replace(/_/g, ' ');

    const statCards = [
        {
            label: 'Total Products',
            value: stats.total,
            icon: Package,
            color: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-50 dark:bg-blue-400/10',
            description: 'Registered medicines'
        },
        {
            label: 'In Stock',
            value: stats.inStock,
            icon: Boxes,
            color: 'text-emerald-600 dark:text-emerald-400',
            iconBg: 'bg-emerald-50 dark:bg-emerald-400/10',
            description: 'Available inventory'
        },
        {
            label: 'Low Stock',
            value: stats.lowStock,
            icon: AlertTriangle,
            color: 'text-amber-600 dark:text-amber-400',
            iconBg: 'bg-amber-50 dark:bg-amber-400/10',
            description: 'Restock recommended'
        },
        {
            label: 'Needs Attention',
            value: stats.attention,
            icon: CalendarClock,
            color: 'text-rose-600 dark:text-rose-400',
            iconBg: 'bg-rose-50 dark:bg-rose-400/10',
            description: 'Expiry or stock issue'
        }
    ];

    return (
        <div className="min-h-full space-y-5 bg-slate-50/70 pb-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20">
                        <PackageOpen size={25} />
                    </div>

                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                            Inventory Management
                        </h1>
                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                            Monitor medicine stock, batches and expiry details.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={exportCSV}
                        disabled={!filteredMeds.length}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:text-sm"
                    >
                        <Download size={15} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500 active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-400 sm:text-sm"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        Register Product
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                                    <Icon size={19} className={card.color} />
                                </div>

                                <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                    Inventory
                                </span>
                            </div>

                            <div className="mt-4">
                                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {card.value}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    {card.label}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                                    {card.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Inventory Table Container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                {/* Table Heading */}
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                            Medicine Registry
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            View and manage your registered medicine batches.
                        </p>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Package size={14} />
                        {filteredMeds.length} of {safeMedicines.length} products
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:px-5">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            placeholder="Search medicine, generic name or batch..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:bg-slate-950 sm:text-sm"
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <SlidersHorizontal
                            size={15}
                            className="shrink-0 text-slate-400"
                        />

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:min-w-[165px] sm:text-sm"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="IN_STOCK">In Stock</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="EXPIRING_SOON">Expiring Soon</option>
                        </select>

                        {(searchTerm || statusFilter !== 'ALL') && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Responsive Table */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-xs">
                        <thead className="bg-slate-50/90 dark:bg-slate-800/50">
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                {[
                                    'Medicine',
                                    'Batch / Lot',
                                    'Current Stock',
                                    'Expiry Date',
                                    'Storage',
                                    'Unit Price',
                                    'Status',
                                    'Actions'
                                ].map((heading, index) => (
                                    <th
                                        key={heading}
                                        className={`whitespace-nowrap px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                                            index === 7 ? 'text-right' : ''
                                        }`}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredMeds.map((med) => {
                                const quantity = Number(med.quantity) || 0;
                                const minQuantity = Number(med.minQuantity) || 0;
                                const lowStock =
                                    med.status === 'LOW_STOCK' ||
                                    med.status === 'OUT_OF_STOCK' ||
                                    quantity <= minQuantity;

                                const expiryDate = med.expiryDate
                                    ? new Date(med.expiryDate).toLocaleDateString()
                                    : '—';

                                return (
                                    <tr
                                        key={med.id}
                                        className="group transition-colors hover:bg-emerald-50/40 dark:hover:bg-slate-800/60"
                                    >
                                        {/* Medicine */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:border-emerald-400/20 dark:group-hover:bg-emerald-400/10 dark:group-hover:text-emerald-400">
                                                    <Package size={17} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="max-w-[190px] truncate font-semibold text-slate-800 dark:text-slate-100">
                                                        {med.name || 'Unnamed medicine'}
                                                    </p>
                                                    {med.genericName && (
                                                        <p className="mt-1 max-w-[190px] truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                            {med.genericName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Batch */}
                                        <td className="px-5 py-4">
                                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {med.batchNumber || 'N/A'}
                                            </span>
                                        </td>

                                        {/* Stock Controls */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    title="Decrease stock by one"
                                                    aria-label={`Decrease stock for ${med.name}`}
                                                    disabled={!onAdjustStock || quantity <= 0}
                                                    onClick={() =>
                                                        onAdjustStock?.(
                                                            med.id,
                                                            -1,
                                                            'Manual Adjustment'
                                                        )
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10 dark:hover:text-rose-400"
                                                >
                                                    <Minus size={13} />
                                                </button>

                                                <span className={`min-w-8 text-center text-sm font-bold tabular-nums ${
                                                    lowStock
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-slate-800 dark:text-slate-100'
                                                }`}>
                                                    {quantity}
                                                </span>

                                                <button
                                                    type="button"
                                                    title="Increase stock by one"
                                                    aria-label={`Increase stock for ${med.name}`}
                                                    disabled={!onAdjustStock}
                                                    onClick={() =>
                                                        onAdjustStock?.(
                                                            med.id,
                                                            1,
                                                            'Manual Adjustment'
                                                        )
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-400"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>

                                            <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                                                Min. {minQuantity}
                                            </p>
                                        </td>

                                        {/* Expiry */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                <CalendarClock
                                                    size={13}
                                                    className="text-slate-400"
                                                />
                                                {expiryDate}
                                            </div>
                                        </td>

                                        {/* Storage */}
                                        <td className="px-5 py-4">
                                            <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                {med.storageCondition || 'Room Temp'}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="px-5 py-4">
                                            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                                                ${Number(med.unitPrice || 0).toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-bold ring-1 ring-inset ${getStatusStyle(med.status)}`}>
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                {formatStatus(med.status)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    title="Edit medicine"
                                                    aria-label={`Edit ${med.name}`}
                                                    onClick={() => onEditMedicine?.(med)}
                                                    disabled={!onEditMedicine}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-blue-400/20 dark:hover:bg-blue-400/10 dark:hover:text-blue-400"
                                                >
                                                    <Edit size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Delete medicine"
                                                    aria-label={`Delete ${med.name}`}
                                                    onClick={() => onDeleteMedicine?.(med)}
                                                    disabled={!onDeleteMedicine}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:border-rose-400/20 dark:hover:bg-rose-400/10 dark:hover:text-rose-400"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Empty State */}
                            {filteredMeds.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                            <PackageOpen size={25} />
                                        </div>

                                        <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                            No medicines found
                                        </h3>

                                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                                            {searchTerm || statusFilter !== 'ALL'
                                                ? 'Try changing your search or status filter.'
                                                : 'Your inventory is empty. Register a product to get started.'}
                                        </p>

                                        {(searchTerm || statusFilter !== 'ALL') ? (
                                            <button
                                                type="button"
                                                onClick={clearFilters}
                                                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                <RefreshCw size={13} />
                                                Reset filters
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={onOpenAddModal}
                                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                                            >
                                                <Plus size={14} />
                                                Register Product
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                {filteredMeds.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3 text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredMeds.length}</span> products
                        </span>

                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Inventory data
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
