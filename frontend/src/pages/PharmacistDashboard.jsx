import { useState } from "react";

import AppShell from "../components/AppShell";
import { Icon } from "../components/icons";
import Medicines from "./admin/Medicines";
import Inventory from "./admin/Inventory";
import PurchaseOrders from "./admin/PurchaseOrders";
import StockMovements from "./admin/StockMovements";
import ExpiryTracking from "./admin/ExpiryTracking";
import Reports from "./admin/Reports";
import Notifications from "./admin/Notifications";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "medicines", label: "Medicines", icon: "pill" },
  { id: "inventory", label: "Inventory", icon: "boxes" },
  { id: "purchase-orders", label: "Purchase Orders", icon: "cart" },
  { id: "stock-movements", label: "Stock Movements", icon: "swap" },
  { id: "expiry", label: "Expiry Tracking", icon: "clock" },
  { id: "reports", label: "Reports", icon: "file" },
  { id: "notifications", label: "Notifications", icon: "bell" },
];

const pages = {
  medicines: Medicines,
  inventory: Inventory,
  "purchase-orders": PurchaseOrders,
  "stock-movements": StockMovements,
  expiry: ExpiryTracking,
  reports: Reports,
  notifications: Notifications,
};

const shortcuts = [
  {
    id: "medicines",
    icon: "pill",
    title: "Medicine catalogue",
    text: "Browse every medicine registered in the system.",
  },
  {
    id: "inventory",
    icon: "boxes",
    title: "Stock on hand",
    text: "Check batches, quantities and storage locations.",
  },
  {
    id: "purchase-orders",
    icon: "cart",
    title: "Purchase orders",
    text: "Raise orders and track supplier deliveries.",
  },
  {
    id: "expiry",
    icon: "clock",
    title: "Expiry watch",
    text: "Spot batches expiring soon before they are wasted.",
  },
  {
    id: "stock-movements",
    icon: "swap",
    title: "Stock movements",
    text: "Review every inward and outward stock entry.",
  },
  {
    id: "reports",
    icon: "file",
    title: "Reports",
    text: "Download CSV reports for audits and reviews.",
  },
];

function PharmacistHome({ onSelect }) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-800 via-ink-900 to-slate-950 p-6 text-white shadow-xl sm:p-10">
        <div className="brand-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
            Pharmacist workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Good to see you. Everything pharmacy, in one place.
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Dispense confidently - review stock levels, follow expiry dates and
            keep purchase orders moving.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold text-slate-900 dark:text-white">
              {item.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {item.text}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
              Open
              <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}

export default function PharmacistDashboard({ onLogout }) {
  const [active, setActive] = useState("dashboard");
  const ActivePage = pages[active];
  const current = menu.find((item) => item.id === active);

  return (
    <AppShell
      role="Pharmacist"
      menu={menu}
      active={active}
      onSelect={setActive}
      onLogout={onLogout}
      title={current.label}
      subtitle="Dispensing, stock and expiry at a glance"
    >
      <div key={active} className="animate-rise">
        {active === "dashboard" ? (
          <PharmacistHome onSelect={setActive} />
        ) : (
          <ActivePage />
        )}
      </div>
    </AppShell>
  );
}
