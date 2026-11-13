
import { useEffect, useState } from "react";
import {
  getPendingDriverVerificationsApi,
  updateDriverVerificationApi,
  getDriverDocumentApi,
} from "../services/api";

const documentTypes = [
  { key: "profilePhoto", label: "Profile Photo" },
  { key: "license", label: "Driving Licence" },
  { key: "vehicleRC", label: "Vehicle RC" },
  { key: "identity", label: "Identity Proof" },
];

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not provided";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StaffDriverVerification({ onBack }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState({});
  const [processingId, setProcessingId] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPendingDriverVerificationsApi();
      setDrivers(response.drivers || []);
    } catch (err) {
      setError(err.message || "Unable to load driver applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const handleRemarkChange = (driverId, value) => {
    setRemarks((previous) => ({
      ...previous,
      [driverId]: value,
    }));
  };

  const handleVerification = async (driverId, status) => {
    const reason = (remarks[driverId] || "").trim();

    if (status === "rejected" && !reason) {
      setError("Please enter a rejection reason before rejecting.");
      return;
    }

    const confirmed = window.confirm(
      status === "approved"
        ? "Are you sure you want to approve this driver?"
        : "Are you sure you want to reject this driver?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(driverId);
      setError("");

      await updateDriverVerificationApi(driverId, {
        status,
        remarks: reason,
      });

      setDrivers((previous) =>
        previous.filter((driver) => driver._id !== driverId)
      );

      setRemarks((previous) => {
        const updated = { ...previous };
        delete updated[driverId];
        return updated;
      });
    } catch (err) {
      setError(err.message || "Unable to update driver verification.");
    } finally {
      setProcessingId("");
    }
  };

  const handleViewDocument = async (driverId, documentType) => {
    try {
      setPreviewLoading(true);
      setError("");

      const blob = await getDriverDocumentApi(driverId, documentType);
      const url = URL.createObjectURL(blob);

      setPreview((previous) => {
        if (previous?.url) {
          URL.revokeObjectURL(previous.url);
        }

        return {
          url,
          documentType,
          isImage: blob.type.startsWith("image/"),
        };
      });
    } catch (err) {
      setError(err.message || "Unable to open driver document.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
  };

  return (
    <main className="staff-verification-page">
      <div className="staff-verification-container">
        <header className="staff-verification-header">
          <div>
            <button
              type="button"
              className="staff-back-button"
              onClick={onBack}
            >
              ← Back to Dashboard
            </button>

            <p className="staff-portal-label">STAFF OPERATIONS</p>

            <h1>Driver Verification</h1>

            <p>
              Review driver registration details and verify submitted
              documents before approving an application.
            </p>
          </div>

          <button
            type="button"
            className="staff-refresh-button"
            onClick={fetchDrivers}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </header>

        <div className="staff-verification-summary">
          <div>
            <span>Pending Applications</span>
            <strong>{drivers.length}</strong>
          </div>
        </div>

        {error && (
          <p className="staff-verification-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <div className="staff-verification-empty">
            Loading driver applications...
          </div>
        ) : drivers.length === 0 ? (
          <div className="staff-verification-empty">
            <span>✓</span>
            <h3>No Pending Applications</h3>
            <p>All driver applications have been reviewed.</p>
          </div>
        ) : (
          <div className="staff-driver-list">
            {drivers.map((driver) => (
              <article
                className="staff-driver-card"
                key={driver._id}
              >
                <div className="staff-driver-card-header">
                  <div>
                    <span className="staff-pending-label">
                      PENDING REVIEW
                    </span>

                    <h2>{driver.name || "Unnamed Driver"}</h2>
                    <p>{driver.phone}</p>
                  </div>

                  <span className="staff-driver-date">
                    Applied: {formatDate(driver.createdAt)}
                  </span>
                </div>

                {/* Personal Information */}
                <section className="staff-driver-details-section">
                  <h3>Personal Information</h3>

                  <div className="staff-driver-details">
                    <div>
                      <span>Email</span>
                      <strong>{driver.email || "Not provided"}</strong>
                    </div>

                    <div>
                      <span>Date of Birth</span>
                      <strong>{formatDate(driver.dateOfBirth)}</strong>
                    </div>

                    <div>
                      <span>Gender</span>
                      <strong>{driver.gender || "Not provided"}</strong>
                    </div>

                    <div>
                      <span>Address</span>
                      <strong>{driver.address || "Not provided"}</strong>
                    </div>

                    <div>
                      <span>Bio</span>
                      <strong>{driver.bio || "Not provided"}</strong>
                    </div>
                  </div>
                </section>

                {/* Vehicle Information */}
                <section className="staff-driver-details-section">
                  <h3>Vehicle & Experience Details</h3>

                  <div className="staff-driver-details">
                    <div>
                      <span>Experience</span>
                      <strong>
                        {driver.experienceYears ?? 0} years
                      </strong>
                    </div>

                    <div>
                      <span>Vehicle Type</span>
                      <strong>
                        {driver.vehicleType || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Vehicle Model</span>
                      <strong>
                        {driver.vehicleModel || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Vehicle Number</span>
                      <strong>
                        {driver.vehicleNumber || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Driving Licence Number</span>
                      <strong>
                        {driver.licenseNumber || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>PAN Number</span>
                      <strong>
                        {driver.panNumber || "Not provided"}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* Uploaded Documents */}
                <section className="staff-driver-documents">
                  <h3>Profile & Uploaded Documents</h3>

                  <div className="staff-document-list">
                    {documentTypes.map((document) => {
                      const file =
                        document.key === "profilePhoto"
                          ? driver.profilePhoto
                          : driver.documents?.[document.key];

                      const hasFile = Boolean(file?.filename);

                      return (
                        <button
                          type="button"
                          key={document.key}
                          className="staff-document-button"
                          disabled={!hasFile || previewLoading}
                          onClick={() =>
                            handleViewDocument(
                              driver._id,
                              document.key
                            )
                          }
                        >
                          <span>
                            {document.key === "profilePhoto" ? "👤" : "📄"}
                          </span>

                          <span>
                            <strong>{document.label}</strong>
                            <small>
                              {hasFile
                                ? file.originalName || "View file"
                                : "Not uploaded"}
                            </small>
                          </span>

                          <span>↗</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Approval / Rejection */}
                <div className="staff-driver-review">
                  <label htmlFor={`remarks-${driver._id}`}>
                    Review Remarks
                  </label>

                  <textarea
                    id={`remarks-${driver._id}`}
                    rows={3}
                    maxLength={500}
                    placeholder="Enter rejection reason or verification notes..."
                    value={remarks[driver._id] || ""}
                    onChange={(e) =>
                      handleRemarkChange(driver._id, e.target.value)
                    }
                  />

                  <div className="staff-driver-actions">
                    <button
                      type="button"
                      className="staff-reject-button"
                      disabled={processingId === driver._id}
                      onClick={() =>
                        handleVerification(driver._id, "rejected")
                      }
                    >
                      {processingId === driver._id
                        ? "Processing..."
                        : "Reject Application"}
                    </button>

                    <button
                      type="button"
                      className="staff-approve-button"
                      disabled={processingId === driver._id}
                      onClick={() =>
                        handleVerification(driver._id, "approved")
                      }
                    >
                      {processingId === driver._id
                        ? "Processing..."
                        : "✓ Approve Driver"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {preview && (
        <div
          className="staff-document-modal"
          onClick={closePreview}
        >
          <section
            className="staff-document-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="staff-document-modal-header">
              <h3>
                {documentTypes.find(
                  (item) => item.key === preview.documentType
                )?.label || "Driver Document"}
              </h3>

              <button
                type="button"
                onClick={closePreview}
                aria-label="Close document preview"
              >
                ×
              </button>
            </div>

            {preview.isImage ? (
              <img
                src={preview.url}
                alt="Driver uploaded document"
                className="staff-document-image"
              />
            ) : (
              <iframe
                title="Driver document preview"
                src={preview.url}
                className="staff-document-frame"
              />
            )}
          </section>
        </div>
      )}
    </main>
  );
}
