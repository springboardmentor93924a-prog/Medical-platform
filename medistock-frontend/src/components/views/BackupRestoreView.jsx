
import React, { useEffect, useState } from 'react';
import {
    Database, Download, Upload, Trash2, RefreshCw, ShieldCheck,
    AlertTriangle, CheckCircle, HardDrive, FileJson
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const BackupRestoreView = () => {
    const { showToast } = useToast();
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const data = await adminService.listBackups();
            setBackups(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load backups', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBackups(); }, []);

    const handleCreate = async () => {
        setBusy(true);
        try {
            const meta = await adminService.createBackup();
            showToast(`Backup created: ${meta.fileName}`, 'success');
            await fetchBackups();
        } catch (err) {
            showToast('Create failed: ' + err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleRestore = async (fileName) => {
        const confirm1 = window.confirm(
            `⚠️ RESTORE OPERATION\n\n` +
            `This will REPLACE all current data with the backup content.\n\n` +
            `📁 File: ${fileName}\n\n` +
            `Are you absolutely sure?`
        );
        if (!confirm1) return;

        const confirm2 = window.prompt(
            `Type RESTORE (in all caps) to confirm the restore of:\n${fileName}`
        );
        if (confirm2 !== 'RESTORE') {
            showToast('Restore cancelled', 'info');
            return;
        }

        setBusy(true);
        try {
            // Safety: create a backup of current state first
            showToast('Creating safety backup before restore...', 'info');
            try {
                await adminService.createBackup();
            } catch (e) {
                console.warn('Safety backup failed — continuing anyway', e);
            }

            const result = await adminService.restoreBackup(fileName);
            showToast('✅ Restore successful. Reloading page...', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            showToast('Restore failed: ' + err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (fileName) => {
        if (!window.confirm(`Delete backup ${fileName}? This cannot be undone.`)) return;
        setBusy(true);
        try {
            await adminService.deleteBackup(fileName);
            showToast('Backup deleted', 'success');
            await fetchBackups();
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleDownload = async (fileName) => {
        try {
            // Fetch with auth header, then save as blob
            const token = localStorage.getItem('medistock_auth_token_v1');
            const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
            const res = await fetch(`${base}/admin/backups/download/${fileName}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            showToast('Download failed: ' + err.message, 'error');
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-[#080f1e] p-4 sm:p-6 lg:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-400/20 shadow-sm">
                            <Database size={23} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Backup & Restore
                                </h1>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                    Database Control
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Protect, download and restore your MediStock database snapshots.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-2 shadow-sm w-fit">
                        <ShieldCheck size={15} className="text-emerald-500" />
                        Secure database management
                    </div>
                </div>

                {/* Create Backup Hero */}
                <div className="relative overflow-hidden rounded-3xl border border-blue-200 dark:border-blue-400/20 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-[#10264a] dark:via-[#101d35] dark:to-[#102b3b] shadow-sm">
                    <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-400/10 dark:bg-blue-400/10 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

                    <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-5 sm:p-7">
                        <div className="flex items-start gap-4">
                            <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <HardDrive size={29} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-blue-600 dark:text-blue-300 mb-1">
                                    Database protection
                                </p>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                    Create New Backup
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl leading-relaxed">
                                    Generate a complete JSON snapshot of your database, including users, medicines, suppliers, orders, tasks, feedback and audit logs.
                                </p>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {['JSON Snapshot', 'Database Export', 'Secure Storage'].map(item => (
                                        <span key={item} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-white/5 border border-blue-100 dark:border-white/10 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                            <CheckCircle size={11} className="text-emerald-500" />
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={busy}
                            className="w-full lg:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            <Database size={17} />
                            {busy ? 'Creating...' : 'Create Backup Now'}
                        </button>
                    </div>
                </div>

                {/* Restore Warning */}
                <div className="relative overflow-hidden flex items-start gap-3.5 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.07] p-4 sm:p-5">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                Restore is a destructive operation
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-200/70 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                Important
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/75 mt-1.5 leading-relaxed">
                            Restoring will <strong>replace all current database data</strong> with the selected backup. A safety backup is automatically attempted before every restore operation.
                        </p>
                    </div>
                </div>

                {/* Backup List */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-[#101a2b] shadow-sm overflow-hidden">

                    {/* List Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 py-5 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                                <FileJson size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Available Backups
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {backups.length} backup{backups.length !== 1 ? 's' : ''} available
                                    <span className="mx-1.5">·</span>
                                    Maximum 10 retained
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={fetchBackups}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        >
                            <RefreshCw size={14} />
                            Refresh List
                        </button>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                                <RefreshCw size={23} className="text-blue-600 dark:text-blue-400 animate-spin" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Loading backups...
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Retrieving your database snapshots
                            </p>
                        </div>
                    ) : backups.length === 0 ? (
                        /* Empty State */
                        <div className="py-16 sm:py-20 px-5 text-center">
                            <div className="h-20 w-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-5">
                                <Database size={34} className="text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                                No backups found
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                                Your database snapshots will appear here. Create your first backup to keep your data protected.
                            </p>
                            <button
                                onClick={handleCreate}
                                disabled={busy}
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                            >
                                <Database size={15} />
                                Create First Backup
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/70">
                                            <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Backup File</th>
                                            <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Created At</th>
                                            <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">File Size</th>
                                            <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tables</th>
                                            <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {backups.map(b => (
                                            <tr key={b.fileName} className="group hover:bg-blue-50/40 dark:hover:bg-blue-500/[0.04] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                            <FileJson size={17} />
                                                        </div>
                                                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 break-all">
                                                            {b.fileName}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {formatDate(b.createdAt)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {formatBytes(b.sizeBytes)}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center justify-center min-w-8 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                                        {b.tableCount}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide ${
                                                        b.status === 'OK'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                    }`}>
                                                        {b.status === 'OK' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                        {b.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleDownload(b.fileName)}
                                                            title="Download backup"
                                                            className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRestore(b.fileName)}
                                                            disabled={busy}
                                                            title="Restore backup"
                                                            className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <Upload size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(b.fileName)}
                                                            disabled={busy}
                                                            title="Delete backup"
                                                            className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile / Tablet Backup Cards */}
                            <div className="lg:hidden p-3 sm:p-5 space-y-3">
                                {backups.map(b => (
                                    <div key={b.fileName} className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/30 p-4 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <FileJson size={19} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 break-all leading-relaxed">
                                                    {b.fileName}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                                                    {formatDate(b.createdAt)}
                                                </p>
                                            </div>

                                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-extrabold ${
                                                b.status === 'OK'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                            }`}>
                                                {b.status === 'OK' ? <CheckCircle size={10} /> : <AlertTriangle size={10} />}
                                                {b.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">File Size</p>
                                                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                                                    {formatBytes(b.sizeBytes)}
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 p-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Tables</p>
                                                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                                                    {b.tableCount}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            <button
                                                onClick={() => handleDownload(b.fileName)}
                                                title="Download"
                                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                            <button
                                                onClick={() => handleRestore(b.fileName)}
                                                disabled={busy}
                                                title="Restore"
                                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-40"
                                            >
                                                <Upload size={14} />
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handleDelete(b.fileName)}
                                                disabled={busy}
                                                title="Delete"
                                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-40"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Audit Information */}
                <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.06] p-4 sm:p-5">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck size={21} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                            Every action is audited
                        </h3>
                        <p className="text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-200/70 mt-1 leading-relaxed">
                            All backup creates, restores, and deletes are logged in the <strong>Audit Trail</strong> with timestamp and admin email — critical for compliance (HIPAA, GxP).
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
