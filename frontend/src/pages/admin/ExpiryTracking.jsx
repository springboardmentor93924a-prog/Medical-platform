import { API_BASE } from "../../services/api";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";

const API = `${API_BASE}`;

export default function ExpiryTracking() {
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const token = sessionStorage.getItem("medistock_token");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error("Please log in to view expiry tracking.");
      }

      const headers = { Authorization: `Bearer ${token}` };

      const responses = await Promise.all([
        fetch(`${API}/inventory`, { headers }),
        fetch(`${API}/admin/medicines`, { headers }),
      ]);

      const failed = responses.find((response) => !response.ok);

      if (failed) {
        throw new Error(
          `Unable to load expiry data. Server returned ${failed.status}.`
        );
      }

      const [inventoryData, medicineData] = await Promise.all(
        responses.map((response) => response.json())
      );

      setInventory(inventoryData);
      setMedicines(medicineData);
    } catch (err) {
      setError(err.message || "Unable to load expiry records.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = formatDate(today);

  const medicineName = (id) =>
    medicines.find((medicine) => medicine.medicineId === id)?.medicineName ||
    `Medicine #${id}`;

  function getDaysLeft(expiryDate) {
    if (!expiryDate) return null;

    const expiry = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return null;

    return Math.round((expiry.getTime() - today.getTime()) / 86400000);
  }

  function getStatus(item) {
    const days = getDaysLeft(item.expiryDate);

    if (days === null) return "UNKNOWN";
    if (days < 0) return "EXPIRED";
    if (days <= 30) return "EXPIRING";
    return "SAFE";
  }

  const expired = inventory.filter(
    (item) => getStatus(item) === "EXPIRED"
  );

  const expiring = inventory.filter(
    (item) => getStatus(item) === "EXPIRING"
  );

  const safe = inventory.filter(
    (item) => getStatus(item) === "SAFE"
  );

  const filteredInventory = inventory
    .filter((item) => {
      const status = getStatus(item);
      const text =
        `${medicineName(item.medicineId)} ${item.batchNumber || ""} ${item.expiryDate || ""}`.toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        (filter === "ALL" || status === filter)
      );
    })
    .sort((a, b) => {
      const first = getDaysLeft(a.expiryDate) ?? Infinity;
      const second = getDaysLeft(b.expiryDate) ?? Infinity;
      return first - second;
    });

  return (
    <div className="min-h-full space-y-7 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 p-4 md:p-7 lg:p-8">
      {/* Header */}
      <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <CalendarClock size={30} />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700">
                MediStock / Inventory Safety
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                Expiry Tracking
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Monitor batch expiry dates and identify stock that needs attention.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh data
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Unable to load expiry records</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Total Batches"
          value={inventory.length}
          subtitle="All inventory batches"
          icon={Package}
          color="teal"
        />

        <Metric
          title="Expired"
          value={expired.length}
          subtitle="Past expiry date"
          icon={Siren}
          color="red"
        />

        <Metric
          title="Expiring Soon"
          value={expiring.length}
          subtitle="Within 30 days"
          icon={Clock}
          color="amber"
        />

        <Metric
          title="Safe Batches"
          value={safe.length}
          subtitle="More than 30 days left"
          icon={ShieldCheck}
          color="emerald"
        />
      </section>

      {/* Expiry table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 border-b border-slate-100 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Medicine Expiry Register
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Batches are sorted by nearest expiry date.
              </p>
            </div>

            <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
              {filteredInventory.length} batches
            </span>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search medicine, batch or date..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                ["ALL", "All"],
                ["EXPIRED", "Expired"],
                ["EXPIRING", "Expiring soon"],
                ["SAFE", "Safe"],
                ["UNKNOWN", "Unknown"],
              ].map(([key, label]) => {
                const count =
                  key === "ALL"
                    ? inventory.length
                    : inventory.filter((item) => getStatus(item) === key).length;

                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`whitespace-nowrap rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                      filter === key
                        ? "border-teal-600 bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50"
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-14 text-slate-500">
            <RefreshCw size={28} className="animate-spin text-teal-600" />
            <p className="text-sm font-medium">Loading expiry records...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="mt-4 font-bold text-slate-900">
              No matching batches
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or expiry filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">Medicine</th>
                  <th className="whitespace-nowrap px-5 py-4">Batch</th>
                  <th className="whitespace-nowrap px-5 py-4">Quantity</th>
                  <th className="whitespace-nowrap px-5 py-4">Expiry Date</th>
                  <th className="whitespace-nowrap px-5 py-4">Time Remaining</th>
                  <th className="whitespace-nowrap px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const status = getStatus(item);
                  const days = getDaysLeft(item.expiryDate);

                  const badgeStyles = {
                    EXPIRED: "bg-rose-100 text-rose-800",
                    EXPIRING: "bg-amber-100 text-amber-800",
                    SAFE: "bg-emerald-100 text-emerald-800",
                    UNKNOWN: "bg-slate-100 text-slate-700",
                  };

                  const statusLabels = {
                    EXPIRED: "Expired",
                    EXPIRING: "Expiring Soon",
                    SAFE: "Safe",
                    UNKNOWN: "Unknown",
                  };

                  return (
                    <tr
                      key={item.inventoryId}
                      className="transition hover:bg-teal-50/50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {medicineName(item.medicineId)}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Medicine ID: {item.medicineId}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-600">
                          {item.batchNumber || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {item.quantity}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {item.expiryDate || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {days === null ? (
                          <span className="text-slate-400">Not available</span>
                        ) : days < 0 ? (
                          <span className="font-semibold text-rose-700">
                            {Math.abs(days)} days overdue
                          </span>
                        ) : (
                          <span
                            className={
                              days <= 30
                                ? "font-semibold text-amber-700"
                                : "text-slate-600"
                            }
                          >
                            {days} days left
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${badgeStyles[status]}`}
                        >
                          {status === "EXPIRED" ? (
                            <AlertTriangle size={13} />
                          ) : status === "EXPIRING" ? (
                            <Clock size={13} />
                          ) : status === "SAFE" ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <CalendarClock size={13} />
                          )}
                          {statusLabels[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-500">
        <strong className="text-slate-700">Expiry policy:</strong> Batches
        past their expiry date are marked Expired. Batches expiring within
        30 days are marked Expiring Soon. This page reports status only; it
        does not delete stock or change inventory quantities.
      </footer>
    </div>
  );
}

function Metric({ title, value, subtitle, icon: Icon, color }) {
  const themes = {
    teal: "border-teal-100 from-teal-50 to-white",
    red: "border-rose-100 from-rose-50 to-white",
    amber: "border-amber-100 from-amber-50 to-white",
    emerald: "border-emerald-100 from-emerald-50 to-white",
  };

  const iconThemes = {
    teal: "bg-teal-100 text-teal-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <article
      className={`group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${themes[color]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div
          className={`rounded-2xl p-3 transition group-hover:scale-105 ${iconThemes[color]}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </article>
  );
}
