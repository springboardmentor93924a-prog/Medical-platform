import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Activity, Bell, ClipboardList, FileBarChart, LayoutDashboard, LogOut, Menu, Pill, Truck, Users } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { expiryStatus, stockStatus } from "../data/mock.js";

export const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Pharmacist", "Staff", "Supplier"] },
  { to: "/inventory", label: "Inventory", icon: Pill, roles: ["Admin", "Pharmacist", "Staff"] },
  { to: "/suppliers", label: "Suppliers", icon: Truck, roles: ["Admin", "Pharmacist"] },
  { to: "/orders", label: "Purchase Orders", icon: ClipboardList, roles: ["Admin", "Pharmacist", "Supplier"] },
  { to: "/alerts", label: "Alerts", icon: Bell, roles: ["Admin", "Pharmacist", "Staff"] },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: ["Admin", "Pharmacist"] },
  { to: "/users", label: "Users", icon: Users, roles: ["Admin"] },
];

export default function DashboardLayout() {
  const { user, logout, medicines } = useApp();
  const [open, setOpen] = useState(false);
  const nav = NAV.filter((n) => n.roles.includes(user.role));
  const alerts = medicines.filter((m) => stockStatus(m) !== "In stock" || expiryStatus(m) !== "Safe").length;
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-teal-600 text-white" : "text-teal-100 hover:bg-teal-800"}`;

  return (
    <div className="min-h-dvh bg-teal-50">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-teal-900 p-4 text-teal-50 transition-transform print:hidden lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white"><Activity className="size-6" aria-hidden="true" /></span>
          <span className="text-xl font-extrabold tracking-tight">MediStock</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={link} onClick={() => setOpen(false)}>
              <Icon className="size-5" aria-hidden="true" />{label}
            </NavLink>
          ))}
        </nav>
        <p className="rounded-xl bg-teal-950/50 p-3 text-xs text-teal-100/80">Signed in as <b className="text-white">{user.role}</b></p>
      </aside>

      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-teal-900/10 bg-white/90 px-4 py-3 backdrop-blur print:hidden sm:px-6">
          <button className="rounded-lg p-2 hover:bg-teal-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-6" /></button>
          <div className="ml-auto flex items-center gap-3">
            {user.role !== "Supplier" && (
              <Link to="/alerts" aria-label={`${alerts} alerts`} className="relative rounded-lg p-2 hover:bg-teal-50">
                <Bell className="size-5" />
                {alerts > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{alerts}</span>}
              </Link>
            )}
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <button onClick={logout} aria-label="Sign out" className="rounded-lg p-2 text-slate-600 hover:bg-teal-50"><LogOut className="size-5" /></button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}