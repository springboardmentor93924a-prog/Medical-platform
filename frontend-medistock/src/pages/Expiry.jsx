import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { titleFor } from "../menus.js";
import { PageHeader, TableWrap, Tag, btn, fld, ghost, td, th } from "../components/ui.jsx";

// Each tab keeps the batches whose days-to-expiry fall in its range
const TABS = [
  ["all", "All", () => true],
  ["expired", "Expired", (d) => d < 0],
  ["d30", "Within 30 days", (d) => d >= 0 && d <= 30],
  ["d60", "31 to 60 days", (d) => d > 30 && d <= 60],
  ["d90", "61 to 90 days", (d) => d > 60 && d <= 90],
  ["later", "Beyond 90 days", (d) => d > 90],
];

const money = (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// "664 days ago", "52 days", "1 yr 7 mo". The exact number of days is shown underneath.
function timeLeft(d) {
  if (d < 0) return { main: d === -1 ? "1 day ago" : `${-d} days ago`, color: "text-red-700" };
  if (d === 0) return { main: "Today", color: "text-red-700" };
  const color = d <= 30 ? "text-red-700" : d <= 60 ? "text-amber-700" : d <= 90 ? "text-yellow-700" : "text-emerald-700";
  if (d < 90) return { main: `${d} ${d === 1 ? "day" : "days"}`, color };
  const years = Math.floor(d / 365);
  const months = Math.floor((d % 365) / 30);
  return { main: [years ? `${years} yr` : "", months ? `${months} mo` : ""].filter(Boolean).join(" ") || `${d} days`, color };
}

export default function Expiry() {
  const { user } = useApp();
  const canRemove = user.role !== "Staff";   // Staff can see this page but not remove stock

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/inventory");
      // Every batch, nearest expiry first (expired ones at the top)
      setRows([...data].sort((a, b) => a.daysToExpiry - b.daysToExpiry));
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // A search made only of a number (30, "30 days", "30d") means "expires within that many days".
  // Anything else is a text search on medicine, batch, category and supplier.
  const q = search.trim().toLowerCase();
  const daysMatch = q.match(/^(\d+)\s*(?:d|day|days)?$/);
  const withinDays = daysMatch ? Number(daysMatch[1]) : null;
  const searched = rows.filter((r) => withinDays !== null
    ? r.daysToExpiry >= 0 && r.daysToExpiry <= withinDays
    : !q || `${r.name} ${r.batchNumber} ${r.category} ${r.supplier}`.toLowerCase().includes(q));
  const inTab = (key) => searched.filter((r) => TABS.find((t) => t[0] === key)[2](r.daysToExpiry));
  const shown = inTab(tab);
  const stockValue = shown.reduce((sum, r) => sum + r.quantity * r.price, 0);

  const removeExpired = async (r) => {
    if (!window.confirm(`Remove ${r.quantity} expired units of ${r.name} (batch ${r.batchNumber}) from stock? This is recorded in the history.`)) return;
    setActionError("");
    try {
      await api.post(`/api/alerts/expired/${r.batchId}/remove`);
      await load();
      window.dispatchEvent(new Event("alerts-changed"));   // refreshes the bell count
    } catch (err) {
      setActionError(errorOf(err).message);
    }
  };

  return (
    <>
      <PageHeader title={titleFor(user.role, "/expiry", "Expiry Tracking")} sub="Every medicine batch with the time left before it expires" />

      <div className="mb-4 max-w-md">
        <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input aria-label="Search medicines" placeholder="Search by name, batch, category, supplier or days left" value={search}
          onChange={(e) => setSearch(e.target.value)} className={`${fld} pl-9`} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {withinDays !== null
            ? `Showing batches that expire within ${withinDays} ${withinDays === 1 ? "day" : "days"}`
            : "Tip: type a number, such as 30, to see everything that expires within that many days."}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === key ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {label} ({inTab(key).length})
          </button>
        ))}
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading expiry data...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <>
            <p className="px-3 pt-2 text-sm text-slate-600">
              {shown.length} {shown.length === 1 ? "batch" : "batches"} · stock value <b>{money(stockValue)}</b>
            </p>
            <TableWrap>
              <thead><tr>{["Medicine", "Category", "Supplier", "Qty", "Expiry date", "Time left", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {shown.map((r) => {
                  const t = timeLeft(r.daysToExpiry);
                  return (
                    <tr key={r.batchId}>
                      <td className={td}><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">Batch {r.batchNumber}</p></td>
                      <td className={td}>{r.category}</td>
                      <td className={td}>{r.supplier}</td>
                      <td className={`${td} font-semibold`}>{r.quantity}</td>
                      <td className={td}>{r.expiryDate}</td>
                      <td className={td}>
                        <p className={`font-semibold ${t.color}`}>{t.main}</p>
                        {r.daysToExpiry >= 90 && <p className="text-xs text-slate-500">{r.daysToExpiry} days</p>}
                      </td>
                      <td className={td}><Tag s={r.expiryStatus} /></td>
                      <td className={td}>
                        {r.daysToExpiry < 0 && r.quantity === 0 && <span className="text-xs text-slate-500">No stock left</span>}
                        {r.daysToExpiry < 0 && r.quantity > 0 && canRemove && <button className={ghost} onClick={() => removeExpired(r)}>Remove stock</button>}
                      </td>
                    </tr>
                  );
                })}
                {!shown.length && <tr><td colSpan={8} className="p-6 text-center text-slate-500">{withinDays !== null ? `No batches expire within ${withinDays} days.` : q ? "No batches match your search." : "Nothing in this group."}</td></tr>}
              </tbody>
            </TableWrap>
          </>
        )}
      </div>
    </>
  );
}