
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  RotateCcw,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { apiFetch } from "../../services/api";

const CONDITIONS = [
  "SEALED",
  "OPENED",
  "DAMAGED",
  "EXPIRED",
  "DEFECTIVE",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400";

const cardClass =
  "rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN");
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    APPROVED:
      "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
    REJECTED:
      "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  };

  const icons = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
  };

  const Icon = icons[status] || AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[status] ||
        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
      }`}
    >
      <Icon size={14} />
      {status || "UNKNOWN"}
    </span>
  );
}

function StatCard({ label, count, icon: Icon, color }) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
        {count}
      </p>
    </div>
  );
}

export default function SupplierMedicineReturns() {
  const [inventory, setInventory] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    inventoryId: "",
    returnQuantity: "",
    returnReason: "",
    medicineCondition: "SEALED",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [inventoryData, returnData] = await Promise.all([
        apiFetch("/supplier/me/inventory"),
        apiFetch("/returns"),
      ]);

      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setReturns(Array.isArray(returnData) ? returnData : []);
    } catch (err) {
      setError(err.message || "Unable to load medicine return data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBatch = inventory.find(
    (item) => String(item.inventoryId) === String(form.inventoryId)
  );

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedBatch) {
      setError("Please select an inventory batch.");
      return;
    }

    const quantity = Number(form.returnQuantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > selectedBatch.quantity
    ) {
      setError(
        "Enter a valid quantity not exceeding the available batch quantity."
      );
      return;
    }

    if (!form.returnReason.trim()) {
      setError("Please enter a return reason.");
      return;
    }

    setSubmitting(true);

    try {
      await apiFetch("/returns", {
        method: "POST",
        body: JSON.stringify({
          returnType: "SUPPLIER_RETURN",
          inventoryId: Number(form.inventoryId),
          returnQuantity: quantity,
          returnReason: form.returnReason.trim(),
          medicineCondition: form.medicineCondition,
          notes: form.notes.trim(),
        }),
      });

      setSuccess(
        "Return request submitted successfully. Waiting for pharmacist approval."
      );

      setForm({
        inventoryId: "",
        returnQuantity: "",
        returnReason: "",
        medicineCondition: "SEALED",
        notes: "",
      });

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to submit return request.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = returns.filter(
    (item) => item.returnStatus === "PENDING"
  ).length;

  const approvedCount = returns.filter(
    (item) => item.returnStatus === "APPROVED"
  ).length;

  const rejectedCount = returns.filter(
    (item) => item.returnStatus === "REJECTED"
  ).length;

  return (
    <div className="min-h-full space-y-6 bg-gray-50 p-1 text-gray-900 dark:bg-gray-950 dark:text-gray-100 sm:p-2">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <RotateCcw className="text-blue-600 dark:text-blue-400" />
            Medicine Returns
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit supplier return requests and track approval status.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Requests"
          count={pendingCount}
          icon={Clock}
          color="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
        />

        <StatCard
          label="Approved Requests"
          count={approvedCount}
          icon={CheckCircle}
          color="bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400"
        />

        <StatCard
          label="Rejected Requests"
          count={rejectedCount}
          icon={XCircle}
          color="bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
        />
      </div>

      {/* Return Form */}
      <div className={`${cardClass} p-5 sm:p-6`}>
        <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
          <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <Package size={21} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Submit Supplier Return
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fill in the medicine and return details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className={labelClass}>Medicine Batch</label>

            <select
              name="inventoryId"
              value={form.inventoryId}
              onChange={updateForm}
              required
              className={inputClass}
            >
              <option value="">Select a medicine batch</option>

              {inventory.map((item) => (
                <option
                  key={item.inventoryId}
                  value={item.inventoryId}
                >
                  {item.medicineName} — {item.batchNumber} (Available: {item.quantity})
                </option>
              ))}
            </select>

            {selectedBatch && (
              <div className="mt-3 flex flex-wrap gap-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <span>
                  Available: <strong>{selectedBatch.quantity}</strong> units
                </span>
                <span>
                  Expiry: <strong>{formatDate(selectedBatch.expiryDate)}</strong>
                </span>
                <span>
                  Batch: <strong>{selectedBatch.batchNumber}</strong>
                </span>
              </div>
            )}

            {!loading && inventory.length === 0 && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                No inventory batches were found for your supplier account.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Return Quantity</label>

              <input
                type="number"
                name="returnQuantity"
                min="1"
                max={selectedBatch?.quantity || undefined}
                value={form.returnQuantity}
                onChange={updateForm}
                required
                placeholder="Enter quantity"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Medicine Condition</label>

              <select
                name="medicineCondition"
                value={form.medicineCondition}
                onChange={updateForm}
                className={inputClass}
              >
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Return Reason</label>

            <textarea
              name="returnReason"
              value={form.returnReason}
              onChange={updateForm}
              required
              rows={3}
              maxLength={500}
              placeholder="Explain why you want to return this medicine..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Additional Notes (Optional)
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={updateForm}
              rows={2}
              maxLength={500}
              placeholder="Additional information..."
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
            <button
              type="submit"
              disabled={submitting || loading || inventory.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}

              {submitting ? "Submitting..." : "Submit Return Request"}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your request must be approved by a pharmacist or admin.
            </p>
          </div>
        </form>
      </div>

      {/* Return History */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center gap-3 border-b border-gray-200 p-5 dark:border-gray-700">
          <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
            <RotateCcw size={20} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Return Requests
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Track your submitted return requests.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-gray-500 dark:text-gray-400">
            <RefreshCw size={19} className="animate-spin" />
            Loading return requests...
          </div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center">
            <Package
              size={35}
              className="mx-auto mb-3 text-gray-400 dark:text-gray-600"
            />

            <p className="font-medium text-gray-700 dark:text-gray-300">
              No return requests yet
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your submitted requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4">Return ID</th>
                  <th className="px-5 py-4">Inventory ID</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Condition</th>
                  <th className="px-5 py-4">Reason</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {returns.map((item) => (
                  <tr
                    key={item.returnId}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                      #{item.returnId}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      #{item.inventoryId}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
                      {item.returnQuantity}
                    </td>

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {item.medicineCondition}
                    </td>

                    <td className="max-w-[220px] truncate px-5 py-4 text-gray-600 dark:text-gray-300">
                      {item.returnReason}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                      {formatDate(item.returnDate || item.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={item.returnStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
