
import { useEffect, useState } from "react";
import { Package, RefreshCw, Search } from "lucide-react";
import { apiFetch } from "../../services/api";

export default function ViewMedicines() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadMedicines = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/inventory");
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const filtered = batches.filter((item) => {
    const term = query.toLowerCase().trim();

    return [
      item.medicineName,
      item.category,
      item.description,
      item.medicineId,
      item.batchNumber,
      item.supplierId,
      item.expiryDate,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(term)
    );
  });

  const getStockStatus = (item) => {
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.minimumStock) return "Low Stock";
    return "In Stock";
  };

  const statusStyle = (status) => {
    if (status === "Out of Stock") {
      return "bg-rose-100 text-rose-700";
    }
    if (status === "Low Stock") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            View Medicines
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View medicine names, categories, batches, stock and expiry dates.
          </p>
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

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-slate-900 dark:text-white">
            Medicine Inventory ({filtered.length})
          </span>
        </div>

        <div className="relative p-4">
          <Search className="absolute left-7 top-7 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicine, category, batch number..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {error && (
          <p className="mx-4 mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="p-4">Medicine Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Batch Number</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Minimum Stock</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    Loading medicines...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No medicines found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const status = getStockStatus(item);

                  return (
                    <tr
                      key={item.inventoryId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {item.medicineName || `Medicine #${item.medicineId}`}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {item.category || "-"}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {item.batchNumber || "-"}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {item.quantity ?? 0}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {item.minimumStock ?? 0}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {item.expiryDate || "N/A"}
                      </td>

                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(status)}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
