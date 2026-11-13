import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import { NAV } from "./menus.js";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Categories from "./pages/Categories.jsx";
import Expiry from "./pages/Expiry.jsx";
import StockMonitoring from "./pages/StockMonitoring.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Orders from "./pages/Orders.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import Profile from "./pages/Profile.jsx";
import SystemMonitoring from "./pages/SystemMonitoring.jsx";
import SettingsPage from "./pages/Settings.jsx";
import AuditLogs from "./pages/AuditLogs.jsx";
import Wastage from "./pages/Wastage.jsx";
import Returns from "./pages/Returns.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import ViewMedicines from "./pages/ViewMedicines.jsx";
import SearchMedicines from "./pages/SearchMedicines.jsx";
import StockChecking from "./pages/StockChecking.jsx";
import SupplierNotifications from "./pages/SupplierNotifications.jsx";
import SupplierReports from "./pages/SupplierReports.jsx";

const PAGES = {
  "/dashboard": Dashboard, "/inventory": Inventory, "/categories": Categories, "/expiry": Expiry, "/stock": StockMonitoring, "/monitoring": SystemMonitoring, "/settings": SettingsPage, "/audit": AuditLogs, "/wastage": Wastage, "/returns": Returns, "/recommendations": Recommendations, "/view-medicines": ViewMedicines, "/search-medicines": SearchMedicines, "/stock-checking": StockChecking, "/supplier-notifications": SupplierNotifications, "/supplier-reports": SupplierReports, "/suppliers": Suppliers,
  "/orders": Orders, "/alerts": Alerts, "/reports": Reports, "/users": Users,
};

// Redirects to login if signed out, and to the dashboard if the role isn't allowed here
function Guard({ roles, children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Guard><DashboardLayout /></Guard>}>
        {NAV.map(({ to, roles }) => {
          const Page = PAGES[to];
          return <Route key={to} path={to} element={<Guard roles={roles}><Page /></Guard>} />;
        })}
        <Route path="/profile" element={<Guard><Profile /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
