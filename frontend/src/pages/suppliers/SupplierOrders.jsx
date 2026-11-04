
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Clock,
  CheckCircle,
  PackageCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import AppShell from "../../components/AppShell";
import SupplierOrders from "./SupplierOrders";
import { apiFetch } from "../../utils/api";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "purchase-orders", label: "Purchase Orders", icon: "cart" },
];

function getStatus(order) {
  return String(order.status || "").toUpperCase();
}

function SupplierHome({ onSelect }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/purchase-orders/my-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = [
    {
      label: "Total Orders",
      value: orders.length,
      icon: ClipboardList,
      color: "blue",
    },
    {
      label: "Pending Orders",
      value: orders.filter((o) => getStatus(o) === "PENDING").length,
      icon: Clock,
      color: "amber",
    },
    {
      label: "Approved Orders",
      value: orders.filter((o) => getStatus(o) === "APPROVED").length,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Received Orders",
      value: orders.filter((o) =>
        ["RECEIVED", "DELIVERED"].includes(getStatus(o))
      ).length,
      icon: PackageCheck,
      color: "violet",
    },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => {
      const dateA = new Date(a.orderDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.orderDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 via-ink-900 to-slate-950 p-6 text-white shadow-xl sm:p-10">
        <div className="brand-grid pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
            Supplier portal
          </p>

          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Welcome to your Supplier Dashboard.
          </h2>

          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Monitor your purchase orders and keep track of pharmacy deliveries.
          </p>

          <button
            type="button"
            onClick={() => onSelect("purchase-orders")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-lg hover:bg-blue-50"
          >
            View purchase orders
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </span>
          <button onClick={loadOrders} className="font-semibold">
            Retry
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Order Overview
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your purchase order statistics
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[stat.color]}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {loading ? "—" : stat.value}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Recent Purchase Orders
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Your latest five orders
            </p>
          </div>

          <button
            onClick={() => onSelect("purchase-orders")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading orders...</p>
        ) : recentOrders.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No purchase orders found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((order) => (
                  <tr key={order.purchaseOrderId}>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      #{order.purchaseOrderId}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {order.orderDate
                        ? new Date(order.orderDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        {order.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SupplierDashboard({ onLogout }) {
  const [active, setActive] = useState("dashboard");
  const current = menu.find((item) => item.id === active);

  return (
    <AppShell
      role="Supplier"
      menu={menu}
      active={active}
      onSelect={setActive}
      onLogout={onLogout}
      title={current.label}
      subtitle="Orders and deliveries from the pharmacy"
    >
      <div key={active} className="animate-rise">
        {active === "dashboard" && <SupplierHome onSelect={setActive} />}
        {active === "purchase-orders" && <SupplierOrders />}
      </div>
    </AppShell>
  );
}
