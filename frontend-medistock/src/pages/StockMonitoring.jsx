import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackageCheck, Pill } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { titleFor } from "../menus.js";
import { Badge, PageHeader, Stat, TableWrap, Tag, btn, fld, ghost, td, th } from "../components/ui.jsx";

const BAR = { "In stock": "bg-emerald-500", "Low stock": "bg-amber-500", "Out of stock": "bg-red-500" };
const TYPES = [["", "All movements"], ["INITIAL", "Initial stock"], ["ADJUSTMENT", "Adjustment"],
  ["PURCHASE_RECEIVED", "Purchase received"], ["EXPIRED_REMOVED", "Expired removed"]];
const typeLabel = (t) => { const s = t.toLowerCase().replace(/_/g, " "); return s[0].toUpperCase() + s.slice(1); };

export default function StockMonitoring() {
  const { user } = useApp();
  const canSeeMovement = user.role !== "Staff";   // the movement history is for Admin and Pharmacist

  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("levels");
  const [q, setQ] = useState({ text: "", status: "", type: "" });

  const load = useCallback(async () => {
    try {
      const [inv, hist, cnt] = await Promise.all([
        api.get("/api/inventory"),
        canSeeMovement ? api.get("/api/inventory/history", { params: { limit: 100 } }) : Promise.resolve({ data: [] }),
        canSeeMovement ? api.get("/api/stock-counts") : Promise.resolve({ data: [] }),
      ]);
      setRows(inv.data);
      setHistory(hist.data);
      setCounts(cnt.data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, [canSeeMovement]);

  useEffect(() => { load(); }, [load]);

  // One line per medicine. Usable stock ignores expired batches, the same rule the alerts use.
  const medicines = useMemo(() => {
    const byId = new Map();
    rows.forEach((r) => {
      const m = byId.get(r.medicineId) ?? { id: r.medicineId, name: r.name, category: r.category, reorder: r.reorderLevel, usable: 0, expired: 0, batches: 0 };
      if (r.daysToExpiry < 0) m.expired += r.quantity; else m.usable += r.quantity;
      m.batches += 1;
      byId.set(r.medicineId, m);
    });
    return [...byId.values()]
      .map((m) => ({ ...m, status: m.usable === 0 ? "Out of stock" : m.usable <= m.reorder ? "Low stock" : "In stock" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const count = (s) => medicines.filter((m) => m.status === s).length;
  const shownMedicines = medicines.filter((m) =>
    (!q.text || m.name.toLowerCase().includes(q.text.toLowerCase())) && (!q.status || m.status === q.status));
  const shownHistory = history.filter((h) =>
    (!q.type || h.type === q.type) && (!q.text || h.medicine.toLowerCase().includes(q.text.toLowerCase())));
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const shownCounts = counts.filter((c) => !q.text || c.medicine.toLowerCase().includes(q.text.toLowerCase()));
  const COUNT_TONE = { Matched: "green", Discrepancy: "red", Reviewed: "slate" };
  // Marking a difference as reviewed does not change the stock. Fix the quantity in Medicines first if the count is right.
  const review = async (c) => {
    try { await api.post(`/api/stock-counts/${c.id}/review`); await load(); } catch (err) { setLoadError(errorOf(err).message); }
  };

  return (
    <>
      <PageHeader title={titleFor(user.role, "/stock", "Stock Monitoring")} sub="Available quantities, stock status and inventory movement" />

      {loading ? (
        <p className="p-6 text-center text-slate-500">Loading stock data...</p>
      ) : loadError ? (
        <div className="p-6 text-center">
          <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
          <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Pill} label="Medicines" value={medicines.length} tone="teal" />
            <Stat icon={PackageCheck} label="In stock" value={count("In stock")} tone="blue" />
            <Stat icon={AlertTriangle} label="Low stock" value={count("Low stock")} tone="amber" />
            <Stat icon={AlertTriangle} label="Out of stock" value={count("Out of stock")} tone="red" />
          </div>

          <div className="mb-4 mt-5 flex flex-wrap items-center gap-2" role="tablist">
            {[["levels", "Stock levels"], ...(canSeeMovement ? [["movement", "Inventory movement"], ["counts", "Stock counts"]] : [])].map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === key ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{label}</button>
            ))}
            <input aria-label="Search medicine" placeholder="Search medicine" value={q.text} onChange={set("text")} className={`${fld} ml-auto w-full sm:w-56`} />
            {tab === "levels"
              ? <select aria-label="Stock status" value={q.status} onChange={set("status")} className={`${fld} w-full sm:w-44`}>
                  <option value="">Any status</option>{["In stock", "Low stock", "Out of stock"].map((s) => <option key={s}>{s}</option>)}
                </select>
              : tab === "movement" ? <select aria-label="Movement type" value={q.type} onChange={set("type")} className={`${fld} w-full sm:w-48`}>
                  {TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select> : null}
          </div>

          <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
            {tab === "levels" ? (
              <TableWrap>
                <thead><tr>{["Medicine", "Usable units", "Reorder level", "Batches", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {shownMedicines.map((m) => (
                    <tr key={m.id}>
                      <td className={td}><p className="font-semibold">{m.name}</p><p className="text-xs text-slate-500">{m.category}</p></td>
                      <td className={`${td} min-w-40`}>
                        <p className="font-semibold">{m.usable}</p>
                        <div className="mt-1 h-1.5 w-32 rounded-full bg-slate-100" aria-hidden="true">
                          <div className={`h-1.5 rounded-full ${BAR[m.status]}`} style={{ width: `${Math.min(100, (m.usable / Math.max(1, m.reorder * 2)) * 100)}%` }} />
                        </div>
                        {m.expired > 0 && <p className="mt-1 text-xs text-red-600">+ {m.expired} expired</p>}
                      </td>
                      <td className={td}>{m.reorder}</td>
                      <td className={td}>{m.batches}</td>
                      <td className={td}><Tag s={m.status} /></td>
                    </tr>
                  ))}
                  {!shownMedicines.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No medicines found.</td></tr>}
                </tbody>
              </TableWrap>
            ) : tab === "movement" ? (
              <TableWrap>
                <thead><tr>{["When", "Medicine", "Change", "Quantity after", "Type", "Note", "By"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {shownHistory.map((h) => (
                    <tr key={h.id}>
                      <td className={`${td} whitespace-nowrap`}>{new Date(h.createdAt).toLocaleString()}</td>
                      <td className={td}><p className="font-semibold">{h.medicine}</p><p className="text-xs text-slate-500">Batch {h.batchNumber}</p></td>
                      <td className={`${td} font-semibold ${h.changeQuantity > 0 ? "text-emerald-700" : "text-red-600"}`}>{h.changeQuantity > 0 ? "+" : ""}{h.changeQuantity}</td>
                      <td className={td}>{h.quantityAfter}</td>
                      <td className={td}><Badge tone="slate">{typeLabel(h.type)}</Badge></td>
                      <td className={`${td} text-slate-600`}>{h.note || "—"}</td>
                      <td className={td}>{h.performedBy}</td>
                    </tr>
                  ))}
                  {!shownHistory.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No movements found.</td></tr>}
                </tbody>
              </TableWrap>
            ) : (
              <TableWrap>
                <thead><tr>{["When", "Medicine", "System", "Counted", "Difference", "Status", "Note", "Counted by", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {shownCounts.map((c) => (
                    <tr key={c.id}>
                      <td className={`${td} whitespace-nowrap`}>{new Date(c.countedAt).toLocaleString()}</td>
                      <td className={td}><p className="font-semibold">{c.medicine}</p><p className="text-xs text-slate-500">Batch {c.batchNumber}</p></td>
                      <td className={td}>{c.systemQuantity}</td>
                      <td className={td}>{c.countedQuantity}</td>
                      <td className={`${td} font-semibold ${c.difference === 0 ? "" : c.difference > 0 ? "text-emerald-700" : "text-red-600"}`}>{c.difference > 0 ? "+" : ""}{c.difference}</td>
                      <td className={td}><Badge tone={COUNT_TONE[c.status]}>{c.status}</Badge></td>
                      <td className={`${td} text-slate-600`}>{c.note || "—"}</td>
                      <td className={td}>{c.countedBy}</td>
                      <td className={td}>{c.status === "Discrepancy" && <button className={ghost} onClick={() => review(c)}>Mark reviewed</button>}</td>
                    </tr>
                  ))}
                  {!shownCounts.length && <tr><td colSpan={9} className="p-6 text-center text-slate-500">No stock counts yet.</td></tr>}
                </tbody>
              </TableWrap>
            )}
          </div>
          {tab === "movement" && <p className="mt-2 text-xs text-slate-500">Showing the latest 100 movements.</p>}
        </>
      )}
    </>
  );
}