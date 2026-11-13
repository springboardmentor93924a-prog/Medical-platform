
import { useCallback, useEffect, useState } from "react";
import { apiFetch, downloadFile } from "../../services/api";
import {
    Database,
    Download,
    RefreshCw,
    ShieldCheck,
    HardDrive,
    Clock,
    AlertCircle,
    CheckCircle2,
    LoaderCircle,
    RotateCcw,
} from "lucide-react";

const BASE_PATH = "/admin/database-backups";

function formatSize(bytes) {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function BackupRestore() {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [downloading, setDownloading] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadBackups = useCallback(async () => {
        try {
            setError("");
            const data = await apiFetch(BASE_PATH);
            setBackups(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Unable to load backup history.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBackups();
    }, [loadBackups]);

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            setError("");
            setSuccess("");

            const result = await apiFetch(BASE_PATH, { method: "POST" });

            setSuccess(result?.message || "Database backup created successfully.");
            await loadBackups();
        } catch (err) {
            setError(err.message || "Failed to create database backup.");
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (filename) => {
        try {
            setDownloading(filename);
            setError("");

            await downloadFile(
                `${BASE_PATH}/${encodeURIComponent(filename)}/download`,
                filename
            );
        } catch (err) {
            setError(err.message || "Failed to download backup.");
        } finally {
            setDownloading("");
        }
    };

    const card =
        "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";

    const muted = "text-gray-500 dark:text-slate-400";

    return (
        <div className="min-h-full space-y-6 bg-gray-50 p-4 text-gray-900 dark:bg-slate-950 dark:text-slate-100 sm:p-6">

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                            <Database size={25} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold">
                                Backup & Restore
                            </h2>
                            <p className={`mt-1 text-sm ${muted}`}>
                                Manage and protect your MediStock database.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={loadBackups}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${muted}`}>
                                Total Backups
                            </p>
                            <h3 className="mt-2 text-3xl font-bold">
                                {loading ? "—" : backups.length}
                            </h3>
                        </div>
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                            <HardDrive size={24} />
                        </div>
                    </div>
                </div>

                <div className={`${card} p-5`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${muted}`}>
                                Backup Status
                            </p>
                            <h3 className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">
                                Available
                            </h3>
                            <p className={`mt-1 text-xs ${muted}`}>
                                Backup management enabled
                            </p>
                        </div>
                        <div className="rounded-xl bg-green-100 p-3 text-green-700 dark:bg-green-500/15 dark:text-green-400">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Create backup */}
            <section className={`${card} overflow-hidden`}>
                <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                            <Database size={25} />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold">
                                Create Database Backup
                            </h3>
                            <p className={`mt-1 max-w-lg text-sm ${muted}`}>
                                Generate a backup copy of your current MediStock database
                                to protect important inventory, medicine and user data.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {creating ? (
                            <>
                                <LoaderCircle size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Database size={18} />
                                Create Backup
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* Backup history */}
            <section className={`${card} overflow-hidden`}>
                <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 dark:border-slate-700 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="text-lg font-bold">
                            Backup History
                        </h3>
                        <p className={`mt-1 text-sm ${muted}`}>
                            Review and download previously created backups.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className={muted} />
                        <span className={muted}>
                            {backups.length} backup(s)
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Backup File</th>
                                <th className="px-5 py-4 font-semibold">File Size</th>
                                <th className="px-5 py-4 font-semibold">Created At</th>
                                <th className="px-5 py-4 text-right font-semibold">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className={`px-5 py-12 text-center ${muted}`}>
                                        <LoaderCircle size={22} className="mx-auto mb-2 animate-spin" />
                                        Loading backup history...
                                    </td>
                                </tr>
                            ) : backups.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className={`px-5 py-12 text-center ${muted}`}>
                                        <Database size={30} className="mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No backups available</p>
                                        <p className="mt-1 text-xs">
                                            Create your first database backup to see it here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                backups.map((backup) => (
                                    <tr
                                        key={backup.filename}
                                        className="transition hover:bg-gray-50 dark:hover:bg-slate-800/60"
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-800 dark:text-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                                                    <Database size={17} />
                                                </div>
                                                {backup.filename}
                                            </div>
                                        </td>

                                        <td className={`px-5 py-4 ${muted}`}>
                                            {formatSize(backup.size)}
                                        </td>

                                        <td className={`px-5 py-4 ${muted}`}>
                                            {formatDate(backup.createdAt)}
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleDownload(backup.filename)}
                                                disabled={downloading === backup.filename}
                                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                                            >
                                                {downloading === backup.filename ? (
                                                    <LoaderCircle size={16} className="animate-spin" />
                                                ) : (
                                                    <Download size={16} />
                                                )}
                                                {downloading === backup.filename
                                                    ? "Downloading..."
                                                    : "Download"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Restore */}
            {/* Restore Warning */}
            <section className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-start gap-4 p-6">
                    <div className="shrink-0 rounded-xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <AlertCircle size={25} />
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
                                Restore Database
                            </h3>

                            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                                Temporarily Unavailable
                            </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-amber-800 dark:text-amber-300">
                            Restore functionality is temporarily disabled until the backend
                            restoration process is secured and validated. This helps prevent
                            accidental database data loss.
                        </p>

                        <button
                            type="button"
                            disabled
                            className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-500"
                        >
                            <RotateCcw size={17} />
                            Restore Temporarily Disabled
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
