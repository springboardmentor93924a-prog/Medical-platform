
import { useEffect, useState } from "react";

export default function PharmacistMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMedicines() {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("medistock_token");

      const response = await fetch(
        "http://localhost:8080/api/admin/medicines",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Could not load medicines (${response.status})`);
      }

      const data = await response.json();
      setMedicines(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
      <h2>Medicines</h2>
      <button onClick={loadMedicines}>Refresh</button>

      {medicines.length === 0 ? (
        <p>No medicines found.</p>
      ) : (
        <table border="1" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Medicine Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((medicine) => (
              <tr key={medicine.medicineId}>
                <td>{medicine.medicineId}</td>
                <td>{medicine.medicineName}</td>
                <td>{medicine.category}</td>
                <td>{medicine.description}</td>
                <td>{medicine.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
