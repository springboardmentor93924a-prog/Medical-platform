
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  ChevronDown,
  Lock,
  Mail,
  Phone,
  User,
  UserRound,
} from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field, { inputCls } from "../components/Field.jsx";
import { registerUser } from "../api/auth.js";

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    role: "Staff",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await registerUser(form);

      navigate("/login", {
        state: {
          message: "Account created successfully. Please sign in.",
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register an administrator, pharmacist, staff or supplier account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="username" label="Username" icon={User}>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            value={form.username}
            onChange={update}
            placeholder="Enter username"
            className={inputCls}
          />
        </Field>

        <Field id="email" label="Email" icon={Mail}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update}
            placeholder="Enter email"
            className={inputCls}
          />
        </Field>

        <Field id="password" label="Password" icon={Lock}>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            maxLength={72}
            autoComplete="new-password"
            value={form.password}
            onChange={update}
            placeholder="Create password"
            className={inputCls}
          />
        </Field>

        <Field id="fullName" label="Full name" icon={UserRound}>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            value={form.fullName}
            onChange={update}
            placeholder="Enter full name"
            className={inputCls}
          />
        </Field>

        <Field id="phone" label="Phone" icon={Phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            maxLength={20}
            autoComplete="tel"
            value={form.phone}
            onChange={update}
            placeholder="Enter phone"
            className={inputCls}
          />
        </Field>

        <Field
          id="role"
          label="Account role"
          icon={BadgeCheck}
          right={
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"
            />
          }
        >
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={update}
            className={`${inputCls} appearance-none`}
          >
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Supplier">Supplier</option>
          </select>
        </Field>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-slate-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
