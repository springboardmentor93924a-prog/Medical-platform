
import { useState } from "react";
import Users from "./admin/Users";


export default function AdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");

  const menuItems = [
    "Dashboard",
    "Users",
    "Medicines",
    "Suppliers",
    "Inventory",
    "Purchase Orders",
    "Expiry Tracking",
    "Reports",
    "Notifications",
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

        {activePage === "Dashboard" ? (
          <div>
            <p>Welcome to the MediStock Admin Dashboard!</p>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ background: "white", padding: "20px", borderRadius: "10px" }}>
                <h3>Total Users</h3>
                <p>Manage system users</p>
              </div>

              <div style={{ background: "white", padding: "20px", borderRadius: "10px" }}>
                <h3>Medicines</h3>
                <p>Manage medicines</p>
              </div>

              <div style={{ background: "white", padding: "20px", borderRadius: "10px" }}>
                <h3>Inventory</h3>
                <p>Monitor stock levels</p>
              </div>
            </div>
          </div>
) : activePage === "Users" ? (
  <Users />
) : (
  <p>{activePage} page will be connected to the backend next.</p>
)}
      </main>
    </div>
  );
}
