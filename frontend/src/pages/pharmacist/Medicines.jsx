
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  RefreshCw,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";

import { apiFetch } from "../../services/api";

const API_URL = "/admin/medicines";

const emptyForm = {
  medicineName: "",
  category: "",
  description: "",
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [deleteMedicine, setDeleteMedicine] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ================= LOAD MEDICINES =================

  const loadMedicines = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(API_URL);

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.medicines)
            ? response.medicines
            : [];

      setMedicines(data);
    } catch (err) {
      setError(err.message || "Could not load medicines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  // ================= SEARCH =================

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return medicines;

    return medicines.filter((medicine) =>
      [
        medicine.medicineName,
        medicine.category,
        medicine.description,
        medicine.medicineId,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [medicines, query]);

  const categories = useMemo(
    () =>
      new Set(
        medicines
          .map((item) => item.category?.trim())
          .filter(Boolean)
      ).size,
    [medicines]
  );

  // ================= OPEN ADD MODAL =================

  const openAddModal = () => {
    setEditingMedicine(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  // ================= OPEN EDIT MODAL =================

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);

    setForm({
      medicineName: medicine.medicineName || "",
      category: medicine.category || "",
      description: medicine.description || "",
    });

    setFormError("");
    setShowModal(true);
  };

  // ================= CLOSE MODAL =================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingMedicine(null);
    setForm(emptyForm);
    setFormError("");
  };

  // ================= FORM INPUT =================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ================= ADD / UPDATE MEDICINE =================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (!form.medicineName.trim()) {
      setFormError("Medicine name is required.");
      return;
    }

    if (form.medicineName.trim().length > 150) {
      setFormError("Medicine name cannot exceed 150 characters.");
      return;
    }

    const payload = {
      medicineName: form.medicineName.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
    };

    setSaving(true);

    try {
      if (editingMedicine) {
        await apiFetch(
          `${API_URL}/${editingMedicine.medicineId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        setSuccess("Medicine updated successfully.");
      } else {
        await apiFetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        setSuccess("Medicine added successfully.");
      }

      setShowModal(false);
      setEditingMedicine(null);
      setForm(emptyForm);

      await loadMedicines();
    } catch (err) {
      setFormError(
        err.message || "Unable to save medicine."
      );
    } finally {
      setSaving(false);
    }
  };

  // ================= DELETE MEDICINE =================

  const handleDelete = async () => {
  if (!deleteMedicine) return;

  setDeleting(true);
  setError("");
  setSuccess("");

  try {
    await apiFetch(`${API_URL}/${deleteMedicine.medicineId}`, {
      method: "DELETE",
    });

    setDeleteMedicine(null);
    setSuccess(
      `${deleteMedicine.medicineName} deleted successfully.`
    );

    await loadMedicines();
  } catch (err) {
    const message = err.message || "";

    if (message.includes("inventory batch")) {
      setError(
        `${deleteMedicine.medicineName} cannot be deleted because it has inventory batches. Remove or resolve its associated inventory batches first.`
      );
    } else {
      setError(message || "Unable to delete medicine. Please try again.");
    }

    setDeleteMedicine(null);
  } finally {
    setDeleting(false);
  }
};

  // ================= STAT CARDS =================

  const cards = [
    {
      label: "Total medicines",
      value: medicines.length,
      tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    },
    {
      label: "Categories",
      value: categories,
      tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Showing",
      value: filtered.length,
      tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Medicines
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, search, and manage medicine records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadMedicines}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </button>
        </div>
      </header>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {card.label}
              </p>

              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
              >
                <Package className="h-4 w-4" />
              </span>
            </div>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* MEDICINE TABLE */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by medicine name, category or description..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Medicine</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Loading medicines...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    No medicines found.
                  </td>
                </tr>
              ) : (
                filtered.map((medicine) => (
                  <tr
                    key={medicine.medicineId}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                      #{medicine.medicineId}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {medicine.medicineName}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        {medicine.category || "General"}
                      </span>
                    </td>

                    <td className="max-w-[320px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                      {medicine.description || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(medicine.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(medicine)}
                          title="Edit medicine"
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:hover:bg-blue-500/10"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteMedicine(medicine)}
                          title="Delete medicine"
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingMedicine ? "Edit Medicine" : "Add Medicine"}
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter the medicine information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Medicine Name *
                </label>

                <input
                  type="text"
                  name="medicineName"
                  value={form.medicineName}
                  onChange={handleChange}
                  maxLength={150}
                  required
                  placeholder="Enter medicine name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Example: Tablet, Syrup, Injection"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter medicine description"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-500/20"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving
                    ? "Saving..."
                    : editingMedicine
                      ? "Update Medicine"
                      : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {deleteMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Delete Medicine?
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete{" "}
              <strong>{deleteMedicine.medicineName}</strong>?
              This action cannot be undone.
            </p>

            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Medicines with existing inventory batches cannot be deleted.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteMedicine(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
