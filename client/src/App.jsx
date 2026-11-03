
import "./App.css";
import { useState } from "react";

import CustomerLogin from "./components/CustomerLogin";
import OtpVerification from "./components/OtpVerification";
import BookingHome from "./components/BookingHome";
import BookTransport from "./components/BookTransport";
import MyBookings from "./components/MyBookings";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [booking, setBooking] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  const handleOtpSent = (userPhone) => {
    setPhone(userPhone);
    setScreen("otp");
  };

  const handleVerified = (verifiedCustomer) => {
    setCustomer(verifiedCustomer);
    setScreen("booking");
  };

  const handleBookingConfirm = ({ fromLocation, toLocation }) => {
    setBooking({ fromLocation, toLocation });
    setCreatedBooking(null);
    setScreen("transport");
  };

  const handleBookingCreated = (savedBooking) => {
    setCreatedBooking(savedBooking);
    setScreen("confirmation");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("customer");

    setCustomer(null);
    setBooking(null);
    setCreatedBooking(null);
    setPhone("");
    setScreen("login");
  };

  return (
    <div className="app">
      {screen === "login" && (
        <CustomerLogin onOtpSent={handleOtpSent} />
      )}

      {screen === "otp" && (
        <OtpVerification
          phone={phone}
          onVerified={handleVerified}
          onBack={() => setScreen("login")}
        />
      )}

      {screen === "booking" && customer && (
        <BookingHome
          customer={customer}
          booking={booking}
          onConfirm={handleBookingConfirm}
          onLogout={handleLogout}
          onViewBookings={() => setScreen("my-bookings")}
        />
      )}

      {screen === "my-bookings" && customer && (
        <MyBookings
          onBack={() => setScreen("booking")}
          onLogout={handleLogout}
        />
      )}

      {screen === "transport" && customer && booking && (
        <BookTransport
          booking={booking}
          onBack={() => setScreen("booking")}
          onBookingCreated={handleBookingCreated}
        />
      )}

      {screen === "confirmation" && createdBooking && (
        <main className="booking-page">
          <section className="booking-content">
            <div className="booking-confirmation">
              <div className="confirmation-top">
                <span className="confirmation-icon">✓</span>
                <div>
                  <p className="confirmation-label">
                    BOOKING CREATED
                  </p>
                  <h2>Your transport request is saved!</h2>
                </div>
              </div>

              <div className="confirmed-route">
                <div className="confirmed-location">
                  <div>
                    <span className="confirmed-label">
                      PICKUP FROM
                    </span>
                    <p>{createdBooking.pickupLocation}</p>
                  </div>
                </div>

                <div className="confirmed-location">
                  <div>
                    <span className="confirmed-label">
                      DELIVER TO
                    </span>
                    <p>{createdBooking.dropLocation}</p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Booking ID:</strong>{" "}
                {createdBooking._id}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {createdBooking.status}
              </p>

              <p className="confirmation-note">
                Your booking record has been created. A truck has
                not yet been assigned.
              </p>

              <button
                type="button"
                className="btn-confirm"
                onClick={() => {
                  setBooking(null);
                  setCreatedBooking(null);
                  setScreen("booking");
                }}
              >
                Back to Booking Home
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
