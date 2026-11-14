
import { useState } from "react";
import { updateCustomerProfileApi } from "../services/api";

export default function CustomerProfile({
  customer,
  onBack,
  onProfileUpdated,
}) {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const phone = customer?.phone || "";

  const initials = name.trim()
    ? name.trim().charAt(0).toUpperCase()
    : "C";

  const handleCancel = () => {
    setName(customer?.name || "");
    setEmail(customer?.email || "");
    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await updateCustomerProfileApi({
        name: trimmedName,
        email: trimmedEmail,
      });

      const updatedCustomer =
        response?.customer ||
        response?.data?.customer ||
        {
          ...customer,
          name: trimmedName,
          email: trimmedEmail,
        };

      onProfileUpdated?.(updatedCustomer);

      setName(updatedCustomer.name || trimmedName);
      setEmail(updatedCustomer.email || trimmedEmail);

      setIsEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err.message || "Unable to update your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="customer-profile-page">
      <header className="customer-profile-header">
        <button
          type="button"
          className="customer-profile-back"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="customer-profile-brand">
          <span>R</span>
          RaahSetu
        </div>
      </header>

      <section className="customer-profile-content">
        <div className="customer-profile-heading">
          <p className="customer-profile-eyebrow">
            CUSTOMER ACCOUNT
          </p>

          <h1>My Profile</h1>

          <p>
            View and manage your personal account information.
          </p>
        </div>

        <section className="customer-profile-card">
          <div className="customer-profile-card-top">
            <div className="customer-profile-avatar">
              {initials}
            </div>

            <div className="customer-profile-identity">
              <h2>{customer?.name?.trim() || "Customer"}</h2>
              <p>RaahSetu Customer</p>
              <span className="customer-profile-verified">
                ✓ Verified Account
              </span>
            </div>

            {!isEditing && (
              <button
                type="button"
                className="customer-profile-edit"
                onClick={() => {
                  setSuccess("");
                  setError("");
                  setIsEditing(true);
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="customer-profile-divider" />

          <form onSubmit={handleSave}>
            <div className="customer-profile-section-heading">
              <h3>Personal Information</h3>
              <p>
                {isEditing
                  ? "Update your personal details below."
                  : "Your registered account details."}
              </p>
            </div>

            <div className="customer-profile-fields">
              <div className="customer-profile-field">
                <label htmlFor="customer-name">
                  Full Name
                </label>

                <input
                  id="customer-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Enter your full name"
                  maxLength={100}
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="customer-profile-field">
                <label htmlFor="customer-email">
                  Email Address
                </label>

                <input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Enter your email address"
                  disabled={!isEditing || loading}
                />
              </div>

              <div className="customer-profile-field">
                <label htmlFor="customer-phone">
                  Mobile Number
                </label>

                <input
                  id="customer-phone"
                  type="tel"
                  value={phone ? `+91 ${phone}` : ""}
                  disabled
                  readOnly
                />

                <small>
                  Your verified mobile number cannot be changed here.
                </small>
              </div>
            </div>

            {error && (
              <p className="customer-profile-message error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="customer-profile-message success" role="status">
                {success}
              </p>
            )}

            {isEditing && (
              <div className="customer-profile-actions">
                <button
                  type="button"
                  className="customer-profile-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="customer-profile-save"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </section>

        <div className="customer-profile-security">
          <span>🔒</span>
          <div>
            <strong>Your account is secure</strong>
            <p>
              Your registered mobile number is verified through OTP.
            </p>
          </div>
        </div>

        <footer className="customer-profile-footer">
          RaahSetu · Moving goods, connecting journeys.
        </footer>
      </section>
    </main>
  );
}
