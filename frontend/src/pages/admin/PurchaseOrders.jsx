import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  X,
  XCircle,
} from "lucide-react";

import { apiFetch } from "../../services/api";

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "REJECTED",
  "CANCELLED",
];

function statusTheme(status) {
  const themes = {
    PENDING:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    APPROVED:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
    PARTIALLY_RECEIVED:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200",
    RECEIVED:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    REJECTED:
      "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
    CANCELLED:
      "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  };

  return (
    themes[status] ||
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Metric({ title, value, icon: Icon, tone }) {
  const tones = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <span className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [orderData, supplierData] = await Promise.all([
        apiFetch("/admin/purchase-orders"),
        apiFetch("/admin/suppliers"),
      ]);

      setOrders(Array.isArray(orderData) ? orderData : []);
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
    } catch (err) {
      setError(err.message || "Unable to load purchase orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const supplierName = useCallback(
    (id) =>
      suppliers.find((supplier) => supplier.supplierId === id)?.supplierName ||
      `Supplier #${id}`,
    [suppliers]
  );

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesText =
        !term ||
        `${order.purchaseOrderId} ${supplierName(order.supplierId)} ${
          order.status
        }`
          .toLowerCase()
          .includes(term);

      return (
        matchesText && (statusFilter === "ALL" || order.status === statusFilter)
      );
    });
  }, [orders, search, statusFilter, supplierName]);

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING"
  ).length;
  const approvedCount = orders.filter(
    (order) => order.status === "APPROVED"
  ).length;
  const totalValue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  async function viewItems(order) {
    setError("");
    setSelectedOrder(order);
    setOrderItems([]);
    setItemsLoading(true);

    try {
      const data = await apiFetch(
        `/admin/purchase-orders/${order.purchaseOrderId}/items`
      );
      setOrderItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load order items.");
    } finally {
      setItemsLoading(false);
    }
  }

  async function decide(order, status) {
    if (status === "REJECTED") {
      const confirmed = window.confirm(
        `Reject purchase order #${order.purchaseOrderId}? The pharmacist will need to raise a new one.`
      );
      if (!confirmed) return;
    }

    setBusyId(order.purchaseOrderId);
    setError("");
    setSuccess("");

    try {
      const updated = await apiFetch(
        `/admin/purchase-orders/${order.purchaseOrderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setOrders((current) =>
        current.map((row) =>
          row.purchaseOrderId === order.purchaseOrderId
            ? { ...row, ...updated, status: updated?.status || status }
            : row
        )
      );

      setSelectedOrder((current) =>
        current && current.purchaseOrderId === order.purchaseOrderId
          ? { ...current, ...updated, status: updated?.status || status }
          : current
      );

      setSuccess(
        `Order #${order.purchaseOrderId} ${
          status === "APPROVED" ? "approved" : "rejected"
        }.`
      );
    } catch (err) {
      setError(err.message || "Unable to update this order.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 md:p-7 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-cyan-50 p-6 shadow-sm transition-colors dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <ShoppingCart size={30} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                MediStock / Procurement
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Purchase Orders
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Review the orders pharmacists raise and approve or reject them.
                Approved orders are received by staff.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Action failed</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          {success}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total Orders" value={orders.length} icon={ShoppingCart} tone="teal" />
        <Metric title="Awaiting Review" value={pendingCount} icon={Clock} tone="amber" />
        <Metric title="Approved" value={approvedCount} icon={CheckCircle2} tone="blue" />
        <Metric title="Total Value" value={formatCurrency(totalValue)} icon={Receipt} tone="violet" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order or supplier..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:focus:bg-slate-900"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:w-auto"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL"
                  ? "All statuses"
                  : status
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/^./, (char) => char.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw
              size={24}
              className="mx-auto mb-3 animate-spin text-teal-600 dark:text-teal-400"
            />
            Loading purchase orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-teal-50 p-4 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <ShoppingCart size={30} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
              No purchase orders found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Pharmacists raise purchase orders; they will appear here for
              approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Supplier</th>
                  <th className="px-5 py-4">Order Date</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.purchaseOrderId}
                    className="transition hover:bg-teal-50/50 dark:hover:bg-teal-500/5"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                      #{order.purchaseOrderId}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <Truck size={16} />
                        </span>
                        {supplierName(order.supplierId)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-block rounded-full px-3 py-1.5 text-xs font-bold ${statusTheme(
                          order.status
                        )}`}
                      >
                        {String(order.status || "").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => viewItems(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-500/30 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-500/10"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        {order.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => decide(order, "APPROVED")}
                              disabled={busyId === order.purchaseOrderId}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 size={15} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => decide(order, "REJECTED")}
                              disabled={busyId === order.purchaseOrderId}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              <XCircle size={15} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  Purchase details
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  Order #{selectedOrder.purchaseOrderId}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {supplierName(selectedOrder.supplierId)} ·{" "}
                  {formatDate(selectedOrder.orderDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderItems([]);
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50"
                aria-label="Close order details"
              >
                <X size={20} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusTheme(
                    selectedOrder.status
                  )}`}
                >
                  {String(selectedOrder.status || "").replace(/_/g, " ")}
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>

              {itemsLoading ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  <RefreshCw
                    size={22}
                    className="mx-auto mb-3 animate-spin text-teal-600 dark:text-teal-400"
                  />
                  Loading items...
                </div>
              ) : orderItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No items recorded for this order.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">Item</th>
                        <th className="pb-3 pr-4">Ordered</th>
                        <th className="pb-3 pr-4">Received</th>
                        <th className="pb-3">Unit price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {orderItems.map((item) => (
                        <tr key={item.itemId}>
                          <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                            Medicine #{item.medicineId}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                            {item.quantity}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                            {item.receivedQuantity ?? 0}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedOrder.status === "PENDING" && (
              <footer className="flex flex-col gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => decide(selectedOrder, "REJECTED")}
                  disabled={busyId === selectedOrder.purchaseOrderId}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <XCircle size={17} />
                  Reject order
                </button>
                <button
                  type="button"
                  onClick={() => decide(selectedOrder, "APPROVED")}
                  disabled={busyId === selectedOrder.purchaseOrderId}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={17} />
                  Approve order
                </button>
              </footer>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
