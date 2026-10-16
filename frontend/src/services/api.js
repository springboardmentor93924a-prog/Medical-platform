
const API_BASE_URL = "http://localhost:8080/api";

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Login failed (${response.status})`);
  }

  return data;
}

export async function registerUser(fullName, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fullName, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Registration failed (${response.status})`);
  }

  return data;
}

export async function getProtectedData(token) {
  const response = await fetch(`${API_BASE_URL}/test-protected`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Protected request failed (${response.status})`);
  }

  return response.text();
}
