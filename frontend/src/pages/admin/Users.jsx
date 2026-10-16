
import { useEffect, useState } from "react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load users from the backend
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("medistock_token");

      if (!token) {
        setError("Login token not found. Please login again.");
        return;
      }

      const response = await fetch(
        "http://localhost:8080/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        if (response.status === 403) {
          throw new Error("Only ADMIN can view users.");
        }

        throw new Error("Failed to load users.");
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Load users when the page opens
  useEffect(() => {
    loadUsers();
  }, []);

  // Show loading message
  if (loading) {
    return <p>Loading users...</p>;
  }

  // Show error message
  if (error) {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>

        <button onClick={loadUsers}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page heading and refresh button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1>Users Management</h1>
          <p>Total users: {users.length}</p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          style={{
            padding: "10px 18px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Refresh Users"}
        </button>
      </div>

      <p>Manage MediStock users and their roles.</p>

      {/* Users table */}
      <table
        style={{
          width: "100%",
          background: "white",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ padding: "12px", textAlign: "left" }}>
              Name
            </th>

            <th style={{ padding: "12px", textAlign: "left" }}>
              Email
            </th>

            <th style={{ padding: "12px", textAlign: "left" }}>
              Role
            </th>

            <th style={{ padding: "12px", textAlign: "left" }}>
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ padding: "16px" }}>
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.email}>
                <td style={{ padding: "12px" }}>
                  {user.fullName}
                </td>

                <td style={{ padding: "12px" }}>
                  {user.email}
                </td>

                <td style={{ padding: "12px" }}>
                  {user.role}
                </td>

                <td style={{ padding: "12px" }}>
                  {user.active ? "Active" : "Inactive"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
