
import { useState } from "react";

export default function Signup({ onLogin, onBackToLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select your role.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      // If registration automatically returns a login token
      if (data.token && data.role) {
        sessionStorage.setItem("medistock_token", data.token);
        sessionStorage.setItem("medistock_role", data.role);
        onLogin(data);
      } else {
        // Otherwise return to login after successful registration
        onBackToLogin();
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSignup} style={styles.card}>
        <h1 style={styles.title}>Create MediStock Account</h1>
        <p style={styles.subtitle}>Register with your assigned role</p>

        {error && <p style={styles.error}>{error}</p>}

        <label style={styles.label}>Full Name</label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={styles.input}
        />

        <label style={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          style={styles.input}
        />

        <label style={styles.label}>Register as</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          style={styles.input}
        >
          <option value="">Select your role</option>
          <option value="PHARMACIST">Pharmacist</option>
          <option value="STAFF">Staff</option>
          <option value="SUPPLIER">Supplier</option>
        </select>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p style={styles.footer}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            style={styles.link}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "white",
    padding: "32px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    color: "#2563eb",
    marginBottom: "8px",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginBottom: "18px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    color: "#dc2626",
    background: "#fee2e2",
    padding: "10px",
    borderRadius: "8px",
  },
  footer: {
    textAlign: "center",
    marginTop: "20px",
  },
  link: {
    color: "#2563eb",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
