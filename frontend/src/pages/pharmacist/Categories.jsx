
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  RefreshCw,
  Pill,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

import {
  getMedicines,
  getStockMonitoring,
} from "../../api/pharmacistApi";

// Extract arrays from common API response formats.
const extractList = (response, keys = []) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const getQuantity = (item) =>
  Number(
    item.quantity ??
    item.stockQuantity ??
    item.stock ??
    item.units ??
    0
  );

export default function Categories() {
  const [medicines, setMedicines] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ================= LOAD DATA =================

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [medicineResponse, stockResponse] = await Promise.all([
        getMedicines(),
        getStockMonitoring(),
      ]);

      const medicineList = extractList(medicineResponse, [
        "medicines",
      ]);

      const stockList = extractList(stockResponse, [
        "inventory",
        "stocks",
        "stockItems",
        "batches",
        "items",
      ]);

      setMedicines(medicineList);
      setStockItems(stockList);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not load medicine categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= CREATE CATEGORIES =================

  const categories = useMemo(() => {
    const categoryMap = new Map();

    medicines.forEach((medicine) => {
      const name = medicine.category?.trim() || "Uncategorized";
      const key = name.toLowerCase();

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          id: key,
          name,
          description: `Medicines under ${name}`,
          count: 0,
        });
      }

      categoryMap.get(key).count += 1;
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [medicines]);

  // ================= SEARCH CATEGORIES =================

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return categories;

    return categories.filter((category) => {
      const categoryMedicines = medicines.filter(
        (medicine) =>
          (medicine.category?.trim() || "Uncategorized").toLowerCase() ===
          category.name.toLowerCase()
      );

      return (
        category.name.toLowerCase().includes(term) ||
        categoryMedicines.some((medicine) =>
          [
            medicine.medicineName,
            medicine.description,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(term)
            )
        )
      );
    });
  }, [categories, medicines, search]);

  // ================= STOCK QUANTITY =================

  const getMedicineStock = (medicineId) => {
    return stockItems
      .filter(
        (item) =>
          Number(item.medicineId) === Number(medicineId)
      )
      .reduce((total, item) => total + getQuantity(item), 0);
  };

  // ================= SELECTED CATEGORY MEDICINES =================

  const categoryMedicines = useMemo(() => {
    if (!selectedCategory) return [];

    return medicines.filter(
      (medicine) =>
        (medicine.category?.trim() || "Uncategorized").toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  }, [medicines, selectedCategory]);

  // ================= SEARCH MEDICINES =================

  const visibleMedicines = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return categoryMedicines;

    return categoryMedicines.filter((medicine) =>
      [
        medicine.medicineName,
        medicine.description,
        medicine.category,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        )
    );
  }, [categoryMedicines, search]);

  const totalStock = categoryMedicines.reduce(
    (total, medicine) =>
      total + getMedicineStock(medicine.medicineId),
    0
  );

  // ================= UI =================

  return (
    <section className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Medicine Categories
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Browse medicines by category and filter inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
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
      </div>

      {/* SEARCH */}

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            selectedCategory
              ? "Search medicines in this category..."
              : "Search categories or medicine names..."
          }
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-500/20"
        />
      </div>

      {/* ERROR */}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading categories and inventory...
        </div>
      ) : (
        <>
          {/* CATEGORY VIEW */}

          {!selectedCategory ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Total categories
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {categories.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Total medicines
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {medicines.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Matching categories
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {filteredCategories.length}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  Browse Categories
                </h2>

                {filteredCategories.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    {medicines.length === 0
                      ? "No medicines have been added yet."
                      : "No matching categories found."}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setSearch("");
                        }}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50"
                      >
                        <div className="flex items-start justify-between">
                          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                            <Pill className="h-6 w-6" />
                          </span>

                          <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                          {category.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {category.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {category.count}{" "}
                            {category.count === 1
                              ? "Medicine"
                              : "Medicines"}
                          </span>

                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            View medicines
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* SELECTED CATEGORY VIEW */

            <div className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSearch("");
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </button>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                        <Package className="h-5 w-5" />
                      </span>

                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedCategory}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Medicines in this category
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Medicines
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {categoryMedicines.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Stock units
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                        {totalStock}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Medicine Name</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Available Stock</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {visibleMedicines.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                          >
                            No medicines found in this category.
                          </td>
                        </tr>
                      ) : (
                        visibleMedicines.map((medicine) => (
                          <tr
                            key={medicine.medicineId}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                              #{medicine.medicineId}
                            </td>

                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {medicine.medicineName}
                            </td>

                            <td className="max-w-[300px] truncate px-4 py-3 text-slate-600 dark:text-slate-300">
                              {medicine.description || "-"}
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                              {getMedicineStock(medicine.medicineId)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
