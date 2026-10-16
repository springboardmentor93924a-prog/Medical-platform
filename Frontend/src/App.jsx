import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import DashboardLayout, { NAV } from "./components/DashboardLayout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Orders from "./pages/Orders.jsx";
import Alerts from "./pages/Alerts.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";

const PAGES = {
  "/dashboard": Dashboard, "/inventory": Inventory, "/suppliers": Suppliers,
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
      <Route element={<Guard><DashboardLayout /></Guard>}>
        {NAV.map(({ to, roles }) => {
          const Page = PAGES[to];
          return <Route key={to} path={to} element={<Guard roles={roles}><Page /></Guard>} />;
        })}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}