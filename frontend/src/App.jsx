
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";

const VALID_ROLES = ["ADMIN", "PHARMACIST", "STAFF", "SUPPLIER"];

export default function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("medistock_token")
  );

  const [role, setRole] = useState(
    () => sessionStorage.getItem("medistock_role")
  );

  const [page, setPage] = useState("login");

  const handleLogin = (data) => {
    sessionStorage.setItem("medistock_token", data.token);
    sessionStorage.setItem("medistock_role", data.role);

    setToken(data.token);
    setRole(data.role);
    setPage("login");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("medistock_token");
    sessionStorage.removeItem("medistock_role");

    localStorage.removeItem("medistock_token");
    localStorage.removeItem("medistock_role");
    localStorage.removeItem("token");

    setToken(null);
    setRole(null);
    setPage("login");
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
      return <SupplierDashboard onLogout={handleLogout} />;

    default:
      return <div>Validating user role...</div>;
  }
}
