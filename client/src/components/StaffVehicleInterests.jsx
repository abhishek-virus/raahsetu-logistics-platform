
import { useEffect, useState } from "react";
import { API_SERVER_URL, getVehicleBuyerInterestsApi } from "../services/api";

function getPhotoUrl(photoPath) {
  if (!photoPath) return "";

  if (photoPath.startsWith("http")) return photoPath;

  return `${API_SERVER_URL}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`;
}

function formatDate(date) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StaffVehicleInterests({ onBack }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInterests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getVehicleBuyerInterestsApi();
      setListings(response.listings || []);
    } catch (err) {
      setError(err.message || "Unable to fetch buyer interests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  const totalInterests = listings.reduce(
    (total, listing) =>
      total + (listing.interestedBuyers?.length || 0),
    0
  );

  return (
    <main className="staff-verification-page">
      <div className="staff-verification-container">

        <header className="staff-verification-header">
          <div>
            <span className="staff-portal-label">
              STAFF OPERATIONS
            </span>

            <h1>Vehicle Buyer Interests</h1>

            <p>
              Manage buyers interested in vehicles listed on the marketplace.
            </p>
          </div>

          <button
            type="button"
            className="staff-back-button"
            onClick={onBack}
          >
            ← Back to Dashboard
          </button>
        </header>

        <section className="staff-verification-summary">
          <div>
            <span>Vehicle Listings</span>
            <strong>{listings.length}</strong>
          </div>

          <div>
            <span>Total Buyer Interests</span>
            <strong>{totalInterests}</strong>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchInterests}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </section>

        {error && (
          <div className="staff-verification-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="staff-verification-message">
            Loading buyer interests...
          </div>
        ) : listings.length === 0 ? (
          <div className="staff-verification-empty">
            <h2>No Buyer Interests Yet</h2>
            <p>
              Interested buyers will appear here when they contact
              RaahSetu through a vehicle listing.
            </p>
          </div>
        ) : (
          <div className="staff-driver-list">
            {listings.map((listing) => (
              <article
                className="staff-driver-card"
                key={listing._id}
              >
                <div className="staff-driver-card-header">
                  <div>
                    <span className="staff-driver-status">
                      APPROVED LISTING
                    </span>

                    <h2>
                      {listing.vehicleModel || "Vehicle"}
                    </h2>

                    <p>
                      Vehicle #{listing._id.slice(-8).toUpperCase()}
                    </p>
                  </div>

                  <span className="staff-driver-experience">
                    {listing.interestedBuyers?.length || 0} Interested
                  </span>
                </div>

                <div className="staff-driver-info-grid">
                  <div>
                    <span>Vehicle Type</span>
                    <strong>{listing.vehicleType || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Vehicle Number</span>
                    <strong>{listing.vehicleNumber || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Seller</span>
                    <strong>{listing.contactName || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Seller Phone</span>
                    <strong>{listing.contactPhone || "Not provided"}</strong>
                  </div>
                </div>

                {listing.photos?.front && (
                  <div className="staff-interest-vehicle-photo">
                    <img
                      src={getPhotoUrl(listing.photos.front)}
                      alt="Vehicle front view"
                    />
                  </div>
                )}

                <section className="staff-buyer-interest-section">
                  <h3>Interested Buyers</h3>

                  {listing.interestedBuyers?.length ? (
                    <div className="staff-buyer-interest-list">
                      {listing.interestedBuyers.map((buyer, index) => (
                        <div
                          className="staff-buyer-interest-card"
                          key={`${buyer.buyer?._id || buyer.buyer}-${index}`}
                        >
                          <div className="staff-buyer-interest-info">
                            <strong>
                              {buyer.name ||
                                buyer.buyer?.name ||
                                "Buyer"}
                            </strong>

                            <span>
                              {buyer.buyerRole || "Customer"} 
                            </span>

                            <small>
                              Interested on: {formatDate(buyer.createdAt)}
                            </small>

                            <small>
                              Phone: {buyer.phone || buyer.buyer?.phone || "Not available"}
                            </small>
                          </div>

                          {(buyer.phone || buyer.buyer?.phone) && (
                            <a
                              href={`tel:${buyer.phone || buyer.buyer.phone}`}
                              className="staff-buyer-call-button"
                            >
                              ☎ Call Buyer
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No interested buyers recorded.</p>
                  )}
                </section>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default StaffVehicleInterests;
