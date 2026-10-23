import { API_BASE } from "../../services/api";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Search,
  Filter,
  CalendarClock,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  X,
  AlertCircle,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

const API_URL = `${API_BASE}/stock-movements`;
const INVENTORY_URL = `${API_BASE}/inventory`;
const MEDICINES_URL = `${API_BASE}/admin/medicines`;

function getToken() {
  return sessionStorage.getItem("medistock_token");
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function movementStyle(type) {
  if (type === "IN") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (type === "OUT") {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState("ALL");

  const request = useCallback(async (url) => {
    const token = getToken();

    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [movementData, inventoryData, medicineData] =
        await Promise.all([
          request(API_URL),
          request(INVENTORY_URL),
          request(MEDICINES_URL),
        ]);

      setMovements(getList(movementData));
      setInventory(getList(inventoryData));
      setMedicines(getList(medicineData));

      setMessage("");
    } catch (err) {
      setError(
        err.message || "Unable to load stock movement history."
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const inventoryMap = useMemo(
    () =>
      new Map(
        inventory.map((item) => [
          String(item.inventoryId),
          item,
        ])
      ),
    [inventory]
  );

  const medicineMap = useMemo(
    () =>
      new Map(
        medicines.map((item) => [
          String(item.medicineId),
          item,
        ])
      ),
    [medicines]
  );

  function getBatch(inventoryId) {
    return inventoryMap.get(String(inventoryId));
  }

  function getMedicineName(inventoryId) {
    const batch = getBatch(inventoryId);
    const medicine = batch
      ? medicineMap.get(String(batch.medicineId))
      : null;

    return (
      medicine?.medicineName ||
      `Inventory #${inventoryId ?? "—"}`
    );
  }

  const incoming = movements
    .filter((movement) => movement.movementType === "IN")
    .reduce(
      (sum, movement) =>
        sum + Math.abs(Number(movement.changeQuantity ?? 0)),
      0
    );

  const outgoing = movements
    .filter((movement) => movement.movementType === "OUT")
    .reduce(
      (sum, movement) =>
        sum + Math.abs(Number(movement.changeQuantity ?? 0)),
      0
    );

  const netChange = incoming - outgoing;

  const filteredMovements = useMemo(() => {
    const term = search.trim().toLowerCase();

    return movements.filter((movement) => {
      const text = [
        getMedicineName(movement.inventoryId),
        movement.movementType,
        movement.notes,
        movement.userId,
        movement.inventoryId,
        movement.stockLogId,
        movement.changeQuantity,
        movement.changedAt,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(term);
      const matchesType =
        movementFilter === "ALL" ||
        movement.movementType === movementFilter;

      return matchesSearch && matchesType;
    });
  }, [movements, search, movementFilter, inventoryMap, medicineMap]);

  const incomingCount = movements.filter(
    (movement) => movement.movementType === "IN"
  ).length;

  const outgoingCount = movements.filter(
    (movement) => movement.movementType === "OUT"
  ).length;

  const filterOptions = [
    { value: "ALL", label: "All movements", count: movements.length },
    { value: "IN", label: "Stock IN", count: incomingCount },
    { value: "OUT", label: "Stock OUT", count: outgoingCount },
  ];

  return (
    <div className="min-h-screen bg-[#f3f8f8] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-teal-100/80 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200">
                <Activity size={27} />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-teal-700 sm:text-sm">
                  MEDISTOCK / STOCK AUDIT
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Stock Movement History
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Track stock received and issued, review movement records,
                  and maintain visibility into inventory changes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-teal-200 transition hover:bg-teal-700 disabled:opacity-60 lg:self-center"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh data
            </button>
          </div>
        </section>

        {/* Alerts */}
        {message && (
          <Notice
            type="success"
            message={message}
            onClose={() => setMessage("")}
          />
        )}

        {error && (
          <Notice
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            title="Total Movements"
            value={movements.length}
            subtitle="All recorded stock changes"
            icon={<Activity size={21} />}
            color="teal"
          />

          <Summary
            title="Units Received"
            value={incoming.toLocaleString("en-IN")}
            subtitle={`${incomingCount} incoming records`}
            icon={<ArrowDownToLine size={21} />}
            color="green"
          />

          <Summary
            title="Units Issued"
            value={outgoing.toLocaleString("en-IN")}
            subtitle={`${outgoingCount} outgoing records`}
            icon={<ArrowUpFromLine size={21} />}
            color="amber"
          />

          <Summary
            title="Net Stock Movement"
            value={`${netChange > 0 ? "+" : ""}${netChange.toLocaleString("en-IN")}`}
            subtitle="Received minus issued units"
            icon={<Boxes size={21} />}
            color="blue"
          />
        </div>

        {/* Movement register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Stock Movement Register
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review stock movement dates, quantities, and notes.
                </p>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                {filteredMovements.length} records
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-sm">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medicine, type or notes..."
                  aria-label="Search stock movements"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMovementFilter(option.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      movementFilter === option.value
                        ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-slate-500">
              <LoaderCircle
                size={22}
                className="animate-spin text-teal-600"
              />
              Loading movement history...
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Package size={28} />
              </div>

              <h3 className="font-semibold text-slate-800">
                No movement records found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {movements.length === 0
                  ? "Stock movements will appear here when they are recorded."
                  : "Try a different search term or movement filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Medicine</th>
                    <th className="px-5 py-4">Batch / ID</th>
                    <th className="px-5 py-4">Movement</th>
                    <th className="px-5 py-4">Quantity Change</th>
                    <th className="px-5 py-4">User ID</th>
                    <th className="px-5 py-4">Notes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map((movement, index) => {
                    const isIn = movement.movementType === "IN";
                    const batch = getBatch(movement.inventoryId);

                    return (
                      <tr
                        key={movement.stockLogId ?? index}
                        className="transition hover:bg-teal-50/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <CalendarClock
                              size={16}
                              className="shrink-0 text-slate-400"
                            />
                            {formatDate(movement.changedAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Package size={19} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {getMedicineName(movement.inventoryId)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Movement #{movement.stockLogId ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-700">
                            {batch?.batchNumber || "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Inventory #{movement.inventoryId ?? "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${movementStyle(movement.movementType)}`}
                          >
                            {isIn ? (
                              <ArrowDownRight size={14} />
                            ) : (
                              <ArrowUpRight size={14} />
                            )}
                            {movement.movementType || "OTHER"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`font-bold ${
                              isIn
                                ? "text-emerald-700"
                                : movement.movementType === "OUT"
                                  ? "text-orange-700"
                                  : "text-slate-700"
                            }`}
                          >
                            {Number(movement.changeQuantity) > 0 ? "+" : ""}
                            {Number(movement.changeQuantity ?? 0).toLocaleString("en-IN")}
                          </span>
                          <p className="mt-1 text-xs text-slate-400">Units</p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {movement.userId ?? "System"}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-500">
                          <p className="line-clamp-2">
                            {movement.notes || "No notes"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {filteredMovements.length} of {movements.length} movement records
          </div>
        </section>
      </div>
    </div>
  );
}

function Summary({ title, value, subtitle, icon, color }) {
  const colors = {
    teal: "border-teal-100 bg-gradient-to-br from-teal-50/80 to-white",
    green: "border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50/80 to-white",
    blue: "border-sky-100 bg-gradient-to-br from-sky-50/80 to-white",
  };

  const iconColors = {
    teal: "bg-teal-100 text-teal-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className={`rounded-xl p-3 ${iconColors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Notice({ type, message, onClose }) {
  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      <div className="flex items-start gap-2">
        {success ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        ) : (
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        )}
        <span className="break-words">{message}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="shrink-0 rounded p-1 hover:bg-black/5"
      >
        <X size={16} />
      </button>
    </div>
  );
}
