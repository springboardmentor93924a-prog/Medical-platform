
import { apiFetch } from "../services/api";

/**
 * Small axios-compatible wrapper over apiFetch.
 * Keeps the `response.data` / `error.response.data` shape used by the
 * pharmacist pages without pulling in an extra HTTP dependency.
 */
async function request(method, path, body) {
  try {
    const data = await apiFetch(path, {
      method,
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body) }),
    });

    return { data };
  } catch (error) {
    error.response = { data: error.data ?? { message: error.message } };
    throw error;
  }
}

const pharmacistApi = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};

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
