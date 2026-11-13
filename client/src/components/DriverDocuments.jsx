
import { useEffect, useState } from "react";

import {
  uploadDriverDocumentsApi,
  getDriverProfileApi,
} from "../services/api";

const documentFields = [
  {
    key: "license",
    label: "Driving Licence",
    description: "Upload your valid driving licence.",
  },
  {
    key: "vehicleRC",
    label: "Vehicle Registration (RC)",
    description: "Upload your vehicle registration certificate.",
  },
  {
    key: "identity",
    label: "Identity Proof",
    description: "Upload a valid identity document.",
  },
];

const emptyDocuments = {
  license: null,
  vehicleRC: null,
  identity: null,
};

function DriverDocuments({ onComplete }) {
  const [documents, setDocuments] = useState({ ...emptyDocuments });
  const [savedDocuments, setSavedDocuments] = useState({
    ...emptyDocuments,
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================================
  // RESTORE SAVED DOCUMENTS
  // =========================================

  useEffect(() => {
    let isMounted = true;

    async function loadDriverDocuments() {
      try {
        const result = await getDriverProfileApi();

        if (!result?.driver) {
          throw new Error("Driver profile not found.");
        }

        if (!isMounted) return;

        const saved = result.driver.documents || {};

        setSavedDocuments({
          license: saved.license || null,
          vehicleRC: saved.vehicleRC || null,
          identity: saved.identity || null,
        });
      } catch (err) {
        if (isMounted) {
          setError(
            err.message || "Unable to load saved documents."
          );
        }
      } finally {
        if (isMounted) {
          setFetching(false);
        }
      }
    }

    loadDriverDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================
  // FILE VALIDATION AND SELECTION
  // =========================================

  function handleFileChange(e, key) {
    const file = e.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and PDF files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Each document must be under 5 MB.");
      e.target.value = "";
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [key]: file,
    }));

    e.target.value = "";
  }

  // =========================================
  // REMOVE SELECTED FILE
  // =========================================

  function removeDocument(key) {
    setDocuments((prev) => ({
      ...prev,
      [key]: null,
    }));

    setError("");
    setSuccess("");
  }

  // =========================================
  // FORMAT FILE SIZE
  // =========================================

  function formatFileSize(size) {
    if (!size) return "";

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  // =========================================
  // DOCUMENT COMPLETION COUNT
  // =========================================

  function getUploadedCount(saved = savedDocuments) {
    return documentFields.filter(
      (field) => Boolean(saved[field.key]?.filename)
    ).length;
  }

  // =========================================
  // CHECK ALL DOCUMENTS
  // =========================================

  function areAllDocumentsUploaded(saved) {
    return documentFields.every(
      (field) => Boolean(saved[field.key]?.filename)
    );
  }

  // =========================================
  // SUBMIT DOCUMENTS
  // =========================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (loading) return;

    const hasNewFiles = Object.values(documents).some(Boolean);

    // If all documents already exist and no replacement selected,
    // allow the driver to return to dashboard.
    if (!hasNewFiles) {
      if (areAllDocumentsUploaded(savedDocuments)) {
        onComplete?.({
          documents: savedDocuments,
          verificationStatus: "pending",
        });
        return;
      }

      setError("Please select at least one missing document.");
      return;
    }

    try {
      setLoading(true);

      // Send only newly selected or replaced documents.
      const filesToUpload = {};

      for (const field of documentFields) {
        if (documents[field.key]) {
          filesToUpload[field.key] = documents[field.key];
        }
      }

      const result = await uploadDriverDocumentsApi(filesToUpload);

      if (!result) {
        throw new Error("Invalid response received from server.");
      }

      // Preserve existing documents and merge uploaded documents.
      const updatedDocuments = {
        ...savedDocuments,
        ...(result.documents || {}),
      };

      setSavedDocuments(updatedDocuments);
      setDocuments({ ...emptyDocuments });

      const allDocumentsUploaded =
        areAllDocumentsUploaded(updatedDocuments);

      if (allDocumentsUploaded) {
        setSuccess("All documents uploaded successfully.");

        onComplete?.({
          ...result,
          documents: updatedDocuments,
        });
      } else {
        setSuccess(
          "Documents saved successfully. Please upload the remaining documents."
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to upload documents."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // LOADING SCREEN
  // =========================================

  if (fetching) {
    return (
      <div className="auth-page">
        <section className="auth-card driver-registration-card">
          <p>Loading your saved documents...</p>
        </section>
      </div>
    );
  }

  const uploadedCount = getUploadedCount();

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <div className="auth-page">
      <section className="auth-card driver-registration-card">

        <div className="auth-brand">
          <span className="brand-mark">R</span>
          RaahSetu
        </div>

        <p className="eyebrow">
          DRIVER REGISTRATION · STEP 03
        </p>

        <h1>Upload Documents</h1>

        <p className="auth-description">
          Upload clear copies of your driving and identity documents.
          You can upload or replace each document separately.
        </p>

        {/* COMPLETION */}

        <div className="driver-form-note">
          Documents completed: {uploadedCount}/{documentFields.length}
        </div>

        <div className="driver-profile-main-progress">
          <span
            style={{
              width: `${(uploadedCount / documentFields.length) * 100}%`,
            }}
          />
        </div>

        <form onSubmit={handleSubmit}>

          {documentFields.map((field) => {
            const selectedFile = documents[field.key];
            const savedFile = savedDocuments[field.key];

            const isUploaded = Boolean(savedFile?.filename);

            return (
              <div
                className="document-upload-field"
                key={field.key}
              >

                {/* DOCUMENT LABEL */}

                <label>
                  {field.label}

                  {!isUploaded && (
                    <span className="required-mark"> *</span>
                  )}
                </label>

                <p className="driver-form-note">
                  {field.description}
                </p>

                {/* SAVED DOCUMENT */}

                {isUploaded && (
                  <div className="document-selected">
                    <div>
                      <span>
                        ✓ {savedFile.originalName || "Document uploaded"}
                      </span>

                      <small>
                        {formatFileSize(savedFile.size)}
                      </small>
                    </div>

                    <span className="document-status">
                      Uploaded
                    </span>
                  </div>
                )}

                {/* FILE SELECTION OPTIONS */}

                <div className="document-actions">

                  <label className="document-option">
                    <span>📁</span>

                    <span>
                      {isUploaded
                        ? "Replace PDF / Photo"
                        : "Choose PDF / Photo"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) =>
                        handleFileChange(e, field.key)
                      }
                      disabled={loading}
                    />
                  </label>

                  <label className="document-option">
                    <span>📷</span>
                    <span>Take Photo</span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      capture="environment"
                      onChange={(e) =>
                        handleFileChange(e, field.key)
                      }
                      disabled={loading}
                    />
                  </label>

                </div>

                {/* NEWLY SELECTED FILE */}

                {selectedFile && (
                  <div className="document-selected">
                    <div>
                      <span>
                        Selected: {selectedFile.name}
                      </span>

                      <small>
                        {formatFileSize(selectedFile.size)}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="document-remove-btn"
                      onClick={() => removeDocument(field.key)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                )}

              </div>
            );
          })}

          {/* ERROR */}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {/* SUCCESS */}

          {success && (
            <p className="success-message" role="status">
              {success}
            </p>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading
              ? "Saving Documents..."
              : uploadedCount === documentFields.length
                ? "Continue"
                : "Save Documents"}
          </button>

        </form>

        <p className="driver-form-note">
          PDF, JPG or PNG · Maximum 5 MB per document.
        </p>

        <p className="auth-footnote">
          Your documents will be reviewed by the RaahSetu verification team.
        </p>

      </section>
    </div>
  );
}

export default DriverDocuments;
