
import { useEffect, useState } from "react";
import { verifyOtpApi } from "../services/api";

export default function OtpVerification({ phone, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(300);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (timer === 0) {
      setError("OTP validity has ended. Go back and request a new OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const data = await verifyOtpApi(phone, otp);

      if (!data.success) {
        setError(data.message || "OTP verification failed.");
        return;
      }

      if (!data.token || !data.customer) {
        setError("The server response is incomplete. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("customer", JSON.stringify(data.customer));

      onVerified(data.customer);
    } catch {
      setError("Unable to verify OTP. Check your server connection.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <main className="auth-page">
      <section className="auth-card otp-card">
        <button
          type="button"
          className="otp-back-btn"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span> Back
        </button>

        <div className="auth-brand">
          <span className="brand-mark">R</span>
          <span>RaahSetu</span>
        </div>

        <p className="eyebrow">PHONE VERIFICATION</p>

        <h1>Verify your number.</h1>

        <p className="auth-description">
          Enter the 6-digit OTP sent to
          <strong className="otp-phone"> +91 {phone}</strong>
        </p>

        <form onSubmit={handleVerify}>
          <label htmlFor="otp">One-time password</label>

          <input
            id="otp"
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError("");
            }}
            aria-describedby="otp-timer"
            required
          />

          <div
            className={`otp-timer ${
              timer <= 60 ? "otp-timer-warning" : ""
            }`}
            id="otp-timer"
            aria-live="polite"
          >
            <span className="timer-dot" />
            <span>
              {timer === 0 ? "OTP validity ended" : "OTP expires in"}
            </span>
            {timer > 0 && (
              <strong>{formatTime(timer)}</strong>
            )}
          </div>

          {timer === 0 && (
            <p className="otp-error" role="alert">
              Your OTP may have expired. Go back and request a new one.
            </p>
          )}

          {error && (
            <p className="otp-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="otp-submit-btn"
            type="submit"
            disabled={loading || timer === 0}
          >
            {loading ? "Verifying..." : "Verify and continue"}
            {!loading && <span aria-hidden="true"> →</span>}
          </button>
        </form>

        <div className="otp-security-note">
          <span aria-hidden="true">🔒</span>
          <p>
            Development mode: check the backend terminal for the OTP.
          </p>
        </div>
      </section>
    </main>
  );
}
