
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  AlertTriangle,
  CalendarClock,
  ShoppingCart,
  RefreshCw,
  Search,
  CheckCircle2,
  Package,
  Clock,
  Activity,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";

const API = "http://localhost:8080/api";

const FILTERS = [
  { key: "ALL", label: "All Alerts" },
  { key: "LOW_STOCK", label: "Low Stock" },
  { key: "EXPIRED", label: "Expired" },
  { key: "EXPIRING", label: "Expiring Soon" },
  { key: "PENDING_ORDER", label: "Purchase Orders" },
];

const ALERT_STYLES = {
  amber: {
    icon: "bg-amber-100 text-amber-700",
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
    card: "bg-gradient-to-r from-amber-50 to-white",
  },
  red: {
    icon: "bg-rose-100 text-rose-700",
    border: "border-l-rose-500",
    badge: "bg-rose-100 text-rose-800",
    card: "bg-gradient-to-r from-rose-50 to-white",
  },
  blue: {
    icon: "bg-blue-100 text-blue-700",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-800",
    card: "bg-gradient-to-r from-blue-50 to-white",
  },
  purple: {
    icon: "bg-purple-100 text-purple-700",
    border: "border-l-purple-500",
    badge: "bg-purple-100 text-purple-800",
    card: "bg-gradient-to-r from-purple-50 to-white",
  },
};

