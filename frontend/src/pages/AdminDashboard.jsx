import { useState } from "react";

import AppShell from "../components/AppShell";
import DashboardHome from "./admin/DashboardHome";
import Users from "./admin/Users";
import Medicines from "./admin/Medicines";
import Suppliers from "./admin/Suppliers";
import Inventory from "./admin/Inventory";
import PurchaseOrders from "./admin/PurchaseOrders";
import StockMovements from "./admin/StockMovements";
import ExpiryTracking from "./admin/ExpiryTracking";
import Reports from "./admin/Reports";
import Notifications from "./admin/Notifications";
import AuditLogs from "./admin/AuditLogs";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "users", label: "Users", icon: "users" },
  { id: "medicines", label: "Medicines", icon: "pill" },
  { id: "suppliers", label: "Suppliers", icon: "truck" },
  { id: "inventory", label: "Inventory", icon: "boxes" },
  { id: "purchase-orders", label: "Purchase Orders", icon: "cart" },
  { id: "stock-movements", label: "Stock Movements", icon: "swap" },
  { id: "expiry", label: "Expiry Tracking", icon: "clock" },
  { id: "reports", label: "Reports", icon: "file" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "audit", label: "Audit Logs", icon: "shield" },
];

const pages = {
  dashboard: DashboardHome,
  users: Users,
  medicines: Medicines,
  suppliers: Suppliers,
  inventory: Inventory,
  "purchase-orders": PurchaseOrders,
  "stock-movements": StockMovements,
  expiry: ExpiryTracking,
  reports: Reports,
  notifications: Notifications,
  audit: AuditLogs,
};

export default function AdminDashboard({ onLogout }) {
  const [active, setActive] = useState("dashboard");
  const ActivePage = pages[active];
  const current = menu.find((item) => item.id === active);

  return (
    <AppShell
      role="Admin"
      menu={menu}
      active={active}
      onSelect={setActive}
      onLogout={onLogout}
      title={current.label}
      subtitle="Full control over inventory, orders and people"
    >
      <div key={active} className="animate-rise">
        {ActivePage ? <ActivePage /> : null}
      </div>
    </AppShell>
  );
}
