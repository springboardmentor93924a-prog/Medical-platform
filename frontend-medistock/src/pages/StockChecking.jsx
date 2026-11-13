import { useCallback, useEffect, useMemo, useState } from "react";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, PageHeader, TableWrap, btn, fld, td, th } from "../components/ui.jsx";

const TONE = { Matched: "green", Discrepancy: "red", Reviewed: "slate" };

export default function StockChecking() {
  const [batches, setBatches] = useState([]);
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ batchId: "", countedQuantity: "", note: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, cnt] = await Promise.all([api.get("/api/inventory"), api.get("/api/stock-counts")]);
      setBatches([...inv.data].sort((a, b) => a.name.localeCompare(b.name)));
      setCounts(cnt.data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The system quantity is not shown before counting, so the count is made without being influenced by it
  const options = useMemo(() => batches.map((b) => ({ id: b.batchId, label: `${b.name} · Batch ${b.batchNumber} · expires ${b.expiryDate}` })), [batches]);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setResult(null); setSaving(true);
    try {
      const { data } = await api.post("/api/stock-counts", { batchId: +form.batchId, countedQuantity: +form.countedQuantity, note: form.note });
      setResult(data);
      setForm({ batchId: "", countedQuantity: "", note: "" });
      await load();
    } catch (err) {
      const body = errorOf(err);
      setErrors(body.errors || {});
      if (!body.errors) setFormError(body.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Stock Checking" sub="Count what is on the shelf. A difference is reported to the Pharmacist or Admin." />

      {loadError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{loadError}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card title="Record a count">
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm font-medium">Medicine and batch
              <select required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className={`${fld} mt-1`}>
                <option value="">Choose a batch</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              {errors.batchId && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.batchId}</p>}
            </label>
            <label className="block text-sm font-medium">Quantity you counted
              <input required type="number" min="0" value={form.countedQuantity} onChange={(e) => setForm({ ...form, countedQuantity: e.target.value })} className={`${fld} mt-1`} />
              {errors.countedQuantity && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.countedQuantity}</p>}
            </label>
            <label className="block text-sm font-medium">Note (needed if the count is different)
              <input maxLength={255} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. 2 strips damaged" className={`${fld} mt-1`} />
              {errors.note && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.note}</p>}
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving || loading} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Save count"}</button>
          </form>

          {result && (
            <div role="status" className={`mt-4 rounded-xl px-4 py-3 text-sm ${result.difference === 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
              <p className="font-semibold">{result.medicine} · Batch {result.batchNumber}</p>
              {result.difference === 0
                ? <p>Your count matches the system ({result.systemQuantity}).</p>
                : <p>The system had {result.systemQuantity} and you counted {result.countedQuantity} (difference {result.difference > 0 ? "+" : ""}{result.difference}). It has been reported for review. The stock was not changed.</p>}
            </div>
          )}
        </Card>

        <Card title="My recent counts">
          {loading ? <p className="py-4 text-center text-slate-500">Loading...</p> : (
            <TableWrap>
              <thead><tr>{["When", "Medicine", "System", "Counted", "Difference", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {counts.map((c) => (
                  <tr key={c.id}>
                    <td className={`${td} whitespace-nowrap`}>{new Date(c.countedAt).toLocaleString()}</td>
                    <td className={td}><p className="font-semibold">{c.medicine}</p><p className="text-xs text-slate-500">Batch {c.batchNumber}</p></td>
                    <td className={td}>{c.systemQuantity}</td>
                    <td className={td}>{c.countedQuantity}</td>
                    <td className={`${td} font-semibold ${c.difference === 0 ? "" : c.difference > 0 ? "text-emerald-700" : "text-red-600"}`}>{c.difference > 0 ? "+" : ""}{c.difference}</td>
                    <td className={td}><Badge tone={TONE[c.status]}>{c.status}</Badge></td>
                  </tr>
                ))}
                {!counts.length && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No counts yet.</td></tr>}
              </tbody>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}