
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Pill,
  RefreshCw,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

const MEDICINES_API = "/admin/medicines";
const FEFO_API = "/fefo/dispense";

// Format date
const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date).slice(0, 10);
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Extract medicine list from API response
const extractMedicines = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.medicines)) return response.medicines;
  if (Array.isArray(response?.content)) return response.content;

  return [];
};

export default function FefoDispensing() {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [dispensing, setDispensing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [result, setResult] = useState(null);

  // ================= LOAD MEDICINES =================

  const fetchMedicines = async () => {
    setLoadingMedicines(true);
    setError("");

    try {
      const response = await apiFetch(MEDICINES_API);

      const data = extractMedicines(response);

      setMedicines(data);

      if (data.length === 0) {
        setSelectedMedicine("");
      }
    } catch (err) {
      setError(err.message || "Unable to load medicines.");
      setMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // ================= SELECTED MEDICINE =================

  const selectedMedicineDetails = useMemo(() => {
    return medicines.find(
      (medicine) =>
        String(medicine.medicineId ?? medicine.id) ===
        String(selectedMedicine)
    );
  }, [medicines, selectedMedicine]);

  // ================= DISPENSE USING FEFO =================

  const handleDispense = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setResult(null);

    if (!selectedMedicine) {
      setError("Please select a medicine.");
      return;
    }

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      setError("Enter a valid quantity greater than zero.");
      return;
    }

    if (notes.length > 500) {
      setError("Notes cannot exceed 500 characters.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to dispense ${requestedQuantity} units of ${
        selectedMedicineDetails?.medicineName || "this medicine"
      } using FEFO?`
    );

    if (!confirmed) return;

    setDispensing(true);

    try {
      const response = await apiFetch(FEFO_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicineId: Number(selectedMedicine),
          quantity: requestedQuantity,
          notes: notes.trim(),
        }),
      });

      setResult(response);

      setSuccess(
        response?.message ||
          "Medicine dispensed successfully using FEFO."
      );

      setQuantity("");
      setNotes("");
    } catch (err) {
      setError(
        err.message || "Dispensing failed. Please try again."
      );
    } finally {
      setDispensing(false);
    }
  };

  // ================= RESET FORM =================

  const resetForm = () => {
    setSelectedMedicine("");
    setQuantity("");
    setNotes("");
    setError("");
    setSuccess("");
    setResult(null);
  };

  // ================= REFRESH =================

  const handleRefresh = async () => {
    setResult(null);
    setSuccess("");
    await fetchMedicines();
  };

  // ================= UI =================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-xl sm:p-8">

        <div className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <ShieldCheck size={14} />
              Smart inventory management
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              FEFO Dispensing
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100">
              First Expiry, First Out. Dispense medicines from
              batches with the earliest eligible expiry dates first.
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Pill size={34} />
          </div>

        </div>
      </section>

      {/* FEFO INFORMATION */}

      <div className="grid gap-4 sm:grid-cols-3">

        <InfoCard
          icon={<Clock size={20} />}
          title="Earliest expiry"
          description="Prioritizes batches expiring first."
        />

        <InfoCard
          icon={<Package size={20} />}
          title="Batch allocation"
          description="Can split quantities across multiple batches."
        />

        <InfoCard
          icon={<ShieldCheck size={20} />}
          title="Stock protection"
          description="Rejects expired and insufficient stock."
        />

      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <Message
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <Message
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* DISPENSING FORM */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">

        <div className="mb-6 flex items-center gap-3">

          <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Truck size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Dispense Medicine
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a medicine and enter the required quantity.
            </p>
          </div>

        </div>

        <form onSubmit={handleDispense} className="space-y-5">

          {/* MEDICINE SELECTION */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Select Medicine <span className="text-red-500">*</span>
            </label>

            <select
              value={selectedMedicine}
              onChange={(event) => {
                setSelectedMedicine(event.target.value);
                setResult(null);
                setSuccess("");
                setError("");
              }}
              disabled={loadingMedicines || dispensing}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >

              <option value="">
                {loadingMedicines
                  ? "Loading medicines..."
                  : "Choose a medicine"}
              </option>

              {medicines.map((medicine) => (
                <option
                  key={medicine.medicineId ?? medicine.id}
                  value={medicine.medicineId ?? medicine.id}
                >
                  {medicine.medicineName || medicine.name}
                </option>
              ))}

            </select>

            {medicines.length === 0 && !loadingMedicines && (
              <p className="mt-2 text-xs text-amber-600">
                No medicines were returned. Check your medicine API.
              </p>
            )}

          </div>

          {/* SELECTED MEDICINE DETAILS */}

          {selectedMedicineDetails && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">

              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                {selectedMedicineDetails.medicineName ||
                  selectedMedicineDetails.name}
              </p>

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Medicine ID: {selectedMedicineDetails.medicineId ?? selectedMedicineDetails.id}
              </p>

              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Category: {selectedMedicineDetails.category || "Not specified"}
              </p>

            </div>
          )}

          {/* QUANTITY */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Quantity to Dispense <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Enter quantity"
              disabled={dispensing}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

          </div>

          {/* NOTES */}

          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Notes
            </label>

            <textarea
              rows="3"
              maxLength="500"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Prescription reference or dispensing notes..."
              disabled={dispensing}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {notes.length}/500
            </p>

          </div>

          {/* BUTTONS */}

          <div className="flex flex-wrap gap-3">

            <button
              type="submit"
              disabled={
                dispensing ||
                loadingMedicines ||
                medicines.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {dispensing ? (
                <>
                  <RefreshCw className="animate-spin" size={17} />
                  Dispensing...
                </>
              ) : (
                <>
                  <Pill size={17} />
                  Dispense Using FEFO
                </>
              )}

            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={dispensing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw size={16} />
              Reset
            </button>

          </div>

        </form>
      </section>

      {/* DISPENSING RESULT */}

      {result && (
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-500/20 dark:bg-slate-900">

          <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">

            <CheckCircle2 className="text-emerald-600" size={24} />

            <div>
              <h2 className="font-bold text-emerald-800 dark:text-emerald-300">
                Dispensing Completed
              </h2>

              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                FEFO batch allocation was successful.
              </p>
            </div>

          </div>

          {/* RESULT SUMMARY */}

          <div className="grid gap-4 p-5 sm:grid-cols-3">

            <ResultCard
              label="Medicine ID"
              value={result.medicineId}
            />

            <ResultCard
              label="Requested quantity"
              value={result.requestedQuantity}
            />

            <ResultCard
              label="Dispensed quantity"
              value={result.dispensedQuantity}
            />

          </div>

          {/* BATCH ALLOCATION */}

          <div className="px-5 pb-5">

            <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">
              FEFO Batch Allocation
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">

              <table className="w-full min-w-[650px] text-left text-sm">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Batch Number</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Dispensed</th>
                    <th className="px-4 py-3">Remaining</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                  {(result.dispensedBatches || []).map(
                    (batch, index) => (
                      <tr key={`${batch.inventoryId}-${index}`}>

                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                          {batch.batchNumber}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDate(batch.expiryDate)}
                        </td>

                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                          {batch.dispensedQuantity}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {batch.remainingQuantity}
                        </td>

                      </tr>
                    )
                  )}

                  {(!result.dispensedBatches ||
                    result.dispensedBatches.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                        No batch allocation details returned.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>
      )}

      {/* REFRESH MEDICINES */}

      <div className="flex justify-end">

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loadingMedicines || dispensing}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 dark:text-blue-400"
        >

          <RefreshCw
            size={15}
            className={loadingMedicines ? "animate-spin" : ""}
          />

          Refresh medicines

        </button>

      </div>

    </div>
  );
}

// ================= INFORMATION CARD =================

function InfoCard({ icon, title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="mb-3 inline-flex rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        {icon}
      </div>

      <h3 className="font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ================= RESULT CARD =================

function ResultCard({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">

      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
        {value ?? "-"}
      </p>

    </div>
  );
}

// ================= MESSAGE =================

function Message({ type, message, onClose }) {
  const isError = type === "error";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        isError
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
      }`}
    >

      {isError ? (
        <AlertCircle size={20} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
      )}

      <p className="flex-1 text-sm font-medium">
        {message}
      </p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold"
        >
          Dismiss
        </button>
      )}

    </div>
  );
}
