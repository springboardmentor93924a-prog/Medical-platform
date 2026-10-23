import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package, RefreshCw, Search } from "lucide-react";

import { apiFetch } from "../services/api";

const dayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");

const expiryLabel = (value) => {
  if (!value) return "No expiry";
  const expiry = new Date(`${dateOnly(value)}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return "No expiry";

  const days = Math.ceil((expiry - dayStart()) / 86400000);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days <= 30) return `Expires in ${days} day${days === 1 ? "" : "s"}`;
  return dateOnly(value);
};

export default function StaffInventory() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/inventory");
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return batches;

    return batches.filter((item) =>
      [item.batchNumber, item.medicineId, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [batches, query]);

  const stats = useMemo(() => {
    const totalUnits = batches.reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0
    );
    const lowStock = batches.filter(
      (item) =>
        Number(item.quantity ?? 0) <= Number(item.minimumStock ?? 10)
    ).length;
    const expiring = batches.filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(`${dateOnly(item.expiryDate)}T00:00:00`);
      if (Number.isNaN(expiry.getTime())) return false;
      const days = Math.ceil((expiry - dayStart()) / 86400000);
      return days <= 30;
    }).length;

    return { totalUnits, lowStock, expiring };
  }, [batches]);

  const cards = [
    { label: "Batches tracked", value: batches.length, icon: Package, tone: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: "Units on hand", value: stats.totalUnits, icon: Package, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300" },
    { label: "Low stock", value: stats.lowStock, icon: AlertTriangle, tone: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
    { label: "Expiring soon", value: stats.expiring, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Read-only view of every batch held in the pharmacy.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
              {card.value}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by batch, medicine ID or status"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {filtered.length} of {batches.length} batches
          </span>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Batch</th>
                <th className="px-4 py-3 font-semibold">Medicine ID</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Min. stock</th>
                <th className="px-4 py-3 font-semibold">Expiry</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    No batches match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.inventoryId}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {item.batchNumber || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      #{item.medicineId ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.quantity ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {item.minimumStock ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {expiryLabel(item.expiryDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.status || "In stock"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
