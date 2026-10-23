import { useState } from "react";

import AuthLayout from "../components/AuthLayout";
import { Icon } from "../components/icons";
import { apiFetch } from "../services/api";

const DEMO_PASSWORD = "Password@123";

const DEMO_ACCOUNTS = {
  ADMIN: "admin@medistock.local",
  PHARMACIST: "pharmacist@medistock.local",
  STAFF: "staff@medistock.local",
  SUPPLIER: "supplier@medistock.local",
};

const ROLES = [
  { id: "ADMIN", label: "Admin", blurb: "Full control" },
  { id: "PHARMACIST", label: "Pharmacist", blurb: "Stock & orders" },
  { id: "STAFF", label: "Staff", blurb: "Read-only" },
  { id: "SUPPLIER", label: "Supplier", blurb: "Deliveries" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800 dark:focus:ring-blue-500/20";

const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400";

export default function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submitLogin = async (emailValue, passwordValue, roleValue) => {
    setError("");

    if (!roleValue) {
      setError("Please select your role.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailValue,
          password: passwordValue,
          role: roleValue,
        }),
      });

      if (data.role !== roleValue) {
        throw new Error("Your selected role does not match your account.");
      }

      sessionStorage.setItem("medistock_token", data.token);
      sessionStorage.setItem("medistock_role", data.role);

      onLogin(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    submitLogin(email, password, role);
  };

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    setRole(nextRole);

    if (DEMO_ACCOUNTS[nextRole]) {
      setEmail(DEMO_ACCOUNTS[nextRole]);
      setPassword(DEMO_PASSWORD);
    }
  };

  const quickLogin = (roleValue) => {
    setRole(roleValue);
    setEmail(DEMO_ACCOUNTS[roleValue]);
    setPassword(DEMO_PASSWORD);
    submitLogin(DEMO_ACCOUNTS[roleValue], DEMO_PASSWORD, roleValue);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage medicines, stock and orders."
      footer={
        <>
          New here?{" "}
          <button
            type="button"
            onClick={onSignup}
            className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Create an account
          </button>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <span className="mt-0.5">!</span>
            <p>{error}</p>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick demo login
            </p>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              one click
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((item) => {
              const isActive = role === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => quickLogin(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                    isActive
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-500/10 dark:ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-500/50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {item.label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {item.blurb}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            or sign in manually
          </span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@medistock.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${inputClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="role" className={labelClass}>
            Login as
          </label>
          <select
            id="role"
            value={role}
            onChange={handleRoleChange}
            required
            className={inputClass}
          >
            <option value="">Select your role</option>
            <option value="ADMIN">Admin</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="STAFF">Staff</option>
            <option value="SUPPLIER">Supplier</option>
          </select>
          <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            Picking a role fills in that demo account automatically.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-700/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Signing in...
            </>
          ) : (
            <>
              Sign in securely
              <Icon name="arrow" className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
