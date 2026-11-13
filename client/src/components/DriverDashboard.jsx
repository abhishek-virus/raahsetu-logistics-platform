
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
  onEditPersonalInfo,
  onEditVehicleDetails,
  onEditDocuments,
}) {
  const [activeTab, setActiveTab] = useState("available");
  const [availableLoads, setAvailableLoads] = useState([]);
  const [myLoads, setMyLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isApproved = driver?.verificationStatus === "approved";

  // =========================================
  // PROFILE COMPLETION
  // =========================================

  const documents = driver?.documents || {};

  const personalFields = [
    Boolean(driver?.name?.trim()),
    Boolean(driver?.email?.trim()),
    Boolean(driver?.address?.trim()),
  ];

  const vehicleFields = [
    driver?.experienceYears != null,
    Boolean(driver?.vehicleType),
    Boolean(driver?.vehicleModel?.trim()),
    Boolean(driver?.vehicleNumber?.trim()),
    Boolean(driver?.licenseNumber?.trim()),
  ];

  const documentFields = [
    Boolean(documents.license?.filename),
    Boolean(documents.vehicleRC?.filename),
    Boolean(documents.identity?.filename),
  ];

  const personalCompleted = personalFields.every(Boolean);
  const vehicleCompleted = vehicleFields.every(Boolean);
  const documentsCompleted = documentFields.every(Boolean);

  const completedFields = [
    ...personalFields,
    ...vehicleFields,
    ...documentFields,
  ].filter(Boolean).length;

  const totalFields = 11;

  const completionPercentage = Math.round(
    (completedFields / totalFields) * 100
  );

  const profileComplete = completionPercentage === 100;

  // =========================================
  // LOAD DASHBOARD DATA
  // =========================================

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        getAvailableLoadsApi(),
        getMyLoadsApi(),
      ]);

      if (results[0].status === "fulfilled") {
        setAvailableLoads(results[0].value.loads || []);
      } else {
        setAvailableLoads([]);
      }

      if (results[1].status === "fulfilled") {
        setMyLoads(results[1].value.loads || []);
      } else {
        setMyLoads([]);
      }

      if (results.some((result) => result.status === "rejected")) {
        setError("Some dashboard data could not be loaded. Please refresh.");
      }
    } catch (err) {
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================================
  // ACCEPT LOAD
  // =========================================

  async function handleAcceptLoad(bookingId) {
    if (!isApproved) {
      setError("Your account must be approved before accepting loads.");
      return;
    }

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

  // =========================================
  // UPDATE DELIVERY STATUS
  // =========================================

  async function handleStatusUpdate(bookingId, status) {
    if (!isApproved) {
      setError("Your account must be approved first.");
      return;
    }

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

  // =========================================
  // DATE FORMAT
  // =========================================

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

  // =========================================
  // PROFILE SECTION CARD
  // =========================================

  function renderProfileSection({
    title,
    description,
    completed,
    completedCount,
    totalCount,
    onEdit,
  }) {
    return (
      <article className="driver-profile-section">
        <div className="driver-profile-section-info">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>

          <span
            className={`driver-profile-status ${
              completed ? "completed" : "incomplete"
            }`}
          >
            {completed ? "Completed" : "Incomplete"}
          </span>
        </div>

        <div className="driver-profile-section-progress">
          <div className="driver-profile-progress-track">
            <span
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            />
          </div>

          <span>
            {completedCount}/{totalCount} completed
          </span>
        </div>

        <button
          type="button"
          className="driver-profile-edit-btn"
          onClick={onEdit}
          disabled={!onEdit}
        >
          {completed ? "Edit Details →" : "Complete Now →"}
        </button>
      </article>
    );
  }

  // =========================================
  // LOAD CARD
  // =========================================

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

  // =========================================
  // MAIN RENDER
  // =========================================

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

        {/* WELCOME */}

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

        {/* PROFILE COMPLETION */}

        <section className="driver-profile-completion">
          <div className="driver-profile-completion-header">
            <div>
              <p className="driver-profile-eyebrow">
                YOUR PROFILE
              </p>

              <h2>Profile Completion</h2>

              <p>
                Complete your details and documents to finish your
                driver registration.
              </p>
            </div>

            <div className="driver-profile-percentage">
              <strong>{completionPercentage}%</strong>
              <span>Completed</span>
            </div>
          </div>

          <div className="driver-profile-main-progress">
            <span
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="driver-profile-count">
            {completedFields} of {totalFields} required fields completed
          </div>

          <div className="driver-profile-sections">
            {renderProfileSection({
              title: "Personal Information",
              description:
                "Name, email address and residential address.",
              completed: personalCompleted,
              completedCount: personalFields.filter(Boolean).length,
              totalCount: personalFields.length,
              onEdit: onEditPersonalInfo,
            })}

            {renderProfileSection({
              title: "Vehicle Information",
              description:
                "Driving experience, vehicle and licence details.",
              completed: vehicleCompleted,
              completedCount: vehicleFields.filter(Boolean).length,
              totalCount: vehicleFields.length,
              onEdit: onEditVehicleDetails,
            })}

            {renderProfileSection({
              title: "Required Documents",
              description:
                "Driving licence, vehicle RC and identity proof.",
              completed: documentsCompleted,
              completedCount: documentFields.filter(Boolean).length,
              totalCount: documentFields.length,
              onEdit: onEditDocuments,
            })}
          </div>

          {profileComplete ? (
            <div className="driver-profile-complete-notice">
              ✓ Your profile information and required documents are complete.
            </div>
          ) : (
            <div className="driver-profile-incomplete-notice">
              Complete the remaining sections to submit your driver
              profile for verification.
            </div>
          )}
        </section>

        {/* VERIFICATION NOTICE */}

        {!isApproved && (
          <div className="driver-pending-notice">
            {driver?.verificationStatus === "rejected"
              ? `Your account verification was rejected. ${
                  driver?.verificationRemarks || "Please review your details and documents."
                }`
              : "Your account is waiting for staff verification. You can view available loads, but accepting loads and updating delivery status will be available after approval."}
          </div>
        )}

        {/* LOAD TABS */}

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

        {/* LOAD LIST */}

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

        {/* DASHBOARD ACTIONS */}

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
