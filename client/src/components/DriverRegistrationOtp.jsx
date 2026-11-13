
import { useState } from "react";
import { verifyDriverRegistrationOtpApi } from "../services/api";

export default function DriverRegistrationOtp({
  phone,
  onVerified,
  onBack,
}) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await verifyDriverRegistrationOtpApi(
        phone,
        otp
      );

      if (!response.token || !response.driver) {
        throw new Error("Invalid registration response.");
      }

      localStorage.setItem("driverToken", response.token);
      localStorage.setItem(
        "driver",
        JSON.stringify(response.driver)
      );

      onVerified(response.driver);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card otp-card">
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

        <p className="eyebrow">NEW DRIVER REGISTRATION</p>

        <h1>Verify OTP</h1>

        <p className="auth-description">
          Enter the 6-digit OTP sent to your mobile number
          <br />
          <strong className="otp-phone">+91 {phone}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="registration-otp">
            One-Time Password
          </label>

          <input
            id="registration-otp"
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
          />

          {error && (
            <p className="otp-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="otp-submit-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify & Register"}
          </button>
        </form>

        <div className="otp-security-note">
          <p>
            Your mobile number will be verified to create
            your RaahSetu driver account.
          </p>
        </div>
      </section>
    </main>
  );
}
