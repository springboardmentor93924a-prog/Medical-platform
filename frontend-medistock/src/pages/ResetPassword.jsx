import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import PasswordField from "../components/Passwordfield.jsx";
import api, { errorOf } from "../api/client.js";

export default function ResetPassword() {
  const token = useSearchParams()[0].get("token");   // from the link: /reset-password?token=...
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError("");
    setError("");
    if (password !== confirm) {
      setFieldError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, newPassword: password });
      navigate("/login", { state: { message: "Password updated. You can now sign in." } });
    } catch (err) {
      const body = errorOf(err);
      if (body.errors?.newPassword) setFieldError(body.errors.newPassword);
      else setError(body.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Choose a new password for your account">
      {!token ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          This reset link is incomplete. Please request a new one.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField id="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Create new password" autoComplete="new-password" error={fieldError}
            hint="8-64 characters with upper and lower case, a number and a special character" />
          <PasswordField id="confirm" label="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password" autoComplete="new-password" />
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-teal-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.99] disabled:opacity-60">
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-slate-600">
        <Link to="/forgot-password" className="font-semibold text-teal-700 underline-offset-4 hover:underline">Request a new link</Link>
        {" · "}
        <Link to="/login" className="font-semibold text-teal-700 underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}