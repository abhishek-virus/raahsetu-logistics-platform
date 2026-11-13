
import { useEffect, useState } from "react";
import {
  getPendingLoadVerificationsApi,
  updateLoadVerificationApi,
} from "../services/api";

function StaffLoadVerification({ onBack }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [remarks, setRemarks] = useState({});

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPendingLoadVerificationsApi();
      setBookings(response.bookings || []);
    } catch (err) {
      setError(err.message || "Unable to load pending bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleVerification = async (bookingId, status) => {
    const currentRemarks = remarks[bookingId] || "";

    if (status === "rejected" && !currentRemarks.trim()) {
      setError("Please enter a reason before rejecting a booking.");
      return;
    }

    const confirmed = window.confirm(
      status === "approved"
        ? "Have you verified this booking with the customer? Approve it now?"
        : "Are you sure you want to reject this booking?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      setError("");

      await updateLoadVerificationApi(bookingId, {
        status,
        remarks: currentRemarks.trim(),
      });

      setBookings((previous) =>
        previous.filter((booking) => booking._id !== bookingId)
      );

      setRemarks((previous) => {
        const updated = { ...previous };
        delete updated[bookingId];
        return updated;
      });
    } catch (err) {
      setError(err.message || "Unable to update booking verification.");
    } finally {
      setProcessingId("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not provided";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not provided";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTruckType = (type) => {
    if (!type) return "Not specified";

    return type
      .split("-")
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  const formatPhone = (phone) => {
    if (!phone) return "Not available";
    return phone;
  };

  return (
    <main className="staff-verification-page">
      <div className="staff-verification-container">
        <header className="staff-verification-header">
          <div>
            <span className="staff-portal-label">
              STAFF OPERATIONS
            </span>

            <h1>Load Verification</h1>

            <p>
              Review customer bookings, contact customers and
              verify genuine transport requests.
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
            <span>Pending Bookings</span>
            <strong>{bookings.length}</strong>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchBookings}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </section>

        {error && (
          <div
            className="staff-verification-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="staff-verification-message">
            Loading pending bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="staff-verification-empty">
            <h2>All caught up!</h2>
            <p>
              There are no pending bookings to verify.
            </p>
          </div>
        ) : (
          <div className="staff-driver-list">
            {bookings.map((booking) => {
              const customerPhone = booking.customer?.phone;
              const isProcessing = processingId === booking._id;

              return (
                <article
                  className="staff-driver-card"
                  key={booking._id}
                >
                  {/* Booking Header */}
                  <div className="staff-driver-card-header">
                    <div>
                      <span className="staff-driver-status">
                        PENDING VERIFICATION
                      </span>

                      <h2>
                        Booking #
                        {booking._id.slice(-8).toUpperCase()}
                      </h2>
                    </div>

                    <span className="staff-driver-experience">
                      Created: {formatDate(booking.createdAt)}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <section className="staff-load-section">
                    <h3>Customer Information</h3>

                    <div className="staff-driver-info-grid">
                      <div>
                        <span>Customer Name</span>
                        <strong>
                          {booking.customer?.name || "Not available"}
                        </strong>
                      </div>

                      <div>
                        <span>Customer Phone</span>
                        <strong>
                          {formatPhone(customerPhone)}
                        </strong>
                      </div>
                    </div>

                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="staff-call-customer-button"
                      >
                        ☎ Call Customer
                      </a>
                    )}
                  </section>

                  {/* Route Information */}
                  <section className="staff-load-section">
                    <h3>Route Information</h3>

                    <div className="staff-driver-info-grid">
                      <div>
                        <span>Pickup Location</span>
                        <strong>
                          {booking.pickupLocation || "Not available"}
                        </strong>
                      </div>

                      <div>
                        <span>Drop Location</span>
                        <strong>
                          {booking.dropLocation || "Not available"}
                        </strong>
                      </div>

                      <div>
                        <span>Pickup Date</span>
                        <strong>
                          {formatDate(booking.pickupDate)}
                        </strong>
                      </div>

                      <div>
                        <span>Pickup Time</span>
                        <strong>
                          {booking.pickupTime || "Not available"}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {/* Goods Information */}
                  <section className="staff-load-section">
                    <h3>Goods & Vehicle Information</h3>

                    <div className="staff-driver-info-grid">
                      <div>
                        <span>Goods Type</span>
                        <strong>
                          {booking.goodsType || "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Goods Weight</span>
                        <strong>
                          {booking.goodsWeightKg != null
                            ? `${booking.goodsWeightKg} kg`
                            : "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Required Truck</span>
                        <strong>
                          {formatTruckType(booking.truckType)}
                        </strong>
                      </div>
                    </div>
                  </section>

                  {/* Verification Remarks */}
                  <div className="staff-driver-remarks">
                    <label htmlFor={`remarks-${booking._id}`}>
                      Verification Remarks
                    </label>

                    <textarea
                      id={`remarks-${booking._id}`}
                      rows={3}
                      maxLength={500}
                      placeholder="Add verification notes or rejection reason..."
                      value={remarks[booking._id] || ""}
                      onChange={(event) =>
                        setRemarks((previous) => ({
                          ...previous,
                          [booking._id]: event.target.value,
                        }))
                      }
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Actions */}
                  <div className="staff-driver-actions">
                    <button
                      type="button"
                      className="staff-approve-button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleVerification(
                          booking._id,
                          "approved"
                        )
                      }
                    >
                      {isProcessing
                        ? "Processing..."
                        : "✓ Verify & Approve"}
                    </button>

                    <button
                      type="button"
                      className="staff-reject-button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleVerification(
                          booking._id,
                          "rejected"
                        )
                      }
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Reject Booking"}
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

export default StaffLoadVerification;
