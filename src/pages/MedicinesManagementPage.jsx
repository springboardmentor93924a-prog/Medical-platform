
import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import {
    Search, Plus, Edit, Trash2, RefreshCw, ArrowUpDown,
    Pill, Package, AlertTriangle, CalendarClock, Boxes,
    ChevronDown, ArrowUp, ArrowDown
} from 'lucide-react';

export default function MedicinesManagementPage({
    onOpenAddModal,
    onEditMedicine,
    onDeleteMedicine,
    isAdmin,
    canEdit,
    canDelete
}) {
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({
        key: 'id',
        direction: 'asc'
    });

    const fetchMeds = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllMedicines();
            setMedicines(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch medicines:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeds();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this medicine?')) return;

        try {
            await adminService.deleteMedicine(id);
            await fetchMeds();
        } catch (err) {
            console.error('Failed to delete medicine:', err);
        }
    };

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === 'asc'
                    ? 'desc'
                    : 'asc'
        }));
    };

    const sortedMeds = [...medicines].sort((a, b) => {
        const first = a[sortConfig.key];
        const second = b[sortConfig.key];

        if (first == null && second == null) return 0;
        if (first == null) return 1;
        if (second == null) return -1;

        const firstValue =
            typeof first === 'string' ? first.toLowerCase() : first;
        const secondValue =
            typeof second === 'string' ? second.toLowerCase() : second;

        if (firstValue < secondValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (firstValue > secondValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredMeds = sortedMeds.filter((medicine) => {
        const term = searchTerm.toLowerCase().trim();

        return [
            medicine.name,
            medicine.batchNumber,
            medicine.category,
            medicine.genericName,
            medicine.genericFormula,
            medicine.manufacturer,
            medicine.supplierName,
            medicine.id?.toString()
        ].some((value) => value?.toString().toLowerCase().includes(term));
    });

    const lowStockCount = medicines.filter(
        (m) => m.status === 'LOW_STOCK'
    ).length;

    const expiredCount = medicines.filter(
        (m) => m.status === 'EXPIRED'
    ).length;

    const availableCount = medicines.filter(
        (m) => m.status === 'IN_STOCK'
    ).length;

    const SortButton = ({ label, field }) => (
        <button
            type="button"
            onClick={() => handleSort(field)}
            className="inline-flex items-center gap-1.5 transition hover:text-blue-600 dark:hover:text-cyan-300"
        >
            {label}
            {sortConfig.key === field ? (
                sortConfig.direction === 'asc' ?
                    <ArrowUp size={13} /> :
                    <ArrowDown size={13} />
            ) : (
                <ArrowUpDown size={13} className="opacity-50" />
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-7 lg:px-8">

            <div className="mx-auto max-w-[1500px] space-y-6">

                {/* Page Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-cyan-300">
                            <Pill size={16} />
                            Inventory Management
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Medicines
                        </h1>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage medicine details, stock levels and expiry dates.
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenAddModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.98] dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
                        >
                            <Plus size={17} />
                            Add Medicine
                        </button>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                                Total Medicines
                            </span>
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                                <Boxes size={18} />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                            {medicines.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Registered items
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                                Available
                            </span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <Package size={18} />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {availableCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            In stock
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                                Low Stock
                            </span>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                                <AlertTriangle size={18} />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {lowStockCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Need replenishment
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
                                Expired
                            </span>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
                                <CalendarClock size={18} />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {expiredCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Require attention
                        </p>
                    </div>
                </div>

                {/* Medicines Table Container */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    {/* Search and Toolbar */}
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                placeholder="Search name, code, category, supplier..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {filteredMeds.length} result{filteredMeds.length !== 1 ? 's' : ''}
                            </span>

                            <button
                                type="button"
                                onClick={fetchMeds}
                                disabled={loading}
                                title="Refresh medicines"
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Medicine</th>
                                    <th className="px-5 py-4 font-semibold">Code</th>
                                    <th className="px-5 py-4 font-semibold">Category</th>
                                    <th className="px-5 py-4 font-semibold">Pricing</th>
                                    <th className="px-5 py-4 font-semibold">
                                        <SortButton label="Stock" field="quantity" />
                                    </th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">
                                        <SortButton label="Expiry Date" field="expiryDate" />
                                    </th>
                                    <th className="px-5 py-4 font-semibold">Supplier</th>
                                    {isAdmin && (<th className="px-5 py-4 text-right font-semibold">Actions</th>)}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-5 py-16 text-center">
                                            <RefreshCw size={24} className="mx-auto animate-spin text-blue-500 dark:text-cyan-400" />
                                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                                Loading medicines...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredMeds.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-5 py-16 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                                <Pill size={23} />
                                            </div>
                                            <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
                                                No medicines found
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Try another search term or refresh the list.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMeds.map((m) => {
                                        const status = m.status || 'IN_STOCK';
                                        const isExpired = status === 'EXPIRED';
                                        const isLowStock = status === 'LOW_STOCK';

                                        return (
                                            <tr
                                                key={m.id}
                                                className="transition-colors hover:bg-blue-50/50 dark:hover:bg-slate-800/50"
                                            >
                                                {/* Medicine */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-400/10 dark:bg-blue-400/10 dark:text-cyan-300">
                                                            <Pill size={19} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                                {m.name || 'Unnamed medicine'}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                {m.genericName || m.genericFormula || 'Generic details unavailable'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Code */}
                                                <td className="px-5 py-4">
                                                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        MED-{String(m.id ?? '').padStart(3, '0')}
                                                    </span>
                                                    {m.batchNumber && (
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Batch: {m.batchNumber}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Category */}
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {m.category || 'General'}
                                                    </span>
                                                </td>

                                                {/* Pricing */}
                                                <td className="px-5 py-4">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Buy: <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            ₹{(Number(m.unitPrice || 0) * 0.8).toFixed(2)}
                                                        </span>
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                                                        ₹{Number(m.unitPrice || 0).toFixed(2)}
                                                        <span className="ml-1 text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                                            sell
                                                        </span>
                                                    </p>
                                                </td>

                                                {/* Stock */}
                                                <td className="px-5 py-4">
                                                    <span className={`text-base font-bold ${
                                                        isExpired ? 'text-rose-600 dark:text-rose-400' :
                                                        isLowStock ? 'text-amber-600 dark:text-amber-400' :
                                                        'text-slate-800 dark:text-slate-100'
                                                    }`}>
                                                        {m.quantity ?? 0}
                                                    </span>
                                                    <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                                                        units
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                                                        isExpired
                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300'
                                                            : isLowStock
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'
                                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                                                    }`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                                            isExpired ? 'bg-rose-500' :
                                                            isLowStock ? 'bg-amber-500' :
                                                            'bg-emerald-500'
                                                        }`} />
                                                        {status === 'IN_STOCK' ? 'AVAILABLE' : status.replaceAll('_', ' ')}
                                                    </span>
                                                </td>

                                                {/* Expiry */}
                                                <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {m.expiryDate || '—'}
                                                </td>

                                                {/* Supplier */}
                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                    {m.supplierName || 'Unassigned'}
                                                </td>

                                                {/* Actions */}
                                                {isAdmin && (
    <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
            <button
                type="button"
                onClick={() => onEditMedicine?.(m)}
                title="Edit medicine"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-300"
            >
                <Edit size={15} />
            </button>

            <button
                type="button"
                onClick={() => onDeleteMedicine?.(m)}
                title="Delete medicine"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
            >
                <Trash2 size={15} />
            </button>
        </div>
    </td>
)}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredMeds.length}</strong> of{' '}
                            <strong className="text-slate-700 dark:text-slate-200">{medicines.length}</strong> medicines
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Inventory data
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
