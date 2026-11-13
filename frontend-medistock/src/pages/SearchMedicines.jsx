import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { PageHeader, TableWrap, Tag, btn, fld, td, th } from "../components/ui.jsx";

export default function SearchMedicines() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState({ text: "", category: "", supplier: "", stock: "" });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/inventory");
      setRows(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))].sort(), [rows]);
  const suppliers = useMemo(() => [...new Set(rows.map((r) => r.supplier))].sort(), [rows]);
  const shown = useMemo(() => rows.filter((r) =>
    (!q.text || `${r.name} ${r.batchNumber}`.toLowerCase().includes(q.text.trim().toLowerCase())) &&
    (!q.category || r.category === q.category) && (!q.supplier || r.supplier === q.supplier) &&
    (!q.stock || r.stockStatus === q.stock)), [rows, q]);

  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const select = (k, label, options) => (
    <select aria-label={label} value={q[k]} onChange={set(k)} className={fld}>
      <option value="">{label}</option>{options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <>
      <PageHeader title="Search Medicines" sub={`${shown.length} of ${rows.length} medicine batches`} />

      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input aria-label="Search by medicine name or batch number" placeholder="Name or batch number" value={q.text} onChange={set("text")} className={`${fld} pl-9`} />
        </div>
        {select("category", "All categories", categories)}
        {select("supplier", "All suppliers", suppliers)}
        {select("stock", "Any stock status", ["In stock", "Low stock", "Out of stock"])}
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading medicines...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <TableWrap>
            <thead><tr>{["Medicine", "Category", "Supplier", "Qty", "Expiry", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.batchId}>
                  <td className={td}><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">Batch {r.batchNumber}</p></td>
                  <td className={td}>{r.category}</td>
                  <td className={td}>{r.supplier}</td>
                  <td className={`${td} font-semibold`}>{r.quantity}</td>
                  <td className={td}>{r.expiryDate}</td>
                  <td className={td}><Tag s={r.stockStatus} /></td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No medicines match your search.</td></tr>}
            </tbody>
          </TableWrap>
        )}
      </div>
    </>
  );
}