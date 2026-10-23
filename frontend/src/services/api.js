/**
 * Shared API helpers. The base URL comes from VITE_API_URL at build time
 * (set it on Render, e.g. VITE_API_URL=https://medistock-api.onrender.com/api)
 * and falls back to the local backend during development.
 */
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

export function authHeaders(extra = {}) {
  const token = sessionStorage.getItem("medistock_token");
  const headers = { ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** JSON request that throws an Error with the backend's `message` on failure. */
export async function apiFetch(path, options = {}) {
  const headers = authHeaders(
    options.body ? { "Content-Type": "application/json" } : {}
  );

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data && data.message
        ? data.message
        : `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

/** Downloads an authenticated endpoint (e.g. /reports/stock.csv) as a file. */
export async function downloadFile(path, filename) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });

  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.message) message = body.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
