import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { titleFor } from "../menus.js";
import { useSettings } from "../api/useSettings.js";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Badge, Modal, PageHeader, TableWrap, Tag, btn, fld, td, th } from "../components/ui.jsx";
import { useFirstIds } from "../api/fefo.js";

const FIELDS = [
  ["name", "Medicine name", "text"], ["batchNumber", "Batch number", "text"], ["quantity", "Quantity", "number"],
  ["reorderLevel", "Reorder level", "number"], ["manufacturingDate", "Manufacturing date", "date"],
  ["expiryDate", "Expiry date", "date"], ["price", "Price (₹)", "number"],
];

const FormField = ({ label, error, children }) => (
  <label className="block text-sm font-medium">
    {label}
    <div className="mt-1">{children}</div>
    {error && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{error}</p>}
  </label>
);

export default function Inventory() {
  const { user } = useApp();
  const settings = useSettings();
  const manage = user.role !== "Staff";   // Staff can only update stock quantities

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [params] = useSearchParams();   // ?category=Antibiotic opens the page already filtered, e.g. from the Categories page
  const [q, setQ] = useState({ text: "", category: params.get("category") ?? "", supplier: "", expiry: "", stock: "" });

  const [modal, setModal] = useState(null);   // { type: "add" | "edit" | "stock", row? }
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, cat, sup] = await Promise.all([
        api.get("/api/inventory"), api.get("/api/categories"), api.get("/api/suppliers"),
      ]);
      setRows(inv.data);
      setCategories(cat.data);
      setSuppliers(sup.data.filter((s) => s.active));
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => rows.filter((r) =>
    (!q.text || `${r.name} ${r.batchNumber}`.toLowerCase().includes(q.text.toLowerCase())) &&
    (!q.category || r.category === q.category) && (!q.supplier || r.supplier === q.supplier) &&
    (!q.expiry || r.expiryStatus === q.expiry) && (!q.stock || r.stockStatus === q.stock)), [rows, q]);

  const firstOut = useMemo(() => useFirstIds(rows), [rows]);   // batches to use or sell first
  const setFilter = (k) => (e) => setQ({ ...q, [k]: e.target.value });
  const setField = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const open = (state, initial) => { setForm(initial); setErrors({}); setFormError(""); setModal(state); };
  const openAdd = () => open({ type: "add" }, {
    name: "", batchNumber: "", categoryId: categories[0]?.id ?? "", supplierId: suppliers[0]?.id ?? "",
    quantity: "", reorderLevel: settings.defaultReorderLevel, manufacturingDate: "", expiryDate: "", price: "",
  });
  const openEdit = (r) => open({ type: "edit", row: r }, {
    name: r.name, batchNumber: r.batchNumber, categoryId: r.categoryId, supplierId: r.supplierId,
    reorderLevel: r.reorderLevel, manufacturingDate: r.manufacturingDate, expiryDate: r.expiryDate, price: r.price,
  });
  const openStock = (r) => open({ type: "stock", row: r }, { quantity: r.quantity, note: "" });

  // Runs a save call, shows backend messages under the right field, then reloads the list
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

  const saveMedicine = () => {
    const { quantity, ...rest } = form;
    const body = { ...rest, categoryId: +rest.categoryId, supplierId: +rest.supplierId,
      reorderLevel: +rest.reorderLevel, price: +rest.price };
    return modal.type === "add"
      ? api.post("/api/inventory", { ...body, quantity: +quantity })
      : api.put(`/api/inventory/${modal.row.batchId}`, body);
  };
  const saveStock = () => api.put(`/api/inventory/${modal.row.batchId}/stock`, { quantity: +form.quantity, note: form.note });

  const remove = async (r) => {
    if (!window.confirm(`Delete ${r.name}? This hides the medicine and all its batches.`)) return;
    setActionError("");
    try {
      await api.delete(`/api/inventory/medicines/${r.medicineId}`);
      await load();
    } catch (err) {
      setActionError(errorOf(err).message);
    }
  };

  const select = (k, label, opts) => (
    <select aria-label={label} value={q[k]} onChange={setFilter(k)} className={fld}>
      <option value="">{label}</option>{opts.map((o) => <option key={o}>{o}</option>)}
    </select>
  );

  const errorBox = (msg) => msg && (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:col-span-2">{msg}</p>
  );

  return (
    <>
      <PageHeader title={titleFor(user.role, "/inventory", "Medicines")} sub={`${shown.length} of ${rows.length} medicine batches`}>
        {manage && <button className={btn} onClick={openAdd}><Plus className="size-4" />Add medicine</button>}
      </PageHeader>

      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input aria-label="Search by name or batch" placeholder="Name or batch" value={q.text} onChange={setFilter("text")} className={`${fld} pl-9`} />
        </div>
        {select("category", "All categories", categories.map((c) => c.name))}
        {select("supplier", "All suppliers", suppliers.map((s) => s.name))}
        {select("expiry", "Any expiry", ["Safe", "Near expiry", "Expired"])}
        {select("stock", "Any stock status", ["In stock", "Low stock", "Out of stock"])}
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading inventory...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <TableWrap>
            <thead><tr>{["Medicine", "Category", "Supplier", "Qty", "Expiry", "Status", "Price", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.batchId}>
                  <td className={td}><p className="font-semibold">{r.name}</p><p className="text-xs text-slate-500">Batch {r.batchNumber}</p></td>
                  <td className={td}>{r.category}</td><td className={td}>{r.supplier}</td>
                  <td className={`${td} font-semibold`}>{r.quantity}</td><td className={td}>{r.expiryDate}</td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1"><Tag s={r.stockStatus} />{r.expiryStatus !== "Safe" && <Tag s={r.expiryStatus} />}{firstOut.has(r.batchId) && <span title="Another batch of this medicine expires later, so use or sell this one first"><Badge tone="blue">Use first</Badge></span>}</div>
                  </td>
                  <td className={td}>₹{Number(r.price).toFixed(2)}</td>
                  <td className={td}>
                    <div className="flex gap-1">
                      <button aria-label={`Update stock for ${r.name}`} title="Update stock" className="rounded-lg p-2 text-teal-700 hover:bg-teal-50" onClick={() => openStock(r)}><ArrowUpDown className="size-4" /></button>
                      {manage && <button aria-label={`Edit ${r.name}`} title="Edit details" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => openEdit(r)}><Pencil className="size-4" /></button>}
                      {manage && <button aria-label={`Delete ${r.name}`} title="Delete" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(r)}><Trash2 className="size-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={8} className="p-6 text-center text-slate-500">No medicines found.</td></tr>}
            </tbody>
          </TableWrap>
        )}
      </div>

      {(modal?.type === "add" || modal?.type === "edit") && (
        <Modal title={modal.type === "add" ? "Add medicine" : `Edit ${modal.row.name}`} onClose={() => setModal(null)}>
          <form onSubmit={submit(saveMedicine)} className="grid gap-3 sm:grid-cols-2">
            {FIELDS.filter(([k]) => modal.type === "add" || k !== "quantity").map(([k, label, type]) => (
              <FormField key={k} label={label} error={errors[k]}>
                <input required type={type} min={type === "number" ? 0 : undefined} step={k === "price" ? "0.01" : undefined}
                  value={form[k]} onChange={setField(k)} className={fld} />
              </FormField>
            ))}
            <FormField label="Category" error={errors.categoryId}>
              <select required value={form.categoryId} onChange={setField("categoryId")} className={fld}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Supplier" error={errors.supplierId}>
              <select required value={form.supplierId} onChange={setField("supplierId")} className={fld}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            {errorBox(formError)}
            <button disabled={saving} className={`${btn} sm:col-span-2 disabled:opacity-60`}>{saving ? "Saving..." : "Save medicine"}</button>
          </form>
        </Modal>
      )}

      {modal?.type === "stock" && (
        <Modal title={`Update stock: ${modal.row.name}`} onClose={() => setModal(null)}>
          <form onSubmit={submit(saveStock)} className="space-y-3">
            <FormField label={`New quantity (currently ${modal.row.quantity})`} error={errors.quantity}>
              <input autoFocus required type="number" min="0" value={form.quantity} onChange={setField("quantity")} className={fld} />
            </FormField>
            <FormField label="Note (optional)" error={errors.note}>
              <input type="text" maxLength={255} value={form.note} onChange={setField("note")} placeholder="e.g. Received new delivery" className={fld} />
            </FormField>
            {errorBox(formError)}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Update stock"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}