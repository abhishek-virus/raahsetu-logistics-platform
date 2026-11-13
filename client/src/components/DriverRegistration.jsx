
import { useState } from "react";
import { requestDriverRegistrationOtpApi } from "../services/api";

export default function DriverRegistration({
  onOtpSent,
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

      await requestDriverRegistrationOtpApi(phone);
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

        <p className="eyebrow">DRIVER REGISTRATION</p>

        <h1>Join RaahSetu</h1>

        <p className="auth-description">
          Start your journey as a RaahSetu transport partner.
          Enter your mobile number to create your driver account.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="registration-phone">
            Mobile Number
          </label>

          <div className="phone-input">
            <span>+91</span>

            <input
              id="registration-phone"
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
            {loading ? "Sending OTP..." : "Continue with OTP"}
          </button>
        </form>

        <div className="otp-security-note">
          <p>
            Your mobile number will be verified before
            registration begins.
          </p>
        </div>

        <p className="auth-footnote">
          Already registered? Go back and choose Driver Login.
        </p>
      </section>
    </main>
  );
}
