
import { useState } from "react";
import { requestDriverOtpApi } from "../services/api";

export default function DriverLogin({
  onOtpSent,
  onRegister,
  onBack,
}) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);

      await requestDriverOtpApi(phone);
      onOtpSent(phone);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <button
          type="button"
          className="otp-back-btn"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="auth-brand">
          <span className="brand-mark">R</span>
          RaahSetu
        </div>

        <p className="eyebrow">DRIVER PORTAL</p>
        <h1>Driver Login</h1>

        <p className="auth-description">
          Enter your registered mobile number to continue
          with your driver account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="driver-phone">Mobile Number</label>

          <div className="phone-input">
            <span>+91</span>

            <input
              id="driver-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="Enter 10-digit number"
              value={phone}
              onChange={(e) => {
                setPhone(
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                );
                setError("");
              }}
              required
            />
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Login with OTP"}
          </button>
        </form>

        <div className="otp-security-note">
          <p>
            Secure login for registered RaahSetu transport partners.
          </p>
        </div>

        <div className="driver-login-divider">
          <span></span>
          <p>NEW TO RAahSETU?</p>
          <span></span>
        </div>

        <button
          type="button"
          className="customer-driver-button"
          onClick={onRegister}
        >
          <span className="driver-button-icon">🚚</span>

          <span>
            <strong>Register as a Driver</strong>
            <small>Create your new driver account</small>
          </span>

          <span className="driver-button-arrow">→</span>
        </button>
      </section>
    </main>
  );
}
