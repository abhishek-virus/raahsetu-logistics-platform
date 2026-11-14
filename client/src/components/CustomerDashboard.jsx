
import { useEffect, useMemo, useState } from "react";
import { getBookingsApi } from "../services/api";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "transport", label: "Book Transport", icon: "＋" },
  { id: "my-bookings", label: "My Bookings", icon: "▤" },
  { id: "finance-enquiry", label: "Finance & Insurance", icon: "₹" },
  { id: "buy-vehicles", label: "Buy Vehicles", icon: "🚚" },
  { id: "sell-vehicle", label: "Sell Vehicle", icon: "↗" },
  { id: "customer-profile", label: "My Profile", icon: "👤" },
];

function formatStatus(status = "pending") {
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerDashboard({
  customer,
  onNavigate,
  onLogout,
}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadBookings() {
      try {
        setLoading(true);
        setError("");

        const response = await getBookingsApi();

        const list = Array.isArray(response)
          ? response
          : response?.bookings || response?.data || [];

        if (!ignore) {
          setBookings(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load bookings.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadBookings();

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: bookings.length,

      pending: bookings.filter(
        (booking) => booking.status === "pending"
      ).length,

      active: bookings.filter((booking) =>
        ["confirmed", "assigned", "in-transit"].includes(
          booking.status
        )
      ).length,

      delivered: bookings.filter(
        (booking) => booking.status === "delivered"
      ).length,
    };
  }, [bookings]);

  const recentBookings = bookings.slice(0, 5);

  const firstName =
    customer?.name?.trim()?.split(" ")[0] || "Customer";

  function navigate(screen) {
    setMobileMenuOpen(false);
    onNavigate?.(screen);
  }

  return (
    <div className="customer-dashboard">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <button
          className="customer-dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`customer-dashboard-sidebar ${
          mobileMenuOpen
            ? "customer-dashboard-sidebar-open"
            : ""
        }`}
      >
        <div className="customer-dashboard-brand">
          <span className="customer-dashboard-brand-mark">
            R
          </span>

          <div>
            <strong>RaahSetu</strong>
            <span>Customer Portal</span>
          </div>
        </div>

        <div className="customer-dashboard-nav-label">
          WORKSPACE
        </div>

        <nav className="customer-dashboard-nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`customer-dashboard-nav-item ${
                item.id === "dashboard" ? "active" : ""
              }`}
              onClick={() => navigate(item.id)}
            >
              <span className="customer-dashboard-nav-icon">
                {item.icon}
              </span>

              {item.label}

              {item.id === "dashboard" && (
                <span className="customer-dashboard-active-dot" />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Bottom */}
        <div className="customer-dashboard-sidebar-bottom">
          <div className="customer-dashboard-help">
            <span className="customer-dashboard-help-icon">
              ?
            </span>

            <strong>Need assistance?</strong>

            <p>
              Our team is here to help with your transport needs.
            </p>
          </div>

          <button
            type="button"
            className="customer-dashboard-logout"
            onClick={onLogout}
          >
            <span>↪</span> Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="customer-dashboard-main">
        {/* Topbar */}
        <header className="customer-dashboard-topbar">
          <button
            type="button"
            className="customer-dashboard-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div className="customer-dashboard-breadcrumb">
            Workspace <span>/</span> Dashboard
          </div>

          <div className="customer-dashboard-user">
            <div className="customer-dashboard-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{customer?.name || "Customer"}</strong>
              <span>Customer Account</span>
            </div>
          </div>
        </header>

        <div className="customer-dashboard-content">
          {/* Welcome Section */}
          <section className="customer-dashboard-welcome">
            <div>
              <span className="customer-dashboard-eyebrow">
                CUSTOMER OVERVIEW
              </span>

              <h1>Welcome back, {firstName}!</h1>

              <p>
                Manage your transport bookings and explore RaahSetu
                services from one place.
              </p>

              <button
                type="button"
                className="customer-dashboard-primary-btn"
                onClick={() => navigate("transport")}
              >
                + Book Transport
              </button>
            </div>

            <div
              className="customer-dashboard-welcome-art"
              aria-hidden="true"
            >
              <div className="customer-dashboard-art-circle">
                <span>🚚</span>
              </div>

              <span className="customer-dashboard-art-caption">
                Moving business forward
              </span>
            </div>
          </section>

          {/* Statistics */}
          <section className="customer-dashboard-stats">
            <article className="customer-dashboard-stat-card">
              <span className="customer-dashboard-stat-icon purple">
                ▤
              </span>

              <span className="customer-dashboard-stat-label">
                Total Bookings
              </span>

              <strong>{loading ? "—" : stats.total}</strong>

              <span className="customer-dashboard-stat-note">
                All your transport requests
              </span>
            </article>

            <article className="customer-dashboard-stat-card">
              <span className="customer-dashboard-stat-icon orange">
                ◷
              </span>

              <span className="customer-dashboard-stat-label">
                Pending
              </span>

              <strong>{loading ? "—" : stats.pending}</strong>

              <span className="customer-dashboard-stat-note">
                Awaiting confirmation
              </span>
            </article>

            <article className="customer-dashboard-stat-card">
              <span className="customer-dashboard-stat-icon blue">
                ⇢
              </span>

              <span className="customer-dashboard-stat-label">
                Active Deliveries
              </span>

              <strong>{loading ? "—" : stats.active}</strong>

              <span className="customer-dashboard-stat-note">
                Confirmed, assigned or in transit
              </span>
            </article>

            <article className="customer-dashboard-stat-card">
              <span className="customer-dashboard-stat-icon green">
                ✓
              </span>

              <span className="customer-dashboard-stat-label">
                Delivered
              </span>

              <strong>{loading ? "—" : stats.delivered}</strong>

              <span className="customer-dashboard-stat-note">
                Successfully completed
              </span>
            </article>
          </section>

          {/* Recent Bookings */}
          <section className="customer-dashboard-section">
            <div className="customer-dashboard-section-heading">
              <div>
                <span className="customer-dashboard-eyebrow">
                  YOUR ACTIVITY
                </span>

                <h2>Recent Bookings</h2>
              </div>

              <button
                type="button"
                className="customer-dashboard-text-btn"
                onClick={() => navigate("my-bookings")}
              >
                View all bookings →
              </button>
            </div>

            {loading && (
              <div className="customer-dashboard-empty">
                Loading your bookings...
              </div>
            )}

            {!loading && error && (
              <div className="customer-dashboard-empty customer-dashboard-error">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              recentBookings.length === 0 && (
                <div className="customer-dashboard-empty">
                  <span>📦</span>

                  <h3>No bookings yet</h3>

                  <p>
                    Your transport bookings will appear here.
                  </p>

                  <button
                    type="button"
                    className="customer-dashboard-primary-btn"
                    onClick={() => navigate("transport")}
                  >
                    Create your first booking
                  </button>
                </div>
              )}

            {!loading &&
              !error &&
              recentBookings.length > 0 && (
                <div className="customer-dashboard-booking-list">
                  {recentBookings.map((booking) => (
                    <article
                      className="customer-dashboard-booking-row"
                      key={booking._id}
                    >
                      <div className="customer-dashboard-booking-icon">
                        🚚
                      </div>

                      <div className="customer-dashboard-route">
                        <strong>
                          {booking.pickupLocation}
                        </strong>

                        <span>→</span>

                        <strong>
                          {booking.dropLocation}
                        </strong>

                        <small>
                          {booking._id} ·{" "}
                          {formatDate(booking.createdAt)}
                        </small>
                      </div>

                      <div className="customer-dashboard-booking-meta">
                        <span>
                          {booking.goodsType || "Goods"}
                        </span>

                        <small>
                          {booking.goodsWeightKg ?? "—"} kg
                        </small>
                      </div>

                      <span
                        className={`customer-dashboard-status status-${booking.status}`}
                      >
                        {formatStatus(booking.status)}
                      </span>
                    </article>
                  ))}
                </div>
              )}
          </section>

          {/* Quick Services */}
          <section className="customer-dashboard-section">
            <div className="customer-dashboard-section-heading">
              <div>
                <span className="customer-dashboard-eyebrow">
                  EXPLORE RAAHSETU
                </span>

                <h2>Quick Services</h2>
              </div>
            </div>

            <div className="customer-dashboard-services">
              <button
                type="button"
                className="customer-dashboard-service-card"
                onClick={() => navigate("transport")}
              >
                <span className="customer-dashboard-service-icon">
                  🚛
                </span>

                <strong>Book Transport</strong>

                <p>
                  Arrange transportation for your goods.
                </p>

                <span className="customer-dashboard-service-arrow">
                  →
                </span>
              </button>

              <button
                type="button"
                className="customer-dashboard-service-card"
                onClick={() => navigate("finance-enquiry")}
              >
                <span className="customer-dashboard-service-icon">
                  ₹
                </span>

                <strong>Finance & Insurance</strong>

                <p>
                  Explore vehicle finance and insurance.
                </p>

                <span className="customer-dashboard-service-arrow">
                  →
                </span>
              </button>

              <button
                type="button"
                className="customer-dashboard-service-card"
                onClick={() => navigate("buy-vehicles")}
              >
                <span className="customer-dashboard-service-icon">
                  🚚
                </span>

                <strong>Buy Vehicles</strong>

                <p>
                  Explore available vehicle listings.
                </p>

                <span className="customer-dashboard-service-arrow">
                  →
                </span>
              </button>

              <button
                type="button"
                className="customer-dashboard-service-card"
                onClick={() => navigate("sell-vehicle")}
              >
                <span className="customer-dashboard-service-icon">
                  ↗
                </span>

                <strong>Sell Vehicle</strong>

                <p>
                  List your vehicle for interested buyers.
                </p>

                <span className="customer-dashboard-service-arrow">
                  →
                </span>
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="customer-dashboard-footer">
            © {new Date().getFullYear()} RaahSetu Logistics.
            All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}
