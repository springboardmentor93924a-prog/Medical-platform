
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Truck,
  Users,
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Pencil,
  Power,
  X,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  MapPin,
  Mail,
  Phone,
  Building2,
} from "lucide-react";

const API = "http://localhost:8080/api/admin/suppliers";

const emptyForm = {
  supplierName: "",
  contactNumber: "",
  email: "",
  address: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function getToken() {
  return sessionStorage.getItem("medistock_token");
}

function isActive(supplier) {
  return supplier.active === true || supplier.active === 1;
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const apiRequest = useCallback(async (url, options = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(API);
      setSuppliers(getList(data));
    } catch (err) {
      setError(err.message || "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const activeCount = suppliers.filter(isActive).length;
  const inactiveCount = suppliers.length - activeCount;

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return suppliers;

    return suppliers.filter((supplier) =>
      [
        supplier.supplierId,
        supplier.supplierName,
        supplier.contactNumber,
        supplier.email,
        supplier.address,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }, [suppliers, search]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(supplier) {
    setEditingId(supplier.supplierId);
    setForm({
      supplierName: supplier.supplierName || "",
      contactNumber: supplier.contactNumber || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setError("");
    setMessage("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = {
      supplierName: form.supplierName.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };

    if (!payload.supplierName) {
      setError("Supplier name is required.");
      return;
    }

    if (
      payload.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    ) {
      setError("Enter a valid email address.");
      return;
    }

    if (payload.contactNumber.length > 20) {
      setError("Contact number must be 20 characters or fewer.");
      return;
    }

    if (
      payload.supplierName.length > 150 ||
      payload.email.length > 150 ||
      payload.address.length > 255
    ) {
      setError("One or more fields exceed the allowed length.");
      return;
    }

    setSaving(true);

    try {
      const editing = editingId !== null;

      await apiRequest(editing ? `${API}/${editingId}` : API, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      closeForm();
      setMessage(
        editing
          ? "Supplier updated successfully."
          : "Supplier added successfully."
      );

      await loadSuppliers();
    } catch (err) {
      setError(err.message || "Unable to save supplier.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(supplier) {
    const currentlyActive = isActive(supplier);
    const nextActive = !currentlyActive;

    if (
      !window.confirm(
        `${nextActive ? "Activate" : "Deactivate"} ${supplier.supplierName}?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    setStatusUpdating(supplier.supplierId);

    try {
      await apiRequest(`${API}/${supplier.supplierId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active: nextActive }),
      });

      setMessage(
        `${supplier.supplierName} ${nextActive ? "activated" : "deactivated"} successfully.`
      );

      await loadSuppliers();
    } catch (err) {
      setError(err.message || "Unable to update supplier status.");
    } finally {
      setStatusUpdating(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f8f8] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header matching Expiry Tracking */}
        <section className="overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-teal-100/80 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200">
                <Truck size={27} />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.18em] text-teal-700 sm:text-sm">
                  MEDISTOCK / SUPPLIER MANAGEMENT
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Suppliers Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Manage medical suppliers, contact details, and supplier
                  availability in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:shrink-0">
              <button
                type="button"
                onClick={loadSuppliers}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh data
              </button>

              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-200 transition hover:bg-teal-700"
              >
                <Plus size={17} />
                Add Supplier
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
            title="Total Suppliers"
            value={suppliers.length}
            subtitle="All registered suppliers"
            icon={<Truck size={21} />}
            color="teal"
          />

          <Summary
            title="Active Suppliers"
            value={activeCount}
            subtitle="Available for operations"
            icon={<UserCheck size={21} />}
            color="green"
          />

          <Summary
            title="Inactive Suppliers"
            value={inactiveCount}
            subtitle="Currently deactivated"
            icon={<Users size={21} />}
            color="amber"
          />

          <Summary
            title="Search Results"
            value={filteredSuppliers.length}
            subtitle="Matching supplier records"
            icon={<Search size={21} />}
            color="blue"
          />
        </div>

        {/* Add / edit supplier form */}
        {showForm && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  {editingId !== null ? (
                    <Pencil size={20} />
                  ) : (
                    <Plus size={22} />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId !== null
                      ? "Edit Supplier"
                      : "Add New Supplier"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter the supplier's contact information.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Supplier Name *">
                  <input
                    required
                    maxLength={150}
                    value={form.supplierName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        supplierName: event.target.value,
                      })
                    }
                    placeholder="Enter supplier name"
                    className={inputClass}
                  />
                </Field>

                <Field label="Contact Number">
                  <input
                    maxLength={20}
                    value={form.contactNumber}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        contactNumber: event.target.value,
                      })
                    }
                    placeholder="Enter contact number"
                    className={inputClass}
                  />
                </Field>

                <Field label="Email Address">
                  <input
                    type="email"
                    maxLength={150}
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="supplier@example.com"
                    className={inputClass}
                  />
                </Field>

                <Field label="Address">
                  <input
                    maxLength={255}
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address: event.target.value,
                      })
                    }
                    placeholder="City or full address"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Save Supplier"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Supplier register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Supplier Register
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View supplier contact details and manage active status.
                </p>
              </div>

              <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                {filteredSuppliers.length} suppliers
              </span>
            </div>

            <div className="relative mt-5 w-full sm:max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                aria-label="Search suppliers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, email or address..."
                className={`${inputClass} bg-slate-50 pl-10 focus:bg-white`}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-slate-500">
              <LoaderCircle
                size={22}
                className="animate-spin text-teal-600"
              />
              Loading suppliers...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Truck size={28} />
              </div>

              <h3 className="font-semibold text-slate-800">
                No suppliers found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {suppliers.length === 0
                  ? "Add your first supplier to get started."
                  : "Try another search term."}
              </p>

              {suppliers.length === 0 && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  <Plus size={16} />
                  Add Supplier
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Supplier</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Address</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((supplier) => {
                    const active = isActive(supplier);

                    return (
                      <tr
                        key={supplier.supplierId}
                        className="transition hover:bg-teal-50/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Building2 size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {supplier.supplierName}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Supplier ID: {supplier.supplierId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-slate-600">
                            <Phone
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {supplier.contactNumber || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-2 text-slate-600">
                            <Mail
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {supplier.email || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <MapPin
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {supplier.address || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${
                              active
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-rose-50 text-rose-700 ring-rose-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                active ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(supplier)}
                              title="Edit supplier"
                              aria-label={`Edit ${supplier.supplierName}`}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleStatus(supplier)}
                              disabled={statusUpdating === supplier.supplierId}
                              title={active ? "Deactivate supplier" : "Activate supplier"}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                                active
                                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {statusUpdating === supplier.supplierId ? (
                                <LoaderCircle size={14} className="animate-spin" />
                              ) : (
                                <Power size={14} />
                              )}
                              {active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Summary({ title, value, subtitle, icon, color }) {
  const colors = {
    teal: "border-teal-100 bg-gradient-to-br from-teal-50/80 to-white",
    green: "border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white",
    amber: "border-amber-100 bg-gradient-to-br from-amber-50/80 to-white",
    blue: "border-sky-100 bg-gradient-to-br from-sky-50/80 to-white",
  };

  const iconColors = {
    teal: "bg-teal-100 text-teal-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-sky-100 text-sky-700",
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${colors[color]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className={`rounded-xl p-3 ${iconColors[color]}`}>
          {icon}
        </div>
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
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        )}
        <span className="break-words">{message}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="shrink-0 rounded p-1 hover:bg-black/5"
      >
        <X size={16} />
      </button>
    </div>
  );
}
