import { useState } from "react";
import { Bell, Boxes, Search } from "lucide-react";

import AppShell from "../components/AppShell";
import StaffInventory from "./StaffInventory";
import Notifications from "./admin/Notifications";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "inventory", label: "Inventory", icon: "boxes" },
  { id: "notifications", label: "Notifications", icon: "bell" },
];

function StaffHome({ onSelect }) {
  const cards = [
    {
      id: "inventory",
      icon: Boxes,
      title: "Browse inventory",
      text: "Check batches, stock levels and expiry dates across the pharmacy.",
      action: "View inventory",
    },
    {
      id: "notifications",
      icon: Bell,
      title: "Stock alerts",
      text: "See low-stock, expiry and order notifications raised by the system.",
      action: "View notifications",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 via-ink-900 to-slate-950 p-6 text-white shadow-xl sm:p-10">
        <div className="brand-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
            Staff workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back. Here is what you can do today.
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Your account gives you read-only access to stock information and
            pharmacy alerts.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
              <card.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              {card.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {card.text}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              {card.action}
              <Search className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StaffDashboard({ onLogout }) {
  const [active, setActive] = useState("dashboard");
  const current = menu.find((item) => item.id === active);

  return (
    <AppShell
      role="Staff"
      menu={menu}
      active={active}
      onSelect={setActive}
      onLogout={onLogout}
      title={current.label}
      subtitle="Read-only access to stock and alerts"
    >
      <div key={active} className="animate-rise">
        {active === "dashboard" && <StaffHome onSelect={setActive} />}
        {active === "inventory" && <StaffInventory />}
        {active === "notifications" && <Notifications />}
      </div>
    </AppShell>
  );
}
