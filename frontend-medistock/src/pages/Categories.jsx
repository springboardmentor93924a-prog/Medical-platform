import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { Modal, PageHeader, Row, TableWrap, Tag, btn, fld, td, th } from "../components/ui.jsx";

// Groups the batch rows of one category into one line per medicine
function medicinesOf(rows, categoryId) {
  const byId = new Map();
  rows.filter((r) => r.categoryId === categoryId).forEach((r) => {
    const m = byId.get(r.medicineId) ?? { id: r.medicineId, name: r.name, reorder: r.reorderLevel, usable: 0, batches: 0, suppliers: new Set() };
    if (r.daysToExpiry >= 0) m.usable += r.quantity;   // expired batches are not usable stock
    m.batches += 1;
    m.suppliers.add(r.supplier);
    byId.set(r.medicineId, m);
  });
  return [...byId.values()]
    .map((m) => ({ ...m, status: m.usable === 0 ? "Out of stock" : m.usable <= m.reorder ? "Low stock" : "In stock" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);   // inventory batches, used to list the medicines of each category
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [modal, setModal] = useState(null);   // { type: "add" } or { type: "edit", c }
  const [form, setForm] = useState({ name: "", description: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cat, inv] = await Promise.all([api.get("/api/categories"), api.get("/api/inventory")]);
      setCategories(cat.data);
      setRows(inv.data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (state, initial) => { setForm(initial); setErrors({}); setFormError(""); setModal(state); };
  const openAdd = () => open({ type: "add" }, { name: "", description: "" });
  const openEdit = (c) => open({ type: "edit", c }, { name: c.name, description: c.description ?? "" });

  const save = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setSaving(true);
    try {
      if (modal.type === "add") await api.post("/api/categories", form);
      else await api.put(`/api/categories/${modal.c.id}`, form);
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

  const remove = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    setActionError("");
    try {
      await api.delete(`/api/categories/${c.id}`);
      await load();
    } catch (err) {
      setActionError(errorOf(err).message);
    }
  };

  return (
    <>
      <PageHeader title="Categories" sub="Browse medicines by category. Click a category to see its medicines.">
        <button className={btn} onClick={openAdd}><Plus className="size-4" />Add category</button>
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading categories...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <TableWrap>
            <thead><tr>{["Category", "Description", "Medicines", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {categories.map((c) => {
                const isOpen = openId === c.id;
                const meds = isOpen ? medicinesOf(rows, c.id) : [];
                return (
                  <Fragment key={c.id}>
                    <tr>
                      <td className={td}>
                        <button onClick={() => setOpenId(isOpen ? null : c.id)} aria-expanded={isOpen}
                          className="flex items-center gap-1.5 font-semibold hover:text-teal-700">
                          {isOpen ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                          {c.name}
                        </button>
                      </td>
                      <td className={`${td} text-slate-600`}>{c.description || "—"}</td>
                      <td className={td}>{c.medicineCount}</td>
                      <td className={td}>
                        <div className="flex gap-1">
                          <button aria-label={`Edit ${c.name}`} title="Edit" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => openEdit(c)}><Pencil className="size-4" /></button>
                          <button aria-label={`Delete ${c.name}`} title={c.medicineCount > 0 ? "In use by medicines" : "Delete"}
                            disabled={c.medicineCount > 0} onClick={() => remove(c)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={4} className="bg-slate-50 px-4 py-3">
                          {meds.length ? (
                            <ul>
                              {meds.map((m) => (
                                <Row key={m.id} left={m.name}
                                  sub={`${m.usable} usable units · ${m.batches} batch${m.batches === 1 ? "" : "es"} · ${[...m.suppliers].join(", ")}`}
                                  right={<Tag s={m.status} />} />
                              ))}
                            </ul>
                          ) : <p className="text-sm text-slate-500">No medicines in this category yet.</p>}
                          {meds.length > 0 && (
                            <Link to={`/inventory?category=${encodeURIComponent(c.name)}`} className="mt-2 inline-block text-sm font-semibold text-teal-700">
                              Open these in Medicines
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!categories.length && <tr><td colSpan={4} className="p-6 text-center text-slate-500">No categories yet.</td></tr>}
            </tbody>
          </TableWrap>
        )}
      </div>

      {modal && (
        <Modal title={modal.type === "add" ? "Add category" : `Edit ${modal.c.name}`} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-3">
            <label className="block text-sm font-medium">Name
              <input required autoFocus value={form.name} maxLength={50} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${fld} mt-1`} />
              {errors.name && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.name}</p>}
            </label>
            <label className="block text-sm font-medium">Description (optional)
              <input value={form.description} maxLength={255} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${fld} mt-1`} />
              {errors.description && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.description}</p>}
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Save category"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}