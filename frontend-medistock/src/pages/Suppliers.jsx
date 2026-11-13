import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Pencil, Phone, Plus } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { useApp } from "../context/AppContext.jsx";
import { titleFor } from "../menus.js";
import { Badge, Card, Modal, PageHeader, Row, Tag, btn, fld, ghost } from "../components/ui.jsx";

const FIELDS = [
  ["name", "Supplier name", "text"], ["phone", "Contact number", "tel"],
  ["email", "Email", "email"], ["address", "Address", "text"],
];

const money = (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const FormField = ({ label, error, children }) => (
  <label className="block text-sm font-medium">
    {label}
    <div className="mt-1">{children}</div>
    {error && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{error}</p>}
  </label>
);

// Order count, money spent and on-time delivery rate for one supplier
function summarise(orders) {
  const spent = orders.filter((o) => !["Cancelled", "Rejected", "Awaiting approval"].includes(o.status)).reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const timed = orders.filter((o) => o.status === "Received" && o.expectedDate && o.deliveredAt);
  const onTime = timed.length
    ? Math.round((100 * timed.filter((o) => new Date(o.deliveredAt).toLocaleDateString("en-CA") <= o.expectedDate).length) / timed.length)
    : null;
  return { count: orders.length, spent, onTime };
}

export default function Suppliers() {
  const { user } = useApp();
  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([]);       // inventory rows: which medicines each supplier provides
  const [orders, setOrders] = useState([]);   // purchase orders: each supplier's purchase history
  const [openId, setOpenId] = useState(null); // supplier whose history is open
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [modal, setModal] = useState(null);   // { type: "add" } or { type: "edit", s }
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sup, inv, ord] = await Promise.all([api.get("/api/suppliers"), api.get("/api/inventory"), api.get("/api/orders")]);
      setSuppliers(sup.data);
      setRows(inv.data);
      setOrders(ord.data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };
  const open = (state, initial) => { setForm(initial); setErrors({}); setFormError(""); setModal(state); };
  const openAdd = () => open({ type: "add" }, { name: "", phone: "", email: "", address: "" });
  const openEdit = (s) => open({ type: "edit", s }, { name: s.name, phone: s.phone, email: s.email, address: s.address });

  const save = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setSaving(true);
    try {
      if (modal.type === "add") await api.post("/api/suppliers", form);
      else await api.put(`/api/suppliers/${modal.s.id}`, { ...form, active: modal.s.active });
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

  // Suppliers are never deleted (medicines and orders point to them). They are switched off instead.
  const toggleActive = async (s) => {
    if (s.active && !window.confirm(`Deactivate ${s.name}? It can no longer be chosen for new medicines.`)) return;
    setActionError("");
    try {
      await api.put(`/api/suppliers/${s.id}`, { name: s.name, phone: s.phone, email: s.email, address: s.address, active: !s.active });
      await load();
    } catch (err) {
      setActionError(errorOf(err).message);
    }
  };

  return (
    <>
      <PageHeader title={titleFor(user.role, "/suppliers", "Suppliers")} sub="Contacts, supplied medicines and purchase history">
        <button className={btn} onClick={openAdd}><Plus className="size-4" />Add supplier</button>
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      {loading ? (
        <p className="p-6 text-center text-slate-500">Loading suppliers...</p>
      ) : loadError ? (
        <div className="p-6 text-center">
          <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
          <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suppliers.map((s) => {
            const meds = [...new Set(rows.filter((r) => r.supplierId === s.id).map((r) => r.name))];
            const mine = orders.filter((o) => o.supplierId === s.id);
            const { count, spent, onTime } = summarise(mine);
            const isOpen = openId === s.id;
            return (
              <Card key={s.id} title={s.name} action={<Badge tone={s.active ? "green" : "slate"}>{s.active ? "Active" : "Inactive"}</Badge>}>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><Phone className="size-4 shrink-0" aria-hidden="true" />{s.phone}</li>
                  <li className="flex items-center gap-2"><Mail className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{s.email}</span></li>
                  <li className="flex items-center gap-2"><MapPin className="size-4 shrink-0" aria-hidden="true" />{s.address}</li>
                </ul>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[["Orders", count], ["Total spent", money(spent)], ["On time", onTime == null ? "—" : `${onTime}%`]].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-teal-50 px-2 py-2">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm font-semibold">Supplied medicines ({meds.length})</p>
                <p className="text-sm text-slate-600">{meds.join(", ") || "None yet"}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className={ghost} aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? null : s.id)}>
                    Purchase history ({count})
                  </button>
                  <button className={ghost} onClick={() => openEdit(s)}><Pencil className="size-4" />Edit</button>
                  <button className={ghost} onClick={() => toggleActive(s)}>{s.active ? "Deactivate" : "Activate"}</button>
                </div>

                {isOpen && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    {mine.length ? (
                      <ul className="max-h-64 overflow-y-auto">
                        {mine.map((o) => (
                          <Row key={o.id} left={`${o.orderNumber} · ${o.createdAt.slice(0, 10)}`}
                            sub={o.items.map((i) => `${i.medicine} × ${i.quantity}`).join(", ")}
                            right={<div className="text-right"><Tag s={o.status} /><p className="mt-1 text-xs font-semibold">{money(o.totalAmount)}</p></div>} />
                        ))}
                      </ul>
                    ) : <p className="text-sm text-slate-500">No orders placed with this supplier yet.</p>}
                    {mine.length > 0 && <Link to="/orders" className="mt-2 inline-block text-sm font-semibold text-teal-700">Open Purchase Orders</Link>}
                  </div>
                )}
              </Card>
            );
          })}
          {!suppliers.length && <p className="text-slate-500">No suppliers yet. Click Add supplier.</p>}
        </div>
      )}

      {modal && (
        <Modal title={modal.type === "add" ? "Add supplier" : `Edit ${modal.s.name}`} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-3">
            {FIELDS.map(([k, label, type]) => (
              <FormField key={k} label={label} error={errors[k]}>
                <input required type={type} value={form[k]} onChange={setField(k)} className={fld} />
              </FormField>
            ))}
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Save supplier"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}