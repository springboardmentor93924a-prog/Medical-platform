import { useState } from "react";

import { apiFetch } from "../services/api";

const DEMO_PASSWORD = "Password@123";

const DEMO_ACCOUNTS = {
  ADMIN: "admin@medistock.local",
  PHARMACIST: "pharmacist@medistock.local",
  STAFF: "staff@medistock.local",
  SUPPLIER: "supplier@medistock.local",
};

export default function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (emailValue, passwordValue, roleValue) => {
    setError("");

    if (!roleValue) {
      setError("Please select your role.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: emailValue,
          password: passwordValue,
          role: roleValue,
        }),
      });

      if (data.role !== roleValue) {
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

  const handleLogin = (e) => {
    e.preventDefault();
    submitLogin(email, password, role);
  };

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    setRole(nextRole);

    if (DEMO_ACCOUNTS[nextRole]) {
      setEmail(DEMO_ACCOUNTS[nextRole]);
      setPassword(DEMO_PASSWORD);
    }
  };

  const quickLogin = (roleValue) => {
    setRole(roleValue);
    setEmail(DEMO_ACCOUNTS[roleValue]);
    setPassword(DEMO_PASSWORD);
    submitLogin(DEMO_ACCOUNTS[roleValue], DEMO_PASSWORD, roleValue);
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>MediStock</h1>
        <p style={styles.subtitle}>Sign in to your account</p>

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.quickLabel}>Quick demo login</p>

        <div style={styles.quickRow}>
          {Object.keys(DEMO_ACCOUNTS).map((roleName) => (
            <button
              key={roleName}
              type="button"
              disabled={loading}
              onClick={() => quickLogin(roleName)}
              style={{
                ...styles.quickButton,
                ...(role === roleName ? styles.quickButtonActive : {}),
              }}
            >
              {roleName.charAt(0) + roleName.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <p style={styles.divider}>or sign in manually</p>

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
          onChange={handleRoleChange}
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

        <p style={styles.hint}>
          Choosing a role fills in that demo account automatically.
        </p>

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
  quickLabel: {
    margin: "0 0 10px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  quickRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
  },
  quickButton: {
    padding: "10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },
  quickButtonActive: {
    background: "#2563eb",
    borderColor: "#2563eb",
    color: "white",
  },
  divider: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
    margin: "20px 0 16px",
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
  hint: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "12px",
    marginTop: "12px",
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
