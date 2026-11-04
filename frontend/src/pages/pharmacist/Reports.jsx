
import { API_BASE, downloadFile } from "../../services/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Download,
  FileBarChart,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

const API = API_BASE;

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 10);
};

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export default function Reports() {
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [reportType, setReportType] = useState("stock");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    const token =
      sessionStorage.getItem("medistock_token") ||
      localStorage.getItem("medistock_token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view reports.");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const endpoints = [
      {
        name: "Inventory",
        url: `${API}/inventory`,
        setter: setInventory,
      },
      {
        name: "Medicines",
        url: `${API}/admin/medicines`,
        setter: setMedicines,
      },
      {
        name: "Purchase orders",
        url: `${API}/purchase-orders`,
        setter: setOrders,
      },
      {
        name: "Stock movements",
        url: `${API}/stock-movements`,
        setter: setMovements,
      },
    ];

    try {
      const results = await Promise.all(
        endpoints.map(async ({ name, url, setter }) => {
          try {
            const response = await fetch(url, { headers });

            if (!response.ok) {
              throw new Error(`${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            setter(getList(data));

            return null;
          } catch (err) {
            console.error(`${name} loading error:`, err);
            setter([]);
            return `${name}: ${err.message}`;
          }
        })
      );

      const failures = results.filter(Boolean);

      if (failures.length) {
        setError(`Some reports could not be loaded: ${failures.join("; ")}`);
      }
    } catch (err) {
      console.error("Report loading error:", err);
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const todayString = getTodayString();

  const futureDate = new Date();
  futureDate.setHours(0, 0, 0, 0);
  futureDate.setDate(futureDate.getDate() + 30);

  const soonString = [
    futureDate.getFullYear(),
    String(futureDate.getMonth() + 1).padStart(2, "0"),
    String(futureDate.getDate()).padStart(2, "0"),
  ].join("-");

  const lowStock = useMemo(
    () =>
      inventory.filter(
        (item) =>
          Number(item.quantity ?? 0) <= Number(item.minimumStock ?? 0)
      ),
    [inventory]
  );

  const expired = useMemo(
    () =>
      inventory.filter(
        (item) => item.expiryDate && item.expiryDate < todayString
      ),
    [inventory, todayString]
  );

  const expiringSoon = useMemo(
    () =>
      inventory.filter(
        (item) =>
          item.expiryDate &&
          item.expiryDate >= todayString &&
          item.expiryDate <= soonString
      ),
    [inventory, todayString, soonString]
  );

  const inventoryValue = useMemo(
    () =>
      inventory.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      ),
    [inventory]
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  );

  const totalOrderValue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  const medicineName = useCallback(
    (id) =>
      medicines.find(
        (medicine) => Number(medicine.medicineId) === Number(id)
      )?.medicineName || `Medicine #${id ?? "Unknown"}`,
    [medicines]
  );

  const reportTypes = [
    { type: "stock", name: "Stock on hand" },
    { type: "expiry", name: "Expiry status" },
    { type: "low-stock", name: "Low stock items" },
    { type: "movements", name: "Stock movements" },
    { type: "orders", name: "Purchase orders" },
  ];

  const dateFiltered =
    reportType === "movements" || reportType === "orders";

  const handleDownload = async () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDownloadError("From date cannot be later than To date.");
      return;
    }

    setDownloading(true);
    setDownloadError("");

    try {
      const params = new URLSearchParams();

      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const query = params.toString();
      const stamp = getTodayString();

      await downloadFile(
        `/reports/${reportType}.csv${query ? `?${query}` : ""}`,
        `medistock-${reportType}-${stamp}.csv`
      );
    } catch (err) {
      console.error("CSV download error:", err);
      setDownloadError(err.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const matchesSearch = (value) =>
    String(value ?? "").toLowerCase().includes(search.toLowerCase());

  const filteredLowStock = lowStock.filter(
    (item) =>
      matchesSearch(medicineName(item.medicineId)) ||
      matchesSearch(item.batchNumber)
  );

  const filteredExpired = expired.filter(
    (item) =>
      matchesSearch(medicineName(item.medicineId)) ||
      matchesSearch(item.batchNumber)
  );

  const filteredExpiring = expiringSoon.filter(
    (item) =>
      matchesSearch(medicineName(item.medicineId)) ||
      matchesSearch(item.batchNumber)
  );

  const filteredOrders = [...orders]
    .filter(
      (order) =>
        matchesSearch(order.purchaseOrderId) ||
        matchesSearch(order.status) ||
        matchesSearch(order.supplierId)
    )
    .sort(
      (a, b) =>
        Number(b.purchaseOrderId || 0) -
        Number(a.purchaseOrderId || 0)
    )
    .slice(0, 10);

  const filteredMovements = [...movements]
    .filter(
      (movement) =>
        matchesSearch(movement.stockLogId) ||
        matchesSearch(movement.inventoryId) ||
        matchesSearch(movement.movementType) ||
        matchesSearch(movement.notes)
    )
    .sort(
      (a, b) =>
        new Date(b.changedAt || 0) - new Date(a.changedAt || 0)
    )
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 bg-slate-50 p-8 dark:bg-slate-800/50">
        <div className="rounded-2xl bg-teal-50 p-4 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
          <RefreshCw size={30} className="animate-spin" />
        </div>
        <p className="font-medium text-slate-600 dark:text-slate-300">
          Preparing your reports...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-7 lg:p-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <FileBarChart size={30} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                MediStock / Analytics
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Reports & Analytics
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Monitor inventory value, stock risks, expiry dates and purchasing activity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
            >
              <Download size={16} />
              Print report
            </button>
          </div>
        </div>
      </header>

      {/* CSV export */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Download size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Download CSV
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Export stock, expiry, movement and purchase reports.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Report
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {reportTypes.map((report) => (
                <option key={report.type} value={report.type}>
                  {report.name}
                </option>
              ))}
            </select>
          </label>

          {dateFiltered && (
            <>
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                From
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                To
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                />
              </label>
            </>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} />
            {downloading ? "Preparing..." : "Download CSV"}
          </button>
        </div>

        {downloadError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            {downloadError}
          </p>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Some report data could not be loaded</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Medicine Types"
          value={medicines.length}
          subtitle="Registered medicines"
          icon={Package}
          color="teal"
        />
        <Metric
          title="Inventory Batches"
          value={inventory.length}
          subtitle="Recorded stock batches"
          icon={Boxes}
          color="blue"
        />
        <Metric
          title="Low Stock"
          value={lowStock.length}
          subtitle="Batches needing review"
          icon={AlertTriangle}
          color="amber"
        />
        <Metric
          title="Expired Batches"
          value={expired.length}
          subtitle="Require attention"
          icon={CalendarClock}
          color="red"
        />
        <Metric
          title="Expiring Soon"
          value={expiringSoon.length}
          subtitle="Within the next 30 days"
          icon={Activity}
          color="purple"
        />
        <Metric
          title="Inventory Value"
          value={formatCurrency(inventoryValue)}
          subtitle="Quantity × unit price"
          icon={Wallet}
          color="emerald"
        />
        <Metric
          title="Purchase Orders"
          value={orders.length}
          subtitle="All recorded orders"
          icon={ShoppingCart}
          color="blue"
        />
        <Metric
          title="Pending Orders"
          value={pendingOrders.length}
          subtitle="Awaiting processing"
          icon={TrendingUp}
          color="amber"
        />
      </section>

      {/* Purchase summary */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SummaryCard
          title="Total recorded purchase order value"
          value={formatCurrency(totalOrderValue)}
          description="Includes all order statuses"
          icon={ShoppingCart}
          color="teal"
        />

        <SummaryCard
          title="Stock batches within minimum level"
          value={lowStock.length}
          description="Review these batches before replenishment"
          icon={CheckCircle2}
          color="emerald"
        />
      </section>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search medicine, batch, order ID or movement..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Report tables */}
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <ReportTable
          title="Low Stock Batches"
          description="Stock at or below the configured minimum"
          icon={AlertTriangle}
          color="amber"
          headers={["Medicine", "Batch", "Quantity", "Minimum"]}
          rows={filteredLowStock.map((item) => [
            medicineName(item.medicineId),
            item.batchNumber,
            item.quantity,
            item.minimumStock,
          ])}
          emptyText="No matching low-stock batches."
        />

        <ReportTable
          title="Expired Batches"
          description="Batches past their expiry date"
          icon={CalendarClock}
          color="red"
          headers={["Medicine", "Batch", "Quantity", "Expiry"]}
          rows={filteredExpired.map((item) => [
            medicineName(item.medicineId),
            item.batchNumber,
            item.quantity,
            formatDate(item.expiryDate),
          ])}
          emptyText="No matching expired batches."
        />

        <ReportTable
          title="Expiring Within 30 Days"
          description="Batches approaching their expiry date"
          icon={Activity}
          color="purple"
          headers={["Medicine", "Batch", "Quantity", "Expiry"]}
          rows={filteredExpiring.map((item) => [
            medicineName(item.medicineId),
            item.batchNumber,
            item.quantity,
            formatDate(item.expiryDate),
          ])}
          emptyText="No matching batches expiring soon."
        />

        <ReportTable
          title="Recent Purchase Orders"
          description="Latest 10 matching orders"
          icon={ShoppingCart}
          color="blue"
          headers={["Order ID", "Supplier ID", "Status", "Total"]}
          rows={filteredOrders.map((order) => [
            `#${order.purchaseOrderId}`,
            order.supplierId,
            order.status,
            formatCurrency(order.totalAmount),
          ])}
          emptyText="No matching purchase orders."
          statusColumn={2}
        />

        <ReportTable
          title="Recent Stock Movements"
          description="Latest 10 matching stock movement records"
          icon={Activity}
          color="teal"
          headers={["Log ID", "Inventory ID", "Type", "Quantity", "Date"]}
          rows={filteredMovements.map((movement) => [
            `#${movement.stockLogId}`,
            movement.inventoryId,
            movement.movementType,
            movement.changeQuantity,
            formatDate(movement.changedAt),
          ])}
          emptyText="No matching stock movements."
          statusColumn={2}
        />
      </div>

      <footer className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        <strong className="text-slate-700 dark:text-slate-300">
          Report notes:
        </strong>{" "}
        Inventory value is calculated from current recorded quantity and unit
        price. Purchase order value includes all order statuses and should not
        be interpreted as completed expenditure. Expiry and stock figures are
        based on the currently loaded inventory records.
      </footer>
    </div>
  );
}

function Metric({ title, value, subtitle, icon: Icon, color }) {
  const themes = {
    teal: "border-teal-100 from-teal-50 to-white dark:border-teal-900/50 dark:from-teal-950/40 dark:to-slate-900",
    blue: "border-blue-100 from-blue-50 to-white dark:border-blue-900/50 dark:from-blue-950/40 dark:to-slate-900",
    amber: "border-amber-100 from-amber-50 to-white dark:border-amber-900/50 dark:from-amber-950/40 dark:to-slate-900",
    red: "border-rose-100 from-rose-50 to-white dark:border-rose-900/50 dark:from-rose-950/40 dark:to-slate-900",
    purple: "border-purple-100 from-purple-50 to-white dark:border-purple-900/50 dark:from-purple-950/40 dark:to-slate-900",
    emerald: "border-emerald-100 from-emerald-50 to-white dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-slate-900",
  };

  const iconThemes = {
    teal: "bg-teal-100 dark:bg-teal-500/15",
    blue: "bg-blue-100 dark:bg-blue-500/15",
    amber: "bg-amber-100 dark:bg-amber-500/15",
    red: "bg-rose-100 dark:bg-rose-500/15",
    purple: "bg-purple-100 dark:bg-purple-500/15",
    emerald: "bg-emerald-100 dark:bg-emerald-500/15",
  };

  return (
    <article
      className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
        themes[color] || themes.teal
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 transition duration-200 group-hover:scale-105 ${
            iconThemes[color] || iconThemes.teal
          }`}
        >
          <Icon size={23} />
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ title, value, description, icon: Icon, color }) {
  const themes = {
    teal: "border-teal-100 dark:border-teal-900/50",
    emerald: "border-emerald-100 dark:border-emerald-900/50",
  };

  const iconThemes = {
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${
        themes[color] || themes.teal
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <p className="mt-2 break-words text-2xl font-extrabold text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {description}
        </p>
      </div>

      <div className={`rounded-2xl p-4 ${iconThemes[color] || iconThemes.teal}`}>
        <Icon size={27} />
      </div>
    </div>
  );
}

function ReportTable({
  title,
  description,
  icon: Icon,
  color,
  headers,
  rows,
  emptyText,
  statusColumn = -1,
}) {
  const iconThemes = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
        <div className={`rounded-xl p-3 ${iconThemes[color] || iconThemes.blue}`}>
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {rows.length}
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="rounded-2xl bg-slate-50 p-4 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
            <CheckCircle2 size={27} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3.5">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="transition hover:bg-teal-50/60 dark:hover:bg-teal-950/20"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300"
                    >
                      {cellIndex === statusColumn ? (
                        <StatusBadge value={cell} />
                      ) : (
                        <span
                          className={
                            cellIndex === 0
                              ? "font-semibold text-slate-800 dark:text-slate-200"
                              : ""
                          }
                        >
                          {cell ?? "—"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "UNKNOWN").toUpperCase();

  const themes = {
    PENDING:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    CANCELLED:
      "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
    APPROVED:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
    RECEIVED:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    IN:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    OUT:
      "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        themes[status] ||
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {status}
    </span>
  );
}
