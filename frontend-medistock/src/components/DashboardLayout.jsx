import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Activity, Bell, LogOut, Menu, UserRound } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api from "../api/client.js";
import { MENUS } from "../menus.js";
import { useSettings } from "../api/useSettings.js";

export default function DashboardLayout() {
  const { user, logout } = useApp();
  const { pathname } = useLocation();
  const { organisationName } = useSettings();
  // Two letters for the round profile button, e.g. "Asha Raman" -> "AR"
  const initials = (user.fullName || user.username).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const [open, setOpen] = useState(false);
  const nav = MENUS[user.role] ?? [];   // each role has its own sidebar
  // Bell count comes from the backend. It refreshes on every page change and after expired stock is removed.
  const [alerts, setAlerts] = useState(0);
  useEffect(() => {
    if (user.role === "Supplier") return;
    const refresh = () => api.get("/api/alerts").then((r) => setAlerts(r.data.length)).catch(() => {});
    refresh();
    window.addEventListener("alerts-changed", refresh);
    return () => window.removeEventListener("alerts-changed", refresh);
  }, [pathname, user.role]);
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-teal-600 text-white" : "text-teal-100 hover:bg-teal-800"}`;

  return (
    <div className="min-h-dvh bg-teal-50">
      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-teal-900 p-4 text-teal-50 transition-transform print:hidden lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white"><Activity className="size-6" aria-hidden="true" /></span>
          <span className="truncate text-xl font-extrabold tracking-tight" title={organisationName}>{organisationName}</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={link} onClick={() => setOpen(false)}>
              <Icon className="size-5" aria-hidden="true" />{label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/profile" className={link} onClick={() => setOpen(false)}>
          <UserRound className="size-5" aria-hidden="true" />My profile
        </NavLink>
        <p className="mt-3 rounded-xl bg-teal-950/50 p-3 text-xs text-teal-100/80">Signed in as <b className="text-white">{user.role}</b></p>
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
            <Link to="/profile" title="My profile" aria-label="My profile"
              className="flex items-center gap-2.5 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:border-teal-300 hover:bg-teal-50 max-sm:pr-1">
              <span className="grid size-9 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">{initials}</span>
              <span className="text-left leading-tight max-sm:hidden">
                <span className="block text-sm font-semibold">{user.username}</span>
                <span className="block text-xs text-slate-500">{user.role}</span>
              </span>
            </Link>
            <button onClick={logout} aria-label="Sign out" className="rounded-lg p-2 text-slate-600 hover:bg-teal-50"><LogOut className="size-5" /></button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}