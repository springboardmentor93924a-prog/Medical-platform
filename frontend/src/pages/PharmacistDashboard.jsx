
import { useState } from "react";
import PharmacistMedicines from "./PharmacistMedicines";
export default function PharmacistDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "medicines", label: "View Medicines", icon: "💊" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "expiry", label: "Expiry Tracking", icon: "📅" },
    { id: "suppliers", label: "Suppliers", icon: "🚚" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
  ];

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>💊 MediStock</h2>
        <p style={styles.role}>PHARMACIST PORTAL</p>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            style={{
              ...styles.menuItem,
              ...(activePage === item.id ? styles.activeMenu : {}),
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        <button onClick={onLogout} style={styles.logout}>
          ↪ Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>
              {menuItems.find((item) => item.id === activePage)?.label}
            </h1>
            <p style={styles.subtitle}>
              MediStock Medical Inventory Management
            </p>
          </div>
          <span style={styles.badge}>PHARMACIST</span>
        </header>

        {activePage === "medicines" && (
  <section style={styles.content}>
    <PharmacistMedicines />
  </section>
)}

{activePage !== "dashboard" && activePage !== "medicines" && (
  <section style={styles.content}>
    <h2>{menuItems.find((item) => item.id === activePage)?.label}</h2>
    <p>
      This section is ready for the next development step.
    </p>
  </section>
)}
        {activePage !== "dashboard" && (
          <section style={styles.content}>
            <h2>{menuItems.find((item) => item.id === activePage)?.label}</h2>
            <p>
              This section is ready for the next development step. We will
              connect it to the backend API before displaying real data.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f3f6fb",
    fontFamily: "Arial, sans-serif",
    color: "#1e293b",
  },
  sidebar: {
    width: "245px",
    flexShrink: 0,
    background: "#123b63",
    color: "white",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  logo: { margin: "0 0 4px", fontSize: "23px" },
  role: {
    fontSize: "11px",
    letterSpacing: "1.5px",
    color: "#b9d9f7",
    marginBottom: "24px",
  },
  menuItem: {
    textAlign: "left",
    padding: "13px 12px",
    border: "none",
    borderRadius: "8px",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  activeMenu: { background: "#2563eb" },
  logout: {
    marginTop: "auto",
    padding: "13px",
    border: "1px solid #8baac8",
    borderRadius: "8px",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  main: { flex: 1, minWidth: 0, padding: "32px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "32px",
  },
  heading: { margin: 0, fontSize: "28px" },
  subtitle: { color: "#64748b", marginTop: "8px" },
  badge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "20px",
    padding: "8px 14px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "20px",
    marginTop: "24px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
  },
  actionButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 14px",
    borderRadius: "7px",
    cursor: "pointer",
  },
  content: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
  },
};
