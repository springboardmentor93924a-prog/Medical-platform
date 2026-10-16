
import { useEffect, useState } from "react";

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("medistock_token");

      if (!token) {
        throw new Error("Login token not found. Please login again.");
      }

      const response = await fetch(
        "http://localhost:8080/api/admin/medicines",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load medicines.");
      }

      const data = await response.json();
      setMedicines(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  if (loading) {
    return <p>Loading medicines...</p>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={loadMedicines}>Try Again</button>
      </div>
    );
  }

  return (
    <div>
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
          <h1>Medicines Management</h1>
          <p>Total medicines: {medicines.length}</p>
        </div>

        <button
          onClick={loadMedicines}
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
          Refresh Medicines
        </button>
      </div>

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
      Medicine ID
    </th>
    <th style={{ padding: "12px", textAlign: "left" }}>
      Medicine Name
    </th>
    <th style={{ padding: "12px", textAlign: "left" }}>
      Category
    </th>
    <th style={{ padding: "12px", textAlign: "left" }}>
      Description
    </th>
    <th style={{ padding: "12px", textAlign: "left" }}>
      Created At
    </th>
  </tr>
</thead>

<tbody>
  {medicines.length === 0 ? (
    <tr>
      <td colSpan="5" style={{ padding: "16px" }}>
        No medicines found.
      </td>
    </tr>
  ) : (
    medicines.map((medicine) => (
      <tr key={medicine.medicineId}>
        <td style={{ padding: "12px" }}>
          {medicine.medicineId}
        </td>
        <td style={{ padding: "12px" }}>
          {medicine.medicineName}
        </td>
        <td style={{ padding: "12px" }}>
          {medicine.category}
        </td>
        <td style={{ padding: "12px" }}>
          {medicine.description}
        </td>
        <td style={{ padding: "12px" }}>
          {medicine.createdAt}
        </td>
      </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  );
}
