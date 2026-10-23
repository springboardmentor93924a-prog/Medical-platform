import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  Package,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { apiFetch } from "../../services/api";

const TYPE_META = {
  LOW_STOCK: { label: "Low stock", icon: Package, tone: "amber" },
  EXPIRING_SOON: { label: "Expiring soon", icon: CalendarClock, tone: "orange" },
  EXPIRED: { label: "Expired", icon: AlertTriangle, tone: "red" },
  ORDER_PENDING: { label: "Order pending", icon: ShoppingCart, tone: "violet" },
};

const TONES = {
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

const FILTERS = ["ALL", "UNREAD", "LOW_STOCK", "EXPIRING_SOON", "EXPIRED", "ORDER_PENDING"];

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, counts] = await Promise.all([
        apiFetch("/notifications"),
        apiFetch("/notifications/unread-count"),
      ]);
      setItems(list);
      setUnread(counts.count);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAlerts = async () => {
    setRefreshing(true);
    setError("");
    try {
      const result = await apiFetch("/notifications/refresh", { method: "POST" });
      setNotice(
        result.created > 0
          ? `${result.created} new alert(s) generated`
          : "No new alerts — everything is already covered"
      );
      await load();
    } catch (err) {
      setError(err.message || "Unable to refresh alerts.");
    } finally {
      setRefreshing(false);
    }
  };

  const markRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err.message || "Unable to update notification.");
    }
  };

  const markAllRead = async () => {
    try {
      const result = await apiFetch("/notifications/read-all", { method: "POST" });
      setNotice(`${result.updated} notification(s) marked as read`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to update notifications.");
    }
  };

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const visible = items.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "UNREAD") return !item.read;
    return item.notificationType === filter;
  });

  const toneFor = (type) => TONES[(TYPE_META[type] || {}).tone] || TONES.slate;
  const iconFor = (type) => (TYPE_META[type] || { icon: Bell }).icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <Bell size={28} />
              {unread > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold shadow">
                  {unread}
                </span>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-700">
                MediStock / Alerts
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {unread} unread — low stock, expiry and pending purchase order alerts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Reload
            </button>
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
            <button
              onClick={refreshAlerts}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-60"
            >
              <BellRing size={16} />
              {refreshing ? "Scanning..." : "Scan for alerts"}
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-xs font-bold ring-1 ring-inset transition ${
              filter === value
                ? "bg-teal-600 text-white ring-teal-600"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {value === "ALL"
              ? "All"
              : value === "UNREAD"
                ? "Unread"
                : (TYPE_META[value] || { label: value }).label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 p-10 text-slate-600">
          <RefreshCw size={22} className="animate-spin" /> Loading notifications...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Bell size={34} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">Nothing here</p>
          <p className="mt-1 text-sm text-slate-500">
            Use “Scan for alerts” to check stock, expiry and pending orders.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const meta = TYPE_META[item.notificationType] || {
              label: item.notificationType,
              icon: Bell,
              tone: "slate",
            };
            const Icon = iconFor(item.notificationType);
            return (
              <li
                key={item.notificationId}
                className={`flex items-start gap-4 rounded-2xl border p-4 shadow-sm ${
                  item.read
                    ? "border-slate-200 bg-white"
                    : "border-teal-200 bg-teal-50/40"
                }`}
              >
                <div className={`rounded-xl p-2.5 ring-1 ring-inset ${toneFor(item.notificationType)}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${toneFor(item.notificationType)}`}
                    >
                      {meta.label}
                    </span>
                    {!item.read && (
                      <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        NEW
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {item.createdAt ? item.createdAt.replace("T", " ").slice(0, 16) : ""}
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 text-sm ${
                      item.read ? "text-slate-500" : "font-medium text-slate-800"
                    }`}
                  >
                    {item.message}
                  </p>
                </div>
                {!item.read && (
                  <button
                    onClick={() => markRead(item.notificationId)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Mark read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-slate-400">
        Alerts are generated server-side from inventory levels, expiry dates and
        pending purchase orders. Email/SMS delivery is not part of this milestone.
      </p>
    </div>
  );
}
