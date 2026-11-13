import { useEffect, useState } from "react";
import api, { errorOf } from "../api/client.js";
import { Card, PageHeader, btn, fld } from "../components/ui.jsx";

const Toggle = ({ id, checked, onChange, label, help }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
    <input id={id} type="checkbox" checked={checked} onChange={onChange} className="mt-1 size-4 accent-teal-700" />
    <span>
      <span className="block text-sm font-medium">{label}</span>
      <span className="block text-sm text-slate-500">{help}</span>
    </span>
  </label>
);

export default function Settings() {
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/settings").then((res) => setForm(res.data)).catch((err) => setLoadError(errorOf(err).message));
  }, []);

  const header = <PageHeader title="Settings" sub="Application settings that apply to everyone" />;
  if (loadError) return <>{header}<p role="alert" className="p-6 text-center font-medium text-red-700">{loadError}</p></>;
  if (!form) return <>{header}<p className="p-6 text-center text-slate-500">Loading settings...</p></>;

  const set = (k, v) => { setForm({ ...form, [k]: v }); setErrors({ ...errors, [k]: undefined }); setMessage(""); };

  const save = async (e) => {
    e.preventDefault();
    setErrors({}); setFormError(""); setMessage(""); setSaving(true);
    try {
      const res = await api.put("/api/settings", { ...form, defaultReorderLevel: +form.defaultReorderLevel });
      setForm(res.data);
      setMessage("Settings saved.");
      window.dispatchEvent(new Event("settings-changed"));   // the sidebar and forms pick up the new values
    } catch (err) {
      const body = errorOf(err);
      setErrors(body.errors || {});
      if (!body.errors) setFormError(body.message);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setMessage(""); setFormError("");
    try { const res = await api.post("/api/admin/notifications/test"); setMessage(res.data.message); } catch (err) { setFormError(errorOf(err).message); }
  };

  return (
    <>
      {header}
      <form onSubmit={save} className="grid gap-4 lg:grid-cols-2">
        <Card title="Organisation">
          <label className="block text-sm font-medium">Organisation name
            <input required minLength={2} maxLength={60} value={form.organisationName} onChange={(e) => set("organisationName", e.target.value)} className={`${fld} mt-1`} />
            {errors.organisationName && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.organisationName}</p>}
            <span className="mt-1 block text-xs font-normal text-slate-500">Shown in the sidebar and at the top of PDF reports.</span>
          </label>
        </Card>

        <Card title="Inventory">
          <label className="block text-sm font-medium">Default reorder level for new medicines
            <input required type="number" min="0" max="100000" value={form.defaultReorderLevel} onChange={(e) => set("defaultReorderLevel", e.target.value)} className={`${fld} mt-1`} />
            {errors.defaultReorderLevel && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors.defaultReorderLevel}</p>}
            <span className="mt-1 block text-xs font-normal text-slate-500">Filled in automatically when a pharmacist adds a medicine. It can still be changed for each medicine.</span>
          </label>
        </Card>

        <Card title="Purchase orders">
          <Toggle id="approval" checked={form.requireOrderApproval} onChange={(e) => set("requireOrderApproval", e.target.checked)}
            label="Orders need Admin approval"
            help="When on, a new order waits for the Admin before the supplier sees it. When off, it goes straight to the supplier. Orders already waiting stay as they are." />
        </Card>

        <Card title="Notifications">
          <Toggle id="digest" checked={form.dailyAlertEmail} onChange={(e) => set("dailyAlertEmail", e.target.checked)}
            label="Send the daily alert email"
            help="Every day at 08:00, Admins and Pharmacists get one email with low-stock, expiry and purchase alerts. Real email must also be set up on the server." />
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            <Toggle id="emailEvents" checked={form.emailNotifications} onChange={(e) => set("emailNotifications", e.target.checked)}
              label="Email people about order events"
              help="Order placed, approved, rejected, accepted and dispatched. Each message goes to the people it concerns." />
            <Toggle id="smsEvents" checked={form.smsNotifications} onChange={(e) => set("smsNotifications", e.target.checked)}
              label="Also send text messages (SMS)"
              help="Uses the phone number on each account. Needs a Twilio account on the server. Without one, messages are only written to the server log." />
            <button type="button" onClick={sendTest} className="text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">Send me a test notification</button>
          </div>
        </Card>

        <div className="lg:col-span-2">
          {formError && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{formError}</p>}
          {message && <p role="status" className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}
          <button disabled={saving} className={`${btn} disabled:opacity-60`}>{saving ? "Saving..." : "Save settings"}</button>
        </div>
      </form>
    </>
  );
}