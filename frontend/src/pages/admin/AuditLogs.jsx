import { useCallback, useEffect, useState } from "react";
import {
  History,
  RefreshCw,
  Search,
} from "lucide-react";
import { apiFetch } from "../../services/api";

const PAGE_SIZE = 20;

const ACTION_STYLES = {
  CREATE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UPDATE: "bg-sky-50 text-sky-700 ring-sky-200",
  DELETE: "bg-red-50 text-red-700 ring-red-200",
  ACTIVATE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DEACTIVATE: "bg-slate-100 text-slate-600 ring-slate-200",
  LOGIN: "bg-violet-50 text-violet-700 ring-violet-200",
  REGISTER: "bg-violet-50 text-violet-700 ring-violet-200",
  STOCK_IN: "bg-teal-50 text-teal-700 ring-teal-200",
  STOCK_OUT: "bg-amber-50 text-amber-700 ring-amber-200",
  REPORT_GENERATED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
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

export default function AuditLogs() {
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
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
      setData(await apiFetch(`/admin/audit-logs?${params}`));
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

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <History size={28} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-700">
                MediStock / Security
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Audit Logs
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {data.totalElements} recorded action(s) — every change is attributed to a user.
              </p>
            </div>
          </div>

          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-64 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by user, summary or entity..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(0);
          }}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
        >
          {ACTIONS.map((value) => (
            <option key={value || "ALL"} value={value}>
              {value || "All actions"}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-slate-600">
            <RefreshCw size={22} className="animate-spin" /> Loading audit logs...
          </div>
        ) : data.content.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No audit entries found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5">When</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.content.map((log) => (
                <tr key={log.auditId} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                    {log.createdAt ? log.createdAt.replace("T", " ").slice(0, 19) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                        ACTION_STYLES[log.action] || "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {log.entityType}
                    {log.entityId ? ` #${log.entityId}` : ""}
                  </td>
                  <td className="max-w-md truncate px-5 py-3.5 text-slate-700">
                    {log.summary || "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                    {log.performedBy || "system"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          Page {data.number + 1} of {Math.max(data.totalPages, 1)} — {data.totalElements} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
