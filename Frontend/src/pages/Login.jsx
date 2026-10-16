import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { ChevronDown, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field, { inputCls } from "../components/Field.jsx";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "", role: "Staff" });
  const [show, setShow] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call the Spring Boot login API here (Axios) once the backend is ready
    login(form.username, form.role);
    navigate("/dashboard");
  };

  return (
    <AuthLayout title="MediStock Portal" subtitle="Sign in to manage medical inventory systems">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="username" label="Username" icon={User}>
          <input
            id="username" name="username" type="text" required autoComplete="username"
            value={form.username} onChange={update}
            placeholder="Enter your username" className={inputCls}
          />
        </Field>

        <Field
          id="password" label="Password" icon={Lock}
          right={
            <button
              type="button" onClick={() => setShow(!show)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
        >
          <input
            id="password" name="password" type={show ? "text" : "password"} required
            autoComplete="current-password" value={form.password} onChange={update}
            placeholder="Enter your password" className={`${inputCls} pr-12`}
          />
        </Field>

        <Field
          id="role" label="Select role" icon={ShieldCheck}
          right={<ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" />}
        >
          <select id="role" name="role" value={form.role} onChange={update} className={`${inputCls} appearance-none`}>
            <option>Staff</option>
            <option>Pharmacist</option>
            <option>Admin</option>
          </select>
        </Field>

        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.99]"
        >
          Sign in
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-slate-600">
        Need an account?{" "}
        <Link to="/signup" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
          Create one here
        </Link>
      </p>
    </AuthLayout>
  );
}