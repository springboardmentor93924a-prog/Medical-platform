import { createContext, useContext, useState } from "react";
import { logsSeed, medicinesSeed, ordersSeed, suppliersSeed } from "../data/mock.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ms_user")); } catch { return null; }
  });
  const [medicines, setMedicines] = useState(medicinesSeed);
  const [suppliers, setSuppliers] = useState(suppliersSeed);
  const [orders, setOrders] = useState(ordersSeed);
  const [logs, setLogs] = useState(logsSeed);

  const login = (username, role) => {
    const u = { username, role };
    setUser(u);
    try { localStorage.setItem("ms_user", JSON.stringify(u)); } catch { /* storage unavailable */ }
  };
  const logout = () => {
    setUser(null);
    try { localStorage.removeItem("ms_user"); } catch { /* storage unavailable */ }
  };
  const log = (text) =>
    setLogs((l) => [{ id: Date.now(), text, by: user?.username, time: new Date().toLocaleString() }, ...l]);

  return (
    <Ctx.Provider value={{ user, login, logout, medicines, setMedicines, suppliers, setSuppliers, orders, setOrders, logs, log }}>
      {children}
    </Ctx.Provider>
  );
}