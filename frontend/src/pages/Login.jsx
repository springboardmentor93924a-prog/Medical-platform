
import { useState } from "react";

export default function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select your role.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.role !== role) {
        throw new Error("Your selected role does not match your account.");
      }

      sessionStorage.setItem("medistock_token", data.token);
      sessionStorage.setItem("medistock_role", data.role);

      onLogin(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>MediStock</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && <p style={styles.error}>{error}</p>}

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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        <label style={styles.label}>Login as</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          style={styles.input}
        >
          <option value="">Select your role</option>
          <option value="ADMIN">Admin</option>
          <option value="PHARMACIST">Pharmacist</option>
          <option value="STAFF">Staff</option>
          <option value="SUPPLIER">Supplier</option>
        </select>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <button type="button" onClick={onSignup} style={styles.link}>
            Sign up
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
