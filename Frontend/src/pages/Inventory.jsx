import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { Label, Modal, PageHeader, Tag, TableWrap, btn, fld, td, th } from "../components/ui.jsx";
import { categories, expiryStatus, inr, stockStatus } from "../data/mock.js";

const FIELDS = [["name", "Medicine name", "text"], ["batch", "Batch number", "text"], ["qty", "Quantity", "number"],
  ["reorder", "Reorder level", "number"], ["mfg", "Manufacturing date", "date"], ["expiry", "Expiry date", "date"], ["price", "Price (₹)", "number"]];

export default function Inventory() {
  const { user, medicines, setMedicines, suppliers, log } = useApp();
  const manage = user.role !== "Staff"; // Staff can only update stock quantities
  const [q, setQ] = useState({ text: "", category: "", supplier: "", expiry: "", stock: "" });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(null);
  const set = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  const rows = useMemo(() => medicines.filter((m) =>
    (!q.text || `${m.name} ${m.batch}`.toLowerCase().includes(q.text.toLowerCase())) &&
    (!q.category || m.category === q.category) && (!q.supplier || m.supplier === q.supplier) &&
    (!q.expiry || expiryStatus(m) === q.expiry) && (!q.stock || stockStatus(m) === q.stock)), [medicines, q]);

  const openAdd = () => {
    setForm({ name: "", batch: "", category: categories[0], supplier: suppliers[0]?.name, qty: "", reorder: 50, mfg: "", expiry: "", price: "" });
    setModal({ type: "add" });
  };
  const add = (e) => {
    e.preventDefault();
    setMedicines((l) => [{ ...form, id: Date.now(), qty: +form.qty, reorder: +form.reorder, price: +form.price }, ...l]);
    log(`Added ${form.name} (batch ${form.batch})`); setModal(null);
  };
  const updateQty = (e) => {
    e.preventDefault();
    const n = +form;
    setMedicines((l) => l.map((m) => (m.id === modal.m.id ? { ...m, qty: n } : m)));
    log(`Stock updated: ${modal.m.name} ${modal.m.qty} → ${n}`); setModal(null);
  };
  const remove = (m) => {
    if (!window.confirm(`Delete ${m.name}?`)) return;
    setMedicines((l) => l.filter((x) => x.id !== m.id)); log(`Deleted ${m.name}`);
  };
  const select = (k, label, opts) => (
    <select aria-label={label} value={q[k]} onChange={set(k)} className={fld}>
      <option value="">{label}</option>{opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  return (
    <>
      <PageHeader title="Inventory" sub={`${rows.length} of ${medicines.length} medicines`}>
        {manage && <button className={btn} onClick={openAdd}><Plus className="size-4" />Add medicine</button>}
      </PageHeader>

      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input aria-label="Search by name or batch" placeholder="Name or batch" value={q.text} onChange={set("text")} className={`${fld} pl-9`} />
        </div>
        {select("category", "All categories", categories)}
        {select("supplier", "All suppliers", suppliers.map((s) => s.name))}
        {select("expiry", "Any expiry", ["Safe", "Near expiry", "Expired"])}
        {select("stock", "Any stock status", ["In stock", "Low stock", "Out of stock"])}
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <TableWrap>
          <thead><tr>{["Medicine", "Category", "Supplier", "Qty", "Expiry", "Status", "Price", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td className={td}><p className="font-semibold">{m.name}</p><p className="text-xs text-slate-500">Batch {m.batch}</p></td>
                <td className={td}>{m.category}</td><td className={td}>{m.supplier}</td>
                <td className={`${td} font-semibold`}>{m.qty}</td><td className={td}>{m.expiry}</td>
                <td className={td}><div className="flex flex-wrap gap-1"><Tag s={stockStatus(m)} />{expiryStatus(m) !== "Safe" && <Tag s={expiryStatus(m)} />}</div></td>
                <td className={td}>{inr(m.price)}</td>
                <td className={td}>
                  <div className="flex gap-1">
                    <button aria-label={`Update stock for ${m.name}`} className="rounded-lg p-2 text-teal-700 hover:bg-teal-50" onClick={() => { setForm(m.qty); setModal({ type: "qty", m }); }}><Pencil className="size-4" /></button>
                    {manage && <button aria-label={`Delete ${m.name}`} className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(m)}><Trash2 className="size-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="p-6 text-center text-slate-500">No medicines match your filters.</td></tr>}
          </tbody>
        </TableWrap>
      </div>

      {modal?.type === "add" && (
        <Modal title="Add medicine" onClose={() => setModal(null)}>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map(([k, label, type]) => (
              <Label key={k} text={label}>
                <input required type={type} min={type === "number" ? 0 : undefined} step={k === "price" ? "0.01" : undefined}
                  value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={fld} />
              </Label>
            ))}
            <Label text="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fld}>{categories.map((c) => <option key={c}>{c}</option>)}</select></Label>
            <Label text="Supplier"><select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={fld}>{suppliers.map((s) => <option key={s.id}>{s.name}</option>)}</select></Label>
            <button className={`${btn} sm:col-span-2`}>Save medicine</button>
          </form>
        </Modal>
      )}
      {modal?.type === "qty" && (
        <Modal title={`Update stock: ${modal.m.name}`} onClose={() => setModal(null)}>
          <form onSubmit={updateQty} className="space-y-3">
            <Label text={`New quantity (currently ${modal.m.qty})`}>
              <input autoFocus required type="number" min="0" value={form} onChange={(e) => setForm(e.target.value)} className={fld} />
            </Label>
            <button className={`${btn} w-full`}>Update stock</button>
          </form>
        </Modal>
      )}
    </>
  );
}