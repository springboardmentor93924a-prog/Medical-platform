import { useCallback, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, Empty, Modal, PageHeader, Row, TableWrap, btn, fld, td, th } from "../components/ui.jsx";

const ROLES = ["Admin", "Pharmacist", "Staff", "Supplier"];

export default function Users() {
  const { user: me } = useApp();
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(null);   // the user being edited
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, s, h] = await Promise.all([
        api.get("/api/users"), api.get("/api/suppliers"), api.get("/api/inventory/history", { params: { limit: 8 } }),
      ]);
      setUsers(u.data);
      setSuppliers(s.data);
      setHistory(h.data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (u) => {
    setForm({ role: u.role, active: u.active, supplierId: u.supplierId ?? suppliers[0]?.id ?? "" });
    setErrors({}); setFormError(""); setEditing(u);
  };

  const save = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setSaving(true);
    try {
      await api.put(`/api/users/${editing.id}`, {
        role: form.role, active: form.active, supplierId: form.role === "Supplier" ? +form.supplierId : null,
      });
      setEditing(null);
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
      <PageHeader title="User Management" sub="Role management, account status and recent activity" />

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading users...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <TableWrap>
            <thead><tr>{["User", "Email", "Role", "Supplier", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.username.toLowerCase() === me.username.toLowerCase();
                return (
                  <tr key={u.id}>
                    <td className={td}><p className="font-semibold">{u.fullName} {isMe && <Badge tone="blue">You</Badge>}</p><p className="text-xs text-slate-500">@{u.username}</p></td>
                    <td className={td}>{u.email}</td>
                    <td className={td}>{u.role}</td>
                    <td className={td}>{u.supplierName || "—"}</td>
                    <td className={td}><Badge tone={u.active ? "green" : "slate"}>{u.active ? "Active" : "Inactive"}</Badge></td>
                    <td className={td}>
                      <button aria-label={`Edit ${u.username}`} title={isMe ? "You cannot change your own account" : "Edit role and status"}
                        disabled={isMe} onClick={() => openEdit(u)}
                        className="rounded-lg p-2 text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-30"><Pencil className="size-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </div>

      <Card title="Recent stock activity" className="mt-4">
        <ul>
          {history.length
            ? history.map((h) => (
                <Row key={h.id} left={`${h.medicine} (batch ${h.batchNumber}): ${h.changeQuantity > 0 ? "+" : ""}${h.changeQuantity} units`}
                  sub={`${h.performedBy} · ${h.type.toLowerCase().replace("_", " ")} · ${new Date(h.createdAt).toLocaleString()}`} />
              ))
            : <Empty text="No activity yet." />}
        </ul>
      </Card>

      {editing && (
        <Modal title={`Edit @${editing.username}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-3">
            <label className="block text-sm font-medium">Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${fld} mt-1`}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
              {errors.role && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.role}</p>}
            </label>
            {form.role === "Supplier" && (
              <label className="block text-sm font-medium">Supplier company
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className={`${fld} mt-1`}>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplierId && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.supplierId}</p>}
              </label>
            )}
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-4 accent-teal-700" />
              Account is active (can sign in)
            </label>
            {formError && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Save changes"}</button>
          </form>
        </Modal>
      )}
    </>
  );
}