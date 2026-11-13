
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  FileText,
  Activity,
  Pill,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

// Format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value));
};

// Format numbers
const formatNumber = (value) => {
  return Number(value ?? 0).toLocaleString("en-IN");
};

// Reusable status badge
function StatusBadge({ value }) {
  const styles = {
    CRITICAL:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    HIGH:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    MEDIUM:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    LOW:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    EXPIRED:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    HEALTHY:
      "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
    WARNING:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  };

  const normalized = String(value || "UNKNOWN").toUpperCase();

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[normalized] ||
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
      }`}
    >
      {normalized}
    </span>
  );
}

// Reusable summary card
function SummaryCard({ title, value, subtitle, icon: IconComponent, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {formatNumber(value)}
          </h3>

          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className={`rounded-xl p-3 ${colors[color] || colors.blue}`}>
          <IconComponent size={22} />
        </div>
      </div>
    </div>
  );
}

// Section heading
function SectionHeading({ icon: IconComponent, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <IconComponent size={21} />
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

// Table wrapper
function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <CheckCircle2 className="mx-auto mb-2 text-green-500" size={28} />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export default function AiRecommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/ai-recommendations");
setData(data);
    } catch (err) {
      console.error("AI Recommendations error:", err);
      setError(
        err.message ||
          "Something went wrong while loading AI recommendations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Download stock report
  const downloadReport = () => {
    if (!data?.stockReport) return;

    const report = [
      "MEDISTOCK - AI STOCK REPORT",
      `Generated At: ${data.stockReport.generatedAt || "N/A"}`,
      `Overall Status: ${data.stockReport.overallStatus || "N/A"}`,
      "",
      "STOCK INSIGHTS",
      ...(data.stockReport.insights || []).map(
        (insight, index) => `${index + 1}. ${insight}`
      ),
      "",
      `Total Medicines: ${data.summary?.totalMedicines ?? 0}`,
      `Low Stock Medicines: ${data.summary?.lowStockCount ?? 0}`,
      `Expiring Batches: ${data.summary?.expiringBatchCount ?? 0}`,
      `Critical Expiry Batches: ${data.summary?.criticalExpiryCount ?? 0}`,
      `Reorder Suggestions: ${data.summary?.reorderCount ?? 0}`,
    ].join("\n");

    const blob = new Blob([report], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "MediStock-AI-Stock-Report.txt";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin text-blue-600" size={32} />

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Analyzing pharmacy inventory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={25} />

          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400">
              Failed to load AI Recommendations
            </h3>

            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={loadRecommendations}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return <EmptyState message="No recommendation data available." />;
  }

  const summary = data.summary || {};
  const stockReport = data.stockReport || {};

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-blue-200">
              <BrainCircuit size={22} />

              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Intelligent Inventory Analysis
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              AI Stock Recommendations
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
              Analyze stock levels, identify expiry risks, forecast medicine
              demand and receive smart replenishment recommendations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadRecommendations}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={downloadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              <Download size={16} />
              Download Report
            </button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Medicines"
          value={summary.totalMedicines}
          subtitle="Registered medicines"
          icon={Pill}
          color="blue"
        />

        <SummaryCard
          title="Low Stock"
          value={summary.lowStockCount}
          subtitle="Require stock review"
          icon={AlertTriangle}
          color="red"
        />

        <SummaryCard
          title="Expiring Batches"
          value={summary.expiringBatchCount}
          subtitle="Expired or expiring within the analysis window"
          icon={CalendarClock}
          color="orange"
        />

        <SummaryCard
          title="Reorder Suggestions"
          value={summary.reorderCount}
          subtitle="Recommended replenishments"
          icon={ShoppingCart}
          color="purple"
        />
      </section>

      {/* Overall status */}
      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Overall Inventory Health
          </p>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {stockReport.overallStatus === "CRITICAL"
              ? "Immediate stock and expiry review is recommended."
              : stockReport.overallStatus === "WARNING"
                ? "Some inventory items need attention."
                : "Inventory is currently in a healthy state."}
          </p>
        </div>

        <StatusBadge value={stockReport.overallStatus} />
      </section>

      {/* 1. Low Stock Detection */}
      <section>
        <SectionHeading
          icon={AlertTriangle}
          title="Low Stock Detection"
          description="Medicines with available stock below their minimum stock level."
        />

        {data.lowStockItems?.length > 0 ? (
          <TableWrapper>
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Medicine</th>
                  <th className="px-5 py-4">Available Stock</th>
                  <th className="px-5 py-4">Minimum Stock</th>
                  <th className="px-5 py-4">Severity</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.lowStockItems.map((item) => (
                  <tr key={item.medicineId}>
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                      {item.medicineName}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {formatNumber(item.availableStock)}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatNumber(item.minimumStock)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge value={item.severity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        ) : (
          <EmptyState message="No medicines are currently below minimum stock." />
        )}
      </section>

      {/* 2. Smart Reorder Suggestions */}
      <section>
        <SectionHeading
          icon={ShoppingCart}
          title="Smart Reorder Suggestions"
          description="Recommended quantities based on current stock, minimum stock and recent demand."
        />

        {data.reorderSuggestions?.length > 0 ? (
          <TableWrapper>
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Medicine</th>
                  <th className="px-5 py-4">Current Stock</th>
                  <th className="px-5 py-4">Suggested Quantity</th>
                  <th className="px-5 py-4">Estimated Cost</th>
                  <th className="px-5 py-4">Recommendation</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.reorderSuggestions.map((item) => (
                  <tr key={item.medicineId}>
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                      {item.medicineName}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatNumber(item.currentStock)}
                    </td>

                    <td className="px-5 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(item.suggestedQuantity)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(item.estimatedCost)}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        ) : (
          <EmptyState message="No reorder suggestions are available." />
        )}
      </section>

      {/* 3. Expiry Risk Recommendations */}
      <section>
        <SectionHeading
          icon={Clock}
          title="Expiry Risk Recommendations"
          description="Expired and upcoming expiry batches that require attention."
        />

        {data.expiryRisks?.length > 0 ? (
          <TableWrapper>
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Medicine</th>
                  <th className="px-5 py-4">Batch Number</th>
                  <th className="px-5 py-4">Remaining Quantity</th>
                  <th className="px-5 py-4">Expiry Date</th>
                  <th className="px-5 py-4">Days</th>
                  <th className="px-5 py-4">Risk</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.expiryRisks.map((item) => (
                  <tr key={item.inventoryId}>
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                      {item.medicineName}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {item.batchNumber}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatNumber(item.remainingQuantity)}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {item.expiryDate}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {item.daysUntilExpiry < 0
                        ? `${Math.abs(item.daysUntilExpiry)} days ago`
                        : `${item.daysUntilExpiry} days`}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge value={item.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        ) : (
          <EmptyState message="No expiry risks detected." />
        )}
      </section>

      {/* 4. Demand Forecasting */}
      <section>
        <SectionHeading
          icon={TrendingUp}
          title="Medicine Demand Forecasting"
          description="Seven-day medicine demand estimates based on outgoing stock movements from the last 30 days."
        />

        {data.demandForecasts?.length > 0 ? (
          <TableWrapper>
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Medicine</th>
                  <th className="px-5 py-4">Current Stock</th>
                  <th className="px-5 py-4">Daily Demand</th>
                  <th className="px-5 py-4">7-Day Forecast</th>
                  <th className="px-5 py-4">Recommendation</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.demandForecasts.map((item) => (
                  <tr key={item.medicineId}>
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                      {item.medicineName}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatNumber(item.currentStock)}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {Number(item.averageDailyDemand || 0).toFixed(2)}
                    </td>

                    <td className="px-5 py-4 font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(item.predictedSevenDayDemand)}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        ) : (
          <EmptyState message="No demand forecast data available." />
        )}
      </section>

      {/* 5. AI Stock Report */}
      <section>
        <SectionHeading
          icon={FileText}
          title="AI-Generated Stock Report"
          description="Automated inventory insights generated from pharmacy stock data."
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Inventory Analysis Summary
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Generated: {stockReport.generatedAt || "Not available"}
              </p>
            </div>

            <StatusBadge value={stockReport.overallStatus} />
          </div>

          <div className="mt-5 space-y-4">
            {stockReport.insights?.length > 0 ? (
              stockReport.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    {index + 1}
                  </span>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {insight}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="No stock insights available." />
            )}
          </div>

          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Total Medicines</p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {formatNumber(summary.totalMedicines)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Low Stock Medicines</p>
              <p className="mt-1 text-xl font-bold text-red-600">
                {formatNumber(summary.lowStockCount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Critical Expiry Batches</p>
              <p className="mt-1 text-xl font-bold text-orange-600">
                {formatNumber(summary.criticalExpiryCount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Reorder Required</p>
              <p className="mt-1 text-xl font-bold text-blue-600">
                {formatNumber(summary.reorderCount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Activity size={14} />
        <span>
          Inventory recommendations are rule-based estimates, not external AI
          predictions. Review expiry and dispensing decisions before taking
          action.
        </span>
      </div>
    </div>
  );
}
