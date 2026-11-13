import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field, { inputCls } from "../components/Field.jsx";
import api, { errorOf } from "../api/client.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      setSent(data.message);   // the backend gives the same answer whether or not the email exists
    } catch (err) {
      const body = errorOf(err);
      setError(body.errors?.email || body.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we will send you a reset link">
      {sent ? (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {sent} The link works once and expires in 15 minutes.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field id="email" label="Email" icon={Mail}>
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="Enter your registered email" className={inputCls} />
          </Field>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-teal-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.99] disabled:opacity-60">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-slate-600">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-teal-700 underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}