/**
 * Shared API helpers for MediStock.
 *
 * Local development:
 *   http://localhost:8080/api
 *
 * Production:
 *   Set VITE_API_URL in your deployment environment.
 */

const RAW_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

const WAKE_DELAYS_MS = [0, 15000, 30000, 45000, 45000];

/**
 * Read the JWT token and attach the Authorization header.
 * The login page must save the token using the same storage key.
 */
export function authHeaders(extra = {}) {
  const token = sessionStorage.getItem("medistock_token");

  const headers = {
    ...extra,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    // Avoid accidentally sending an old Authorization header.
    delete headers.Authorization;
    delete headers.authorization;
  }

  return headers;
}

/**
 * Retry network failures and temporary server errors during startup.
 * Do not retry 401 or 403 responses.
 */
async function fetchWithWake(url, options = {}) {
  let lastError;

  for (let attempt = 0; attempt < WAKE_DELAYS_MS.length; attempt++) {
    const delay = WAKE_DELAYS_MS[attempt];

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch(url, options);

      const serverIsStarting = [502, 503, 504].includes(response.status);

      if (
        serverIsStarting &&
        attempt < WAKE_DELAYS_MS.length - 1
      ) {
        lastError = new Error(
          `Server is starting (${response.status})`
        );

        // Release the response body before retrying.
        await response.body?.cancel().catch(() => {});

        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  const error = new Error(
    "Unable to reach the server. It may be waking up or unavailable. Please try again."
  );

  error.cause = lastError;

  throw error;
}

/**
 * Make an authenticated API request.
 *
 * Example:
 *   await apiFetch("/admin/medicines");
 *   await apiFetch("/admin/medicines", {
 *     method: "POST",
 *     body: JSON.stringify(medicine),
 *   });
 */
export async function apiFetch(path, options = {}) {
  const {
    headers: customHeaders = {},
    body,
    ...requestOptions
  } = options;

  const headers = {
    ...(body != null && !(body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...customHeaders,
  };

  // Always apply the current token after custom headers.
  const finalHeaders = authHeaders(headers);

  const response = await fetchWithWake(
    `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...requestOptions,
      body,
      headers: finalHeaders,
    }
  );

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();

  let data = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? data.message || data.error || data.detail
        : null;

    const error = new Error(
      message || `Request failed (${response.status})`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

/**
 * Download a file from an authenticated endpoint.
 *
 * Example:
 *   await downloadFile("/reports/stock.csv", "stock.csv");
 */
export async function downloadFile(path, filename) {
  const response = await fetchWithWake(
    `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    let message = `Download failed (${response.status})`;

    try {
      const data = await response.json();

      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      }
    } catch {
      // Keep the default error message.
    }

    const error = new Error(message);
    error.status = response.status;

    throw error;
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Delay cleanup until the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
