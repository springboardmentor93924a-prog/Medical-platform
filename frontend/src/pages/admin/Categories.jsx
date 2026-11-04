import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import { apiFetch } from "../../services/api";

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [pickedIds, setPickedIds] = useState([]);

  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryData, medicineData] = await Promise.all([
        apiFetch("/admin/categories"),
        apiFetch("/admin/medicines"),
      ]);

      setCategories(asList(categoryData));
      setMedicines(asList(medicineData));
    } catch (err) {
      setError(err.message || "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((category) =>
      String(category.name).toLowerCase().includes(term)
    );
  }, [categories, search]);

  const uncategorised = medicines.filter(
    (medicine) => !String(medicine.category || "").trim()
  ).length;

  const usedMedicines = medicines.length - uncategorised;

  async function createCategory(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = newName.trim();

    if (!name) {
      setError("Enter a category name.");
      return;
    }
    if (pickedIds.length === 0) {
      setError("Select at least one medicine to tag with this category.");
      return;
    }

    setSaving(true);

    try {
      const data = await apiFetch("/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name, medicineIds: pickedIds }),
      });

      setCategories(asList(data));
      setSuccess(`Category "${name}" created.`);
      setCreateOpen(false);
      setNewName("");
      setPickedIds([]);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to create the category.");
    } finally {
      setSaving(false);
    }
  }

  async function renameCategory(event) {
    event.preventDefault();
    if (!renaming) return;

    const newNameValue = renameValue.trim();

    if (!newNameValue || newNameValue === renaming.name) {
      setRenaming(null);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiFetch("/admin/categories", {
        method: "PUT",
        body: JSON.stringify({ oldName: renaming.name, newName: newNameValue }),
      });

      setCategories(asList(data));
      setSuccess(`Renamed "${renaming.name}" to "${newNameValue}".`);
      setRenaming(null);
      setRenameValue("");
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to rename the category.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category) {
    const confirmed = window.confirm(
      `Remove "${category.name}"? ${category.medicineCount} medicine(s) will become uncategorised.`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const data = await apiFetch(
        `/admin/categories/${encodeURIComponent(category.name)}`,
        { method: "DELETE" }
      );

      setCategories(asList(data));
      setSuccess(`Category "${category.name}" removed.`);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to remove the category.");
    }
  }

  function toggleMedicine(id) {
    setPickedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 md:p-7 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-white via-teal-50 to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl dark:bg-teal-500/10" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <Tags size={30} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                MediStock / Catalogue
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                Medicine Categories
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Group medicines so pharmacists and staff can filter inventory
                quickly.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateOpen(true);
                setError("");
                setSuccess("");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
            >
              <Plus size={16} />
              New category
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <p className="break-words">{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          {success}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Categories
          </p>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {categories.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Categorised medicines
          </p>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {usedMedicines}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Uncategorised
          </p>
          <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {uncategorised}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
        <div className="relative w-full md:max-w-sm">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200 dark:focus:bg-slate-900"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw
              size={24}
              className="mx-auto mb-3 animate-spin text-teal-600 dark:text-teal-400"
            />
            Loading categories...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="rounded-2xl bg-teal-50 p-4 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
              <Boxes size={30} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900 dark:text-white">
              No categories yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Create a category and tag the medicines that belong to it. A
              category exists while at least one medicine uses it.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((category) => (
              <div
                key={category.name}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-teal-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-teal-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {category.medicineCount} medicine
                      {category.medicineCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="rounded-lg bg-teal-100 p-2 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                    <Pill size={16} />
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRenaming(category);
                      setRenameValue(category.name);
                      setError("");
                      setSuccess("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil size={14} />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  New category
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Name it and pick the medicines that belong to it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 dark:border-slate-800 dark:text-slate-400"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <form
              onSubmit={createCategory}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-auto p-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Category name
                  </label>
                  <input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="e.g. Antibiotics"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Medicines ({pickedIds.length} selected)
                  </p>
                  <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    {medicines.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Add medicines first.
                      </p>
                    ) : (
                      medicines.map((medicine) => (
                        <label
                          key={medicine.medicineId}
                          className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60"
                        >
                          <input
                            type="checkbox"
                            checked={pickedIds.includes(medicine.medicineId)}
                            onChange={() => toggleMedicine(medicine.medicineId)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {medicine.medicineName}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {medicine.category || "uncategorised"}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <footer className="flex flex-col gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create category"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={renameCategory}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Rename category
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Updates every medicine using "{renaming.name}".
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenaming(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 dark:border-slate-800 dark:text-slate-400"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="p-5">
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRenaming(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
}
