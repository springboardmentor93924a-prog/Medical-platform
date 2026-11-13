import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Download,
  PackageX,
  RefreshCw,
  RotateCcw,
  Timer,
} from "lucide-react";

import { apiFetch, downloadFile } from "../services/api.js";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "—";
  return String(value).slice(0, 10);
};

const STYLES = {
  red: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  amber:
    "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  blue: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  teal: "border-teal-100 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300",
};

function SummaryCard({ label, value, hint, icon: Icon, color }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${STYLES[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl font-extrabold">{value}</p>
          <p className="mt-1 text-xs opacity-80">{hint}</p>
        </div>
        <Icon size={24} />
      </div>
    </div>
  );
}

function WastageTable({ title, description, headers, rows, emptyText }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </header>

      <div className="max-h-80 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-2.5 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-2.5 text-slate-700 dark:text-slate-300"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function WastageReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const report = await apiFetch("/reports/wastage?days=90");
      setData(report);
    } catch (err) {
      setError(err.message || "Could not load the wastage report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async () => {
    setDownloading(true);
    setError("");

    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadFile(
        "/reports/wastage.csv",
        `medistock-wastage-${stamp}.csv`
      );
    } catch (err) {
      setError(err.message || "Could not download the wastage CSV.");
    } finally {
      setDownloading(false);
    }
  };

  const summary = data?.summary || {};
  const expired = data?.expired || [];
  const nearExpiry = data?.nearExpiry || [];
  const returns = data?.wastageReturns || [];
  const fefoQueue = data?.fefoQueue || [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <PackageX size={20} />
            Wastage Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Expired stock, near-expiry risk, non-restock returns and the
            FEFO use-first queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            <Download size={16} />
            {downloading ? "Downloading…" : "Download CSV"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Expired value"
          value={formatCurrency(summary.expiredValue)}
          hint={`${summary.expiredBatches || 0} batch(es), ${
            summary.expiredUnits || 0
          } units`}
          icon={PackageX}
          color="red"
        />
        <SummaryCard
          label="Expiring soon"
          value={formatCurrency(summary.nearExpiryValue)}
          hint={`Within ${summary.nearExpiryDays || 90} days`}
          icon={CalendarClock}
          color="amber"
        />
        <SummaryCard
          label="Non-restock returns"
          value={formatCurrency(summary.wastageReturnValue)}
          hint={`${summary.wastageReturnCount || 0} approved return(s)`}
          icon={RotateCcw}
          color="blue"
        />
        <SummaryCard
          label="Total wastage booked"
          value={formatCurrency(summary.totalWastageValue)}
          hint={`Value at risk ${formatCurrency(summary.valueAtRisk)}`}
          icon={Timer}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <WastageTable
          title="Expired batches"
          description="Remove these from the shelf and record the loss"
          headers={["Medicine", "Batch", "Qty", "Expiry", "Value"]}
          rows={expired.map((row) => [
            row.medicine,
            row.batch,
            row.quantity,
            formatDate(row.expiryDate),
            formatCurrency(row.value),
          ])}
          emptyText="No expired batches currently hold stock."
        />

        <WastageTable
          title="Expiring soon"
          description="Use these first to avoid a future write-off"
          headers={["Medicine", "Batch", "Qty", "Expiry", "Value"]}
          rows={nearExpiry.map((row) => [
            row.medicine,
            row.batch,
            row.quantity,
            formatDate(row.expiryDate),
            formatCurrency(row.value),
          ])}
          emptyText="No batches are close to expiry."
        />

        <WastageTable
          title="FEFO use-first queue"
          description="Earliest expiry leaves the shelf first"
          headers={["Medicine", "Batch", "Qty", "Days left", "Expiry"]}
          rows={fefoQueue.slice(0, 25).map((row) => [
            row.medicine,
            row.batch,
            row.quantity,
            `${row.daysToExpiry} days`,
            formatDate(row.expiryDate),
          ])}
          emptyText="No dispensible batches available."
        />

        <WastageTable
          title="Approved non-restock returns"
          description="Returns that cannot go back into saleable stock"
          headers={["Medicine", "Batch", "Qty", "Condition", "Value"]}
          rows={returns.map((row) => [
            row.medicine,
            row.batch,
            row.quantity,
            row.condition,
            formatCurrency(row.value),
          ])}
          emptyText="No approved wastage returns yet."
        />
      </div>
    </section>
  );
}
