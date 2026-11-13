
import { useEffect, useState } from "react";

import {
  getAvailableLoadsApi,
  acceptLoadApi,
  getMyLoadsApi,
  updateDeliveryStatusApi,
} from "../services/api";

export default function DriverDashboard({
  driver,
  onLogout,
  onFinanceEnquiry,
  onBuyVehicles,
  onSellVehicle,
}) {
  const [activeTab, setActiveTab] = useState("available");
  const [availableLoads, setAvailableLoads] = useState([]);
  const [myLoads, setMyLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isApproved = driver?.verificationStatus === "approved";

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [availableData, myLoadsData] = await Promise.all([
        getAvailableLoadsApi(),
        getMyLoadsApi(),
      ]);

      setAvailableLoads(availableData.loads || []);
      setMyLoads(myLoadsData.loads || []);
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleAcceptLoad(bookingId) {
    try {
      setActionLoading(bookingId);
      setError("");
      setSuccess("");

      await acceptLoadApi(bookingId);

      setSuccess("Load accepted successfully!");
      await loadDashboard();
      setActiveTab("my-loads");
    } catch (err) {
      setError(err.message || "Unable to accept load.");
    } finally {
      setActionLoading("");
    }
  }

  async function handleStatusUpdate(bookingId, status) {
    try {
      setActionLoading(bookingId);
      setError("");
      setSuccess("");

      await updateDeliveryStatusApi(bookingId, status);

      setSuccess(`Delivery status updated to ${status}.`);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Unable to update delivery status.");
    } finally {
      setActionLoading("");
    }
  }

  function formatDate(date) {
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
  }

  function renderLoadCard(load, isMyLoad = false) {
    const pickupConfirmed = Boolean(load.pickupConfirmedAt);

    return (
      <article className="driver-load-card" key={load._id}>
        <div className="driver-load-header">
          <span className="driver-load-type">
            {load.truckType?.replace("-", " ")}
          </span>

          <span className={`driver-load-status status-${load.status}`}>
            {load.status}
          </span>
        </div>

        <div className="driver-load-route">
          <div>
            <span>PICKUP LOCATION</span>
            <h3>{load.pickupLocation}</h3>
          </div>

          <span className="driver-route-arrow">→</span>

          <div>
            <span>DROP LOCATION</span>
            <h3>{load.dropLocation}</h3>
          </div>
        </div>

        <div className="driver-load-info">
          <div>
            <span>Goods</span>
            <strong>{load.goodsType}</strong>
          </div>

          <div>
            <span>Weight</span>
            <strong>{load.goodsWeightKg} kg</strong>
          </div>

          <div>
            <span>Pickup Date</span>
            <strong>{formatDate(load.pickupDate)}</strong>
          </div>

          <div>
            <span>Pickup Time</span>
            <strong>{load.pickupTime}</strong>
          </div>
        </div>

        {isMyLoad && (
          <div className="driver-customer-info">
            <span>Customer</span>
            <strong>{load.customer?.name || "Customer"}</strong>
            <span>{load.customer?.phone || ""}</span>
          </div>
        )}

        {!isMyLoad && (
          <button
            type="button"
            className="driver-action-btn"
            disabled={!isApproved || actionLoading === load._id}
            onClick={() => handleAcceptLoad(load._id)}
          >
            {actionLoading === load._id
              ? "Accepting..."
              : isApproved
                ? "Accept Load"
                : "Verification Pending"}
          </button>
        )}

        {isMyLoad && isApproved && (
          <div className="driver-status-actions">
            {load.status === "assigned" && (
              pickupConfirmed ? (
                <div className="driver-pickup-confirmed">
                  <p>
                    ✓ Customer pickup confirmed by RaahSetu staff
                  </p>

                  <span>
                    Confirmed on {formatDate(load.pickupConfirmedAt)}
                  </span>

                  <button
                    type="button"
                    className="driver-action-btn"
                    disabled={actionLoading === load._id}
                    onClick={() =>
                      handleStatusUpdate(load._id, "in-transit")
                    }
                  >
                    {actionLoading === load._id
                      ? "Updating..."
                      : "Start Delivery"}
                  </button>
                </div>
              ) : (
                <div className="driver-pickup-pending">
                  <strong>Waiting for Pickup Confirmation</strong>
                  <p>
                    RaahSetu staff will contact the customer and confirm
                    pickup. You can start delivery after confirmation.
                  </p>
                </div>
              )
            )}

            {load.status === "in-transit" && (
              <button
                type="button"
                className="driver-action-btn"
                disabled={actionLoading === load._id}
                onClick={() =>
                  handleStatusUpdate(load._id, "delivered")
                }
              >
                {actionLoading === load._id
                  ? "Updating..."
                  : "Mark as Delivered"}
              </button>
            )}

            {load.status === "delivered" && (
              <p className="driver-delivered-message">
                ✓ Delivery completed
              </p>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="driver-dashboard-page">
      <header className="driver-dashboard-header">
        <div>
          <span className="driver-dashboard-brand">RaahSetu</span>
          <p>Driver Portal</p>
        </div>

        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>

      <section className="driver-dashboard-content">
        <div className="driver-dashboard-welcome">
          <div>
            <p>DRIVER DASHBOARD</p>
            <h1>Welcome, {driver?.name || "Driver"}!</h1>
            <span>Manage your loads and deliveries.</span>
          </div>

          <span
            className={`driver-verification-badge ${
              isApproved ? "approved" : "pending"
            }`}
          >
            {driver?.verificationStatus || "pending"}
          </span>
        </div>

        {!isApproved && (
          <div className="driver-pending-notice">
            Your account is waiting for verification. You can view
            available loads, but accepting loads and updating delivery
            status will be available after approval.
          </div>
        )}

        <div className="driver-dashboard-tabs">
          <button
            type="button"
            className={activeTab === "available" ? "active" : ""}
            onClick={() => setActiveTab("available")}
          >
            Available Loads ({availableLoads.length})
          </button>

          <button
            type="button"
            className={activeTab === "my-loads" ? "active" : ""}
            onClick={() => setActiveTab("my-loads")}
          >
            My Loads ({myLoads.length})
          </button>
        </div>

        {error && (
          <p className="driver-dashboard-error">{error}</p>
        )}

        {success && (
          <p className="driver-dashboard-success">{success}</p>
        )}

        {loading ? (
          <p className="driver-dashboard-message">
            Loading your dashboard...
          </p>
        ) : (
          <>
            {activeTab === "available" && (
              <section className="driver-load-list">
                {availableLoads.length > 0 ? (
                  availableLoads.map((load) =>
                    renderLoadCard(load)
                  )
                ) : (
                  <p className="driver-dashboard-message">
                    No matching loads are available right now.
                  </p>
                )}
              </section>
            )}

            {activeTab === "my-loads" && (
              <section className="driver-load-list">
                {myLoads.length > 0 ? (
                  myLoads.map((load) =>
                    renderLoadCard(load, true)
                  )
                ) : (
                  <p className="driver-dashboard-message">
                    You have not accepted any loads yet.
                  </p>
                )}
              </section>
            )}
          </>
        )}

        <button
          type="button"
          className="driver-refresh-btn"
          onClick={loadDashboard}
          disabled={loading}
        >
          Refresh Loads
        </button>

        <button
          type="button"
          className="driver-refresh-btn"
          onClick={onFinanceEnquiry}
        >
          Finance & Insurance Enquiry →
        </button>

        <button
          type="button"
          className="driver-refresh-btn"
          onClick={onBuyVehicles}
        >
          Buy Vehicles →
        </button>

        <button
          type="button"
          className="driver-refresh-btn"
          onClick={onSellVehicle}
        >
          Sell Vehicle →
        </button>
      </section>
    </main>
  );
}
