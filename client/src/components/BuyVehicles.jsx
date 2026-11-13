
import { useEffect, useState } from "react";

import {
  API_SERVER_URL,
  getVehicleListingsApi,
  registerVehicleInterestApi,
} from "../services/api";

// Convert relative backend image paths into complete URLs.
function getVehicleImageUrl(imagePath) {
  if (!imagePath) return "";

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return `${API_SERVER_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

export default function BuyVehicles({
  tokenType = "customer",
  onBack,
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  async function loadVehicles() {
    try {
      setLoading(true);
      setError("");

      const response = await getVehicleListingsApi(tokenType);
      setListings(response.listings || []);
    } catch (err) {
      setError(err.message || "Unable to load vehicles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, [tokenType]);

  async function handleInterest(listingId) {
    try {
      setActionLoading(listingId);
      setError("");
      setSuccess("");

      const response = await registerVehicleInterestApi(
        listingId,
        tokenType
      );

      setSuccess(
        response.message ||
          "Your interest has been shared with RaahSetu."
      );
    } catch (err) {
      setError(err.message || "Unable to register your interest.");
    } finally {
      setActionLoading("");
    }
  }

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
          ← Back
        </button>
      </header>

      <section className="booking-content">
        <div className="booking-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            RAAHSETU MARKETPLACE
          </p>

          <h1>
            Find your next
            <br className="desktop-break" /> vehicle.
          </h1>

          <p className="booking-subtitle">
            Explore vehicles listed by our community.
            Show interest and our team will contact you.
          </p>
        </div>

        {error && (
          <p className="booking-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="finance-success" role="status">
            {success}
          </p>
        )}

        {loading ? (
          <p className="driver-dashboard-message">
            Loading available vehicles...
          </p>
        ) : listings.length === 0 ? (
          <div className="driver-dashboard-message">
            <h2>No vehicles available right now.</h2>
            <p>Approved vehicle listings will appear here.</p>
          </div>
        ) : (
          <div className="vehicle-listing-grid">
            {listings.map((vehicle) => (
              <article
                className="vehicle-listing-card"
                key={vehicle._id}
              >
                <div className="vehicle-listing-photo">
                  {vehicle.photos?.front ? (
                    <img
                      src={getVehicleImageUrl(vehicle.photos.front)}
                      alt={`${vehicle.vehicleModel} front view`}
                    />
                  ) : (
                    <span>Vehicle photo unavailable</span>
                  )}
                </div>

                <div className="vehicle-listing-details">
                  <span className="driver-load-type">
                    {vehicle.vehicleType?.replace("-", " ")}
                  </span>

                  <h2>{vehicle.vehicleModel}</h2>

                  <p>
                    Vehicle Number: {vehicle.vehicleNumber}
                  </p>

                  <div className="vehicle-photo-views">
                    {["back", "left", "right"].map((side) => (
                      vehicle.photos?.[side] ? (
                        <img
                          key={side}
                          src={getVehicleImageUrl(vehicle.photos[side])}
                          alt={`${side} view`}
                          title={`${side} view`}
                        />
                      ) : null
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn-confirm"
                    disabled={actionLoading === vehicle._id}
                    onClick={() => handleInterest(vehicle._id)}
                  >
                    {actionLoading === vehicle._id
                      ? "Submitting..."
                      : "I'm Interested →"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <button
          type="button"
          className="driver-refresh-btn"
          onClick={loadVehicles}
          disabled={loading}
        >
          Refresh Vehicles
        </button>

        <footer className="booking-footer">
          <span>RaahSetu</span>
          <span>Moving goods, connecting journeys.</span>
        </footer>
      </section>
    </main>
  );
}
