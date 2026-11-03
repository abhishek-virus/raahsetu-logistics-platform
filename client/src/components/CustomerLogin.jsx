
import { useState } from "react";
import { requestOtpApi } from "../services/api";

export default function CustomerLogin({ onOtpSent }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const data = await requestOtpApi(phone);

      if (data.success) {
        onOtpSent(phone);
      } else {
        setError(data.message || "Unable to send OTP.");
      }
    } catch {
      setError(
        "Unable to connect to the server. Please check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">R</span>
          <span>RaahSetu</span>
        </div>

        <p className="eyebrow">LOGISTICS, CONNECTED</p>
        <h1>Your journey starts here.</h1>
        <p className="auth-description">
          Enter your mobile number to continue with your transport journey.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="phone">Mobile number</label>

          <div className="phone-input">
            <span>+91</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setError("");
              }}
              required
            />
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <button className="btn-confirm" type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Continue with OTP"}
          </button>
        </form>

        <p className="auth-footnote">
          By continuing, you agree to use RaahSetu responsibly.
        </p>
      </section>
    </main>
  );
}
