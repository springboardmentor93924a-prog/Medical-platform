
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Mail,
} from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field, { inputCls } from "../components/Field.jsx";
import { loginUser } from "../api/auth.js";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(form.email, form.password);

      localStorage.setItem("ms_token", response.token);

     login(form.email.trim(), response.role);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.status === 401
            ? "Invalid email or password."
            : "Unable to sign in. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="MediStock Portal"
      subtitle="Sign in to manage medical inventory systems"
    >
      {location.state?.message && (
        <p className="mb-4 text-sm text-green-700" role="status">
          {location.state.message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="email" label="Email" icon={Mail}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update}
            placeholder="Enter your email"
            className={inputCls}
          />
        </Field>

        <Field
          id="password"
          label="Password"
          icon={Lock}
          right={
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {show ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          }
        >
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            value={form.password}
            onChange={update}
            placeholder="Enter your password"
            className={`${inputCls} pr-12`}
          />
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-slate-600">
        Need an account?{" "}
        <Link
          to="/signup"
          className="font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          Create one here
        </Link>
      </p>
    </AuthLayout>
  );
}
