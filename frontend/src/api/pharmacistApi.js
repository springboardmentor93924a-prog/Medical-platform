
import axios from "axios";

import { API_BASE } from "../services/api";

const pharmacistApi = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token to every request
pharmacistApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("medistock_token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Medicines
export const getMedicines = () =>
  pharmacistApi.get("/pharmacist/medicines");

// Stock monitoring
export const getStockMonitoring = () =>
  pharmacistApi.get("/pharmacist/stock-monitoring");

// Profile
export const getProfile = () =>
  pharmacistApi.get("/pharmacist/profile");

export const updateProfile = (profile) =>
  pharmacistApi.put("/pharmacist/profile", profile);

// Suppliers
export const getSuppliers = () =>
  pharmacistApi.get("/pharmacist/suppliers");

// Purchase orders
export const getPurchaseOrders = () =>
  pharmacistApi.get("/purchase-orders");

export default pharmacistApi;
