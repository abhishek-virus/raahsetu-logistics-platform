
import { useEffect, useState } from "react";
import { API_SERVER_URL } from "../services/api";
import {
  getPendingVehicleListingsApi,
  updateVehicleListingReviewApi,
} from "../services/api";

function getPhotoUrl(photoPath) {
  if (!photoPath) return "";

  if (photoPath.startsWith("http")) {
    return photoPath;
  }

  return `${API_SERVER_URL}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`;
}

function formatDate(date) {
  if (!date) return "Not provided";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not provided";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatVehicleType(type) {
  if (!type) return "Not specified";

  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const photoLabels = {
  front: "Front View",
  back: "Back View",
  left: "Left View",
  right: "Right View",
};

function StaffVehicleReview({ onBack }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [remarks, setRemarks] = useState({});

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPendingVehicleListingsApi();
      setListings(response.listings || []);
    } catch (err) {
      setError(err.message || "Unable to fetch vehicle listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleReview = async (listingId, status) => {
    const currentRemarks = remarks[listingId] || "";

    if (status === "rejected" && !currentRemarks.trim()) {
      setError("Please enter a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      status === "approved"
        ? "Are you sure you want to approve this vehicle listing?"
        : "Are you sure you want to reject this vehicle listing?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(listingId);
      setError("");

      await updateVehicleListingReviewApi(listingId, {
        status,
        remarks: currentRemarks.trim(),
      });

      setListings((previous) =>
        previous.filter((listing) => listing._id !== listingId)
      );

      setRemarks((previous) => {
        const updated = { ...previous };
        delete updated[listingId];
        return updated;
      });
    } catch (err) {
      setError(err.message || "Unable to update vehicle listing.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <main className="staff-verification-page">
      <div className="staff-verification-container">
        <header className="staff-verification-header">
          <div>
            <span className="staff-portal-label">
              STAFF OPERATIONS
            </span>

            <h1>Vehicle Listing Review</h1>

            <p>
              Verify seller details and vehicle photographs before
              publishing listings on the marketplace.
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
            <span>Pending Listings</span>
            <strong>{listings.length}</strong>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchListings}
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
            Loading vehicle listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="staff-verification-empty">
            <h2>All caught up!</h2>
            <p>There are no pending vehicle listings.</p>
          </div>
        ) : (
          <div className="staff-driver-list">
            {listings.map((listing) => {
              const isProcessing = processingId === listing._id;

              return (
                <article
                  className="staff-driver-card"
                  key={listing._id}
                >
                  {/* Listing Header */}
                  <div className="staff-driver-card-header">
                    <div>
                      <span className="staff-driver-status">
                        PENDING REVIEW
                      </span>

                      <h2>
                        Vehicle #{listing._id.slice(-8).toUpperCase()}
                      </h2>

                      <p>
                        Submitted: {formatDate(listing.createdAt)}
                      </p>
                    </div>

                    <span className="staff-driver-experience">
                      {listing.sellerRole || "Seller"}
                    </span>
                  </div>

                  {/* Seller Information */}
                  <section className="staff-vehicle-section">
                    <h3>Seller Information</h3>

                    <div className="staff-driver-info-grid">
                      <div>
                        <span>Seller Name</span>
                        <strong>
                          {listing.contactName || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Seller Phone</span>
                        <strong>
                          {listing.contactPhone || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Seller Type</span>
                        <strong>
                          {listing.sellerRole || "Not provided"}
                        </strong>
                      </div>
                    </div>

                    {listing.contactPhone && (
                      <a
                        href={`tel:${listing.contactPhone}`}
                        className="staff-vehicle-call-button"
                      >
                        ☎ Call Seller
                      </a>
                    )}
                  </section>

                  {/* Vehicle Information */}
                  <section className="staff-vehicle-section">
                    <h3>Vehicle Information</h3>

                    <div className="staff-driver-info-grid">
                      <div>
                        <span>Vehicle Model</span>
                        <strong>
                          {listing.vehicleModel || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Vehicle Type</span>
                        <strong>
                          {formatVehicleType(listing.vehicleType)}
                        </strong>
                      </div>

                      <div>
                        <span>Vehicle Number</span>
                        <strong>
                          {listing.vehicleNumber || "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>RC Number</span>
                        <strong>
                          {listing.rcNumber || "Not provided"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {/* Vehicle Photographs */}
                  <section className="staff-vehicle-photos">
                    <h3>Vehicle Photographs</h3>

                    <div className="staff-vehicle-photo-grid">
                      {Object.entries(photoLabels).map(([key, label]) => {
                        const photo = listing.photos?.[key];
                        const photoUrl = getPhotoUrl(photo);

                        return (
                          <div
                            className="staff-vehicle-photo"
                            key={key}
                          >
                            <span>{label}</span>

                            {photoUrl ? (
                              <a
                                href={photoUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`${label} of vehicle`}
                                  loading="lazy"
                                />
                              </a>
                            ) : (
                              <div className="staff-vehicle-photo-missing">
                                Photo unavailable
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Review Remarks */}
                  <div className="staff-driver-remarks">
                    <label htmlFor={`vehicle-remarks-${listing._id}`}>
                      Review Remarks
                    </label>

                    <textarea
                      id={`vehicle-remarks-${listing._id}`}
                      rows={3}
                      maxLength={500}
                      placeholder="Add review remarks or rejection reason..."
                      value={remarks[listing._id] || ""}
                      disabled={isProcessing}
                      onChange={(event) =>
                        setRemarks((previous) => ({
                          ...previous,
                          [listing._id]: event.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Review Actions */}
                  <div className="staff-driver-actions">
                    <button
                      type="button"
                      className="staff-approve-button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleReview(listing._id, "approved")
                      }
                    >
                      {isProcessing
                        ? "Processing..."
                        : "✓ Approve Listing"}
                    </button>

                    <button
                      type="button"
                      className="staff-reject-button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleReview(listing._id, "rejected")
                      }
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Reject Listing"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default StaffVehicleReview;
