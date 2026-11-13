
import { useEffect, useState } from "react";
import { getStaffDashboardStatsApi } from "../services/api";

const initialStats = {
  pendingDrivers: 0,
  pendingLoads: 0,
  confirmedLoads: 0,
  assignedLoads: 0,
  activeDeliveries: 0,
  pendingVehicles: 0,
  pendingFinanceEnquiries: 0,
};

export default function StaffDashboard({
  staff,
  onLogout,
  onNavigate,
}) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setError("");
      setLoading(true);

      const response = await getStaffDashboardStatsApi();

      setStats({
        ...initialStats,
        ...response.stats,
      });
    } catch (err) {
      setError(err.message || "Unable to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Pending Drivers",
      value: stats.pendingDrivers,
      icon: "👤",
      color: "blue",
    },
    {
      label: "Pending Loads",
      value: stats.pendingLoads,
      icon: "📦",
      color: "orange",
    },
    {
      label: "Confirmed Loads",
      value: stats.confirmedLoads,
      icon: "✓",
      color: "green",
    },
    {
      label: "Assigned Loads",
      value: stats.assignedLoads,
      icon: "🚚",
      color: "purple",
    },
    {
      label: "Active Deliveries",
      value: stats.activeDeliveries,
      icon: "🛣️",
      color: "blue",
    },
    {
      label: "Pending Vehicles",
      value: stats.pendingVehicles,
      icon: "🚛",
      color: "orange",
    },
    {
      label: "Finance Enquiries",
      value: stats.pendingFinanceEnquiries,
      icon: "💰",
      color: "green",
    },
  ];

  const managementSections = [
    {
      title: "Driver Verification",
      description: "Review driver profiles and uploaded documents.",
      icon: "👤",
      action: "driver-verification",
    },
    {
      title: "Load Verification",
      description: "Review customer bookings and manage dispatch.",
      icon: "📦",
      action: "load-verification",
    },
    {
      title: "Vehicle Listing Review",
      description: "Review seller vehicle information and photographs.",
      icon: "🚛",
      action: "vehicle-review",
    },
    {
      title: "Vehicle Buyer Interests",
      description: "View interested buyers and contact them about vehicle listings.",
      icon: "🤝",
      action: "vehicle-interests",
    },
    {
      title: "Finance & Insurance",
      description: "Manage customer and driver enquiries.",
      icon: "💰",
      action: "finance-enquiries",
    },
    {
      title: "Dispatch Management",
      description: "Manage accepted loads and confirm customer pickups.",
      icon: "🚚",
      action: "dispatch-management",
    },
  ];

  return (
    <main className="staff-dashboard-page">
      <div className="staff-dashboard-container">

        <header className="staff-dashboard-header">
          <div className="auth-brand">
            <span className="brand-mark">R</span>
            RaahSetu
            <span className="staff-portal-label">STAFF PORTAL</span>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Log out
          </button>
        </header>

        <section className="staff-welcome-section">
          <div>
            <p className="eyebrow">OPERATIONS OVERVIEW</p>

            <h1>
              Welcome, {staff?.name || "Staff"}!
            </h1>

            <p className="auth-description">
              Manage bookings, drivers, vehicle listings and customer enquiries.
            </p>

            <span className="staff-email">
              {staff?.email}
            </span>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchStats}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </section>

        <section className="staff-stats-section">
          <div className="staff-section-heading">
            <div>
              <h2>Operations Overview</h2>
              <p>Current platform activity</p>
            </div>
          </div>

          {error && (
            <div className="staff-error-message" role="alert">
              {error}

              <button type="button" onClick={fetchStats}>
                Retry
              </button>
            </div>
          )}

          <div className="staff-stats-grid">
            {statCards.map((item) => (
              <article
                className="staff-stat-card"
                key={item.label}
              >
                <div className={`staff-stat-icon ${item.color}`}>
                  {item.icon}
                </div>

                <div>
                  <p>{item.label}</p>

                  <strong>
                    {loading ? "—" : item.value}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="staff-management-section">
          <div className="staff-section-heading">
            <div>
              <h2>Management Desk</h2>
              <p>Select an operation to continue.</p>
            </div>
          </div>

          <div className="staff-management-grid">
            {managementSections.map((item) => (
              <button
                type="button"
                className="staff-management-card"
                key={item.action}
                onClick={() => onNavigate(item.action)}
              >
                <span className="staff-management-icon">
                  {item.icon}
                </span>

                <span className="staff-management-content">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>

                <span className="staff-management-arrow">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="staff-dashboard-footer">
          RaahSetu Staff Operations
        </footer>

      </div>
    </main>
  );
}
