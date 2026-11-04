import { useState } from "react";

import AppShell from "../../components/AppShell.jsx";
import DashboardHome from "./DashboardHome.jsx";
import Users from "./Users.jsx";
import Medicines from "./Medicines.jsx";
import Categories from "./Categories.jsx";
import Suppliers from "./Suppliers.jsx";
import StockManagement from "./StockManagement.jsx";
import PurchaseOrders from "./PurchaseOrders.jsx";
import ExpiryTracking from "./ExpiryTracking.jsx";
import Reports from "./Reports.jsx";
import Notifications from "./Notifications.jsx";
import SystemMonitoring from "./SystemMonitoring.jsx";
import Settings from "./Settings.jsx";


const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "medicines", label: "Medicine Management", icon: "pill" },
  { id: "categories", label: "Categories", icon: "boxes" },
  { id: "suppliers", label: "Supplier Management", icon: "truck" },
  { id: "purchase-orders", label: "Purchase Orders", icon: "cart" },
  { id: "stock-management", label: "Stock Management", icon: "swap" },
  { id: "expiry", label: "Expiry Tracking", icon: "clock" },
  { id: "reports", label: "Reports & Analytics", icon: "file" },
  { id: "users", label: "User Management", icon: "users" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "systemMonitoring", label: "System Monitoring", icon: "activity" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const pages = {
  dashboard: DashboardHome,
  users: Users,
  medicines: Medicines,
  categories: Categories,
  suppliers: Suppliers,
  "stock-management": StockManagement,
  "purchase-orders": PurchaseOrders,
  expiry: ExpiryTracking,
  reports: Reports,
  notifications: Notifications,
  systemMonitoring: SystemMonitoring,
  settings: Settings,
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
      title={current?.label || "Dashboard"}
      subtitle="Full control over inventory, orders and people"
    >
      <div key={active} className="animate-rise">
        {ActivePage ? <ActivePage /> : <p>Page not found.</p>}
      </div>
    </AppShell>
  );
}