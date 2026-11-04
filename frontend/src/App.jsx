import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import PharmacistDashboard from "./pages/pharmacist/PharmacistDashboard.jsx";
import StaffDashboard from "./pages/staff/StaffDashboard.jsx";
import SupplierDashboard from "./pages/suppliers/SupplierDashboard.jsx";
import SupplierNotifications from "./pages/suppliers/SupplierNotifications.jsx";

const VALID_ROLES = ["ADMIN", "PHARMACIST", "STAFF", "SUPPLIER"];

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("medistock_token")
  );

  const [role, setRole] = useState(
    () => sessionStorage.getItem("medistock_role")?.toUpperCase() || null
  );

  const [page, setPage] = useState("login");
  const [supplierPage, setSupplierPage] = useState("dashboard");

  // Login handler
  const handleLogin = (data) => {
    const normalizedRole = data.role?.toUpperCase();

    if (!data.token || !VALID_ROLES.includes(normalizedRole)) {
      alert("Invalid login credentials or user role.");
      return;
    }

    sessionStorage.setItem("medistock_token", data.token);
    sessionStorage.setItem("medistock_role", normalizedRole);

    setToken(data.token);
    setRole(normalizedRole);
    setPage("login");
    setSupplierPage("dashboard");
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem("medistock_token");
    sessionStorage.removeItem("medistock_role");

    localStorage.removeItem("medistock_token");
    localStorage.removeItem("medistock_role");
    localStorage.removeItem("token");

    setToken(null);
    setRole(null);
    setPage("login");
    setSupplierPage("dashboard");
  };

  // Validate role
  useEffect(() => {
    if (token && !VALID_ROLES.includes(role)) {
      handleLogout();
    }
  }, [token, role]);

  // Login and Signup
  if (!token) {
    if (page === "signup") {
      return (
        <Signup
          onLogin={handleLogin}
          onBackToLogin={() => setPage("login")}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onSignup={() => setPage("signup")}
      />
    );
  }

  // Role-based dashboards
  switch (role) {
    case "ADMIN":
      return <AdminDashboard onLogout={handleLogout} />;

    case "PHARMACIST":
      return <PharmacistDashboard onLogout={handleLogout} />;

    case "STAFF":
      return <StaffDashboard onLogout={handleLogout} />;

    case "SUPPLIER":
      if (supplierPage === "notifications") {
        return (
          <SupplierNotifications
            onBack={() => setSupplierPage("dashboard")}
            onLogout={handleLogout}
          />
        );
      }

      return (
        <SupplierDashboard
          onLogout={handleLogout}
          onOpenNotifications={() => setSupplierPage("notifications")}
        />
      );

    default:
      return <div>Validating user role...</div>;
  }
}