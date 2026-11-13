
import { useState } from "react";
import { staffLoginApi } from "../services/api";

export default function StaffLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(normalizedEmail)) {
      setError("Please enter a valid Gmail address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await staffLoginApi({
        email: normalizedEmail,
        password,
      });

      if (!response.token || !response.staff) {
        throw new Error("Invalid login response from server.");
      }

      localStorage.setItem("staffToken", response.token);
      localStorage.setItem("staff", JSON.stringify(response.staff));

      onLogin(response.staff);
    } catch (err) {
      setError(err.message || "Staff login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">R</span>
          RaahSetu
        </div>

        <p className="eyebrow">STAFF PORTAL</p>

        <h1>Staff Login</h1>

        <p className="auth-description">
          Sign in to manage bookings, drivers and vehicle listings.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="staff-email">Gmail Address</label>
            <input
              id="staff-email"
              type="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-password">Password</label>
            <input
              id="staff-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <button
          type="button"
          className="logout-button"
          onClick={onBack}
          disabled={loading}
        >
          Back to Home
        </button>

        <p className="auth-footnote">
          Authorized RaahSetu staff only.
        </p>
      </section>
    </main>
  );
}
