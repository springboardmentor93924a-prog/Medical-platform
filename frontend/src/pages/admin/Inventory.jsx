
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes, Package, AlertTriangle, CalendarClock, ShieldCheck,
  RefreshCw, Search, Plus, Pencil, Trash2, X, CheckCircle2,
  LoaderCircle, Filter, IndianRupee, CalendarDays, Pill,
} from "lucide-react";

const API_URL = "http://localhost:8080/api/inventory";
const MEDICINES_API = "http://localhost:8080/api/admin/medicines";
const SUPPLIERS_API = "http://localhost:8080/api/admin/suppliers";

const emptyForm = {
  medicineId: "",
  supplierId: "",
  batchNumber: "",
  quantity: "0",
  minimumStock: "10",
  unitPrice: "",
  manufacturingDate: "",
  expiryDate: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function getToken() {
  return sessionStorage.getItem("medistock_token");
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}

function formatDate(value) {
  const date = dateOnly(value);
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatus(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryString = dateOnly(item.expiryDate);
  const expiry = expiryString
    ? new Date(`${expiryString}T00:00:00`)
    : null;

  if (!expiry || Number.isNaN(expiry.getTime())) {
    return "Unknown";
  }

  if (expiry < today) return "Expired";

  const daysLeft = Math.ceil((expiry - today) / 86400000);

  if (daysLeft <= 30) return "Expiring soon";
  if (Number(item.quantity ?? 0) <= 0) return "Out of stock";
  if (Number(item.quantity ?? 0) <= Number(item.minimumStock ?? 10)) {
    return "Low stock";
  }

  return "Safe";
}

function statusStyle(status) {
  const styles = {
    Safe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Low stock": "bg-amber-50 text-amber-700 ring-amber-200",
    "Out of stock": "bg-rose-50 text-rose-700 ring-rose-200",
    Expired: "bg-rose-50 text-rose-700 ring-rose-200",
    "Expiring soon": "bg-orange-50 text-orange-700 ring-orange-200",
    Unknown: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return styles[status] || styles.Unknown;
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const request = useCallback(async (url, options = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [inventoryData, medicineData, supplierData] =
        await Promise.all([
          request(API_URL),
          request(MEDICINES_API),
          request(SUPPLIERS_API),
        ]);

      setItems(getList(inventoryData));
      setMedicines(getList(medicineData));
      setSuppliers(getList(supplierData));
    } catch (err) {
      setError(err.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setError("");
    setMessage("");
  }

  function startEdit(item) {
    setEditingId(item.inventoryId);
    setForm({
      medicineId: String(item.medicineId ?? ""),
      supplierId: item.supplierId == null ? "" : String(item.supplierId),
      batchNumber: item.batchNumber ?? "",
      quantity: String(item.quantity ?? 0),
      minimumStock: String(item.minimumStock ?? 10),
      unitPrice: String(item.unitPrice ?? ""),
      manufacturingDate: dateOnly(item.manufacturingDate),
      expiryDate: dateOnly(item.expiryDate),
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.medicineId ||
      !form.batchNumber.trim() ||
      form.unitPrice === "" ||
      !form.expiryDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (
      Number(form.quantity) < 0 ||
      Number(form.minimumStock) < 0 ||
      Number(form.unitPrice) < 0
    ) {
      setError("Quantity, minimum stock, and unit price cannot be negative.");
      return;
    }

    if (
      form.manufacturingDate &&
      form.expiryDate < form.manufacturingDate
    ) {
      setError("Expiry date must not be before manufacturing date.");
      return;
    }

    const payload = {
      medicineId: Number(form.medicineId),
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      batchNumber: form.batchNumber.trim(),
      quantity: Number(form.quantity),
      minimumStock: Number(form.minimumStock),
      unitPrice: Number(form.unitPrice),
      manufacturingDate: form.manufacturingDate || null,
      expiryDate: form.expiryDate,
    };

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      await request(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();
      setMessage(
        isEditing
          ? "Inventory batch updated successfully."
          : "Inventory batch added successfully."
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Unable to save inventory.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteItem) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      await request(`${API_URL}/${deleteItem.inventoryId}`, {
        method: "DELETE",
      });

      setDeleteItem(null);
      setMessage("Inventory batch deleted successfully.");
      await loadData();
    } catch (err) {
      setDeleteItem(null);
      setError(
        err.message ||
          "Unable to delete this batch. Check your backend DELETE route."
      );
    } finally {
      setDeleting(false);
    }
  }

  const medicineName = (id) =>
    medicines.find(
      (medicine) => String(medicine.medicineId) === String(id)
    )?.medicineName || `Medicine #${id ?? "—"}`;

  const supplierName = (id) =>
    suppliers.find(
      (supplier) => String(supplier.supplierId) === String(id)
    )?.supplierName || (id ? `Supplier #${id}` : "Not assigned");

  const enrichedItems = useMemo(
    () => items.map((item) => ({ ...item, status: getStatus(item) })),
    [items]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return enrichedItems.filter((item) => {
      const text = [
        medicineName(item.medicineId),
        supplierName(item.supplierId),
        item.batchNumber,
        item.inventoryId,
        item.expiryDate,
      ].join(" ").toLowerCase();

      return (
        text.includes(term) &&
        (statusFilter === "All" || item.status === statusFilter)
      );
    });
  }, [enrichedItems, medicines, suppliers, search, statusFilter]);

  const expiredCount = enrichedItems.filter(
    (item) => item.status === "Expired"
  ).length;

  const expiringCount = enrichedItems.filter(
    (item) => item.status === "Expiring soon"
  ).length;

  const lowStockCount = enrichedItems.filter(
    (item) =>
      item.status === "Low stock" || item.status === "Out of stock"
  ).length;

  const safeCount = enrichedItems.filter(
    (item) => item.status === "Safe"
  ).length;

  const totalUnits = enrichedItems.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0
  );

  const statusOptions = [
    "All",
    "Safe",
    "Low stock",
    "Out of stock",
    "Expiring soon",
    "Expired",
    "Unknown",
  ];

  return (
    <div className="min-h-screen bg-[#f3f8f8] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header — matches Expiry Tracking */}
        <section className="overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-teal-100/80 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200">
                <Boxes size={27} />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-teal-700 sm:text-sm">
                  MEDISTOCK / STOCK CONTROL
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Inventory Management
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Monitor medicine stock, manage batches, track suppliers,
                  and identify inventory that needs attention.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:shrink-0">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh data
              </button>

              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-200 transition hover:bg-teal-700"
              >
                <Plus size={17} />
                Add inventory
              </button>
            </div>
          </div>
        </section>

        {/* Alerts */}
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

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary
            title="Total Batches"
            value={items.length}
            subtitle="All inventory batches"
            icon={<Package size={20} />}
            color="teal"
          />
          <Summary
            title="Low Stock"
            value={lowStockCount}
            subtitle="Replenishment required"
            icon={<AlertTriangle size={20} />}
            color="rose"
          />
          <Summary
            title="Expiring Soon"
            value={expiringCount}
            subtitle="Within 30 days"
            icon={<CalendarClock size={20} />}
            color="amber"
          />
          <Summary
            title="Safe Batches"
            value={safeCount}
            subtitle="Stock within safe limits"
            icon={<ShieldCheck size={20} />}
            color="green"
          />
        </div>

        {/* Add / edit form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                {editingId !== null ? <Pencil size={20} /> : <Plus size={22} />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId !== null ? "Edit Inventory Batch" : "Add Inventory Batch"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the stock and batch details.
                </p>
              </div>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
              >
                <X size={15} /> Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Medicine *">
                <select
                  name="medicineId"
                  value={form.medicineId}
                  onChange={updateField}
                  required
                  className={inputClass}
                >
                  <option value="">Select medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.medicineId} value={medicine.medicineId}>
                      {medicine.medicineName}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Supplier">
                <select
                  name="supplierId"
                  value={form.supplierId}
                  onChange={updateField}
                  className={inputClass}
                >
                  <option value="">No supplier</option>
                  {suppliers
                    .filter((supplier) => supplier.active !== false)
                    .map((supplier) => (
                      <option key={supplier.supplierId} value={supplier.supplierId}>
                        {supplier.supplierName}
                      </option>
                    ))}
                </select>
              </Field>

              <Field label="Batch Number *">
                <input
                  name="batchNumber"
                  value={form.batchNumber}
                  onChange={updateField}
                  required
                  maxLength={100}
                  placeholder="e.g. BATCH-001"
                  className={inputClass}
                />
              </Field>

              <Field label="Quantity *">
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={updateField}
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Minimum Stock *">
                <input
                  name="minimumStock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.minimumStock}
                  onChange={updateField}
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Unit Price (₹) *">
                <input
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={updateField}
                  required
                  placeholder="0.00"
                  className={inputClass}
                />
              </Field>

              <Field label="Manufacturing Date">
                <input
                  name="manufacturingDate"
                  type="date"
                  value={form.manufacturingDate}
                  onChange={updateField}
                  className={inputClass}
                />
              </Field>

              <Field label="Expiry Date *">
                <input
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={updateField}
                  required
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : editingId !== null ? (
                  <Pencil size={17} />
                ) : (
                  <Plus size={18} />
                )}
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Batch"
                    : "Add Batch"}
              </button>
            </div>
          </form>
        </section>

        {/* Inventory register — matches Expiry Tracking */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Inventory Register
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review stock quantities, batch details, and inventory status.
                </p>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                {filteredItems.length} batches
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-sm">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medicine, batch or supplier..."
                  aria-label="Search inventory"
                  className={`${inputClass} pl-10`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => {
                  const count =
                    status === "All"
                      ? enrichedItems.length
                      : enrichedItems.filter((item) => item.status === status).length;

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        statusFilter === status
                          ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                      }`}
                    >
                      {status === "All" ? "All" : status} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-slate-500">
              <LoaderCircle size={22} className="animate-spin text-teal-600" />
              Loading inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Boxes size={28} />
              </div>
              <h3 className="font-semibold text-slate-800">
                No inventory batches found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different filter or add an inventory batch above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Medicine / Batch</th>
                    <th className="px-5 py-4">Supplier</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Unit Price</th>
                    <th className="px-5 py-4">Expiry Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.inventoryId} className="transition hover:bg-teal-50/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <Pill size={19} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {medicineName(item.medicineId)}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.batchNumber} · ID: {item.inventoryId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {supplierName(item.supplierId)}
                      </td>

                      <td className="px-5 py-4">
                        <p className={`font-bold ${
                          item.status === "Low stock" || item.status === "Out of stock"
                            ? "text-rose-600"
                            : "text-slate-800"
                        }`}>
                          {Number(item.quantity ?? 0).toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Minimum: {item.minimumStock ?? 10}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                        <span className="inline-flex items-center">
                          <IndianRupee size={14} />
                          {Number(item.unitPrice ?? 0).toFixed(2)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-slate-600">
                          <CalendarDays size={15} className="text-slate-400" />
                          {formatDate(item.expiryDate)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            title="Edit batch"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteItem(item)}
                            title="Delete batch"
                            className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {filteredItems.length} of {items.length} inventory batches
          </div>
        </section>
      </div>

      {/* Delete confirmation */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Delete inventory batch?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Delete batch{" "}
              <strong className="text-slate-800">
                {deleteItem.batchNumber}
              </strong>
              ? The backend may reject deletion if the batch is referenced elsewhere.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting && <LoaderCircle size={16} className="animate-spin" />}
                Delete batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Summary({ title, value, subtitle, icon, color }) {
  const colors = {
    teal: "border-teal-100 bg-gradient-to-br from-teal-50/80 to-white text-teal-700",
    rose: "border-rose-100 bg-gradient-to-br from-rose-50/80 to-white text-rose-700",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50/80 to-white text-amber-700",
    green: "border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white text-emerald-700",
  };

  const iconColors = {
    teal: "bg-teal-100 text-teal-700",
    rose: "bg-rose-100 text-rose-600",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[color]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className={`rounded-xl p-3 ${iconColors[color]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-3 text-sm text-slate-500">{subtitle}</p>
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
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-700"
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
        <X size={16} />
      </button>
    </div>
  );
}
