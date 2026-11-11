
import React, { useMemo, useState } from 'react';
import {
    Boxes,
    Search,
    ClipboardCheck,
    AlertTriangle,
    CheckCircle,
    Package,
    RefreshCw,
    X,
    ArrowUpDown,
    FileSearch,
    Hash,
    Info
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const StockCheckingView = ({ medicines = [], onRefresh }) => {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [checks, setChecks] = useState({});
    const [updatingId, setUpdatingId] = useState(null);

    const handleQtyChange = (medId, value) => {
        setChecks(prev => ({
            ...prev,
            [medId]: { ...prev[medId], actualQty: value }
        }));
    };

    const handleNotesChange = (medId, value) => {
        setChecks(prev => ({
            ...prev,
            [medId]: { ...prev[medId], notes: value }
        }));
    };

    const handleSubmitDiscrepancy = async (med) => {
        const check = checks[med.id];

        if (!check || check.actualQty === undefined || check.actualQty === '') {
            showToast('Please enter the counted quantity first', 'error');
            return;
        }

        const actualQty = Number(check.actualQty);

        if (!Number.isInteger(actualQty) || actualQty < 0) {
            showToast('Please enter a valid non-negative whole quantity', 'error');
            return;
        }

        if (actualQty === Number(med.quantity)) {
            showToast('No discrepancy found. Counts match.', 'info');
            return;
        }

        const reason = `Physical count discrepancy: system=${med.quantity}, actual=${actualQty}. ${check.notes || ''}`.trim();

        if (!window.confirm(`Update stock from ${med.quantity} to ${actualQty}?\n\n${check.notes || 'No notes'}`)) {
            return;
        }

        try {
            setUpdatingId(med.id);

            await adminService.updateMedicine(med.id, {
                ...med,
                quantity: actualQty
            });

            showToast(`Stock updated for ${med.name}`, 'success');

            setChecks(prev => {
                const copy = { ...prev };
                delete copy[med.id];
                return copy;
            });

            if (onRefresh) onRefresh();
        } catch (err) {
            showToast(err.message || 'Failed to update stock', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = useMemo(() => {
        const term = search.toLowerCase().trim();

        return medicines.filter(med =>
            med.name?.toLowerCase().includes(term) ||
            med.batchNumber?.toLowerCase().includes(term) ||
            med.category?.toLowerCase().includes(term)
        );
    }, [medicines, search]);

    const discrepancyCount = medicines.filter(med => {
        const value = checks[med.id]?.actualQty;
        return value !== undefined &&
            value !== '' &&
            Number(value) !== Number(med.quantity) &&
            Number.isInteger(Number(value)) &&
            Number(value) >= 0;
    }).length;

    const getCheckStatus = (med) => {
        const value = checks[med.id]?.actualQty;

        if (value === undefined || value === '') return 'unchecked';
        if (!Number.isInteger(Number(value)) || Number(value) < 0) return 'invalid';
        if (Number(value) === Number(med.quantity)) return 'matched';

        return 'mismatch';
    };

    return (
        <div className="min-h-full bg-slate-50/60 dark:bg-[#080f1e] p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-7">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                <Boxes size={19} className="text-blue-600 dark:text-blue-400" />
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                Inventory Operations
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Stock Checking
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Compare physical stock with system records and report discrepancies.
                        </p>
                    </div>

                    <button
                        onClick={() => onRefresh?.()}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        <RefreshCw size={16} />
                        Refresh Stock
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/50 dark:to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Medicines</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {medicines.length}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                <Package size={21} className="text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Discrepancies Found</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {discrepancyCount}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                                <AlertTriangle size={21} className="text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Counts Matched</p>
                                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                                    {medicines.filter(med => getCheckStatus(med) === 'matched').length}
                                </p>
                            </div>
                            <div className="h-11 w-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                                <CheckCircle size={21} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                {/* <div className="flex items-start gap-3 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10 p-4">
                    <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                            How stock checking works
                        </p>
                        <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300/90 mt-1">
                            Enter the physically counted quantity for each medicine. Matching counts are marked as verified. If the count differs, review the difference and report it to update the system stock.
                        </p>
                    </div>
                </div> */}

                {/* Search and Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">

                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Medicine Stock Records
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Enter actual quantities to compare stock.
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search medicine, category or batch..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4 font-bold">Medicine</th>
                                    <th className="px-4 py-4 font-bold">Batch</th>
                                    <th className="px-4 py-4 text-center font-bold">System Qty</th>
                                    <th className="px-4 py-4 text-center font-bold">Actual Count</th>
                                    <th className="px-4 py-4 font-bold min-w-48">Notes</th>
                                    <th className="px-4 py-4 text-center font-bold">Status</th>
                                    <th className="px-5 py-4 text-center font-bold">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center">
                                            <FileSearch size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                No medicines found
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Try another medicine name or batch number.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(med => {
                                        const check = checks[med.id] || {};
                                        const status = getCheckStatus(med);
                                        const hasDiscrepancy = status === 'mismatch';

                                        return (
                                            <tr
                                                key={med.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {med.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {med.category || 'Uncategorized'}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                                                        <Hash size={12} className="text-slate-400" />
                                                        {med.batchNumber || 'N/A'}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex min-w-12 justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-extrabold text-slate-800 dark:text-slate-200">
                                                        {med.quantity}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={check.actualQty ?? ''}
                                                        onChange={e => handleQtyChange(med.id, e.target.value)}
                                                        placeholder={String(med.quantity ?? 0)}
                                                        className={`w-24 px-2 py-2 border rounded-lg text-center text-sm font-bold outline-none transition focus:ring-2 ${
                                                            status === 'mismatch'
                                                                ? 'border-amber-400 bg-amber-50 text-amber-800 focus:ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/50'
                                                                : status === 'matched'
                                                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40'
                                                                    : 'border-slate-200 bg-white text-slate-800 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                                                        }`}
                                                    />
                                                </td>

                                                <td className="px-4 py-4">
                                                    <input
                                                        type="text"
                                                        value={check.notes ?? ''}
                                                        onChange={e => handleNotesChange(med.id, e.target.value)}
                                                        placeholder="Add notes..."
                                                        className="w-full min-w-36 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                                    />
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    {status === 'mismatch' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                                                            <AlertTriangle size={12} /> Mismatch
                                                        </span>
                                                    ) : status === 'matched' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                                                            <CheckCircle size={12} /> Matched
                                                        </span>
                                                    ) : status === 'invalid' ? (
                                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                                            Invalid count
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-semibold text-slate-400">
                                                            Not checked
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    {hasDiscrepancy ? (
                                                        <button
                                                            onClick={() => handleSubmitDiscrepancy(med)}
                                                            disabled={updatingId === med.id}
                                                            className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                                                        >
                                                            {updatingId === med.id ? (
                                                                <RefreshCw size={13} className="animate-spin" />
                                                            ) : (
                                                                <ClipboardCheck size={13} />
                                                            )}
                                                            {updatingId === med.id ? 'Updating' : 'Report'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile / Tablet Cards */}
                    <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {filtered.length === 0 ? (
                            <div className="p-10 text-center">
                                <FileSearch size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                    No medicines found
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Try another search term.
                                </p>
                            </div>
                        ) : (
                            filtered.map(med => {
                                const check = checks[med.id] || {};
                                const status = getCheckStatus(med);
                                const hasDiscrepancy = status === 'mismatch';

                                return (
                                    <div key={med.id} className="p-4 sm:p-5 space-y-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 dark:text-white break-words">
                                                    {med.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {med.category || 'Uncategorized'} · Batch: {med.batchNumber || 'N/A'}
                                                </p>
                                            </div>

                                            {status === 'mismatch' ? (
                                                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                                    <AlertTriangle size={11} /> Mismatch
                                                </span>
                                            ) : status === 'matched' ? (
                                                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                                    <CheckCircle size={11} /> Matched
                                                </span>
                                            ) : (
                                                <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                                                    Not checked
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-3">
                                                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                    System Quantity
                                                </p>
                                                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                                                    {med.quantity}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                                                    Actual Count
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={check.actualQty ?? ''}
                                                    onChange={e => handleQtyChange(med.id, e.target.value)}
                                                    placeholder={String(med.quantity ?? 0)}
                                                    className={`w-full px-3 py-2.5 border rounded-xl text-sm font-bold outline-none focus:ring-2 ${
                                                        status === 'mismatch'
                                                            ? 'border-amber-400 bg-amber-50 text-amber-800 focus:ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/50'
                                                            : status === 'matched'
                                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/40'
                                                                : 'border-slate-200 bg-white text-slate-800 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                                                Notes
                                            </label>
                                            <input
                                                type="text"
                                                value={check.notes ?? ''}
                                                onChange={e => handleNotesChange(med.id, e.target.value)}
                                                placeholder="e.g. damaged boxes"
                                                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        {hasDiscrepancy && (
                                            <button
                                                onClick={() => handleSubmitDiscrepancy(med)}
                                                disabled={updatingId === med.id}
                                                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {updatingId === med.id ? (
                                                    <RefreshCw size={15} className="animate-spin" />
                                                ) : (
                                                    <ClipboardCheck size={15} />
                                                )}
                                                {updatingId === med.id ? 'Updating Stock...' : 'Report Discrepancy'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 sm:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filtered.length}</span> of {medicines.length} medicines
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Mismatch</span> indicates a difference in physical stock.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
