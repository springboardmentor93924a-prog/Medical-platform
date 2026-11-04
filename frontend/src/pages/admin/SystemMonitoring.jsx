
import { useCallback, useEffect, useState } from "react";
import {
  History,
  RefreshCw,
  Search,
  Activity,
  Database,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "../../services/api";

const PAGE_SIZE = 20;

const ACTION_STYLES = {
  CREATE: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  UPDATE: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  DELETE: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
  ACTIVATE: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  DEACTIVATE: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  LOGIN: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  REGISTER: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  STOCK_IN: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30",
  STOCK_OUT: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  REPORT_GENERATED: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30",
};

const ACTIONS = [
  "",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ACTIVATE",
  "DEACTIVATE",
  "LOGIN",
  "REGISTER",
  "STOCK_IN",
  "STOCK_OUT",
  "REPORT_GENERATED",
];

const DEFAULT_ACTION_STYLE =
  "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";

export default function SystemMonitoring() {
  const [data, setData] = useState({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });

  const [page, setPage] = useState(0);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        action,
        q: query.trim(),
        page: String(page),
        size: String(PAGE_SIZE),
      });

      const response = await apiFetch(`/admin/audit-logs?${params}`);
      setData(response);
    } catch (err) {
      setError(err.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [action, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const totalPages = Math.max(data.totalPages, 1);

  return (
    <div className="min-h-full space-y-6 rounded-3xl bg-slate-50 p-3 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:p-6">

      {/* Header */}
      <header className="rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm transition-colors dark:border-teal-500/20 dark:from-teal-950/60 dark:via-slate-900 dark:to-cyan-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <History size={28} />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                MediStock / System Monitoring
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                System Monitoring
              </h1>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review system activity, user actions and operational records.
              </p>
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Activities
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.totalElements}
              </h2>
            </div>
            <div className="rounded-xl bg-teal-50 p-3 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
              <Activity size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Current Page
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.content.length}
              </h2>
            </div>
            <div className="rounded-xl bg-sky-50 p-3 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <Database size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Activity Tracking
              </p>
              <h2 className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Enabled
              </h2>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={23} />
            </div>
          </div>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-wrap items-center gap-3">

        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Search size={18} className="text-slate-400 dark:text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by user, summary or entity..."
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>

        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(0);
          }}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          {ACTIONS.map((value) => (
            <option key={value || "ALL"} value={value}>
              {value || "All actions"}
            </option>
          ))}
        </select>

      </div>

      {/* Audit Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-slate-600 dark:text-slate-300">
            <RefreshCw size={22} className="animate-spin" />
            Loading system activity...
          </div>
        ) : data.content.length === 0 ? (
          <div className="p-12 text-center">
            <History size={38} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No activity found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try changing your search or action filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">

              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">When</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Entity</th>
                  <th className="px-5 py-4">Details</th>
                  <th className="px-5 py-4">By</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.content.map((log) => (
                  <tr
                    key={log.auditId}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {log.createdAt
                        ? log.createdAt.replace("T", " ").slice(0, 19)
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                          ACTION_STYLES[log.action] || DEFAULT_ACTION_STYLE
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {log.entityType}
                      {log.entityId ? ` #${log.entityId}` : ""}
                    </td>

                    <td className="max-w-md truncate px-5 py-4 text-slate-700 dark:text-slate-300">
                      {log.summary || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {log.performedBy || "system"}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">

        <span>
          Page {data.number + 1} of {totalPages} — {data.totalElements} total
        </span>

        <div className="flex gap-2">

          <button
            disabled={page === 0 || loading}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Previous
          </button>

          <button
            disabled={page + 1 >= data.totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Next
          </button>

        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        System activity is displayed from recorded audit entries. Operational
        error logs and server health metrics require separate monitoring APIs.
      </p>

    </div>
  );
}
