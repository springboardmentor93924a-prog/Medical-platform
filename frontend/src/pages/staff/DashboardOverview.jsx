
import { useEffect, useState } from "react";
import {
  ClipboardList,
  Package,
  AlertTriangle,
  Truck,
  TrendingDown,
  RefreshCw,
  Activity,
  CalendarDays,
} from "lucide-react";

import { apiFetch } from "../../services/api";

export default function DashboardOverview() {
  const [inventory, setInventory] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [inventoryData, reportData] = await Promise.all([
        apiFetch("/inventory"),
        apiFetch("/stock-check-reports/my"),
      ]);

      setInventory(
        Array.isArray(inventoryData) ? inventoryData : []
      );

      setMyReports(
        Array.isArray(reportData) ? reportData : []
      );
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message || "Unable to load dashboard information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Calculate inventory information
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableMedicines = new Set(
    inventory
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => item.medicineId)
  ).size;

  const lowStockCount = inventory.filter(
    (item) =>
      Number(item.quantity) <= Number(item.minimumStock)
  ).length;

  const expiryAlerts = inventory.filter((item) => {
    if (!item.expiryDate) return false;

    const expiryDate = new Date(item.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );

    return daysRemaining <= 30;
  }).length;

  const pendingReports = myReports.filter(
    (report) => report.status === "PENDING"
  ).length;

  // These figures require separate task and delivery APIs.
  const assignedTasks = 0;
  const pendingDeliveries = 0;

  const cards = [
    {
      title: "Assigned Tasks",
      value: assignedTasks,
      description: "Tasks assigned to you",
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: "Available Medicines",
      value: availableMedicines,
      description: "Medicines currently in stock",
      icon: Package,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-500/10",
    },
    {
      title: "Expiry Alerts",
      value: expiryAlerts,
      description: "Expired or expiring within 30 days",
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-500/10",
    },
    {
      title: "Pending Deliveries",
      value: pendingDeliveries,
      description: "Deliveries awaiting verification",
      icon: Truck,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-500/10",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount,
      description: "Batches at or below minimum stock",
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-500/10",
    },
    {
      title: "Pending Stock Reports",
      value: pendingReports,
      description: "Your reports awaiting review",
      icon: ClipboardList,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Dashboard Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Staff Dashboard
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your daily inventory operations and assigned tasks.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200
          bg-white px-4 py-2 text-sm font-medium text-slate-700
          hover:bg-slate-50 disabled:opacity-50
          dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <RefreshCw className="mx-auto animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading dashboard information...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Dashboard Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const CardIcon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {card.title}
                      </p>

                      <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                        {card.value}
                      </p>
                    </div>

                    <div className={`rounded-xl p-3 ${card.bg}`}>
                      <CardIcon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Daily Operational Information */}
          <div className="grid gap-5 lg:grid-cols-2">

            {/* Inventory Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Inventory Overview
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Total inventory batches
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {inventory.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Medicines in stock
                  </span>
                  <span className="font-semibold text-green-600">
                    {availableMedicines}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Low stock batches
                  </span>
                  <span className="font-semibold text-red-600">
                    {lowStockCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Expiry alerts
                  </span>
                  <span className="font-semibold text-orange-600">
                    {expiryAlerts}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-blue-600" size={20} />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Daily Operational Information
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Today's date
                  </span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Stock reports submitted
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {myReports.filter((report) => {
                      if (!report.reportedAt) return false;

                      return new Date(report.reportedAt)
                        .toDateString() === new Date().toDateString();
                    }).length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Reports awaiting review
                  </span>
                  <span className="font-semibold text-indigo-600">
                    {pendingReports}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Reported inventory discrepancies
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {myReports.filter(
                      (report) => Number(report.difference) !== 0
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
