import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function registerUser(form) {
  return api.post("/auth/register", {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    password: form.password,
    phone: form.phone.trim(),
    role: form.role.toUpperCase(),
  });
}

export async function loginUser(email, password) {
  const response = await api.post("/auth/login", {
    email: email.trim(),
    password,
  });

  return response.data;
}

export default api;