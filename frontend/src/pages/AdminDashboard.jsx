
import { useState } from "react";
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

const pages = {
  Dashboard: DashboardHome,
  Users,
  Medicines,
  Suppliers,
  Inventory,
  "Purchase Orders": PurchaseOrders,
  "Stock Movements": StockMovements,
  "Expiry Tracking": ExpiryTracking,
  Reports,
  Notifications,
  "Audit Logs": AuditLogs,
};

export default function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");

  const ActivePage = pages[activePage];

  const menuItems = [
    "Dashboard",
    "Users",
    "Medicines",
    "Suppliers",
    "Inventory",
    "Purchase Orders",
    "Stock Movements",
    "Expiry Tracking",
    "Reports",
    "Notifications",
    "Audit Logs",
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          background: "#123b35",
          color: "white",
          padding: "20px",
        }}
      >
        <h2>MediStock</h2>
        <p>Admin Panel</p>

        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => setActivePage(item)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginBottom: "8px",
              textAlign: "left",
              background:
                activePage === item ? "#28765f" : "transparent",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {item}
          </button>
        ))}
        <button
  onClick={onLogout}
  style={{
    display: "block",
    width: "100%",
    padding: "12px",
    marginTop: "20px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>
  Logout
</button>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "30px", background: "#f4f7f6" }}>
        <h1>{activePage}</h1>

        {ActivePage ? (
          <ActivePage />
        ) : (
          <p>{activePage} page will be connected to the backend next.</p>
        )}
      </main>
    </div>
  );
}
