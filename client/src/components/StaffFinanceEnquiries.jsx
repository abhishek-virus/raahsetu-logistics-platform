import { useEffect, useState } from "react";

import {
  getStaffFinanceEnquiriesApi,
  updateStaffFinanceEnquiryStatusApi,
} from "../services/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

// Only allow status transitions supported by the backend.
const STATUS_TRANSITIONS = {
  pending: ["pending", "reviewing", "contacted", "closed"],
  reviewing: ["reviewing", "contacted", "closed"],
  contacted: ["contacted", "closed"],
  closed: ["closed"],
};

function StaffFinanceEnquiries({ onBack }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [filter, setFilter] = useState("all");

  // =========================================
  // FETCH ENQUIRIES
  // =========================================

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await getStaffFinanceEnquiriesApi();

      setEnquiries(response.enquiries || []);
    } catch (err) {
      setError(err.message || "Unable to fetch enquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // =========================================
  // UPDATE ENQUIRY STATUS
  // =========================================

  const handleStatusUpdate = async (enquiryId, status) => {
    const currentEnquiry = enquiries.find(
      (enquiry) => enquiry._id === enquiryId
    );

    if (!currentEnquiry) return;

    const allowedTransitions =
      STATUS_TRANSITIONS[currentEnquiry.status] || [];

    if (!allowedTransitions.includes(status)) {
      setError("This status transition is not allowed.");
      return;
    }

    try {
      setProcessingId(enquiryId);
      setError("");
      setSuccess("");

      const response = await updateStaffFinanceEnquiryStatusApi(
        enquiryId,
        status
      );

      setEnquiries((previous) =>
        previous.map((enquiry) => {
          if (enquiry._id !== enquiryId) {
            return enquiry;
          }

          // Use updated backend response when available.
          if (response?.enquiry) {
            return response.enquiry;
          }

          // Fallback to local status update.
          return {
            ...enquiry,
            status,
          };
        })
      );

      setSuccess("Enquiry status updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update enquiry status.");
    } finally {
      setProcessingId("");
    }
  };

  // =========================================
  // FORMAT HELPERS
  // =========================================

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

  const formatText = (value) => {
    if (!value || typeof value !== "string") {
      return "Not specified";
    }

    return value
      .split("-")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  };

  // =========================================
  // FILTER ENQUIRIES
  // =========================================

  const visibleEnquiries = enquiries.filter(
    (enquiry) =>
      filter === "all" || enquiry.status === filter
  );

  // =========================================
  // STATUS COUNTS
  // =========================================

  const getStatusCount = (status) =>
    enquiries.filter(
      (enquiry) => enquiry.status === status
    ).length;

  // =========================================
  // RENDER
  // =========================================

  return (
    <main className="staff-verification-page">
      <div className="staff-verification-container">

        {/* HEADER */}

        <header className="staff-verification-header">
          <div>
            <span className="staff-portal-label">
              STAFF OPERATIONS
            </span>

            <h1>Finance & Insurance Enquiries</h1>

            <p>
              Review requests, contact applicants and track enquiry progress.
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

        {/* SUMMARY */}

        <section className="staff-verification-summary">
          <div>
            <span>Total Enquiries</span>
            <strong>{enquiries.length}</strong>
          </div>

          <div>
            <span>Pending</span>
            <strong>{getStatusCount("pending")}</strong>
          </div>

          <div>
            <span>Reviewing</span>
            <strong>{getStatusCount("reviewing")}</strong>
          </div>

          <div>
            <span>Contacted</span>
            <strong>{getStatusCount("contacted")}</strong>
          </div>

          <div>
            <span>Closed</span>
            <strong>{getStatusCount("closed")}</strong>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchEnquiries}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {/* FILTER */}

        <div className="staff-finance-filter">
          <label htmlFor="finance-status-filter">
            Filter by Status
          </label>

          <select
            id="finance-status-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All Enquiries</option>

            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="staff-verification-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            className="staff-finance-success"
            role="status"
          >
            {success}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="staff-verification-message">
            Loading enquiries...
          </div>
        ) : visibleEnquiries.length === 0 ? (
          <div className="staff-verification-empty">
            <h2>No enquiries found</h2>

            <p>
              There are no finance or insurance enquiries matching this filter.
            </p>
          </div>
        ) : (

          /* ENQUIRY LIST */

          <div className="staff-driver-list">

            {visibleEnquiries.map((enquiry) => {
              const allowedTransitions =
                STATUS_TRANSITIONS[enquiry.status] || [
                  enquiry.status,
                ];

              return (
                <article
                  className="staff-driver-card"
                  key={enquiry._id}
                >

                  {/* CARD HEADER */}

                  <div className="staff-driver-card-header">
                    <div>
                      <span className="staff-driver-status">
                        {formatText(enquiry.status)}
                      </span>

                      <h2>
                        {formatText(enquiry.enquiryType)} Enquiry
                      </h2>
                    </div>

                    <span className="staff-driver-experience">
                      {formatDate(enquiry.createdAt)}
                    </span>
                  </div>

                  {/* APPLICANT DETAILS */}

                  <div className="staff-driver-info-grid">

                    <div>
                      <span>Applicant Name</span>
                      <strong>
                        {enquiry.applicantName || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Phone Number</span>
                      <strong>
                        {enquiry.phone || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Requester Type</span>
                      <strong>
                        {formatText(enquiry.requesterRole)}
                      </strong>
                    </div>

                    <div>
                      <span>Vehicle Type</span>
                      <strong>
                        {formatText(enquiry.vehicleType)}
                      </strong>
                    </div>

                    <div>
                      <span>RC Number</span>
                      <strong>
                        {enquiry.rcNumber || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Enquiry ID</span>
                      <strong>
                        #{enquiry._id?.slice(-8).toUpperCase()}
                      </strong>
                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="staff-finance-actions">

                    {/* CONTACT */}

                    <div className="staff-finance-contact">
                      <span>Applicant Contact</span>

                      {enquiry.phone ? (
                        <a href={`tel:${enquiry.phone}`}>
                          Call {enquiry.phone}
                        </a>
                      ) : (
                        <span>Phone unavailable</span>
                      )}
                    </div>

                    {/* STATUS UPDATE */}

                    <div className="staff-finance-status-control">
                      <label htmlFor={`status-${enquiry._id}`}>
                        Update Status
                      </label>

                      <select
                        id={`status-${enquiry._id}`}
                        value={enquiry.status}
                        disabled={
                          processingId === enquiry._id ||
                          enquiry.status === "closed"
                        }
                        onChange={(event) =>
                          handleStatusUpdate(
                            enquiry._id,
                            event.target.value
                          )
                        }
                      >
                        {STATUS_OPTIONS.filter((option) =>
                          allowedTransitions.includes(option.value)
                        ).map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {processingId === enquiry._id && (
                        <small>Updating status...</small>
                      )}

                      {enquiry.status === "closed" && (
                        <small>
                          This enquiry has been closed.
                        </small>
                      )}
                    </div>

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

export default StaffFinanceEnquiries;
