import axios from "axios";

// Talks to the Spring Boot backend. Change VITE_API_URL later when you deploy.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

// Attach the saved login token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the saved token has expired, send the user back to the login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith("/api/auth/");
    if (err.response?.status === 401 && !isAuthCall && localStorage.getItem("ms_token")) {
      localStorage.removeItem("ms_token");
      localStorage.removeItem("ms_user");
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

// Turns any failed request into { message, errors } so pages can show it
export const errorOf = (err) =>
  err.response?.data ?? { message: "Cannot reach the server. Is the backend running?" };

export default api;