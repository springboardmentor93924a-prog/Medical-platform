import { useState } from "react";
import { ArrowRight, ClipboardList } from "lucide-react";

import AppShell from "../components/AppShell";
import SupplierOrders from "./SupplierOrders";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "purchase-orders", label: "Purchase Orders", icon: "cart" },
];

function SupplierHome({ onSelect }) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 via-ink-900 to-slate-950 p-6 text-white shadow-xl sm:p-10">
        <div className="brand-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
            Supplier portal
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Keep deliveries on track.
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Review the purchase orders the pharmacy has placed with you and
            coordinate upcoming deliveries.
          </p>
          <button
            type="button"
            onClick={() => onSelect("purchase-orders")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-lg transition hover:bg-blue-50"
          >
            View purchase orders
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <ClipboardList className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">
            Order status
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track pending, approved and delivered orders in one list.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ClipboardList className="h-5 w-5" />
          </span>
          <p className="mt-4 font-semibold text-slate-900 dark:text-white">
            Account records
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your medicines and deliveries are managed by the pharmacy admin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SupplierDashboard({ onLogout }) {
  const [active, setActive] = useState("dashboard");
  const current = menu.find((item) => item.id === active);

  return (
    <AppShell
      role="Supplier"
      menu={menu}
      active={active}
      onSelect={setActive}
      onLogout={onLogout}
      title={current.label}
      subtitle="Orders and deliveries from the pharmacy"
    >
      <div key={active} className="animate-rise">
        {active === "dashboard" && <SupplierHome onSelect={setActive} />}
        {active === "purchase-orders" && <SupplierOrders />}
      </div>
    </AppShell>
  );
}
