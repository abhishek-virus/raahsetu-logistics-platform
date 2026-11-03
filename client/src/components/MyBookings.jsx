
import { useEffect, useState } from "react";
import {
  getBookingsApi,
  getBookingByIdApi,
} from "../services/api";

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getStatusSteps(status) {
  const steps = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "assigned", label: "Truck Assigned" },
    { value: "in-transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
  ];

  if (status === "cancelled") {
    return [
      { value: "pending", label: "Pending" },
      { value: "cancelled", label: "Cancelled" },
    ];
  }

  return steps;
}

export default function MyBookings({ onBack, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadBookings() {
      try {
        setLoading(true);
        setError("");

        const response = await getBookingsApi();

        if (ignore) return;

        const bookingList = Array.isArray(response)
          ? response
          : response.bookings || response.data || [];

        setBookings(bookingList);
      } catch (err) {
        if (!ignore) {
          setError(
            err.message || "Could not load your bookings."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleViewDetails(bookingId) {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      setSelectedBooking(null);

      const response = await getBookingByIdApi(bookingId);

      const booking =
        response.booking || response.data || response;

      setSelectedBooking(booking);
    } catch (err) {
      setDetailsError(
        err.message || "Could not load booking details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function renderBookingDetails(booking) {
    return (
      <section className="booking-confirmation">
        <div className="confirmation-top">
          <span className="confirmation-icon">✓</span>

          <div>
            <p className="confirmation-label">
              BOOKING DETAILS
            </p>
            <h2>Your transport request</h2>
          </div>
        </div>

        <div className="confirmed-route">
          <div className="confirmed-location">
            <div>
              <span className="confirmed-label">
                PICKUP FROM
              </span>
              <p>{booking.pickupLocation}</p>
            </div>
          </div>

          <div className="confirmed-location">
            <div>
              <span className="confirmed-label">
                DELIVER TO
              </span>
              <p>{booking.dropLocation}</p>
            </div>
          </div>
        </div>

        <div className="status-tracker">
            <h3>Booking Progress</h3>

            <div className="status-timeline">
                {getStatusSteps(booking.status).map((step, index, steps) => {
                    const currentIndex = steps.findIndex(
                        (item) => item.value === booking.status
                    );

                    const isCompleted = index < currentIndex;
                    const isCurrent = step.value === booking.status;

                    return (
                        <div
                        key={step.value}
                        className={`status-step ${
                            isCompleted ? "completed" : ""
                        } ${isCurrent ? "current" : ""}`}
                        >
                        <span className="status-step-marker">
                            {isCompleted ? "✓" : index + 1}
                        </span>

                        <span className="status-step-label">
                            {step.label}
                        </span>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="booking-detail-grid">
          <div>
            <span className="confirmed-label">BOOKING ID</span>
            <p className="booking-id">{booking._id}</p>
          </div>

          <div>
            <span className="confirmed-label">STATUS</span>
            <p>
              <span
                className={`booking-status status-${booking.status}`}
              >
                {formatStatus(booking.status)}
              </span>
            </p>
          </div>

          <div>
            <span className="confirmed-label">PICKUP DATE</span>
            <p>{formatDate(booking.pickupDate)}</p>
          </div>

          <div>
            <span className="confirmed-label">PICKUP TIME</span>
            <p>{booking.pickupTime || "Not available"}</p>
          </div>

          <div>
            <span className="confirmed-label">GOODS TYPE</span>
            <p>{booking.goodsType || "Not available"}</p>
          </div>

          <div>
            <span className="confirmed-label">WEIGHT</span>
            <p>
              {booking.goodsWeightKg != null
                ? `${booking.goodsWeightKg} kg`
                : "Not available"}
            </p>
          </div>

          <div>
            <span className="confirmed-label">TRUCK TYPE</span>
            <p>
              {booking.truckType
                ? formatStatus(booking.truckType)
                : "Not available"}
            </p>
          </div>

          <div>
            <span className="confirmed-label">CREATED ON</span>
            <p>{formatDate(booking.createdAt)}</p>
          </div>
        </div>

        <p className="confirmation-note">
          Booking details are retrieved from your account.
          Truck assignment depends on the current booking status.
        </p>

        <button
          type="button"
          className="btn-confirm"
          onClick={() => setSelectedBooking(null)}
        >
          Back to My Bookings
        </button>
      </section>
    );
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-name">RaahSetu</span>
        </div>

        <div className="booking-actions">
          <button
            type="button"
            className="logout-button"
            onClick={onBack}
          >
            Back to Home
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
            YOUR TRANSPORT ACTIVITY
          </p>

          <h1>My Bookings</h1>

          <p className="booking-subtitle">
            View your transport requests, track their status,
            and open a booking to see its complete details.
          </p>
        </div>

        {loading && (
          <div className="booking-state">
            <p>Loading your bookings...</p>
          </div>
        )}

        {!loading && error && (
          <div className="booking-error" role="alert">
            <p>{error}</p>

            <button
              type="button"
              className="btn-confirm"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {detailsLoading && (
              <div className="booking-state">
                <p>Loading booking details...</p>
              </div>
            )}

            {detailsError && (
              <div className="booking-error" role="alert">
                <p>{detailsError}</p>
              </div>
            )}

            {selectedBooking &&
              renderBookingDetails(selectedBooking)}

            {!selectedBooking &&
              !detailsLoading &&
              bookings.length === 0 && (
                <div className="booking-confirmation">
                  <div className="confirmation-top">
                    <span className="confirmation-icon">i</span>

                    <div>
                      <p className="confirmation-label">
                        NO BOOKINGS YET
                      </p>
                      <h2>Your journey starts here</h2>
                    </div>
                  </div>

                  <p className="confirmation-note">
                    You have not created any transport bookings yet.
                    Your future bookings will appear here.
                  </p>

                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={onBack}
                  >
                    Create a Booking
                  </button>
                </div>
              )}

            {!selectedBooking &&
              !detailsLoading &&
              bookings.length > 0 && (
                <div className="booking-list">
                  <div className="booking-list-heading">
                    <h2>Booking History</h2>
                    <span>{bookings.length} total</span>
                  </div>

                  {bookings.map((booking) => (
                    <article
                      className="booking-card"
                      key={booking._id}
                    >
                      <div className="booking-card-header">
                        <span className="confirmed-label">
                          BOOKING ID
                        </span>

                        <span
                          className={`booking-status status-${booking.status}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </div>

                      <p className="booking-id">
                        {booking._id}
                      </p>

                      <div className="booking-route-row">
                        <div>
                          <span className="confirmed-label">
                            PICKUP
                          </span>
                          <p>{booking.pickupLocation}</p>
                        </div>

                        <span className="route-arrow">→</span>

                        <div>
                          <span className="confirmed-label">
                            DROP
                          </span>
                          <p>{booking.dropLocation}</p>
                        </div>
                      </div>

                      <div className="booking-meta">
                        <span>
                          <strong>Date:</strong>{" "}
                          {formatDate(booking.pickupDate)}
                        </span>

                        <span>
                          <strong>Goods:</strong>{" "}
                          {booking.goodsType}
                        </span>

                        <span>
                          <strong>Weight:</strong>{" "}
                          {booking.goodsWeightKg} kg
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn-confirm"
                        onClick={() =>
                          handleViewDetails(booking._id)
                        }
                      >
                        View Details
                      </button>
                    </article>
                  ))}
                </div>
              )}
          </>
        )}
      </section>
    </main>
  );
}
