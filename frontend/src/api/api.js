
const RAW_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

// Attach JWT token to API requests
export function authHeaders(extra = {}) {
  const token = sessionStorage.getItem("medistock_token");

  const headers = {
    ...extra,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    delete headers.Authorization;
    delete headers.authorization;
  }

  return headers;
}

// Common API request function
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = authHeaders(options.headers || {});

  const isFormData = options.body instanceof FormData;

  if (options.body && !isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text || null;
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? data.message || data.error || data.detail
        : data;

    throw new Error(
      message || `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return data;
}

// Download files from backend
export async function downloadFile(path, filename = "download") {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}
