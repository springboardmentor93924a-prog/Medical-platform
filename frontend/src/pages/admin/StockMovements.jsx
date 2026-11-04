
import { API_BASE } from "../../services/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Search,
  CalendarClock,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  LoaderCircle,
  CheckCircle2,
  AlertTriangle,
  PackageX,
  Warehouse,
  X,
  Filter,
} from "lucide-react";

const API_URL = `${API_BASE}/stock-movements`;
const INVENTORY_URL = `${API_BASE}/inventory`;
const MEDICINES_URL = `${API_BASE}/admin/medicines`;

// =====================================================
// HELPERS
// =====================================================

function getToken() {
  return sessionStorage.getItem("medistock_token");
}

function getList(data) {
  if (Array.isArray(data)) return data;

  if (!data || typeof data !== "object") return [];

  const possibleLists = [
    data.content,
    data.data,
    data.result,
    data.movements,
    data.stockMovements,
    data.stockLogs,
    data.inventory,
    data.medicines,
    data.records,
    data.items,
    data.data?.content,
    data.data?.movements,
    data.data?.stockLogs,
    data.result?.content,
  ];

  return possibleLists.find(Array.isArray) || [];
}

function normalizeMovementType(type) {
  const value = String(type ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const incomingTypes = [
    "IN",
    "STOCK_IN",
    "STOCKIN",
    "RECEIVED",
    "PURCHASE",
    "ADD",
    "ADDED",
    "INWARD",
    "RESTOCK",
  ];

  const outgoingTypes = [
    "OUT",
    "STOCK_OUT",
    "STOCKOUT",
    "ISSUED",
    "SALE",
    "REMOVE",
    "REMOVED",
    "OUTWARD",
    "DISPENSED",
  ];

  if (incomingTypes.includes(value)) return "IN";
  if (outgoingTypes.includes(value)) return "OUT";

  return value || "OTHER";
}

function getMovementType(movement) {
  return (
    movement.movementType ??
    movement.type ??
    movement.transactionType ??
    movement.action ??
    movement.stockMovementType ??
    movement.movement ??
    ""
  );
}

function getMovementQuantity(movement) {
  return Number(
    movement.changeQuantity ??
    movement.quantityChanged ??
    movement.quantity ??
    movement.quantityChange ??
    movement.amount ??
    0
  );
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

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

function getStockStatus(item) {
  const quantity = Number(item.quantity ?? 0);
  const minimum = Number(
    item.minimumStock ?? item.minStock ?? 0
  );

  if (quantity <= 0) return "OUT";
  if (quantity <= minimum) return "LOW";

  return "AVAILABLE";
}

function movementStyle(type) {
  const normalized = normalizeMovementType(type);

  if (normalized === "IN") {
    return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30";
  }

  if (normalized === "OUT") {
    return "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-200 dark:ring-orange-500/30";
  }

  return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700";
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function StockMovements() {
  // -------------------- STATES --------------------

  const [movements, setMovements] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState("ALL");

  const [movementSearch, setMovementSearch] = useState("");
  const [movementFilter, setMovementFilter] = useState("ALL");

  // -------------------- API REQUEST --------------------

  const request = useCallback(async (url) => {
    const token = getToken();

    if (!token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `${url}: ${
          responseText ||
          `Request failed (${response.status})`
        }`
      );
    }

    if (!responseText) return [];

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(
        `${url}: The server returned invalid JSON.`
      );
    }
  }, []);

  // -------------------- LOAD DATA --------------------

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      {
        name: "Stock movements",
        url: API_URL,
        setter: setMovements,
      },
      {
        name: "Inventory",
        url: INVENTORY_URL,
        setter: setInventory,
      },
      {
        name: "Medicines",
        url: MEDICINES_URL,
        setter: setMedicines,
      },
    ];

    const results = await Promise.allSettled(
      endpoints.map((endpoint) => request(endpoint.url))
    );

    const errors = [];

    results.forEach((result, index) => {
      const endpoint = endpoints[index];

      if (result.status === "fulfilled") {
        const list = getList(result.value);

        endpoint.setter(list);

        console.log(`${endpoint.name} loaded:`, list);
      } else {
        errors.push(
          `${endpoint.name}: ${
            result.reason?.message || "Failed to load"
          }`
        );

        console.error(
          `${endpoint.name} API error:`,
          result.reason
        );
      }
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    setLoading(false);
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // -------------------- LOOKUP MAPS --------------------

  const medicineMap = useMemo(() => {
    return new Map(
      medicines.map((item) => [
        String(item.medicineId ?? item.id),
        item,
      ])
    );
  }, [medicines]);

  const inventoryMap = useMemo(() => {
    return new Map(
      inventory.map((item) => [
        String(item.inventoryId ?? item.id),
        item,
      ])
    );
  }, [inventory]);

  function getMedicineName(medicineId) {
    const medicine = medicineMap.get(String(medicineId));

    return (
      medicine?.medicineName ||
      medicine?.name ||
      `Medicine #${medicineId ?? "—"}`
    );
  }

  function getBatch(inventoryId) {
    return inventoryMap.get(String(inventoryId));
  }

  function getMovementMedicineName(movement) {
    const inventoryId =
      movement.inventoryId ??
      movement.inventory?.inventoryId ??
      movement.inventory?.id;

    const batch = getBatch(inventoryId);

    if (batch) {
      const medicineId =
        batch.medicineId ??
        batch.medicine?.medicineId;

      return (
        batch.medicine?.medicineName ||
        batch.medicine?.name ||
        getMedicineName(medicineId)
      );
    }

    return (
      movement.medicineName ||
      movement.medicine?.medicineName ||
      movement.medicine?.name ||
      `Inventory #${inventoryId ?? "—"}`
    );
  }

  // -------------------- INVENTORY STATISTICS --------------------

  const totalUnits = useMemo(() => {
    return inventory.reduce(
      (sum, item) =>
        sum + Number(item.quantity ?? 0),
      0
    );
  }, [inventory]);

  const lowStockItems = useMemo(
    () =>
      inventory.filter(
        (item) => getStockStatus(item) === "LOW"
      ),
    [inventory]
  );

  const outOfStockItems = useMemo(
    () =>
      inventory.filter(
        (item) => getStockStatus(item) === "OUT"
      ),
    [inventory]
  );

  // -------------------- MOVEMENT STATISTICS --------------------

  const incomingMovements = useMemo(
    () =>
      movements.filter(
        (item) =>
          normalizeMovementType(getMovementType(item)) === "IN"
      ),
    [movements]
  );

  const outgoingMovements = useMemo(
    () =>
      movements.filter(
        (item) =>
          normalizeMovementType(getMovementType(item)) === "OUT"
      ),
    [movements]
  );

  const incoming = incomingMovements.reduce(
    (sum, item) =>
      sum + Math.abs(getMovementQuantity(item)),
    0
  );

  const outgoing = outgoingMovements.reduce(
    (sum, item) =>
      sum + Math.abs(getMovementQuantity(item)),
    0
  );

  const netChange = incoming - outgoing;

  const incomingCount = incomingMovements.length;
  const outgoingCount = outgoingMovements.length;

  // -------------------- INVENTORY SEARCH --------------------

  const filteredInventory = useMemo(() => {
    const term = inventorySearch.trim().toLowerCase();

    return inventory.filter((item) => {
      const medicineId =
        item.medicineId ??
        item.medicine?.medicineId;

      const medicine =
        medicineMap.get(String(medicineId)) ??
        item.medicine;

      const medicineName =
        medicine?.medicineName ||
        medicine?.name ||
        "";

      const text = [
        medicineName,
        item.batchNumber,
        item.inventoryId,
        item.medicineId,
        item.quantity,
        item.minimumStock,
        item.expiryDate,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(term);

      const status = getStockStatus(item);

      const matchesFilter =
        inventoryFilter === "ALL" ||
        status === inventoryFilter;

      return matchesSearch && matchesFilter;
    });
  }, [
    inventory,
    inventorySearch,
    inventoryFilter,
    medicineMap,
  ]);

  // -------------------- MOVEMENT HISTORY SEARCH --------------------

  const filteredMovements = useMemo(() => {
    const term = movementSearch.trim().toLowerCase();

    return movements.filter((movement) => {
      const type = normalizeMovementType(
        getMovementType(movement)
      );

      const inventoryId =
        movement.inventoryId ??
        movement.inventory?.inventoryId ??
        movement.inventory?.id;

      const batch = inventoryMap.get(String(inventoryId));

      const medicineId =
        batch?.medicineId ??
        batch?.medicine?.medicineId ??
        movement.medicineId ??
        movement.medicine?.medicineId;

      const medicine =
        medicineMap.get(String(medicineId)) ??
        movement.medicine ??
        batch?.medicine;

      const medicineName =
        medicine?.medicineName ??
        medicine?.name ??
        movement.medicineName ??
        "";

      const batchNumber =
        batch?.batchNumber ??
        movement.batchNumber ??
        movement.inventory?.batchNumber ??
        "";

      const userName =
        movement.user?.email ??
        movement.user?.fullName ??
        movement.user?.name ??
        movement.userId ??
        "";

      const quantity = getMovementQuantity(movement);

      const text = [
        medicineName,
        batchNumber,
        type,
        getMovementType(movement),
        movement.notes,
        userName,
        inventoryId,
        movement.stockLogId,
        movement.movementId,
        quantity,
        movement.changedAt,
        movement.createdAt,
        movement.timestamp,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(term);

      const matchesFilter =
        movementFilter === "ALL" ||
        type === movementFilter;

      return matchesSearch && matchesFilter;
    });
  }, [
    movements,
    movementSearch,
    movementFilter,
    inventoryMap,
    medicineMap,
  ]);

  // -------------------- CLEAR SEARCH --------------------

  function clearMovementSearch() {
    setMovementSearch("");
    setMovementFilter("ALL");
  }

  function clearInventorySearch() {
    setInventorySearch("");
    setInventoryFilter("ALL");
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 text-slate-800 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 dark:text-slate-200 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}

        <section className="rounded-3xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 sm:p-8">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div className="flex items-start gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                <Warehouse size={27} />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-teal-700 dark:text-teal-300">
                  MEDISTOCK / INVENTORY CONTROL
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Stock Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Monitor available quantities, low-stock items,
                  out-of-stock medicines, and stock movements.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh data
            </button>

          </div>
        </section>

        {/* NOTIFICATIONS */}

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

        {/* INVENTORY SUMMARY */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Summary
            title="Inventory Batches"
            value={formatNumber(inventory.length)}
            subtitle="Total recorded batches"
            icon={<Boxes size={21} />}
            color="teal"
          />

          <Summary
            title="Available Units"
            value={formatNumber(totalUnits)}
            subtitle="Total quantity across batches"
            icon={<Package size={21} />}
            color="blue"
          />

          <Summary
            title="Low Stock"
            value={formatNumber(lowStockItems.length)}
            subtitle="At or below minimum stock"
            icon={<AlertTriangle size={21} />}
            color="amber"
          />

          <Summary
            title="Out of Stock"
            value={formatNumber(outOfStockItems.length)}
            subtitle="Batches with zero quantity"
            icon={<PackageX size={21} />}
            color="red"
          />

        </div>

        {/* STOCK ALERTS */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">

            <div className="flex items-center gap-3">
              <AlertTriangle
                className="text-amber-600 dark:text-amber-300"
                size={23}
              />

              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-200">
                  Low Stock Alert
                </h3>

                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {lowStockItems.length} batch(es) need stock replenishment.
                </p>
              </div>
            </div>

          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">

            <div className="flex items-center gap-3">
              <PackageX
                className="text-rose-600 dark:text-rose-300"
                size={23}
              />

              <div>
                <h3 className="font-bold text-rose-900 dark:text-rose-200">
                  Out of Stock Alert
                </h3>

                <p className="text-sm text-rose-800 dark:text-rose-300">
                  {outOfStockItems.length} batch(es) currently have no stock.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* INVENTORY REGISTER */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  Inventory Register
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  View medicine quantities, batches, and stock levels.
                </p>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
                {filteredInventory.length} batches
              </span>

            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

              <div className="relative w-full xl:max-w-sm">

                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={inventorySearch}
                  onChange={(event) =>
                    setInventorySearch(event.target.value)
                  }
                  placeholder="Search medicine or batch..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800/50"
                />

                {inventorySearch && (
                  <button
                    type="button"
                    onClick={() => setInventorySearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                    aria-label="Clear inventory search"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

              <div className="flex flex-wrap gap-2">

                {[
                  { value: "ALL", label: "All" },
                  { value: "AVAILABLE", label: "Available" },
                  { value: "LOW", label: "Low Stock" },
                  { value: "OUT", label: "Out of Stock" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setInventoryFilter(option.value)
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      inventoryFilter === option.value
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearInventorySearch}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Reset
                </button>

              </div>

            </div>
          </div>

          {loading ? (
            <Loading />
          ) : filteredInventory.length === 0 ? (
            <EmptyState message="No inventory records found." />
          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">

                  <tr>
                    <th className="px-5 py-4">Medicine</th>
                    <th className="px-5 py-4">Batch Number</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Minimum Stock</th>
                    <th className="px-5 py-4">Expiry Date</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item);

                    const medicineId =
                      item.medicineId ??
                      item.medicine?.medicineId;

                    return (
                      <tr
                        key={item.inventoryId ?? item.id}
                        className="hover:bg-teal-50/50 dark:hover:bg-teal-500/5"
                      >

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.medicine?.medicineName ||
                              item.medicine?.name ||
                              getMedicineName(medicineId)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Medicine ID: {medicineId ?? "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">
                          {item.batchNumber || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-800 dark:text-white">
                            {formatNumber(item.quantity)}
                          </span>

                          <span className="ml-1 text-xs text-slate-400">
                            units
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {formatNumber(
                            item.minimumStock ?? item.minStock
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                          {item.expiryDate || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <StockBadge status={status} />
                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>

            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Showing {filteredInventory.length} of {inventory.length} inventory batches
          </div>

        </section>

        {/* MOVEMENT SUMMARY */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <Summary
            title="Units Received"
            value={formatNumber(incoming)}
            subtitle={`${incomingCount} incoming records`}
            icon={<ArrowDownToLine size={21} />}
            color="green"
          />

          <Summary
            title="Units Issued"
            value={formatNumber(outgoing)}
            subtitle={`${outgoingCount} outgoing records`}
            icon={<ArrowUpFromLine size={21} />}
            color="amber"
          />

          <Summary
            title="Net Movement"
            value={`${netChange > 0 ? "+" : ""}${formatNumber(netChange)}`}
            subtitle="Received minus issued units"
            icon={<Activity size={21} />}
            color="blue"
          />

        </div>

        {/* STOCK MOVEMENT HISTORY */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  Stock Movement History
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Track stock received and issued.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {filteredMovements.length} records found
              </span>

            </div>

            {/* SEARCH AND FILTER */}

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

              <div className="relative w-full xl:max-w-md">

                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={movementSearch}
                  onChange={(event) =>
                    setMovementSearch(event.target.value)
                  }
                  placeholder="Search medicine, batch, type, user, notes..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-800/50"
                />

                {movementSearch && (
                  <button
                    type="button"
                    onClick={() => setMovementSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                    aria-label="Clear movement search"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

              <div className="flex flex-wrap items-center gap-2">

                <Filter
                  size={17}
                  className="text-slate-400"
                />

                {[
                  {
                    value: "ALL",
                    label: "All",
                    count: movements.length,
                  },
                  {
                    value: "IN",
                    label: "Stock IN",
                    count: incomingCount,
                  },
                  {
                    value: "OUT",
                    label: "Stock OUT",
                    count: outgoingCount,
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setMovementFilter(option.value)
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      movementFilter === option.value
                        ? option.value === "IN"
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : option.value === "OUT"
                            ? "border-orange-600 bg-orange-600 text-white"
                            : "border-teal-600 bg-teal-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}

                <button
                  type="button"
                  onClick={clearMovementSearch}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Reset
                </button>

              </div>

            </div>

          </div>

          {loading ? (
            <Loading />
          ) : filteredMovements.length === 0 ? (

            <EmptyState
              message={
                movements.length === 0
                  ? "No stock movement records are available."
                  : "No records match your search or selected filter."
              }
            />

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">

                  <tr>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Medicine</th>
                    <th className="px-5 py-4">Inventory ID</th>
                    <th className="px-5 py-4">Movement</th>
                    <th className="px-5 py-4">Quantity Change</th>
                    <th className="px-5 py-4">User ID</th>
                    <th className="px-5 py-4">Notes</th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                  {filteredMovements.map((movement, index) => {
                    const type = normalizeMovementType(
                      getMovementType(movement)
                    );

                    const isIn = type === "IN";

                    const inventoryId =
                      movement.inventoryId ??
                      movement.inventory?.inventoryId ??
                      movement.inventory?.id;

                    const batch = getBatch(inventoryId);

                    const movementId =
                      movement.stockLogId ??
                      movement.movementId ??
                      movement.id ??
                      index;

                    const quantity =
                      getMovementQuantity(movement);

                    const date =
                      movement.changedAt ??
                      movement.createdAt ??
                      movement.timestamp;

                    return (
                      <tr
                        key={movementId}
                        className="hover:bg-teal-50/50 dark:hover:bg-teal-500/5"
                      >

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <CalendarClock
                              size={16}
                              className="text-slate-400"
                            />

                            {formatDate(date)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {getMovementMedicineName(movement)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {batch?.batchNumber ||
                              movement.batchNumber ||
                              movement.inventory?.batchNumber ||
                              "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {inventoryId ?? "—"}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${movementStyle(type)}`}
                          >

                            {isIn ? (
                              <ArrowDownRight size={14} />
                            ) : type === "OUT" ? (
                              <ArrowUpRight size={14} />
                            ) : null}

                            {type}

                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`font-bold ${
                              isIn
                                ? "text-emerald-700 dark:text-emerald-300"
                                : type === "OUT"
                                  ? "text-orange-700 dark:text-orange-300"
                                  : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {quantity > 0 && isIn ? "+" : ""}
                            {formatNumber(quantity)}
                          </span>

                          <p className="mt-1 text-xs text-slate-400">
                            Units
                          </p>

                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {movement.userId ??
                            movement.user?.userId ??
                            movement.user?.email ??
                            "System"}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-500 dark:text-slate-400">
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

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Showing {filteredMovements.length} of {movements.length} movement records
          </div>

        </section>

      </div>
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function Summary({ title, value, subtitle, icon, color }) {
  const colors = {
    teal: "border-teal-200 bg-gradient-to-br from-white to-teal-50 dark:border-teal-900 dark:from-slate-900 dark:to-teal-950/40",
    green: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 dark:border-emerald-900 dark:from-slate-900 dark:to-emerald-950/40",
    amber: "border-amber-200 bg-gradient-to-br from-white to-amber-50 dark:border-amber-900 dark:from-slate-900 dark:to-amber-950/40",
    blue: "border-sky-200 bg-gradient-to-br from-white to-sky-50 dark:border-sky-900 dark:from-slate-900 dark:to-sky-950/40",
    red: "border-rose-200 bg-gradient-to-br from-white to-rose-50 dark:border-rose-900 dark:from-slate-900 dark:to-rose-950/40",
  };

  const iconColors = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    blue: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[color]}`}
    >
      <div className="flex items-start justify-between gap-3">

        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${iconColors[color]}`}>
          {icon}
        </div>

      </div>

      <p className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

// =====================================================
// STOCK STATUS BADGE
// =====================================================

function StockBadge({ status }) {
  const styles = {
    AVAILABLE:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    LOW:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    OUT:
      "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  };

  const labels = {
    AVAILABLE: "Available",
    LOW: "Low Stock",
    OUT: "Out of Stock",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// =====================================================
// LOADING
// =====================================================

function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 p-16 text-slate-500 dark:text-slate-400">
      <LoaderCircle
        size={22}
        className="animate-spin text-teal-600"
      />
      Loading data...
    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({ message }) {
  return (
    <div className="px-5 py-16 text-center">
      <Package
        size={30}
        className="mx-auto mb-3 text-slate-400"
      />

      <p className="font-semibold text-slate-700 dark:text-slate-300">
        {message}
      </p>
    </div>
  );
}

// =====================================================
// NOTIFICATION
// =====================================================

function Notice({ type, message, onClose }) {
  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      }`}
    >
      <div className="flex items-start gap-2">

        {success ? (
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />
        ) : (
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
        )}

        <span className="break-words whitespace-pre-line">
          {message}
        </span>

      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X size={16} />
      </button>
    </div>
  );
}
