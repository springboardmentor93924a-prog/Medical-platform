
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../services/api";

import {
  Truck,
  Search,
  RefreshCw,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Package,
  History,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

const SUPPLIERS_API = `${API_BASE}/admin/suppliers`;
const PURCHASE_API = `${API_BASE}/purchase-orders`;

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    APPROVED:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
    RECEIVED:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    CANCELLED:
      "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  };

  const icons = {
    PENDING: Clock,
    APPROVED: CheckCircle2,
    RECEIVED: CheckCircle2,
    CANCELLED: XCircle,
  };

  const Icon = icons[status] || Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
        styles[status] ||
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      <Icon size={13} />
      {status || "UNKNOWN"}
    </span>
  );
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});
  const [historyErrors, setHistoryErrors] = useState({});

  const request = useCallback(async (url) => {
    const token =
      sessionStorage.getItem("medistock_token") ||
      localStorage.getItem("medistock_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

    if (!token) {
      throw new Error("Please log in to view supplier information.");
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed: ${response.status}`
      );
    }

    return data;
  }, []);

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request(SUPPLIERS_API);
      setSuppliers(getList(data));
    } catch (err) {
      setError(err.message || "Unable to load suppliers.");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Load purchase history for one supplier
  const loadPurchaseHistory = useCallback(
    async (supplierId) => {
      if (supplierId == null) return;

      setHistoryLoading((previous) => ({
        ...previous,
        [supplierId]: true,
      }));

      setHistoryErrors((previous) => ({
        ...previous,
        [supplierId]: "",
      }));

      try {
        const data = await request(
          `${PURCHASE_API}/supplier/${supplierId}`
        );

        setPurchaseHistory((previous) => ({
          ...previous,
          [supplierId]: getList(data),
        }));
      } catch (err) {
        setHistoryErrors((previous) => ({
          ...previous,
          [supplierId]:
            err.message || "Unable to load purchase history.",
        }));
      } finally {
        setHistoryLoading((previous) => ({
          ...previous,
          [supplierId]: false,
        }));
      }
    },
    [request]
  );

  // Expand or collapse purchase history
  const togglePurchaseHistory = (supplierId) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null);
      return;
    }

    setExpandedSupplier(supplierId);

    // Fetch history only when it has not already been loaded
    if (!Object.prototype.hasOwnProperty.call(purchaseHistory, supplierId)) {
      loadPurchaseHistory(supplierId);
    }
  };

  // Search suppliers
  const filteredSuppliers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return suppliers.filter((supplier) =>
      [
        supplier.supplierName,
        supplier.email,
        supplier.contactNumber,
        supplier.address,
        supplier.medicines,
        supplier.supplierId,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [suppliers, search]);

  const totalOrders = Object.values(purchaseHistory).reduce(
    (total, orders) => total + orders.length,
    0
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 dark:border-blue-900/40 dark:from-slate-900 dark:to-slate-900">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-600 p-3 text-white">
            <Truck size={27} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Suppliers
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage supplier details, supplied medicines and purchase history.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSuppliers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </header>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Suppliers
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {suppliers.length}
              </p>
            </div>
            <Truck className="text-blue-600" size={27} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loaded Purchase Orders
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {totalOrders}
              </p>
            </div>
            <ShoppingCart className="text-emerald-600" size={27} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Orders from supplier histories opened during this session.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          All Suppliers ({filteredSuppliers.length})
        </h2>

        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search suppliers..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Supplier list */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500 dark:text-slate-400">
          <RefreshCw size={20} className="animate-spin" />
          Loading suppliers...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Truck
            size={36}
            className="mx-auto text-slate-400 dark:text-slate-500"
          />

          <h3 className="mt-3 font-semibold text-slate-800 dark:text-white">
            {search ? "No suppliers found" : "No suppliers available"}
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {search
              ? "Try a different search term."
              : "Supplier records will appear here when available."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredSuppliers.map((supplier) => {
            const supplierId = supplier.supplierId;
            const isExpanded = expandedSupplier === supplierId;
            const orders = purchaseHistory[supplierId] || [];

            return (
              <article
                key={supplierId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Supplier details */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Truck size={23} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-slate-900 dark:text-white">
                          {supplier.supplierName || "Unnamed supplier"}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Supplier ID: {supplierId ?? "—"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                        supplier.active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {supplier.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <Mail
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <span className="break-all">
                        {supplier.email || "Email not available"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <span>
                        {supplier.contactNumber || "Phone not available"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <span className="break-words">
                        {supplier.address || "Address not available"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Package
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <div>
                        <span className="font-semibold">
                          Supplied medicines:
                        </span>
                        <p className="mt-1 break-words">
                          {supplier.medicines || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Purchase history button */}
                  <button
                    type="button"
                    onClick={() => togglePurchaseHistory(supplierId)}
                    className="mt-5 flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <History size={17} />
                      View Purchase History
                    </span>

                    {isExpanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>

                {/* Purchase history */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                    <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                      <ShoppingCart size={18} />
                      Purchase History
                    </h4>

                    {historyLoading[supplierId] ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-400">
                        <RefreshCw size={18} className="animate-spin" />
                        Loading purchase history...
                      </div>
                    ) : historyErrors[supplierId] ? (
                      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                        <p>{historyErrors[supplierId]}</p>

                        <button
                          type="button"
                          onClick={() => loadPurchaseHistory(supplierId)}
                          className="mt-3 font-semibold underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                        <History
                          size={27}
                          className="mx-auto text-slate-400"
                        />
                        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No purchase history found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          No purchase orders are available for this supplier.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders
                          .slice()
                          .sort((a, b) =>
                            String(b.orderDate || "").localeCompare(
                              String(a.orderDate || "")
                            )
                          )
                          .map((order) => (
                            <div
                              key={order.purchaseOrderId}
                              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    PO #{order.purchaseOrderId}
                                  </p>

                                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <CalendarDays size={14} />
                                    {formatDate(order.orderDate)}
                                  </p>
                                </div>

                                <StatusBadge status={order.status} />
                              </div>

                              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Total Amount
                                </span>

                                <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300">
                                  <IndianRupee size={15} />
                                  {formatAmount(order.totalAmount)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
