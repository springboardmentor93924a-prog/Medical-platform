
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LoaderCircle,
  Truck,
  ClipboardList,
  Package,
} from "lucide-react";

import { apiFetch } from "../../services/api";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusStyle(status) {
  const styles = {
    PENDING:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    APPROVED:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    REJECTED:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  };

  return styles[status] || styles.PENDING;
}

export default function MedicineReturns() {
  const [returns, setReturns] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        apiFetch("/returns"),
        apiFetch("/pharmacist/inventory"),
        apiFetch("/pharmacist/medicines"),
        apiFetch("/pharmacist/suppliers"),
      ]);

      const errors = [];

      if (results[0].status === "fulfilled") {
        const allReturns = getList(results[0].value);

        // Pharmacist page displays supplier returns only.
        setReturns(
          allReturns.filter(
            (item) => item.returnType === "SUPPLIER_RETURN"
          )
        );
      } else {
        setReturns([]);
        errors.push(`Returns: ${getErrorMessage(results[0].reason)}`);
      }

      if (results[1].status === "fulfilled") {
        setInventory(getList(results[1].value));
      } else {
        setInventory([]);
        errors.push(`Inventory: ${getErrorMessage(results[1].reason)}`);
      }

      if (results[2].status === "fulfilled") {
        setMedicines(getList(results[2].value));
      } else {
        setMedicines([]);
        errors.push(`Medicines: ${getErrorMessage(results[2].reason)}`);
      }

      if (results[3].status === "fulfilled") {
        setSuppliers(getList(results[3].value));
      } else {
        setSuppliers([]);
        errors.push(`Suppliers: ${getErrorMessage(results[3].reason)}`);
      }

      if (errors.length) {
        setError(errors.join(" "));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestData();
  }, [requestData]);

  function medicineName(medicineId) {
    return (
      medicines.find(
        (medicine) =>
          String(medicine.medicineId) === String(medicineId)
      )?.medicineName || `Medicine #${medicineId ?? "—"}`
    );
  }

  function supplierName(supplierId) {
    return (
      suppliers.find(
        (supplier) =>
          String(supplier.supplierId) === String(supplierId)
      )?.supplierName || `Supplier #${supplierId ?? "—"}`
    );
  }

  async function handleDecision(returnId, decision) {
    const action = decision === "APPROVE" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} supplier return #${returnId}?`
    );

    if (!confirmed) return;

    setProcessingId(returnId);
    setError("");
    setMessage("");

    try {
      await apiFetch(`/returns/${returnId}/decision`, {
        method: "PUT",
        body: JSON.stringify({
          decision,
          notes: null,
        }),
      });

      setMessage(
        `Supplier return #${returnId} ${action}d successfully.`
      );

      await requestData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();

    return returns.filter((item) => {
      const batch = inventory.find(
        (entry) =>
          String(entry.inventoryId) === String(item.inventoryId)
      );

      const text = [
        item.returnId,
        item.returnStatus,
        item.returnReason,
        item.medicineCondition,
        item.supplierId,
        supplierName(item.supplierId),
        batch?.batchNumber,
        medicineName(batch?.medicineId),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.returnStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [returns, inventory, medicines, suppliers, search, statusFilter]);

  const pendingCount = returns.filter(
    (item) => item.returnStatus === "PENDING"
  ).length;

  const approvedCount = returns.filter(
    (item) => item.returnStatus === "APPROVED"
  ).length;

  const rejectedCount = returns.filter(
    (item) => item.returnStatus === "REJECTED"
  ).length;

  const totalCount = returns.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-teal-50 to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                <RotateCcw size={27} />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-teal-700 dark:text-teal-300">
                  MEDISTOCK / STOCK CONTROL
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Supplier Medicine Returns
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Review supplier return requests and approve or reject
                  them. Approved returns are deducted from inventory.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={requestData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60 dark:border-teal-500/30 dark:bg-slate-900 dark:text-teal-200 dark:hover:bg-teal-500/10"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh data
            </button>
          </div>
        </section>

        {/* Messages */}
        {message && (
          <Notice
            type="success"
            message={message}
            onClose={() => setMessage("")}
          />
        )}

        {error && (
          <Notice
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            title="Total Requests"
            value={totalCount}
            subtitle="All supplier return requests"
            icon={<ClipboardList size={21} />}
            color="teal"
          />

          <Summary
            title="Pending"
            value={pendingCount}
            subtitle="Waiting for your decision"
            icon={<Clock size={21} />}
            color="amber"
          />

          <Summary
            title="Approved"
            value={approvedCount}
            subtitle="Approved supplier returns"
            icon={<CheckCircle2 size={21} />}
            color="green"
          />

          <Summary
            title="Rejected"
            value={rejectedCount}
            subtitle="Rejected supplier returns"
            icon={<XCircle size={21} />}
            color="rose"
          />
        </div>

        {/* Return History */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Supplier Return Requests
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Approve or reject pending requests submitted by suppliers.
                </p>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300">
                {filteredReturns.length} records
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medicine, supplier or batch..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={inputClass}
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-slate-500">
              <LoaderCircle size={22} className="animate-spin text-teal-600" />
              Loading supplier return requests...
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                <Package size={27} />
              </div>

              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                No supplier return requests found
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Supplier requests will appear here when they are submitted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Return ID</th>
                    <th className="px-5 py-4">Medicine / Batch</th>
                    <th className="px-5 py-4">Supplier</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Condition</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReturns.map((item) => {
                    const batch = inventory.find(
                      (entry) =>
                        String(entry.inventoryId) ===
                        String(item.inventoryId)
                    );

                    const pending = item.returnStatus === "PENDING";
                    const processing = processingId === item.returnId;

                    return (
                      <tr
                        key={item.returnId}
                        className="transition hover:bg-teal-50/30 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                          #{item.returnId}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {medicineName(batch?.medicineId)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {batch?.batchNumber ||
                              `Inventory #${item.inventoryId}`}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                            <Truck size={16} className="text-teal-600" />
                            {supplierName(item.supplierId)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {item.returnQuantity} units
                        </td>

                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {item.medicineCondition}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-slate-600 dark:text-slate-300">
                          <p className="line-clamp-2" title={item.returnReason}>
                            {item.returnReason || "—"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600 dark:text-slate-300">
                          {formatDate(item.returnDate || item.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(item.returnStatus)}`}
                          >
                            {item.returnStatus}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {pending ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDecision(item.returnId, "APPROVE")
                                }
                                disabled={processing}
                                title="Approve supplier return"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {processing ? (
                                  <LoaderCircle size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDecision(item.returnId, "REJECT")
                                }
                                disabled={processing}
                                title="Reject supplier return"
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                              >
                                <XCircle size={14} />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Showing {filteredReturns.length} of {returns.length} supplier return records
          </div>
        </section>
      </div>
    </div>
  );
}

function Summary({ title, value, subtitle, icon, color }) {
  const colors = {
    teal: "border-teal-200 bg-gradient-to-br from-white to-teal-50 dark:border-teal-900 dark:from-slate-900 dark:to-teal-950/40",
    amber: "border-amber-200 bg-gradient-to-br from-white to-amber-50 dark:border-amber-900 dark:from-slate-900 dark:to-amber-950/40",
    green: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50 dark:border-emerald-900 dark:from-slate-900 dark:to-emerald-950/40",
    rose: "border-rose-200 bg-gradient-to-br from-white to-rose-50 dark:border-rose-900 dark:from-slate-900 dark:to-rose-950/40",
  };

  const iconColors = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${colors[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {title}
        </p>
        <div className={`rounded-xl p-3 ${iconColors[color]}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

function Notice({ type, message, onClose }) {
  const success = type === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
      }`}
    >
      <div className="flex items-start gap-2">
        {success ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        ) : (
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        )}
        <span className="break-words">{message}</span>
      </div>

      <button type="button" onClick={onClose} aria-label="Close message">
        <XCircle size={16} />
      </button>
    </div>
  );
}
