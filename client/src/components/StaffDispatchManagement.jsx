
import { useEffect, useState } from "react";
import {
  getStaffDispatchLoadsApi,
  confirmStaffPickupApi,
} from "../services/api";

function StaffDispatchManagement({ onBack }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [remarks, setRemarks] = useState({});

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getStaffDispatchLoadsApi();
      setBookings(response.bookings || []);
    } catch (err) {
      setError(err.message || "Unable to fetch dispatch bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handlePickupConfirmation = async (bookingId) => {
    const confirmed = window.confirm(
      "Have you contacted the customer and confirmed the pickup?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(bookingId);
      setError("");

      const response = await confirmStaffPickupApi(
        bookingId,
        remarks[bookingId] || ""
      );

      if (response?.booking) {
        setBookings((previous) =>
          previous.map((booking) =>
            booking._id === bookingId ? response.booking : booking
          )
        );
      } else {
        await fetchBookings();
      }
    } catch (err) {
      setError(err.message || "Unable to confirm pickup.");
    } finally {
      setProcessingId("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "Not available";

    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <main className="staff-verification-page">
      <div className="staff-verification-container">
        <header className="staff-verification-header">
          <div>
            <span className="staff-portal-label">STAFF OPERATIONS</span>
            <h1>Dispatch Management</h1>
            <p>
              Manage driver-accepted loads and record customer pickup
              confirmations.
            </p>
          </div>

          <button
            type="button"
            className="staff-back-button"
            onClick={onBack}
          >
            Back to Dashboard
          </button>
        </header>

        <section className="staff-verification-summary">
          <div>
            <span>Driver Accepted Loads</span>
            <strong>{bookings.length}</strong>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchBookings}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {error && (
          <div className="staff-verification-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="staff-verification-message">
            Loading dispatch bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="staff-verification-empty">
            <h2>No assigned loads</h2>
            <p>Driver-accepted bookings will appear here.</p>
          </div>
        ) : (
          <div className="staff-driver-list">
            {bookings.map((booking) => {
              const customer = booking.customer || {};
              const driver = booking.assignedDriver || {};
              const pickupConfirmed = Boolean(booking.pickupConfirmedAt);

              return (
                <article className="staff-driver-card" key={booking._id}>
                  <div className="staff-driver-card-header">
                    <div>
                      <span className="staff-driver-status">
                        {formatStatus(booking.status)}
                      </span>
                      <h2>
                        Booking #{booking._id.slice(-8).toUpperCase()}
                      </h2>
                    </div>

                    <span className="staff-driver-experience">
                      {formatDate(booking.assignedAt)}
                    </span>
                  </div>

                  <div className="staff-driver-info-grid">
                    <div>
                      <span>Customer</span>
                      <strong>{customer.name || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Customer Phone</span>
                      <strong>{customer.phone || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Driver</span>
                      <strong>{driver.name || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Driver Phone</span>
                      <strong>{driver.phone || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Vehicle Number</span>
                      <strong>{driver.vehicleNumber || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Vehicle Type</span>
                      <strong>{formatStatus(driver.vehicleType)}</strong>
                    </div>

                    <div>
                      <span>Pickup Location</span>
                      <strong>{booking.pickupLocation || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Drop Location</span>
                      <strong>{booking.dropLocation || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Pickup Date</span>
                      <strong>{formatDate(booking.pickupDate)}</strong>
                    </div>

                    <div>
                      <span>Pickup Time</span>
                      <strong>{booking.pickupTime || "Not available"}</strong>
                    </div>
                  </div>

                  <div className="staff-dispatch-confirmation">
                    {pickupConfirmed ? (
                      <div className="staff-finance-success">
                        Pickup confirmed on{" "}
                        {formatDate(booking.pickupConfirmedAt)}
                      </div>
                    ) : booking.status === "assigned" ? (
                      <>
                        <label htmlFor={`dispatch-remarks-${booking._id}`}>
                          Pickup Confirmation Remarks
                        </label>

                        <textarea
                          id={`dispatch-remarks-${booking._id}`}
                          rows={2}
                          maxLength={500}
                          placeholder="Optional confirmation notes..."
                          value={remarks[booking._id] || ""}
                          onChange={(event) =>
                            setRemarks((previous) => ({
                              ...previous,
                              [booking._id]: event.target.value,
                            }))
                          }
                        />

                        <button
                          type="button"
                          className="staff-approve-button"
                          disabled={processingId === booking._id}
                          onClick={() =>
                            handlePickupConfirmation(booking._id)
                          }
                        >
                          {processingId === booking._id
                            ? "Processing..."
                            : "Confirm Customer Pickup"}
                        </button>
                      </>
                    ) : (
                      <div className="staff-verification-message">
                        Pickup confirmation is available while the booking
                        is assigned and awaiting delivery.
                      </div>
                    )}
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

export default StaffDispatchManagement;
