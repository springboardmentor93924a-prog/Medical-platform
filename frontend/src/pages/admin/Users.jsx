import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { apiFetch } from "../../services/api";

const ROLES = ["ADMIN", "PHARMACIST", "STAFF", "SUPPLIER"];
const PAGE_SIZE = 10;

const emptyForm = { fullName: "", email: "", password: "", role: "STAFF", active: true };

export default function Users() {
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search: query.trim(),
        page: String(page),
        size: String(PAGE_SIZE),
      });
      setData(await apiFetch(`/admin/users?${params}`));
    } catch (err) {
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
    });
    setFormError("");
    setFormOpen(true);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const body = {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          active: form.active,
        };
        if (form.password) body.password = form.password;
        await apiFetch(`/admin/users/${editing.userId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setNotice(`Updated ${form.email}`);
      } else {
        await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setNotice(`Created ${form.email}`);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.message || "Unable to save user.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    try {
      await apiFetch(`/admin/users/${user.userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      setNotice(`${user.fullName} ${!user.active ? "activated" : "deactivated"}`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to change status.");
    }
  };

  const removeUser = async (user) => {
    if (!window.confirm(`Delete ${user.fullName} (${user.email})? This cannot be undone.`)) {
      return;
    }
    try {
      await apiFetch(`/admin/users/${user.userId}`, { method: "DELETE" });
      setNotice(`Deleted ${user.email}`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to delete user.");
    }
  };

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 dark:from-teal-500/10 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-4 text-white shadow-lg shadow-teal-600/20">
              <UsersIcon size={28} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                MediStock / Administration
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                User Management
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {data.totalElements} account(s) — add, edit, activate or remove users.
              </p>
            </div>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700"
          >
            <UserPlus size={16} />
            Add user
          </button>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200"
        >
          <CheckCircle2 size={18} /> {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm font-medium text-red-700 dark:text-red-300"
        >
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <Search size={18} className="text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email or role..."
          className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-3 p-10 text-slate-600 dark:text-slate-300">
            <RefreshCw size={22} className="animate-spin" /> Loading users...
          </div>
        ) : data.content.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.content.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {user.fullName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-teal-50 dark:bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 ring-1 ring-inset ring-teal-200 dark:ring-teal-500/30">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                        user.active
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-500/30"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700"
                      }`}
                    >
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        title="Edit"
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        title={user.active ? "Deactivate" : "Activate"}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        {user.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => removeUser(user)}
                        title="Delete"
                        className="rounded-lg border border-red-200 dark:border-red-500/30 bg-white dark:bg-slate-900 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span>
          Page {data.number + 1} of {Math.max(data.totalPages, 1)} — {data.totalElements} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={page + 1 >= data.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create / edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={saveUser}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {editing ? "Edit user" : "Add user"}
            </h2>

            {formError && (
              <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-300">
                {formError}
              </p>
            )}

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Full name</span>
              <input
                required
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 focus:border-teal-500 focus:outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 focus:border-teal-500 focus:outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">
                Password {editing && "(leave blank to keep current)"}
              </span>
              <input
                required={!editing}
                type="password"
                placeholder={editing ? "••••••••" : "Minimum 8 characters"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 focus:border-teal-500 focus:outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Role</span>
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2.5 focus:border-teal-500 focus:outline-none"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                <Plus size={15} />
                {saving ? "Saving..." : editing ? "Save changes" : "Create user"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