export default function Notifications() {
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const token = sessionStorage.getItem("medistock_token");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("Please log in to view notifications.");
      }

      const headers = { Authorization: `Bearer ${token}` };

      const responses = await Promise.all([
        fetch(`${API}/inventory`, { headers }),
        fetch(`${API}/admin/medicines`, { headers }),
        fetch(`${API}/admin/purchase-orders`, { headers }),
      ]);

      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        if (failedResponse.status === 401 || failedResponse.status === 403) {
          throw new Error(
            `Access denied (${failedResponse.status}). Please check your login and API permissions.`
          );
        }

        throw new Error(
          `Unable to load notifications. Server returned ${failedResponse.status}.`
        );
      }

      const [inventoryData, medicineData, orderData] = await Promise.all(
        responses.map((response) => response.json())
      );

      setInventory(inventoryData);
      setMedicines(medicineData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);

  const futureString = [
    futureDate.getFullYear(),
    String(futureDate.getMonth() + 1).padStart(2, "0"),
    String(futureDate.getDate()).padStart(2, "0"),
  ].join("-");

  const medicineName = (id) =>
    medicines.find((medicine) => medicine.medicineId === id)?.medicineName
    || `Medicine #${id}`;

  const alerts = [
    ...inventory
      .filter((item) => item.quantity <= item.minimumStock)
      .map((item) => ({
        id: `stock-${item.inventoryId}`,
        type: "LOW_STOCK",
        title: "Low Stock Alert",
        message: `${medicineName(item.medicineId)} — batch ${item.batchNumber} has ${item.quantity} units remaining. Minimum stock is ${item.minimumStock}.`,
        date: null,
        icon: Package,
        color: "amber",
        action: "Review Inventory",
      })),

    ...inventory
      .filter((item) => item.expiryDate && item.expiryDate < todayString)
      .map((item) => ({
        id: `expired-${item.inventoryId}`,
        type: "EXPIRED",
        title: "Expired Medicine",
        message: `${medicineName(item.medicineId)} — batch ${item.batchNumber} expired on ${item.expiryDate}.`,
        date: item.expiryDate,
        icon: AlertTriangle,
        color: "red",
        action: "Review Batch",
      })),

    ...inventory
      .filter(
        (item) =>
          item.expiryDate &&
          item.expiryDate >= todayString &&
          item.expiryDate <= futureString
      )
      .map((item) => ({
        id: `expiry-${item.inventoryId}`,
        type: "EXPIRING",
        title: "Expiry Approaching",
        message: `${medicineName(item.medicineId)} — batch ${item.batchNumber} expires on ${item.expiryDate}.`,
        date: item.expiryDate,
        icon: CalendarClock,
        color: "blue",
        action: "Review Expiry",
      })),

    ...orders
      .filter((order) => order.status === "PENDING")
      .map((order) => ({
        id: `order-${order.purchaseOrderId}`,
        type: "PENDING_ORDER",
        title: "Purchase Order Pending",
        message: `Purchase order #${order.purchaseOrderId} is awaiting processing. Total: ₹${Number(order.totalAmount).toFixed(2)}.`,
        date: order.orderDate,
        icon: ShoppingCart,
        color: "purple",
        action: "Review Order",
      })),
  ];

  const counts = {
    ALL: alerts.length,
    LOW_STOCK: alerts.filter((a) => a.type === "LOW_STOCK").length,
    EXPIRED: alerts.filter((a) => a.type === "EXPIRED").length,
    EXPIRING: alerts.filter((a) => a.type === "EXPIRING").length,
    PENDING_ORDER: alerts.filter((a) => a.type === "PENDING_ORDER").length,
  };

  const visibleAlerts = alerts
    .filter((alert) => filter === "ALL" || alert.type === filter)
    .filter((alert) =>
      `${alert.title} ${alert.message}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const priority = { EXPIRED: 0, LOW_STOCK: 1, EXPIRING: 2, PENDING_ORDER: 3 };
      return priority[a.type] - priority[b.type];
    });

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/50 p-4 md:p-7 lg:p-8">
      {/* Page heading */}
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-5 shadow-sm md:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-teal-100/50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-28 w-28 rounded-full bg-cyan-100/60 blur-2xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <Bell size={29} />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-teal-700">
                <span>Workspace</span>
                <span>/</span>
                <span>Notifications</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Notifications
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
                Stay ahead of stock shortages, medicine expiry and pending purchases.
              </p>
            </div>
          </div>

          <button
            onClick={loadNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh alerts
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to load alerts</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <Metric
          icon={Bell}
          title="Total Alerts"
          value={counts.ALL}
          color="teal"
          subtitle="Across your workspace"
        />

        <Metric
          icon={Package}
          title="Low Stock"
          value={counts.LOW_STOCK}
          color="amber"
          subtitle="Needs replenishment"
        />

        <Metric
          icon={AlertTriangle}
          title="Expired Batches"
          value={counts.EXPIRED}
          color="red"
          subtitle="Requires attention"
        />

        <Metric
          icon={Clock}
          title="Pending Orders"
          value={counts.PENDING_ORDER}
          color="purple"
          subtitle="Awaiting processing"
        />
      </section>

      {/* Alert center */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
        <div className="space-y-5 border-b border-slate-100 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity size={21} className="text-teal-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Alert Center
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Important updates from your inventory and purchasing records.
              </p>
            </div>

            <span className="rounded-full border border-teal-100 bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700">
              {visibleAlerts.length} alerts
            </span>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-sm">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search alerts..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <SlidersHorizontal
                size={17}
                className="hidden shrink-0 text-slate-400 sm:block"
              />

              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition duration-200 ${
                    filter === key
                      ? "border-teal-600 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 opacity-80">({counts[key]})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-14 text-slate-500">
            <RefreshCw size={28} className="animate-spin text-teal-600" />
            <p className="text-sm font-medium">Loading your latest alerts...</p>
          </div>
        ) : visibleAlerts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 p-5 text-emerald-600">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {error ? "Alerts could not be loaded" : "You're all caught up"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {error
                ? "Fix the connection or permission issue, then refresh to try again."
                : search || filter !== "ALL"
                ? "No alerts match your current search or filter."
                : "There are no active stock or purchase alerts in the current data."}
            </p>

            {(search || filter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
                className="mt-5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          /* Notification rows */
          <div className="space-y-3 bg-slate-50/60 p-3 md:p-5">
            {visibleAlerts.map((alert) => {
              const Icon = alert.icon;
              const style = ALERT_STYLES[alert.color];

              return (
                <article
                  key={alert.id}
                  className={`group flex flex-col gap-4 rounded-2xl border border-slate-200 border-l-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center md:gap-5 md:p-5 ${style.border} ${style.card}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition duration-200 group-hover:scale-105 ${style.icon}`}
                  >
                    <Icon size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {alert.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
                      >
                        {alert.type.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                      {alert.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      {alert.date && (
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock size={14} />
                          Related date: {alert.date}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        Live data alert
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end sm:pl-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                      {alert.action}
                      <ArrowUpRight size={14} className="text-teal-600" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer information */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <Activity size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              MediStock monitoring
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Alerts are calculated from your current inventory and purchase-order data.
            </p>
          </div>
        </div>

        <button
          onClick={loadNotifications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Update data
        </button>
      </div>

      <p className="px-1 text-xs leading-5 text-slate-400">
        Notifications currently reflect live API data. Persistent read/unread
        status, dismiss actions and email/SMS delivery are not implemented yet.
      </p>
    </div>
  );
}

function Metric({ icon: Icon, title, value, color, subtitle }) {
  const colors = {
    teal: {
      card: "border-teal-100 from-teal-50 to-white",
      icon: "bg-teal-100 text-teal-700",
      number: "text-teal-800",
      accent: "bg-teal-500",
    },
    amber: {
      card: "border-amber-100 from-amber-50 to-white",
      icon: "bg-amber-100 text-amber-700",
      number: "text-amber-800",
      accent: "bg-amber-500",
    },
    red: {
      card: "border-rose-100 from-rose-50 to-white",
      icon: "bg-rose-100 text-rose-700",
      number: "text-rose-800",
      accent: "bg-rose-500",
    },
    purple: {
      card: "border-purple-100 from-purple-50 to-white",
      icon: "bg-purple-100 text-purple-700",
      number: "text-purple-800",
      accent: "bg-purple-500",
    },
  };

  const style = colors[color] || colors.teal;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className={`mt-3 text-3xl font-extrabold tracking-tight ${style.number}`}>
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`rounded-2xl p-3 transition duration-200 group-hover:scale-105 ${style.icon}`}
        >
          <Icon size={23} />
        </div>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/90">
        <div
          className={`h-full w-2/3 rounded-full opacity-50 ${style.accent}`}
        />
      </div>
    </div>
  );
}
