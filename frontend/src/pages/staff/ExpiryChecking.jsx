
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Package,
  CalendarDays,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

export default function ExpiryChecking() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch inventory only. Staff already has permission for this API.
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const inventoryData = await apiFetch("/inventory");

      console.log("Inventory API:", inventoryData);

      setInventory(
        Array.isArray(inventoryData) ? inventoryData : []
      );
    } catch (err) {
      console.error("Expiry API error:", err);
      setError(err.message || "Failed to load expiry information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get today's date in YYYY-MM-DD format.
  const todayString = (() => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
  })();

  // Calculate the date 30 days from today.
  const nearExpiryString = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  })();

  const getStatus = (expiryDate) => {
    if (!expiryDate) return "UNKNOWN";

    const date = String(expiryDate).slice(0, 10);

    if (date < todayString) return "EXPIRED";
    if (date <= nearExpiryString) return "NEAR_EXPIRY";

    return "VALID";
  };

  // Prepare inventory rows.
  const rows = useMemo(() => {
    return inventory.map((item) => ({
      ...item,

      // Use the medicine name if the inventory API provides it.
      medicineName:
        item.medicineName ||
        item.medicine?.medicineName ||
        item.medicine?.name ||
        "Unknown Medicine",

      status: getStatus(item.expiryDate),
    }));
  }, [inventory, todayString, nearExpiryString]);

  // Summary counts.
  const expiredCount = rows.filter(
    (item) => item.status === "EXPIRED"
  ).length;

  const nearExpiryCount = rows.filter(
    (item) => item.status === "NEAR_EXPIRY"
  ).length;

  const validCount = rows.filter(
    (item) => item.status === "VALID"
  ).length;

  // Search, filter and sort.
  const filteredRows = rows
    .filter((item) => {
      const matchesFilter =
        filter === "ALL" || item.status === filter;

      const matchesSearch =
        item.medicineName.toLowerCase().includes(search.toLowerCase()) ||
        String(item.batchNumber || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    })
    .sort((a, b) =>
      String(a.expiryDate || "9999-12-31").localeCompare(
        String(b.expiryDate || "9999-12-31")
      )
    );

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(`${String(date).slice(0, 10)}T00:00:00`)
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  };

  const statusStyle = {
    EXPIRED:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",

    NEAR_EXPIRY:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",

    VALID:
      "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",

    UNKNOWN:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };

  const statusLabel = {
    EXPIRED: "Expired",
    NEAR_EXPIRY: "Near Expiry",
    VALID: "Valid",
    UNKNOWN: "Unknown",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Expiry Checking
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Identify and report expired or near-expiry medicines.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          title="Total Batches"
          count={rows.length}
          color="blue"
          icon={<Package size={22} />}
        />

        <SummaryCard
          title="Expired Batches"
          count={expiredCount}
          color="red"
          icon={<AlertTriangle size={22} />}
        />

        <SummaryCard
          title="Near Expiry"
          count={nearExpiryCount}
          color="amber"
          icon={<CalendarDays size={22} />}
        />

        <SummaryCard
          title="Valid Batches"
          count={validCount}
          color="green"
          icon={<Package size={22} />}
        />

      </div>

      {/* Expiry report */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Medicine Expiry Report
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine or batch..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["ALL", "All"],
            ["EXPIRED", "Expired"],
            ["NEAR_EXPIRY", "Near Expiry"],
            ["VALID", "Valid"],
            ["UNKNOWN", "Unknown"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Loading expiry information...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">

              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700">
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((item) => (
                  <tr
                    key={item.inventoryId}
                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">
                      {item.medicineName}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {item.batchNumber || "-"}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {item.quantity ?? 0}
                    </td>

                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {formatDate(item.expiryDate)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle[item.status]}`}
                      >
                        {statusLabel[item.status]}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-slate-500"
                    >
                      No inventory batches found.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, count, color, icon }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",

    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",

    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",

    green:
      "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>

        <div className={`rounded-lg p-2 ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
        {count}
      </p>
    </div>
  );
}
