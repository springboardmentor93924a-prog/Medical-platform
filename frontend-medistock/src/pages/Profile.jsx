import { useEffect, useState } from "react";
import api, { errorOf } from "../api/client.js";
import PasswordField from "../components/Passwordfield.jsx";
import { Card, PageHeader, Row, btn, fld } from "../components/ui.jsx";

const ok = "rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800";
const bad = "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700";
const FieldError = ({ children }) => children ? <p role="alert" className="mt-1 text-sm font-medium text-red-600">{children}</p> : null;

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwMessage, setPwMessage] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    api.get("/api/auth/me")
      .then((res) => { setProfile(res.data); setForm({ fullName: res.data.fullName, phone: res.data.phone }); })
      .catch((err) => setLoadError(errorOf(err).message));
  }, []);

  const saveDetails = async (e) => {
    e.preventDefault();
    setErrors({}); setMessage(""); setSaving(true);
    try {
      const res = await api.put("/api/profile", form);
      setProfile(res.data);
      setMessage("Profile updated.");
    } catch (err) {
      const body = errorOf(err);
      setErrors(body.errors || { form: body.message });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErrors({}); setPwMessage("");
    if (pw.newPassword !== pw.confirm) { setPwErrors({ confirm: "Passwords do not match" }); return; }
    setPwSaving(true);
    try {
      await api.post("/api/profile/password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      setPwMessage("Password changed. Use the new password the next time you sign in.");
    } catch (err) {
      const body = errorOf(err);
      setPwErrors(body.errors || { form: body.message });
    } finally {
      setPwSaving(false);
    }
  };

  const header = <PageHeader title="My profile" sub="Your account details and password" />;
  if (loadError) return <>{header}<p role="alert" className="p-6 text-center font-medium text-red-700">{loadError}</p></>;
  if (!profile) return <>{header}<p className="p-6 text-center text-slate-500">Loading profile...</p></>;

  return (
    <>
      {header}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account details">
          <ul className="mb-4">
            <Row left="Username" right={<span className="text-sm font-semibold">@{profile.username}</span>} />
            <Row left="Email" right={<span className="text-sm font-semibold">{profile.email}</span>} />
            <Row left="Role" right={<span className="text-sm font-semibold">{profile.role}</span>} />
          </ul>
          <form onSubmit={saveDetails} className="space-y-3">
            <label className="block text-sm font-medium">Full name
              <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={`${fld} mt-1`} />
              <FieldError>{errors.fullName}</FieldError>
            </label>
            <label className="block text-sm font-medium">Phone
              <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={`${fld} mt-1`} />
              <FieldError>{errors.phone}</FieldError>
            </label>
            {errors.form && <p role="alert" className={bad}>{errors.form}</p>}
            {message && <p role="status" className={ok}>{message}</p>}
            <button disabled={saving} className={`${btn} w-full disabled:opacity-60`}>{saving ? "Saving..." : "Save changes"}</button>
          </form>
        </Card>

        <Card title="Change password">
          <form onSubmit={changePassword} className="space-y-4">
            <PasswordField id="current" label="Current password" value={pw.currentPassword} autoComplete="current-password"
              placeholder="Enter current password" error={pwErrors.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <PasswordField id="new" label="New password" value={pw.newPassword} autoComplete="new-password"
              placeholder="Create new password" error={pwErrors.newPassword}
              hint="8-64 characters with upper and lower case, a number and a special character"
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <PasswordField id="confirm" label="Confirm new password" value={pw.confirm} autoComplete="new-password"
              placeholder="Repeat new password" error={pwErrors.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            {pwErrors.form && <p role="alert" className={bad}>{pwErrors.form}</p>}
            {pwMessage && <p role="status" className={ok}>{pwMessage}</p>}
            <button disabled={pwSaving} className={`${btn} w-full disabled:opacity-60`}>{pwSaving ? "Changing..." : "Change password"}</button>
          </form>
        </Card>
      </div>
    </>
  );
}