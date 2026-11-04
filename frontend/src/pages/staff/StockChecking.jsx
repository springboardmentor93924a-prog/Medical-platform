
import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  AlertTriangle,
  RefreshCw,
  Package,
} from "lucide-react";
import { apiFetch } from "../../services/api";

export default function StockChecking() {
  const [inventory, setInventory] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState("");

  const [form, setForm] = useState({
    physicalQuantity: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Load inventory batches
  const fetchInventory = async () => {
    try {
      setLoading(true);

      const data = await apiFetch("/inventory");

      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message || "Failed to load inventory.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Selected inventory batch
  const selectedBatch = inventory.find(
    (item) => String(item.inventoryId) === selectedInventory
  );

  // Automatically calculate difference
  const difference =
    selectedBatch && form.physicalQuantity !== ""
      ? Number(form.physicalQuantity) - Number(selectedBatch.quantity)
      : null;

  const handleInventoryChange = (e) => {
    setSelectedInventory(e.target.value);
    setForm({
      physicalQuantity: "",
      remarks: "",
    });
    setMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit stock discrepancy report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedBatch) {
      setMessage("Please select an inventory batch.");
      setMessageType("error");
      return;
    }

    if (
      form.physicalQuantity === "" ||
      !Number.isInteger(Number(form.physicalQuantity)) ||
      Number(form.physicalQuantity) < 0
    ) {
      setMessage("Enter a valid non-negative whole number.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await apiFetch("/stock-check-reports", {
        method: "POST",
        body: JSON.stringify({
          inventoryId: selectedBatch.inventoryId,
          physicalQuantity: Number(form.physicalQuantity),
          remarks: form.remarks.trim(),
        }),
      });

      setMessage(
        `Stock report submitted successfully. Report ID: ${response.reportId}. Status: ${response.status}.`
      );
      setMessageType("success");

      setForm({
        physicalQuantity: "",
        remarks: "",
      });

    } catch (error) {
      setMessage(error.message || "Failed to submit stock report.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Stock Checking
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Compare physical stock with system quantities.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Submit physical stock counts for review. Submitting a report
            does not directly change inventory quantities.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          Physical Stock Record
        </h3>

        {/* Inventory selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Select Medicine / Batch
          </label>

          <select
            value={selectedInventory}
            onChange={handleInventoryChange}
            required
            disabled={loading || inventory.length === 0}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">
              {loading
                ? "Loading inventory..."
                : inventory.length === 0
                  ? "No inventory batches available"
                  : "Select a medicine batch"}
            </option>

            {inventory.map((item) => (
              <option
                key={item.inventoryId}
                value={item.inventoryId}
              >
                {item.medicineName || `Medicine #${item.medicineId}`}
                {" | Batch: "}
                {item.batchNumber}
                {" | Qty: "}
                {item.quantity}
              </option>
            ))}
          </select>
        </div>

        {/* Selected batch details */}
        {selectedBatch && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
              <Package className="h-5 w-5 text-blue-600" />
              Selected Batch Details
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Medicine</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedBatch.medicineName ||
                    `Medicine #${selectedBatch.medicineId}`}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Batch Number</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedBatch.batchNumber}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Category</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedBatch.category || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">System Quantity</p>
                <p className="font-bold text-blue-600">
                  {selectedBatch.quantity} units
                </p>
              </div>
            </div>
          </div>
        )}

        {/* System quantity */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            System Quantity
          </label>

          <input
            type="number"
            value={selectedBatch?.quantity ?? ""}
            readOnly
            placeholder="Select a batch first"
            className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>

        {/* Physical quantity */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Physical Quantity
          </label>

          <input
            type="number"
            name="physicalQuantity"
            min="0"
            step="1"
            value={form.physicalQuantity}
            onChange={handleChange}
            disabled={!selectedBatch}
            required
            placeholder="Enter actual counted quantity"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-800"
          />
        </div>

        {/* Difference */}
        {difference !== null && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500">Stock Difference</p>

            <p
              className={`mt-1 text-xl font-bold ${
                difference === 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {difference > 0 ? "+" : ""}
              {difference} units
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Physical quantity − System quantity
            </p>
          </div>
        )}

        {/* Remarks */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Remarks
          </label>

          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            placeholder="Explain any stock difference..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || loading || !selectedBatch}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Stock Report"}
        </button>

        {message && (
          <p
            className={`rounded-lg p-3 text-sm ${
              messageType === "error"
                ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                : "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
