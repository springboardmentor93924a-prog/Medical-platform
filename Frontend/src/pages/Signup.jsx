import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, ChevronDown, Lock, Mail, Phone, User, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Field, { inputCls } from "../components/Field.jsx";

export default function Signup() {
  const [form, setForm] = useState({
    username: "", email: "", password: "", fullName: "", phone: "", role: "Staff",
  });

  const navigate = useNavigate();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call the Spring Boot register API here (Axios) once the backend is ready
    navigate("/login");
  };

  return (
    <AuthLayout title="Create Account" subtitle="Register a new pharmacist, staff or supplier account">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="username" label="Username" icon={User}>
          <input id="username" name="username" type="text" required autoComplete="username"
            value={form.username} onChange={update} placeholder="Enter username" className={inputCls} />
        </Field>

        <Field id="email" label="Email" icon={Mail}>
          <input id="email" name="email" type="email" required autoComplete="email"
            value={form.email} onChange={update} placeholder="Enter email" className={inputCls} />
        </Field>

        <Field id="password" label="Password" icon={Lock}>
          <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password"
            value={form.password} onChange={update} placeholder="Create password" className={inputCls} />
        </Field>

        <Field id="fullName" label="Full name" icon={UserRound}>
          <input id="fullName" name="fullName" type="text" required autoComplete="name"
            value={form.fullName} onChange={update} placeholder="Enter full name" className={inputCls} />
        </Field>

        <Field id="phone" label="Phone" icon={Phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel"
            value={form.phone} onChange={update} placeholder="Enter phone" className={inputCls} />
        </Field>

        <Field
          id="role" label="Account role" icon={BadgeCheck}
          right={<ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" />}
        >
          <select id="role" name="role" value={form.role} onChange={update} className={`${inputCls} appearance-none`}>
            <option>Staff</option>
            <option>Pharmacist</option>
            <option>Supplier</option>
          </select>
        </Field>

        <button
          type="submit"
          className="w-full rounded-xl bg-teal-700 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:scale-[0.99]"
        >
          Create account
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