
import { useState } from "react";

export default function BookingHome({
  customer,
  booking,
  onConfirm,
  onLogout,
  onViewBookings,
}) {
  const [fromLocation, setFromLocation] = useState(
    booking?.fromLocation || ""
  );
  const [toLocation, setToLocation] = useState(
    booking?.toLocation || ""
  );
  const [error, setError] = useState("");

  const customerName = customer?.name?.trim() || "Welcome!";
  const phone = customer?.phone || "";
  const initials = customer?.name?.trim()
    ? customer.name.trim().charAt(0).toUpperCase()
    : "C";

  const handleSubmit = (e) => {
    e.preventDefault();

    const from = fromLocation.trim();
    const to = toLocation.trim();

    if (!from || !to) {
      setError("Please enter both pickup and drop locations.");
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      setError("Pickup and drop locations must be different.");
      return;
    }

    setError("");
    onConfirm({ fromLocation: from, toLocation: to });
  };

  const handleLocationChange = (setter, value) => {
    setter(value);
    setError("");
  };

  return (
    <main className="booking-page">
      <header className="booking-header">
        <a className="brand" href="/" aria-label="RaahSetu home">
          <span className="brand-mark">R</span>
          <span className="brand-name">RaahSetu</span>
        </a>

        <div className="header-actions">
          <span className="header-status">
            <span className="status-dot" />
            Customer portal
          </span>

          <button
            type="button"
            className="logout-button"
            onClick={onViewBookings}
          >
            My bookings
          </button>
          
          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <section className="booking-content">
        <div className="booking-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            YOUR JOURNEY STARTS HERE
          </p>

          <h1>
            Where should we
            <br className="desktop-break" /> move your goods?
          </h1>

          <p className="booking-subtitle">
            Start with your route. Enter the pickup and delivery
            locations to get started.
          </p>
        </div>

        <section className="customer-info" aria-label="Customer information">
          <div className="customer-avatar" aria-hidden="true">
            {initials}
          </div>

          <div className="customer-details">
            <span className="customer-welcome">SIGNED IN AS</span>
            <strong>{customerName}</strong>
            <p>{phone ? `+91 ${phone}` : "Customer account"}</p>
          </div>

          <span className="verified-badge">
            <span aria-hidden="true">✓</span> Verified
          </span>
        </section>

        <form className="location-form" onSubmit={handleSubmit} noValidate>
          <div className="form-heading">
            <div>
              <h2>Plan your route</h2>
              <p>Where should we collect and deliver?</p>
            </div>
            <span className="step-indicator">STEP 01</span>
          </div>

          <div className="route-fields">
            <div className="location-field">
              <div className="route-marker pickup-marker" aria-hidden="true">
                <span />
              </div>

              <div className="field-content">
                <label htmlFor="pickup">Pickup location</label>
                <input
                  id="pickup"
                  name="pickup"
                  type="text"
                  placeholder="e.g. Madhubani, Bihar"
                  value={fromLocation}
                  onChange={(e) =>
                    handleLocationChange(setFromLocation, e.target.value)
                  }
                  maxLength={150}
                  autoComplete="address-level2"
                  aria-invalid={Boolean(error)}
                />
                <span className="field-hint">
                  Where should we collect your goods?
                </span>
              </div>
            </div>

            <div className="route-connector" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="location-field">
              <div className="route-marker drop-marker" aria-hidden="true">
                <span />
              </div>

              <div className="field-content">
                <label htmlFor="drop">Drop location</label>
                <input
                  id="drop"
                  name="drop"
                  type="text"
                  placeholder="e.g. Gurugram, Haryana"
                  value={toLocation}
                  onChange={(e) =>
                    handleLocationChange(setToLocation, e.target.value)
                  }
                  maxLength={150}
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                />
                <span className="field-hint">
                  Where should we deliver your goods?
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="booking-error" role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          )}

          <button type="submit" className="btn-confirm">
            Confirm locations
            <span aria-hidden="true">→</span>
          </button>

          <p className="form-disclaimer">
            <span aria-hidden="true">🔒</span>
            Your route details are used to prepare your journey.
          </p>
        </form>

        {booking && (
          <section
            className="booking-confirmation"
            aria-live="polite"
            aria-labelledby="confirmation-title"
          >
            <div className="confirmation-top">
              <span className="confirmation-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <p className="confirmation-label">LOCATIONS CONFIRMED</p>
                <h2 id="confirmation-title">Your route is ready</h2>
              </div>
            </div>

            <div className="confirmed-route">
              <div className="confirmed-location">
                <span className="confirmed-dot pickup-marker">
                  <span />
                </span>
                <div>
                  <span className="confirmed-label">PICKUP FROM</span>
                  <p>{booking.fromLocation}</p>
                </div>
              </div>

              <div className="confirmed-location">
                <span className="confirmed-dot drop-marker">
                  <span />
                </span>
                <div>
                  <span className="confirmed-label">DELIVER TO</span>
                  <p>{booking.toLocation}</p>
                </div>
              </div>
            </div>

            <p className="confirmation-note">
              This confirms your locations only. No truck or transport
              booking has been created yet.
            </p>
          </section>
        )}

        <footer className="booking-footer">
          <span>RaahSetu</span>
          <span>Moving goods, connecting journeys.</span>
        </footer>
      </section>
    </main>
  );
}
