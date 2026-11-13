import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IndianRupee, ListChecks, Plus, Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, Empty, Modal, PageHeader, Row, Stat, TableWrap, btn, fld, td, th } from "../components/ui.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const COLORS = { Expired: "#ef4444", Damaged: "#f59e0b", "Lost or stolen": "#8b5cf6", Other: "#64748b" };
const tip = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 };
const REASONS = [["DAMAGED", "Damaged"], ["LOST", "Lost or stolen"], ["OTHER", "Other"]];

export default function Wastage() {
  const [data, setData] = useState(null);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batchId: "", quantity: "", reason: "DAMAGED", note: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, inv] = await Promise.all([api.get("/api/wastage"), api.get("/api/inventory")]);
      setData(w.data);
      setBatches(inv.data.filter((r) => r.quantity > 0).sort((a, b) => a.name.localeCompare(b.name)));
      setError("");
    } catch (err) {
      setError(errorOf(err).message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setSaving(true);
    try {
      await api.post("/api/wastage", { batchId: +form.batchId, quantity: +form.quantity, reason: form.reason, note: form.note });
      setOpen(false);
      await load();
    } catch (err) {
      const body = errorOf(err);
      setErrors(body.errors || {});
      if (!body.errors) setFormError(body.message);
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <PageHeader title="Wastage & Loss" sub="Stock lost to expiry, damage or theft, and what it cost">
      <button className={btn} onClick={() => { setForm({ batchId: batches[0]?.batchId ?? "", quantity: "", reason: "DAMAGED", note: "" }); setErrors({}); setFormError(""); setOpen(true); }}><Plus className="size-4" />Record wastage</button>
    </PageHeader>
  );
  if (!data) return <>{header}{error ? <p role="alert" className="p-6 text-center font-medium text-red-700">{error}</p> : <p className="p-6 text-center text-slate-500">Loading...</p>}</>;

  const err = (k) => errors[k] && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors[k]}</p>;

  return (
    <>
      {header}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        <Stat icon={Trash2} label="Units lost" value={data.totalUnits} tone="red" />
        <Stat icon={IndianRupee} label="Value lost" value={money(data.totalValue)} tone="amber" />
        <Stat icon={ListChecks} label="Records" value={data.records.length} tone="teal" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Loss by reason (₹)">
          {data.byReason.length ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
              <div className="size-44 shrink-0" role="img" aria-label={data.byReason.map((s) => `${s.label}: ${money(s.value)}`).join(", ")}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byReason} dataKey="value" nameKey="label" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none">
                      {data.byReason.map((s) => <Cell key={s.label} fill={COLORS[s.label] ?? "#64748b"} />)}
                    </Pie>
                    <Tooltip contentStyle={tip} formatter={(v) => money(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {data.byReason.map((s) => (
                  <li key={s.label} className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ background: COLORS[s.label] ?? "#64748b" }} aria-hidden="true" />
                    {s.label}: <b>{money(s.value)}</b> <span className="text-slate-500">({s.units} units)</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : <Empty text="No wastage recorded yet." />}
        </Card>

        <Card title="Loss per month (₹)">
          {data.byMonth.every((m) => m.value === 0) ? <Empty text="No loss in the last 6 months." /> : (
            <div className="h-52 w-full" role="img" aria-label={data.byMonth.map((m) => `${m.label}: ${money(m.value)}`).join(", ")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
                  <Tooltip cursor={{ fill: "rgba(239,68,68,0.08)" }} contentStyle={tip} formatter={(v) => [money(v), "Loss"]} />
                  <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Biggest losses by medicine">
          <ul>
            {data.topMedicines.length
              ? data.topMedicines.map((t) => <Row key={t.medicine} left={t.medicine} sub={`${t.units} units lost`} right={<b>{money(t.value)}</b>} />)
              : <Empty text="Nothing yet." />}
          </ul>
        </Card>

        <Card title="Download" >
          <p className="text-sm text-slate-600">The full wastage list is a report, with Excel and PDF downloads.</p>
          <Link to="/reports" className={`${btn} mt-3`}>Open reports</Link>
        </Card>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <TableWrap>
          <thead><tr>{["When", "Medicine", "Reason", "Units", "Value lost", "Note", "By"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.records.map((w, i) => (
              <tr key={i}>
                <td className={`${td} whitespace-nowrap`}>{new Date(w.time).toLocaleString()}</td>
                <td className={td}><p className="font-semibold">{w.medicine}</p><p className="text-xs text-slate-500">Batch {w.batchNumber}</p></td>
                <td className={td}><Badge tone={w.reason === "Expired" ? "red" : "amber"}>{w.reason}</Badge></td>
                <td className={td}>{w.quantity}</td><td className={`${td} font-semibold`}>{money(w.value)}</td>
                <td className={`${td} text-slate-600`}>{w.note || "—"}</td><td className={td}>{w.by}</td>
              </tr>
            ))}
            {!data.records.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No wastage recorded yet.</td></tr>}
          </tbody>
        </TableWrap>
      </div>

      {open && (
        <Modal title="Record wastage" onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-3">
            <p className="text-sm text-slate-600">The units are taken out of stock and counted as a loss. Expired stock is removed from Expiry Tracking, and shows here automatically.</p>
            <label className="block text-sm font-medium">Medicine and batch
              <select required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className={`${fld} mt-1`}>
                {batches.map((b) => <option key={b.batchId} value={b.batchId}>{b.name} · Batch {b.batchNumber} · {b.quantity} in stock</option>)}
              </select>{err("batchId")}
            </label>
            <label className="block text-sm font-medium">Units lost
              <input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={`${fld} mt-1`} />{err("quantity")}
            </label>
            <label className="block text-sm font-medium">Reason
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={`${fld} mt-1`}>
                {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>{err("reason")}
            </label>
            <label className="block text-sm font-medium">Note {form.reason === "OTHER" ? "(required)" : "(optional)"}
              <input maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${fld} mt-1`} />{err("note")}
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Record wastage"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}