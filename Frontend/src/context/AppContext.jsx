
import { createContext, useContext, useState } from "react";
import {
  logsSeed,
  medicinesSeed,
  ordersSeed,
  suppliersSeed,
} from "../data/mock.js";

const Ctx = createContext(null);

export const useApp = () => useContext(Ctx);

const formatRole = (role) => {
  const normalized = String(role ?? "").replace(/^ROLE_/, "").toUpperCase();

  const roles = {
    ADMIN: "Admin",
    PHARMACIST: "Pharmacist",
    STAFF: "Staff",
    SUPPLIER: "Supplier",
  };

  return roles[normalized] ?? null;
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("ms_user"));
      const token = localStorage.getItem("ms_token");

      if (!savedUser || !token) return null;

      const role = formatRole(savedUser.role);
      if (!role || !savedUser.username) return null;

      return { ...savedUser, role };
    } catch {
      return null;
    }
  });

  const [medicines, setMedicines] = useState(medicinesSeed);
  const [suppliers, setSuppliers] = useState(suppliersSeed);
  const [orders, setOrders] = useState(ordersSeed);
  const [logs, setLogs] = useState(logsSeed);

  const login = (username, role) => {
    const normalizedRole = formatRole(role);

    if (!normalizedRole) {
      throw new Error("The server returned an unsupported account role.");
    }

    const currentUser = {
      username: username.trim(),
      role: normalizedRole,
    };

    setUser(currentUser);

    try {
      localStorage.setItem("ms_user", JSON.stringify(currentUser));
    } catch {
      // Storage may be unavailable.
    }
  };

  const logout = () => {
    setUser(null);

    try {
      localStorage.removeItem("ms_user");
      localStorage.removeItem("ms_token");
    } catch {
      // Storage may be unavailable.
    }
  };

  const log = (text) =>
    setLogs((currentLogs) => [
      {
        id: Date.now(),
        text,
        by: user?.username,
        time: new Date().toLocaleString(),
      },
      ...currentLogs,
    ]);

  return (
    <Ctx.Provider
      value={{
        user,
        login,
        logout,
        medicines,
        setMedicines,
        suppliers,
        setSuppliers,
        orders,
        setOrders,
        logs,
        log,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
