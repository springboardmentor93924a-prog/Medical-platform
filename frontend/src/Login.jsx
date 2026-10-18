
import { useState } from "react";
import "./Login.css";
import "./App.css";

export default function Login({ onLogin }) {
  const [page, setPage] = useState("signin");
  const [role, setRole] = useState("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const signup = page === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (signup && role === "admin") {
      setError(
        "Admin accounts cannot be created through public sign up."
      );
      return;
    }

    setLoading(true);

    try {
      const endpoint = signup
        ? "http://localhost:8080/api/auth/signup"
        : "http://localhost:8080/api/auth/login";

      const body = signup
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
            phone: phone.trim(),
            role,
          }
        : {
            email: email.trim(),
            password,
            role,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      if (signup) {
        setSuccess(
          "Account created successfully! Please sign in."
        );

        setPage("signin");
        setName("");
        setPhone("");
        setPassword("");
        setRole("staff");
      } else {
        // Verify that the backend returned a JWT.
        if (!data.token) {
          throw new Error(
            "Login succeeded, but the server did not return a JWT token."
          );
        }

        // Store the JWT token for authenticated API requests.
        localStorage.setItem("token", data.token);

        // Store basic user information for the frontend.
        const user = {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
        };

        localStorage.setItem("user", JSON.stringify(user));

        // Pass login data to the parent App component.
        onLogin(data);
      }
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Check that Spring Boot is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="logo">
          <div className="logo-icon">✚</div>
          <h1>
            Medi<span>Stock</span>
          </h1>
        </div>

        <p className="subtitle">
          Medical Inventory Management
        </p>

        <h2>{signup ? "Create Account" : "Sign In"}</h2>

        <p className="description">
          {signup
            ? "Create your MediStock account"
            : "Sign in to continue to MediStock"}
        </p>

        <form onSubmit={handleSubmit}>
          {signup && (
            <input
              type="text"
              placeholder="Full name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {signup && (
            <input
              type="tel"
              placeholder="Phone number (optional)"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}

          <input
            type="password"
            placeholder="Password"
            autoComplete={
              signup ? "new-password" : "current-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={signup ? 8 : 1}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            {!signup && (
              <option value="admin">Admin</option>
            )}
            <option value="staff">Staff</option>
            <option value="supplier">Supplier</option>
            <option value="pharmacist">Pharmacist</option>
          </select>

          {error && (
            <p
              role="alert"
              style={{
                color: "#dc2626",
                margin: "10px 0",
              }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              style={{
                color: "#15803d",
                margin: "10px 0",
              }}
            >
              {success}
            </p>
          )}

          <button
            className="main-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : signup
                ? "Create Account"
                : "Sign In"}
            {!loading && <span> →</span>}
          </button>
        </form>

        <div className="switch">
          {signup
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setPage(signup ? "signin" : "signup");
              setError("");
              setSuccess("");
            }}
          >
            {signup ? "Sign In" : "Sign Up"}
          </button>
        </div>

        <div className="bottom-mark">
          <span>✚</span> Better Inventory. Healthier Tomorrow.
        </div>
      </div>
    </div>
  );
}
