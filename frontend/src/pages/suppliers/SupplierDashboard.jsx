import SupplierProfile from "./SupplierProfile.jsx";
import SupplierNotifications from "./SupplierNotifications.jsx";
import SupplierMedicineReturns from "./SupplierMedicineReturns.jsx";


import { useCallback, useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";

import AppShell from "../../components/AppShell";

import { API_BASE } from "../../services/api";

const API_URL = API_BASE;

const MENU = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "orders", label: "My Purchase Orders", icon: "cart" },
  { id: "returns", label: "Medicine Returns", icon: "package" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "profile", label: "My Profile", icon: "users" },
];

export default function SupplierDashboard({ onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");

  // Fetch supplier's own purchase orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("medistock_token");

      if (!token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/purchase-orders/my-orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load purchase orders.");
      }

      const result = await response.json();
      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.content)
          ? result.content
          : Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.orders)
              ? result.orders
              : Array.isArray(result.purchaseOrders)
                ? result.purchaseOrders
                : [];
      setOrders(data);
    } catch (err) {
      setError(err.message || "Unable to load purchase orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatus = (status) =>
    String(status || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

  const countStatus = (status) =>
    orders.filter(
      (order) => getStatus(order.status) === status
    ).length;

  const getStatusStyle = (status) => {
    switch (getStatus(status)) {
      case "APPROVED":
        return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300";

      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";

      case "RECEIVED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";

      case "REJECTED":
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";

      case "CANCELLED":
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";

      case "PARTIALLY_RECEIVED":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300";

      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN");

  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      color:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    },
    {
      title: "Pending Orders",
      value: countStatus("PENDING"),
      icon: Clock,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
    },
    {
      title: "Approved Orders",
      value: countStatus("APPROVED"),
      icon: CheckCircle,
      color:
        "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    },
    {
      title: "Received Orders",
      value: countStatus("RECEIVED"),
      icon: Truck,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase();

    return (
      String(order.purchaseOrderId || "")
        .toLowerCase()
        .includes(query) ||
      getStatus(order.status).toLowerCase().includes(query)
    );
  });

  // Reusable purchase orders table
  const OrdersTable = ({ data, limit }) => {
    const displayedOrders = limit ? data.slice(0, limit) : data;

    if (loading) {
      return (
        <div className="p-10 text-center text-slate-500 dark:text-slate-400">
          Loading purchase orders...
        </div>
      );
    }

    if (displayedOrders.length === 0) {
      return (
        <div className="p-10 text-center">
          <Package
            size={40}
            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
          />
          <p className="font-medium text-slate-700 dark:text-slate-200">
            No purchase orders found
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your purchase orders will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="px-5 py-3">Order ID</th>
              <th className="px-5 py-3">Order Date</th>
              <th className="px-5 py-3">Total Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedOrders.map((order, index) => (
              <tr
                key={order.purchaseOrderId ?? index}
                className="transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
              >
                <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                  #{order.purchaseOrderId ?? "N/A"}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {formatDate(order.orderDate)}
                </td>

                <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                  ₹{formatAmount(order.totalAmount)}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      order.status
                    )}`}
                  >
                    {getStatus(order.status).replace(/_/g, " ") || "UNKNOWN"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Dashboard page
  const DashboardPage = () => (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Welcome, Supplier!</h2>
            <p className="mt-2 text-sm text-blue-100">
              Manage your purchase orders and track their status.
            </p>
          </div>
          <Package size={55} className="opacity-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const StatIcon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-800 dark:text-white">
                    {loading ? "..." : stat.value}
                  </h3>
                </div>

                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <StatIcon size={25} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Recent Purchase Orders
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your latest purchase order activity
            </p>
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <OrdersTable data={orders} limit={5} />

        {orders.length > 5 && (
          <div className="border-t border-slate-200 p-4 text-center dark:border-slate-800">
            <button
              onClick={() => setActivePage("orders")}
              className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View all {orders.length} orders
            </button>
          </div>
        )}
      </section>
    </div>
  );

  // All purchase orders page
  const OrdersPage = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          My Purchase Orders
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and track purchase orders assigned to your supplier account.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID or status..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <OrdersTable data={filteredOrders} />
      </section>
    </div>
  );

  // Notifications page
  const NotificationsPage = () => (
    <SupplierNotifications />
  );

  // Supplier Profile Page
  const ProfilePage = () => <SupplierProfile />;

  const pageTitles = {
    dashboard: "Supplier Dashboard",
    orders: "My Purchase Orders",
    returns: "Medicine Returns",
    notifications: "Notifications",
    profile: "My Profile",
  };

  const renderPage = () => {
    switch (activePage) {
      case "orders":
        return <OrdersPage />;

      case "notifications":
        return <NotificationsPage />;

      case "profile":
        return <ProfilePage />;

      case "returns":
        return <SupplierMedicineReturns />;

      default:
        return <DashboardPage />;
    }
  };

  return (
    <AppShell
      role="SUPPLIER"
      menu={MENU}
      active={activePage}
      onSelect={setActivePage}
      onLogout={onLogout}
      title={pageTitles[activePage]}
      subtitle="MediStock Supplier Portal"
    >
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={20} />
          <p className="flex-1 text-sm">{error}</p>
          <button onClick={fetchOrders} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {renderPage()}
    </AppShell>
  );
}