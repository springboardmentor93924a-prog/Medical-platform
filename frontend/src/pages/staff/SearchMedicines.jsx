
import { useEffect, useState } from "react";
import { Search, RefreshCw, Package, X } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function SearchMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMedicines = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/inventory");
      setMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const filteredMedicines = medicines.filter((item) => {
    const term = query.trim().toLowerCase();

    if (!term) return true;

    return [
      item.medicineName,
      item.category,
      item.medicineId,
      item.batchNumber,
      item.supplierId,
      item.expiryDate,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(term)
    );
  });

  const getStatus = (item) => {
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.minimumStock) return "Low Stock";
    return "In Stock";
  };

  const clearSearch = () => setQuery("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Search Medicines
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Find medicines using their name, category, batch or supplier ID.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Search inventory
        </label>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Medicine name, category, batch number..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={loadMedicines}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {loading
            ? "Loading inventory..."
            : `${filteredMedicines.length} result(s) found`}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMedicines.map((item) => {
            const status = getStatus(item);

            return (
              <div
                key={item.inventoryId}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {item.medicineName || `Medicine #${item.medicineId}`}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.category || "No category"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      status === "Out of Stock"
                        ? "bg-rose-100 text-rose-700"
                        : status === "Low Stock"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Batch Number</p>
                    <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                      {item.batchNumber || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {item.quantity ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Supplier ID</p>
                    <p className="mt-1 text-slate-800 dark:text-slate-200">
                      {item.supplierId ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Expiry Date</p>
                    <p className="mt-1 text-slate-800 dark:text-slate-200">
                      {item.expiryDate || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredMedicines.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Package className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            No medicines found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try another medicine name, category or batch number.
          </p>
        </div>
      )}
    </div>
  );
}
