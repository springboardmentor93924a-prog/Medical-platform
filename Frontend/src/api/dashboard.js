import api from "./auth.js";

export async function fetchAdminDashboard() {
  const token = localStorage.getItem("ms_token");
  const { data } = await api.get("/admin/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}