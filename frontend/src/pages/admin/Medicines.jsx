import { useEffect, useMemo, useState } from "react";
import { Package, RefreshCw, Search } from "lucide-react";

import { apiFetch } from "../../services/api";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadMedicines = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/admin/medicines");
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return medicines;

    return medicines.filter((medicine) =>
      [medicine.medicineName, medicine.category, medicine.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [medicines, query]);

  const categories = useMemo(
    () => new Set(medicines.map((item) => item.category).filter(Boolean)).size,
    [medicines]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Medicines
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Every medicine registered in the pharmacy catalogue.
          </p>
        </div>
        <button
          type="button"
          onClick={loadMedicines}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total medicines", value: medicines.length, tone: "bg-blue-50 text-blue-600 dark:text-blue-400 dark:bg-blue-500/10 dark:text-blue-300" },
          { label: "Categories", value: categories, tone: "bg-emerald-50 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300" },
          { label: "Showing", value: filtered.length, tone: "bg-violet-50 text-violet-600 dark:text-violet-400 dark:bg-violet-500/10 dark:text-violet-300" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                <Package className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search medicines by name, category or description"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>
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
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Medicine</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    Loading medicines...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                    No medicines match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((medicine) => (
                  <tr
                    key={medicine.medicineId}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      #{medicine.medicineId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {medicine.medicineName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        {medicine.category || "General"}
                      </span>
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                      {medicine.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(medicine.createdAt)}
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
