import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { API_BASE } from "../../services/api";

const API_URL = API_BASE;

const SupplierNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get token from sessionStorage
  const getToken = () =>
    sessionStorage.getItem("medistock_token");

  // API headers
  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Login session not found. Please log in again.");
      }

      const [notificationsResponse, countResponse] =
        await Promise.all([
          fetch(`${API_URL}/notifications`, {
            method: "GET",
            headers: getHeaders(),
          }),
          fetch(`${API_URL}/notifications/unread-count`, {
            method: "GET",
            headers: getHeaders(),
          }),
        ]);

      // Handle authentication errors
      if (
        notificationsResponse.status === 401 ||
        countResponse.status === 401
      ) {
        throw new Error(
          "Your login session is invalid or expired. Please log in again."
        );
      }

      if (
        notificationsResponse.status === 403 ||
        countResponse.status === 403
      ) {
        throw new Error(
          "Your supplier account does not have permission to access notifications. Check the backend SUPPLIER role permission."
        );
      }

      if (!notificationsResponse.ok) {
        throw new Error(
          `Notifications API failed: ${notificationsResponse.status}`
        );
      }

      if (!countResponse.ok) {
        throw new Error(
          `Unread count API failed: ${countResponse.status}`
        );
      }

      const notificationData = await notificationsResponse.json();
      const countData = await countResponse.json();

      setNotifications(
        Array.isArray(notificationData) ? notificationData : []
      );

      setUnreadCount(Number(countData.count ?? 0));

    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark one notification as read
  const markAsRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}/read`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not mark notification as read. Error: ${response.status}`
        );
      }

      await fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not mark notifications as read. Error: ${response.status}`
        );
      }

      await fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Could not delete notification. Error: ${response.status}`
        );
      }

      await fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  // Notification icons
  const getIcon = (type = "") => {
    const value = type.toUpperCase();

    if (value.includes("APPROVED") || value === "PURCHASE_ORDER_RECEIVED") {
      return <CheckCircle className="text-green-600 dark:text-green-400" size={22} />;
    }

    if (value.includes("REJECTED") || value.includes("CANCELLED")) {
      return <XCircle className="text-red-600 dark:text-red-400" size={22} />;
    }

    if (value.includes("PARTIALLY_RECEIVED")) {
      return <Package className="text-blue-600 dark:text-blue-400" size={22} />;
    }

    if (value.includes("EXPIRY") || value.includes("LOW_STOCK")) {
      return <AlertCircle className="text-orange-600 dark:text-orange-400" size={22} />;
    }

    return <Bell className="text-indigo-600 dark:text-indigo-400" size={22} />;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((item) => {
    if (filter === "UNREAD") return !item.read;
    if (filter === "READ") return item.read;
    return true;
  });

  // Format date
  const formatDate = (date) => {
    if (!date) return "Recently";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Recently";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 transition-colors dark:bg-slate-950 dark:text-white sm:p-6 lg:p-8">

      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 dark:text-white">
              <Bell className="text-blue-600 dark:text-blue-400" />
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Stay updated about your purchase orders.
            </p>
          </div>

          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
                  {notifications.length}
                </p>
              </div>

              <Bell className="text-blue-500" size={28} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Unread Notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {unreadCount}
                </p>
              </div>

              <span className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Bell size={22} />
              </span>
            </div>
          </div>

        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-wrap gap-2">
            {["ALL", "UNREAD", "READ"].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {value === "ALL"
                  ? "All"
                  : value === "UNREAD"
                    ? "Unread"
                    : "Read"}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <CheckCheck size={17} />
              Mark all as read
            </button>
          )}

        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError("")}
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <RefreshCw
              className="mx-auto mb-3 animate-spin text-blue-600"
              size={28}
            />
            Loading notifications...
          </div>

        ) : filteredNotifications.length === 0 ? (

          /* Empty State */
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center dark:border-slate-800 dark:bg-slate-900">
            <Bell
              className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
              size={42}
            />

            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              No notifications found
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {filter === "UNREAD"
                ? "You have no unread notifications."
                : filter === "READ"
                  ? "You have no read notifications."
                  : "Your notifications will appear here."}
            </p>
          </div>

        ) : (

          /* Notification List */
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (

              <div
                key={notification.notificationId}
                className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-slate-900 sm:p-5 ${
                  !notification.read
                    ? "border-l-4 border-l-blue-500 border-slate-200 dark:border-slate-800 dark:border-l-blue-400"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >

                <div className="flex items-start gap-3">

                  <div className="mt-1 rounded-full bg-slate-100 p-2 dark:bg-slate-800">
                    {getIcon(notification.notificationType)}
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-semibold text-slate-800 dark:text-white">
                        {(notification.notificationType || "Notification")
                          .replaceAll("_", " ")}
                      </h3>

                      {!notification.read && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                          New
                        </span>
                      )}

                    </div>

                    <p className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {notification.message}
                    </p>

                    <p className="mt-3 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Clock size={13} />
                      {formatDate(notification.createdAt)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4">

                      {!notification.read && (
                        <button
                          onClick={() =>
                            markAsRead(notification.notificationId)
                          }
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Check size={15} />
                          Mark as read
                        </button>
                      )}

                      <button
                        onClick={() =>
                          deleteNotification(notification.notificationId)
                        }
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>

                    </div>

                  </div>
                </div>
              </div>

            ))}
          </div>

        )}

      </div>
    </div>
  );
};

export default SupplierNotifications;