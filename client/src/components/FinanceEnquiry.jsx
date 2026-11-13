
import { useState } from "react";
import { createFinanceEnquiryApi } from "../services/api";

export default function FinanceEnquiry({
  user,
  customer,
  tokenType = "customer",
  onBack,
}) {
  const requester = user || customer;

  const [form, setForm] = useState({
    enquiryType: "finance",
    applicantName: requester?.name || "",
    phone: requester?.phone || "",
    vehicleType: "mini-truck",
    rcNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.applicantName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!form.rcNumber.trim()) {
      setError("Please enter your vehicle RC number.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        enquiryType: form.enquiryType,
        applicantName: form.applicantName.trim(),
        phone: form.phone.trim(),
        vehicleType: form.vehicleType,
        rcNumber: form.rcNumber.trim().toUpperCase(),
      };

      const response = await createFinanceEnquiryApi(
        payload,
        tokenType
      );

      setSuccess(
        response.message || "Your enquiry was submitted successfully."
      );

      setForm((prev) => ({
        ...prev,
        rcNumber: "",
      }));
    } catch (err) {
      setError(err.message || "Unable to submit your enquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="booking-page">
      <header className="booking-header">
        <a className="brand" href="/" aria-label="RaahSetu home">
          <span className="brand-mark">R</span>
          <span className="brand-name">RaahSetu</span>
        </a>

        <button
          type="button"
          className="logout-button"
          onClick={onBack}
        >
          ← Back to Home
        </button>
      </header>

      <section className="booking-content">
        <div className="booking-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            FINANCE & INSURANCE
          </p>

          <h1>
            Move forward
            <br className="desktop-break" /> with confidence.
          </h1>

          <p className="booking-subtitle">
            Tell us what you need. Our team will contact you
            about suitable commercial vehicle options.
          </p>
        </div>

        <form
          className="location-form finance-enquiry-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-heading">
            <div>
              <h2>Submit an enquiry</h2>
              <p>Share your vehicle and contact details.</p>
            </div>
            <span className="step-indicator">STEP 01</span>
          </div>

          <div className="finance-type-options">
            <label className="finance-type-option">
              <input
                type="radio"
                name="enquiryType"
                value="finance"
                checked={form.enquiryType === "finance"}
                onChange={handleChange}
              />
              <span>
                <strong>Vehicle Finance</strong>
                <small>Explore vehicle loan options</small>
              </span>
            </label>

            <label className="finance-type-option">
              <input
                type="radio"
                name="enquiryType"
                value="insurance"
                checked={form.enquiryType === "insurance"}
                onChange={handleChange}
              />
              <span>
                <strong>Vehicle Insurance</strong>
                <small>Ask about insurance coverage</small>
              </span>
            </label>
          </div>

          <div className="finance-form-grid">
            <div className="field-content">
              <label htmlFor="applicantName">Full Name</label>
              <input
                id="applicantName"
                name="applicantName"
                value={form.applicantName}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="field-content">
              <label htmlFor="financePhone">Mobile Number</label>
              <input
                id="financePhone"
                name="phone"
                type="tel"
                value={form.phone}
                readOnly
                maxLength={10}
                inputMode="numeric"
                required
              />
            </div>

            <div className="field-content">
              <label htmlFor="vehicleType">Vehicle Type</label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
                required
              >
                <option value="mini-truck">Mini Truck</option>
                <option value="light-truck">Light Truck</option>
                <option value="heavy-truck">Heavy Truck</option>
              </select>
            </div>

            <div className="field-content">
              <label htmlFor="rcNumber">Vehicle RC Number</label>
              <input
                id="rcNumber"
                name="rcNumber"
                value={form.rcNumber}
                onChange={handleChange}
                maxLength={30}
                placeholder="e.g. HRXXAB1234"
                required
              />
            </div>
          </div>

          {error && (
            <p className="booking-error" role="alert">
              ! {error}
            </p>
          )}

          {success && (
            <p className="finance-success" role="status">
              ✓ {success}
            </p>
          )}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Enquiry"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>

          <p className="form-disclaimer">
            🔒 Your information is securely associated with your account.
          </p>
        </form>

        <footer className="booking-footer">
          <span>RaahSetu</span>
          <span>Moving goods, connecting journeys.</span>
        </footer>
      </section>
    </main>
  );
}
