import { useCallback, useEffect, useState } from "react";
import { IndianRupee, PackageCheck, Plus, RotateCcw, Truck } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Badge, Modal, PageHeader, Stat, TableWrap, btn, fld, ghost, td, th } from "../components/ui.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const TONE = { Requested: "amber", "Sent to supplier": "blue", Credited: "green", Cancelled: "slate" };
const REASONS = [["DAMAGED", "Damaged"], ["EXPIRED", "Expired"], ["WRONG_ITEM", "Wrong item"], ["QUALITY_ISSUE", "Quality issue"], ["OVERSTOCK", "Overstock"]];

export default function Returns() {
  const { user } = useApp();
  const canManage = user.role === "Pharmacist";   // the Admin can only watch

  const [rows, setRows] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [modal, setModal] = useState(null);   // { type: "new" } or { type: "credit", ret }
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const calls = [api.get("/api/returns")];
      if (canManage) calls.push(api.get("/api/inventory"));
      const [ret, inv] = await Promise.all(calls);
      setRows(ret.data);
      if (inv) setBatches(inv.data.filter((r) => r.quantity > 0).sort((a, b) => a.name.localeCompare(b.name)));
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { load(); }, [load]);

  const open = (state, initial) => { setForm(initial); setErrors({}); setFormError(""); setModal(state); };

  const submit = (save) => async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setSaving(true);
    try {
      await save();
      setModal(null);
      await load();
    } catch (err) {
      const body = errorOf(err);
      setErrors(body.errors || {});
      if (!body.errors) setFormError(body.message);
    } finally {
      setSaving(false);
    }
  };

  const act = async (r, path, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setActionError("");
    try { await api.post(`/api/returns/${r.id}/${path}`); await load(); } catch (err) { setActionError(errorOf(err).message); }
  };

  const open_ = rows.filter((r) => r.status === "Requested" || r.status === "Sent to supplier").length;
  const sent = rows.filter((r) => r.status === "Sent to supplier" || r.status === "Credited");
  const credit = rows.reduce((sum, r) => sum + Number(r.creditAmount ?? 0), 0);
  const err = (k) => errors[k] && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors[k]}</p>;

  return (
    <>
      <PageHeader title="Returns" sub={canManage ? "Medicines sent back to suppliers" : "Medicines sent back to suppliers (view only)"}>
        {canManage && <button className={btn} disabled={loading} onClick={() => open({ type: "new" }, { batchId: batches[0]?.batchId ?? "", quantity: "", reason: "DAMAGED", note: "" })}><Plus className="size-4" />New return</button>}
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <Stat icon={RotateCcw} label="Open returns" value={open_} tone="amber" />
        <Stat icon={Truck} label="Units sent back" value={sent.reduce((s, r) => s + r.quantity, 0)} tone="blue" />
        <Stat icon={PackageCheck} label="Value sent back" value={money(sent.reduce((s, r) => s + Number(r.value), 0))} tone="teal" />
        <Stat icon={IndianRupee} label="Credit received" value={money(credit)} tone="blue" />
      </div>

      {actionError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      <div className="mt-4 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? <p className="p-6 text-center text-slate-500">Loading returns...</p>
          : loadError ? <p role="alert" className="p-6 text-center font-medium text-red-700">{loadError}</p> : (
            <TableWrap>
              <thead><tr>{["Date", "Medicine", "Supplier", "Units", "Reason", "Value", "Credit", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={`${td} whitespace-nowrap`}>{r.createdAt.slice(0, 10)}<p className="text-xs text-slate-500">by {r.createdBy ?? "—"}</p></td>
                    <td className={td}><p className="font-semibold">{r.medicine}</p><p className="text-xs text-slate-500">Batch {r.batchNumber}{r.note ? ` · ${r.note}` : ""}</p></td>
                    <td className={td}>{r.supplier}</td>
                    <td className={`${td} font-semibold`}>{r.quantity}</td>
                    <td className={td}>{r.reason}</td>
                    <td className={td}>{money(r.value)}</td>
                    <td className={td}>{r.creditAmount == null ? "—" : money(r.creditAmount)}</td>
                    <td className={td}><Badge tone={TONE[r.status]}>{r.status}</Badge></td>
                    <td className={td}>
                      {canManage && r.status === "Requested" && (
                        <div className="flex gap-2">
                          <button className={ghost} onClick={() => act(r, "send", `Mark ${r.quantity} units of ${r.medicine} as sent to ${r.supplier}? They will be taken out of stock.`)}>Mark sent</button>
                          <button className={ghost} onClick={() => act(r, "cancel", "Cancel this return?")}>Cancel</button>
                        </div>
                      )}
                      {canManage && r.status === "Sent to supplier" && <button className={ghost} onClick={() => open({ type: "credit", ret: r }, { amount: Number(r.value).toFixed(2) })}>Record credit</button>}
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={9} className="p-6 text-center text-slate-500">No returns yet.</td></tr>}
              </tbody>
            </TableWrap>
          )}
      </div>

      {modal?.type === "new" && (
        <Modal title="New return to supplier" onClose={() => setModal(null)}>
          <form onSubmit={submit(() => api.post("/api/returns", { batchId: +form.batchId, quantity: +form.quantity, reason: form.reason, note: form.note }))} className="space-y-3">
            <p className="text-sm text-slate-600">The stock only goes down when you mark the return as sent.</p>
            <label className="block text-sm font-medium">Medicine and batch
              <select required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} className={`${fld} mt-1`}>
                {batches.map((b) => <option key={b.batchId} value={b.batchId}>{b.name} · Batch {b.batchNumber} · {b.supplier} · {b.quantity} in stock</option>)}
              </select>{err("batchId")}
            </label>
            <label className="block text-sm font-medium">Units to return
              <input required type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={`${fld} mt-1`} />{err("quantity")}
            </label>
            <label className="block text-sm font-medium">Reason
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={`${fld} mt-1`}>
                {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>{err("reason")}
            </label>
            <label className="block text-sm font-medium">Note (optional)
              <input maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${fld} mt-1`} />{err("note")}
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Create return"}</button>
          </form>
        </Modal>
      )}

      {modal?.type === "credit" && (
        <Modal title={`Credit for ${modal.ret.medicine}`} onClose={() => setModal(null)}>
          <form onSubmit={submit(() => api.post(`/api/returns/${modal.ret.id}/credit`, { amount: +form.amount }))} className="space-y-3">
            <p className="text-sm text-slate-600">Enter the money or credit note the supplier gave for this return.</p>
            <label className="block text-sm font-medium">Credit amount (₹)
              <input required autoFocus type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={`${fld} mt-1`} />{err("amount")}
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Save credit"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}