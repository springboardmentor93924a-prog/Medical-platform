import { API_BASE, downloadFile } from "../../services/api";

import { useCallback, useEffect, useState } from "react";
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

const API = `${API_BASE}`;

export default function Reports() {
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reportType, setReportType] = useState("stock");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const token = sessionStorage.getItem("medistock_token");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) throw new Error("Please log in to view reports.");

      const headers = { Authorization: `Bearer ${token}` };

      const responses = await Promise.all([
        fetch(`${API}/inventory`, { headers }),
        fetch(`${API}/admin/medicines`, { headers }),
        fetch(`${API}/admin/purchase-orders`, { headers }),
      ]);

      const failed = responses.find((response) => !response.ok);

      if (failed) {
        throw new Error(
          `Unable to load reports. Server returned ${failed.status}.`
        );
      }

      const [inventoryData, medicineData, orderData] = await Promise.all(
        responses.map((response) => response.json())
      );

      setInventory(inventoryData);
      setMedicines(medicineData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const dateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayString = dateString(today);
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  const soonString = dateString(futureDate);

  const lowStock = inventory.filter(
    (item) => Number(item.quantity) <= Number(item.minimumStock)
  );

  const expired = inventory.filter(
    (item) => item.expiryDate && item.expiryDate < todayString
  );

  const expiringSoon = inventory.filter(
    (item) =>
      item.expiryDate &&
      item.expiryDate >= todayString &&
      item.expiryDate <= soonString
  );

  const inventoryValue = inventory.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  );

  const totalOrderValue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  const medicineName = (id) =>
    medicines.find((medicine) => medicine.medicineId === id)?.medicineName ||
    `Medicine #${id}`;

  const reportTypes = [
    { type: "stock", name: "Stock on hand" },
    { type: "expiry", name: "Expiry status" },
    { type: "low-stock", name: "Low stock items" },
    { type: "movements", name: "Stock movements" },
    { type: "orders", name: "Purchase orders" },
    { type: "users", name: "User directory" },
  ];

  const dateFiltered = reportType === "movements" || reportType === "orders";

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const query = params.toString();
      const stamp = new Date().toISOString().slice(0, 10);

      await downloadFile(
        `/reports/${reportType}.csv${query ? `?${query}` : ""}`,
        `medistock-${reportType}-${stamp}.csv`
      );
    } catch (err) {
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
    .sort((a, b) => b.purchaseOrderId - a.purchaseOrderId)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 bg-slate-50 p-8">
        <div className="rounded-2xl bg-teal-50 p-4 text-teal-700">
          <RefreshCw size={30} className="animate-spin" />
        </div>
        <p className="font-medium text-slate-600">Preparing your reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 md:p-7 lg:p-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <FileBarChart size={30} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700">
                MediStock / Analytics
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Reports & Analytics
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Monitor inventory value, stock risks, expiry dates and purchasing activity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadReports}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
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
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
            <Download size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Download CSV</h2>
            <p className="text-sm text-slate-500">
              Server-generated exports. Movements and orders accept a date range.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Report
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none"
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
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                From
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                To
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none"
                />
              </label>
            </>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60"
          >
            <Download size={16} />
            {downloading ? "Preparing..." : "Download CSV"}
          </button>
        </div>

        {downloadError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {downloadError}
          </p>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Report loading failed</p>
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
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Total recorded purchase order value
            </p>
            <p className="mt-2 break-words text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalOrderValue)}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Includes all order statuses
            </p>
          </div>
          <div className="rounded-2xl bg-teal-50 p-4 text-teal-700">
            <ShoppingCart size={27} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Stock batches within minimum level
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {lowStock.length}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Review these batches before replenishment
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 size={27} />
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search medicine, batch, order ID or status..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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
            item.expiryDate,
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
            item.expiryDate,
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
            formatCurrency(Number(order.totalAmount || 0)),
          ])}
          emptyText="No matching purchase orders."
          statusColumn={2}
        />
      </div>

      <footer className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-xs leading-6 text-slate-500">
        <strong className="text-slate-700">Report notes:</strong> Inventory
        value is calculated from current recorded quantity and unit price.
        Purchase order value includes all order statuses and should not be
        interpreted as completed expenditure.
      </footer>
    </div>
  );
}

function Metric({ title, value, subtitle, icon: Icon, color }) {
  const themes = {
    teal: "border-teal-100 from-teal-50 to-white text-teal-700",
    blue: "border-blue-100 from-blue-50 to-white text-blue-700",
    amber: "border-amber-100 from-amber-50 to-white text-amber-700",
    red: "border-rose-100 from-rose-50 to-white text-rose-700",
    purple: "border-purple-100 from-purple-50 to-white text-purple-700",
    emerald: "border-emerald-100 from-emerald-50 to-white text-emerald-700",
  };

  const iconThemes = {
    teal: "bg-teal-100",
    blue: "bg-blue-100",
    amber: "bg-amber-100",
    red: "bg-rose-100",
    purple: "bg-purple-100",
    emerald: "bg-emerald-100",
  };

  return (
    <article
      className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${themes[color] || themes.teal}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`rounded-2xl p-3 transition duration-200 group-hover:scale-105 ${iconThemes[color] || iconThemes.teal}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </article>
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
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <header className="flex items-center gap-3 border-b border-slate-100 p-5">
        <div
          className={`rounded-xl p-3 ${iconThemes[color] || iconThemes.blue}`}
        >
          <Icon size={21} />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {rows.length}
        </span>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <div className="rounded-2xl bg-slate-50 p-4 text-slate-400">
            <CheckCircle2 size={27} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">{emptyText}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3.5">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index} className="transition hover:bg-teal-50/60">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-4 text-slate-600"
                    >
                      {cellIndex === statusColumn ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            String(cell).toUpperCase() === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : String(cell).toUpperCase() === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {cell}
                        </span>
                      ) : (
                        <span className={cellIndex === 0 ? "font-semibold text-slate-800" : ""}>
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
