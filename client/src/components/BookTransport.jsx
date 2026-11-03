
import { useState } from "react";
import { createBookingApi } from "../services/api";

export default function BookTransport({
  booking,
  onBack,
  onBookingCreated,
}) {
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [goodsType, setGoodsType] = useState("");
  const [goodsWeightKg, setGoodsWeightKg] = useState("");
  const [truckType, setTruckType] = useState("mini-truck");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const truckLabels = {
    "mini-truck": "Mini truck",
    "light-truck": "Light truck",
    "heavy-truck": "Heavy truck",
  };

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!booking?.fromLocation || !booking?.toLocation) {
      setError("Please confirm pickup and drop locations first.");
      return;
    }

    if (
      !pickupDate ||
      !pickupTime ||
      !goodsType.trim() ||
      !goodsWeightKg
    ) {
      setError("Please complete all transport details.");
      return;
    }

    if (pickupDate < minDate) {
      setError("Pickup date cannot be in the past.");
      return;
    }

    if (goodsType.trim().length > 100) {
      setError("Goods type must not exceed 100 characters.");
      return;
    }

    const weight = Number(goodsWeightKg);

    if (!Number.isFinite(weight) || weight < 1) {
      setError("Goods weight must be at least 1 kg.");
      return;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        truckLabels,
        truckType
      )
    ) {
      setError("Please select a valid truck category.");
      return;
    }

    // Only show the review screen. Do not create a booking yet.
    setShowReview(true);
  }

  async function handleConfirmBooking() {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const result = await createBookingApi({
        pickupLocation: booking.fromLocation,
        dropLocation: booking.toLocation,
        pickupDate,
        pickupTime,
        goodsType: goodsType.trim(),
        goodsWeightKg: Number(goodsWeightKg),
        truckType,
      });

      if (!result?.booking?._id) {
        throw new Error(
          "Booking response was incomplete. Please check your bookings before retrying."
        );
      }

      onBookingCreated(result.booking);
    } catch (err) {
      setError(
        err.message || "Unable to create booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleEditDetails() {
    setError("");
    setShowReview(false);
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <a
          className="brand"
          href="/"
          aria-label="RaahSetu home"
        >
          <span className="brand-mark">R</span>
          <span className="brand-name">RaahSetu</span>
        </a>

        <button
          type="button"
          className="logout-button"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </button>
      </header>

      <section className="booking-content">
        <div className="booking-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            YOUR NEXT STEP
          </p>

          <h1>Tell us about your goods.</h1>

          <p className="booking-subtitle">
            Review your route and add the details needed for transport.
          </p>
        </div>

        <section
          className="customer-info"
          aria-label="Confirmed route"
        >
          <div className="customer-avatar" aria-hidden="true">
            R
          </div>

          <div className="customer-details">
            <span className="customer-welcome">YOUR ROUTE</span>
            <strong>{booking?.fromLocation}</strong>
            <p>To: {booking?.toLocation}</p>
          </div>
        </section>

        {!showReview && (
          <form
            className="location-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="form-heading">
              <div>
                <h2>Transport details</h2>
                <p>
                  Provide your pickup schedule and goods information.
                </p>
              </div>

              <span className="step-indicator">STEP 02</span>
            </div>

            <div className="route-fields">
              <div className="field-content">
                <label htmlFor="pickup-date">Pickup date</label>
                <input
                  id="pickup-date"
                  name="pickupDate"
                  type="date"
                  min={minDate}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                />
              </div>

              <div className="field-content">
                <label htmlFor="pickup-time">Pickup time</label>
                <input
                  id="pickup-time"
                  name="pickupTime"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                />
              </div>

              <div className="field-content">
                <label htmlFor="goods-type">Type of goods</label>
                <input
                  id="goods-type"
                  name="goodsType"
                  type="text"
                  placeholder="e.g. Furniture, electronics"
                  maxLength={100}
                  value={goodsType}
                  onChange={(e) => setGoodsType(e.target.value)}
                  required
                />
              </div>

              <div className="field-content">
                <label htmlFor="goods-weight">
                  Goods weight (kg)
                </label>
                <input
                  id="goods-weight"
                  name="goodsWeightKg"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={goodsWeightKg}
                  onChange={(e) => setGoodsWeightKg(e.target.value)}
                  required
                />
              </div>

              <div className="field-content">
                <label htmlFor="truck-type">Truck category</label>
                <select
                  id="truck-type"
                  name="truckType"
                  value={truckType}
                  onChange={(e) => setTruckType(e.target.value)}
                  required
                >
                  <option value="mini-truck">Mini truck</option>
                  <option value="light-truck">Light truck</option>
                  <option value="heavy-truck">Heavy truck</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="booking-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-confirm"
              disabled={loading}
            >
              Review booking
              <span aria-hidden="true">→</span>
            </button>

            <p className="form-disclaimer">
              Review all details before creating your booking.
            </p>
          </form>
        )}

        {showReview && (
          <section
            className="booking-confirmation"
            aria-labelledby="review-title"
            aria-live="polite"
          >
            <div className="confirmation-top">
              <span className="confirmation-icon" aria-hidden="true">
                ✓
              </span>

              <div>
                <p className="confirmation-label">FINAL REVIEW</p>
                <h2 id="review-title">
                  Confirm your transport details
                </h2>
              </div>
            </div>

            <div className="confirmed-route">
              <div className="confirmed-location">
                <div>
                  <span className="confirmed-label">PICKUP FROM</span>
                  <p>{booking.fromLocation}</p>
                </div>
              </div>

              <div className="confirmed-location">
                <div>
                  <span className="confirmed-label">DELIVER TO</span>
                  <p>{booking.toLocation}</p>
                </div>
              </div>

              <div className="confirmed-location">
                <div>
                  <span className="confirmed-label">
                    PICKUP DATE & TIME
                  </span>
                  <p>{pickupDate} at {pickupTime}</p>
                </div>
              </div>

              <div className="confirmed-location">
                <div>
                  <span className="confirmed-label">GOODS</span>
                  <p>
                    {goodsType.trim()} · {Number(goodsWeightKg)} kg
                  </p>
                </div>
              </div>

              <div className="confirmed-location">
                <div>
                  <span className="confirmed-label">
                    TRUCK CATEGORY
                  </span>
                  <p>{truckLabels[truckType]}</p>
                </div>
              </div>
            </div>

            <p className="confirmation-note">
              Please verify your details. Your booking will be
              created only after you select Confirm Booking.
            </p>

            {error && (
              <p className="booking-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </p>
            )}

            <button
              type="button"
              className="btn-confirm"
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? "Confirming..." : "Confirm Booking"}
              {!loading && <span aria-hidden="true">→</span>}
            </button>

            <button
              type="button"
              className="logout-button"
              onClick={handleEditDetails}
              disabled={loading}
            >
              Edit details
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
