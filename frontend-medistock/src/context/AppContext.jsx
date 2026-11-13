import { createContext, useContext, useState } from "react";

// Keeps who is signed in. Everything else (medicines, orders, ...) now comes from the backend.
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ms_user")); } catch { return null; }
  });

  // data = response from POST /api/auth/login { token, username, fullName, role }
  const login = (data) => {
    const u = { username: data.username, fullName: data.fullName, role: data.role };
    setUser(u);
    try {
      localStorage.setItem("ms_user", JSON.stringify(u));
      localStorage.setItem("ms_token", data.token);
    } catch { /* storage unavailable */ }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("ms_user");
      localStorage.removeItem("ms_token");
    } catch { /* storage unavailable */ }
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}