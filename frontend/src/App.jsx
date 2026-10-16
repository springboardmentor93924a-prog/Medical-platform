
import { useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import SupplierDashboard from "./pages/SupplierDashboard";

export default function App() {
  const [token, setToken] = useState(
    sessionStorage.getItem("medistock_token")
  );

  const [role, setRole] = useState(
    sessionStorage.getItem("medistock_role")
  );

  const [page, setPage] = useState("login");

  const handleLogin = (data) => {
    setToken(data.token);
    setRole(data.role);
    setPage("login");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("medistock_token");
    sessionStorage.removeItem("medistock_role");

    setToken(null);
    setRole(null);
    setPage("login");
  };

  // Show login page
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

  // Show the dashboard according to role
  if (token) {
  if (role === "ADMIN") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (role === "PHARMACIST") {
    return <PharmacistDashboard onLogout={handleLogout} />;
  }

  if (role === "STAFF") {
    return <StaffDashboard onLogout={handleLogout} />;
  }

  if (role === "SUPPLIER") {
    return <SupplierDashboard onLogout={handleLogout} />;
  }
}
  // Invalid or missing role
  handleLogout();
  return null;
}
