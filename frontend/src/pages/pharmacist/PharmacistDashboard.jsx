
import { useState } from "react";

import AppShell from "../../components/AppShell.jsx";
import { Icon } from "../../components/icons.jsx";

// Existing medicine and inventory pages
import Medicines from "./Medicines.jsx";
import Inventory from "./Inventory.jsx";
import PurchaseOrders from "./PurchaseOrders.jsx";
import ExpiryTracking from "./ExpiryTracking.jsx";
import Reports from "./Reports.jsx";

import PharmacistNotifications from "./PharmacistNotifications.jsx";

// Pharmacist-specific pages
import Categories from "./Categories.jsx";
import Suppliers from "./Suppliers.jsx";
import MyProfile from "./MyProfile.jsx";
import DashboardOverview from "./DashboardOverview.jsx";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "medicines", label: "Medicines", icon: "pill" },
  { id: "categories", label: "Categories", icon: "boxes" },
  { id: "stock", label: "Stock Monitoring", icon: "swap" },
  { id: "expiry", label: "Expiry Tracking", icon: "clock" },
  { id: "purchase-orders", label: "Purchase Orders", icon: "cart" },
  { id: "suppliers", label: "Suppliers", icon: "boxes" },
  { id: "reports", label: "Inventory Reports", icon: "file" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "profile", label: "My Profile", icon: "dashboard" },
];

const pages = {
  medicines: Medicines,
  categories: Categories,
  stock: Inventory,
  expiry: ExpiryTracking,
  "purchase-orders": PurchaseOrders,
  suppliers: Suppliers,
  reports: Reports,
  notifications: PharmacistNotifications,
  profile: MyProfile,
};

const shortcuts = [
  {
    id: "medicines",
    icon: "pill",
    title: "Medicines",
    text: "View and search registered medicines.",
  },
  {
    id: "categories",
    icon: "boxes",
    title: "Categories",
    text: "Browse medicines by category.",
  },
  {
    id: "stock",
    icon: "swap",
    title: "Stock Monitoring",
    text: "Review available quantities and stock status.",
  },
  {
    id: "expiry",
    icon: "clock",
    title: "Expiry Tracking",
    text: "Identify expired and near-expiry medicines.",
  },
  {
    id: "purchase-orders",
    icon: "cart",
    title: "Purchase Orders",
    text: "Create and track medicine purchase orders.",
  },
  {
    id: "suppliers",
    icon: "boxes",
    title: "Suppliers",
    text: "View supplier information and purchase history.",
  },
  {
    id: "reports",
    icon: "file",
    title: "Inventory Reports",
    text: "Review stock, expiry and purchase reports.",
  },
  {
    id: "notifications",
    icon: "bell",
    title: "Notifications",
    text: "Review stock and expiry alerts.",
  },
  {
    id: "profile",
    icon: "dashboard",
    title: "My Profile",
    text: "View and update your permitted profile details.",
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
            Your pharmacy, in one place.
          </h2>

          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Monitor medicine stock, track expiry dates, manage purchase orders,
            and review supplier information.
          </p>
        </div>
      </section>

      <section>
        <DashboardOverview />

        <h2 className="mb-4 mt-8 text-lg font-semibold text-slate-900 dark:text-white">
          Pharmacy workspace
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                <Icon
                  name="arrow"
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                />
              </span>
            </button>
          ))}
        </div>
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
      title={current?.label ?? "Dashboard"}
      subtitle="Pharmacy inventory and operations"
    >
      <div key={active} className="animate-rise">
        {active === "dashboard" ? (
          <PharmacistHome onSelect={setActive} />
        ) : ActivePage ? (
          <ActivePage />
        ) : (
          <p className="text-slate-500">Page not found.</p>
        )}
      </div>
    </AppShell>
  );
}
