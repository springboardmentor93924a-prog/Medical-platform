
import { useState } from "react";

import AppShell from "../../components/AppShell.jsx";

import DashboardOverview from "./DashboardOverview.jsx";
import ViewMedicines from "./ViewMedicines.jsx";
import SearchMedicines from "./SearchMedicines.jsx";
import StockChecking from "./StockChecking.jsx";
import ReceiveMedicines from "./ReceiveMedicines.jsx";
import ExpiryChecking from "./ExpiryChecking.jsx";
import StaffNotifications from "./StaffNotifications.jsx";
import MyProfile from "./StaffProfile.jsx";

const menu = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "medicines", label: "View Medicines", icon: "pill" },
  { id: "search", label: "Search Medicines", icon: "search" },
  { id: "stock-checking", label: "Stock Checking", icon: "swap" },
  { id: "receive-medicines", label: "Receive Medicines", icon: "cart" },
  { id: "expiry-checking", label: "Expiry Checking", icon: "clock" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "profile", label: "My Profile", icon: "dashboard" },
];

const pages = {
  medicines: ViewMedicines,
  search: SearchMedicines,
  "stock-checking": StockChecking,
  "receive-medicines": ReceiveMedicines,
  "expiry-checking": ExpiryChecking,
  notifications: StaffNotifications,
  profile: MyProfile,
};

export default function StaffDashboard({ onLogout }) {
  const [active, setActive] = useState("dashboard");

  const ActivePage = pages[active];
  const current = menu.find((item) => item.id === active);

  return (
    <AppShell
      role="Staff"
      menu={menu}
      active={active}
      onSelect={setActive}
      onLogout={onLogout}
      title={current?.label ?? "Dashboard"}
      subtitle="Staff inventory operations"
    >
      <div key={active} className="animate-rise">
        {active === "dashboard" ? (
          <DashboardOverview />
        ) : ActivePage ? (
          <ActivePage />
        ) : (
          <p className="text-slate-500">Page not found.</p>
        )}
      </div>
    </AppShell>
  );
}
