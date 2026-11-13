import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, ChevronDown, Mail, Phone, User, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field, { inputCls } from "../components/Field.jsx";
import PasswordField from "../components/Passwordfield.jsx";
import api, { errorOf } from "../api/client.js";

export default function Signup() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", fullName: "", phone: "", role: "Staff",
  });
  const [errors, setErrors] = useState({});   // messages per field, from the backend
  const [error, setError] = useState("");     // general message (server down, etc.)
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/signup", form);
      navigate("/login", { state: { message: "Account created. You can now sign in." } });
    } catch (err) {
      const body = errorOf(err);
      setErrors(body.errors || {});
      if (!body.errors) setError(body.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Register a new pharmacist, staff or supplier account">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="username" label="Username" icon={User} error={errors.username}
          hint="4-30 characters: letters, numbers or underscore">
          <input id="username" name="username" type="text" required autoComplete="username"
            value={form.username} onChange={update} placeholder="Enter username" className={inputCls} />
        </Field>

        <Field id="email" label="Email" icon={Mail} error={errors.email}>
          <input id="email" name="email" type="email" required autoComplete="email"
            value={form.email} onChange={update} placeholder="Enter email" className={inputCls} />
        </Field>

        <PasswordField id="password" name="password" label="Password" value={form.password} onChange={update}
          placeholder="Create password" autoComplete="new-password" error={errors.password}
          hint="8-64 characters with upper and lower case, a number and a special character" />

        <Field id="fullName" label="Full name" icon={UserRound} error={errors.fullName}>
          <input id="fullName" name="fullName" type="text" required autoComplete="name"
            value={form.fullName} onChange={update} placeholder="Enter full name" className={inputCls} />
        </Field>

        <Field id="phone" label="Phone" icon={Phone} error={errors.phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel"
            value={form.phone} onChange={update} placeholder="Enter phone" className={inputCls} />
        </Field>

        <Field
          id="role" label="Account role" icon={BadgeCheck} error={errors.role}
          right={<ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" />}
        >
          <select id="role" name="role" value={form.role} onChange={update} className={`${inputCls} appearance-none`}>
            <option>Staff</option>
            <option>Pharmacist</option>
            <option>Supplier</option>
          </select>
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full rounded-xl bg-teal-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}