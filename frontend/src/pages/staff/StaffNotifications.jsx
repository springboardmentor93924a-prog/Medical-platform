
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  AlertTriangle,
  Package,
  ClipboardList,
  Search,
  RefreshCw,
  CalendarDays,
  CheckCircle,
  Info,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

export default function StaffNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/notifications");
      // Support common API response formats.
      const data = Array.isArray(response)
        ? response
        : response?.notifications ||
          response?.content ||
          response?.data ||
          [];

      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notifications API error:", err);
      setError(
        err.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Identify notification category.
  const getCategory = (notification) => {
    const value = [
      notification.type,
      notification.category,
      notification.title,
      notification.message,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      value.includes("expiry") ||
      value.includes("expired") ||
      value.includes("near-expiry")
    ) {
      return "EXPIRY";
    }

    if (
      value.includes("stock") ||
      value.includes("inventory") ||
      value.includes("low quantity")
    ) {
      return "STOCK";
    }

    if (
      value.includes("task") ||
      value.includes("assigned")
    ) {
      return "TASK";
    }

    return "GENERAL";
  };

  const getTitle = (item) =>
    item.title ||
    item.subject ||
    item.type ||
    "Notification";

  const getMessage = (item) =>
    item.message ||
    item.description ||
    item.content ||
    "You have a new notification.";

  const isUnread = (item) =>
    item.read === false ||
    item.isRead === false ||
    item.status === "UNREAD";

  const getDate = (item) => {
    const date =
      item.createdAt ||
      item.notificationDate ||
      item.date ||
      item.assignedAt;

    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter(isUnread).length;

  const stockCount = notifications.filter(
    (item) => getCategory(item) === "STOCK"
  ).length;

  const expiryCount = notifications.filter(
    (item) => getCategory(item) === "EXPIRY"
  ).length;

  const taskCount = notifications.filter(
    (item) => getCategory(item) === "TASK"
  ).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const category = getCategory(item);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "UNREAD" && isUnread(item)) ||
        category === filter;

      const text = [
        getTitle(item),
        getMessage(item),
        item.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && text.includes(search.toLowerCase());
    });
  }, [notifications, filter, search]);

  const getIcon = (category) => {
    if (category === "EXPIRY") {
      return <AlertTriangle size={21} />;
    }

    if (category === "STOCK") {
      return <Package size={21} />;
    }

    if (category === "TASK") {
      return <ClipboardList size={21} />;
    }

    return <Bell size={21} />;
  };

  const getIconStyle = (category) => {
    if (category === "EXPIRY") {
      return "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
    }

    if (category === "STOCK") {
      return "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
    }

    if (category === "TASK") {
      return "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
    }

    return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Staff Notifications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View your stock alerts, expiry alerts and assigned tasks.
          </p>
        </div>

        <button
          onClick={fetchNotifications}
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
          title="Total Notifications"
          count={notifications.length}
          icon={<Bell size={21} />}
          color="blue"
        />

        <SummaryCard
          title="Unread"
          count={unreadCount}
          icon={<Info size={21} />}
          color="red"
        />

        <SummaryCard
          title="Stock Alerts"
          count={stockCount}
          icon={<Package size={21} />}
          color="amber"
        />

        <SummaryCard
          title="Expiry Alerts"
          count={expiryCount}
          icon={<CalendarDays size={21} />}
          color="purple"
        />
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Notifications
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {taskCount} assigned task notifications
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["ALL", "All"],
            ["UNREAD", "Unread"],
            ["STOCK", "Stock"],
            ["EXPIRY", "Expiry"],
            ["TASK", "Tasks"],
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

        {/* Notification list */}
        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Loading notifications...
          </p>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle
              size={42}
              className="mx-auto mb-3 text-slate-400"
            />

            <h4 className="font-semibold text-slate-700 dark:text-white">
              No notifications found
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              New alerts and assigned tasks will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item, index) => {
              const category = getCategory(item);

              return (
                <div
                  key={
                    item.notificationId ||
                    item.id ||
                    index
                  }
                  className={`flex gap-4 rounded-xl border p-4 ${
                    isUnread(item)
                      ? "border-blue-200 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getIconStyle(category)}`}
                  >
                    {getIcon(category)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {getTitle(item)}
                      </h4>

                      {isUnread(item) && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {getMessage(item)}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {getDate(item)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, count, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
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
