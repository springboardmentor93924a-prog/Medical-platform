import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { titleFor } from "../menus.js";
import { useSettings } from "../api/useSettings.js";
import { Badge, Modal, PageHeader, TableWrap, Tag, btn, fld, ghost, td, th } from "../components/ui.jsx";

const STATUSES = ["Awaiting approval", "Pending", "Accepted", "Dispatched", "Partially received", "Received", "Rejected", "Cancelled"];

const FormField = ({ label, error, children }) => (
  <label className="block text-sm font-medium">
    {label}
    <div className="mt-1">{children}</div>
    {error && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{error}</p>}
  </label>
);

export default function Orders() {
  const { user } = useApp();
  const settings = useSettings();
  const isSupplier = user.role === "Supplier";
  const isAdmin = user.role === "Admin";            // monitors orders and approves or rejects them
  const isPharmacist = user.role === "Pharmacist";  // the only role that places and receives orders
  const statuses = isSupplier ? STATUSES.filter((s) => s !== "Awaiting approval" && s !== "Rejected") : STATUSES;

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [modal, setModal] = useState(null);   // { type: "create" } or { type: "receive", order }
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const calls = [api.get("/api/orders")];
      if (!isSupplier) calls.push(api.get("/api/suppliers"), api.get("/api/inventory"));
      const [ord, sup, inv] = await Promise.all(calls);
      setOrders(ord.data);
      if (sup) setSuppliers(sup.data.filter((s) => s.active));
      if (inv) {
        const byId = new Map();
        inv.data.forEach((r) => byId.set(r.medicineId, { id: r.medicineId, name: r.name, price: r.price }));
        setMedicineOptions([...byId.values()]);
      }
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, [isSupplier]);

  useEffect(() => { load(); }, [load]);

  const open = (state, initial) => { setForm(initial); setErrors({}); setFormError(""); setModal(state); };
  const newItem = () => ({ medicineId: medicineOptions[0]?.id ?? "", quantity: "", unitPrice: medicineOptions[0]?.price ?? "" });
  const openCreate = () => open({ type: "create" }, { supplierId: suppliers[0]?.id ?? "", expectedDate: "", notes: "", items: [newItem()] });

  // Only items that still have units to arrive are shown. The quantity starts at "everything that is left".
  const openReceive = (o) => open({ type: "receive", order: o }, {
    items: o.items.filter((i) => i.quantity - i.receivedQuantity > 0).map((i) => ({
      itemId: i.itemId, name: i.medicine, ordered: i.quantity, received: i.receivedQuantity,
      remaining: i.quantity - i.receivedQuantity, quantity: i.quantity - i.receivedQuantity,
      batchNumber: "", manufacturingDate: "", expiryDate: "",
    })),
  });

  // "Create order" on a recommendation opens this page with the medicine, quantity and supplier already chosen
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const id = params.get("medicineId");
    if (!id || loading || loadError || !isPharmacist || !medicineOptions.length || !suppliers.length) return;
    const m = medicineOptions.find((x) => x.id === +id);
    const supplierId = suppliers.find((s) => s.id === +params.get("supplierId"))?.id ?? suppliers[0].id;
    if (m) open({ type: "create" }, { supplierId, expectedDate: "", notes: "Suggested by Smart Recommendations",
      items: [{ medicineId: m.id, quantity: params.get("qty") ?? "", unitPrice: m.price }] });
    setParams({}, { replace: true });
  }, [params, setParams, loading, loadError, isPharmacist, medicineOptions, suppliers]);   // eslint-disable-line react-hooks/exhaustive-deps

  const setItem = (idx, patch) => setForm({ ...form, items: form.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const rowError = (idx, keys) => keys.map((k) => errors[`items[${idx}].${k}`]).find(Boolean);

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

  const saveOrder = () => api.post("/api/orders", {
    supplierId: +form.supplierId,
    expectedDate: form.expectedDate || null,
    notes: form.notes,
    items: form.items.map((i) => ({ medicineId: +i.medicineId, quantity: +i.quantity, unitPrice: +i.unitPrice })),
  });
  const saveReceive = () => api.post(`/api/orders/${modal.order.id}/receive`, {
    items: form.items.map((i) => ({
      itemId: i.itemId, quantity: +i.quantity || 0,
      batchNumber: i.batchNumber || null, manufacturingDate: i.manufacturingDate || null, expiryDate: i.expiryDate || null,
    })),
  });

  const openReject = (o) => open({ type: "reject", order: o }, { reason: "" });
  const saveReject = () => api.post(`/api/orders/${modal.order.id}/reject`, { reason: form.reason });

  const act = async (o, path, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setActionError("");
    try {
      await api.post(`/api/orders/${o.id}/${path}`);
      await load();
    } catch (err) {
      setActionError(errorOf(err).message);
    }
  };

  const actions = (o) => {
    if (isSupplier) {
      if (o.status === "Pending") return <button className={ghost} onClick={() => act(o, "accept")}>Accept</button>;
      if (o.status === "Accepted") return <button className={ghost} onClick={() => act(o, "dispatch")}>Mark dispatched</button>;
      return null;
    }
    if (isAdmin) {
      // The Admin approves or rejects new orders and only monitors everything else
      return o.status === "Awaiting approval" ? (
        <div className="flex gap-2">
          <button className={ghost} onClick={() => act(o, "approve", `Approve ${o.orderNumber}? It will be sent to the supplier.`)}>Approve</button>
          <button className={ghost} onClick={() => openReject(o)}>Reject</button>
        </div>
      ) : null;
    }
    return (
      <div className="flex gap-2">
        {(o.status === "Dispatched" || o.status === "Partially received") && <button className={ghost} onClick={() => openReceive(o)}>Receive stock</button>}
        {(o.status === "Awaiting approval" || o.status === "Pending" || o.status === "Accepted") && (
          <button className={ghost} onClick={() => act(o, "cancel", `Cancel ${o.orderNumber}?`)}>Cancel</button>
        )}
      </div>
    );
  };

  const errorBox = (msg) => msg && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{msg}</p>;

  return (
    <>
      <PageHeader title={titleFor(user.role, "/orders", "Purchase Orders")} sub={isSupplier ? "Orders placed with you" : isAdmin ? "Monitor orders, approve or reject new ones" : "Create, track and receive orders"}>
        {isPharmacist && <button className={btn} onClick={openCreate} disabled={loading || !!loadError}><Plus className="size-4" />New order</button>}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {statuses.map((s) => <Badge key={s} tone="slate">{s}: {orders.filter((o) => o.status === s).length}</Badge>)}
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading orders...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <TableWrap>
            <thead><tr>{["Order", "Supplier", "Medicines", "Total", "Expected", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={td}><p className="font-semibold">{o.orderNumber}</p><p className="text-xs text-slate-500">{o.createdAt?.slice(0, 10)}</p>{o.notes && <p className="mt-1 max-w-48 text-xs italic text-slate-600">“{o.notes}”</p>}</td>
                  <td className={td}>{o.supplier}</td>
                  <td className={td}>
                    {o.items.map((i) => (
                      <p key={i.itemId}>
                        {i.medicine} × {i.quantity}
                        {i.receivedQuantity > 0 && i.receivedQuantity < i.quantity && <span className="text-xs text-amber-700"> · {i.receivedQuantity} received</span>}
                      </p>
                    ))}
                  </td>
                  <td className={td}>₹{Number(o.totalAmount).toFixed(2)}</td>
                  <td className={td}>{o.expectedDate || "—"}</td>
                  <td className={td}>
                    <Tag s={o.status} />
                    {o.reviewedBy && o.status === "Rejected" && <p className="mt-1 max-w-48 text-xs text-red-700">Rejected by {o.reviewedBy}: {o.rejectionReason}</p>}
                    {o.reviewedBy && o.status !== "Rejected" && o.status !== "Awaiting approval" && <p className="mt-1 text-xs text-slate-500">Approved by {o.reviewedBy}</p>}
                  </td>
                  <td className={td}>{actions(o)}</td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No orders yet.</td></tr>}
            </tbody>
          </TableWrap>
        )}
      </div>

      {modal?.type === "create" && (
        <Modal title="New purchase order" onClose={() => setModal(null)}>
          <form onSubmit={submit(saveOrder)} className="space-y-3">
            {settings.requireOrderApproval && <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">The Admin approves your order before it is sent to the supplier.</p>}
            <FormField label="Supplier" error={errors.supplierId}>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={fld}>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Expected delivery date (optional)" error={errors.expectedDate}>
              <input type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} className={fld} />
            </FormField>

            <p className="pt-1 text-sm font-semibold">Medicines</p>
            {form.items.map((it, idx) => (
              <div key={idx} className="rounded-xl bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_90px_100px_auto]">
                  <select aria-label="Medicine" required value={it.medicineId} className={fld}
                    onChange={(e) => setItem(idx, { medicineId: e.target.value, unitPrice: medicineOptions.find((m) => m.id === +e.target.value)?.price ?? "" })}>
                    {medicineOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input aria-label="Quantity" placeholder="Qty" required type="number" min="1" value={it.quantity} onChange={(e) => setItem(idx, { quantity: e.target.value })} className={fld} />
                  <input aria-label="Unit price" placeholder="₹ each" required type="number" min="0.01" step="0.01" value={it.unitPrice} onChange={(e) => setItem(idx, { unitPrice: e.target.value })} className={fld} />
                  {form.items.length > 1 && (
                    <button type="button" aria-label="Remove this medicine" className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}><Trash2 className="size-4" /></button>
                  )}
                </div>
                {rowError(idx, ["medicineId", "quantity", "unitPrice"]) && (
                  <p role="alert" className="mt-1 text-sm font-medium text-red-600">{rowError(idx, ["medicineId", "quantity", "unitPrice"])}</p>
                )}
              </div>
            ))}
            {errors.items && <p role="alert" className="text-sm font-medium text-red-600">{errors.items}</p>}
            <button type="button" className={ghost} onClick={() => setForm({ ...form, items: [...form.items, newItem()] })}><Plus className="size-4" />Add another medicine</button>

            <FormField label="Notes (optional)" error={errors.notes}>
              <input type="text" maxLength={255} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={fld} />
            </FormField>
            {errorBox(formError)}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Placing order..." : "Place order"}</button>
          </form>
        </Modal>
      )}

      {modal?.type === "receive" && (
        <Modal title={`Receive ${modal.order.orderNumber}`} onClose={() => setModal(null)}>
          <form onSubmit={submit(saveReceive)} className="space-y-3">
            <p className="text-sm text-slate-600">
              Enter how many units arrived and the batch details printed on the packs. Set a quantity to 0 for a medicine that did not arrive. The order stays open until everything has arrived.
            </p>
            {form.items.map((it, idx) => {
              const need = Number(it.quantity) > 0;   // batch details are only needed for items that arrived
              const patch = (p) => setItem(idx, p);
              return (
                <div key={it.itemId} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-semibold">{it.name}</p>
                  <p className="mb-2 text-xs text-slate-500">Ordered {it.ordered} · already received {it.received} · still to arrive {it.remaining}</p>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <label className="text-xs text-slate-500">Arrived now
                      <input type="number" min="0" max={it.remaining} required value={it.quantity} onChange={(e) => patch({ quantity: e.target.value })} className={fld} />
                    </label>
                    <label className="text-xs text-slate-500">Batch number
                      <input required={need} disabled={!need} value={it.batchNumber} onChange={(e) => patch({ batchNumber: e.target.value })} className={fld} />
                    </label>
                    <label className="text-xs text-slate-500">Manufactured
                      <input type="date" required={need} disabled={!need} value={it.manufacturingDate} onChange={(e) => patch({ manufacturingDate: e.target.value })} className={fld} />
                    </label>
                    <label className="text-xs text-slate-500">Expires
                      <input type="date" required={need} disabled={!need} value={it.expiryDate} onChange={(e) => patch({ expiryDate: e.target.value })} className={fld} />
                    </label>
                  </div>
                  {rowError(idx, ["quantity", "batchNumber", "manufacturingDate", "expiryDate"]) && (
                    <p role="alert" className="mt-1 text-sm font-medium text-red-600">{rowError(idx, ["quantity", "batchNumber", "manufacturingDate", "expiryDate"])}</p>
                  )}
                </div>
              );
            })}
            {errors.items && <p role="alert" className="text-sm font-medium text-red-600">{errors.items}</p>}
            {errorBox(formError)}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Receiving..." : "Receive and add to stock"}</button>
          </form>
        </Modal>
      )}

      {modal?.type === "reject" && (
        <Modal title={`Reject ${modal.order.orderNumber}`} onClose={() => setModal(null)}>
          <form onSubmit={submit(saveReject)} className="space-y-3">
            <p className="text-sm text-slate-600">The pharmacist will see your reason.</p>
            <FormField label="Reason" error={errors.reason}>
              <input autoFocus required maxLength={255} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={fld} />
            </FormField>
            {errorBox(formError)}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Rejecting..." : "Reject order"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}