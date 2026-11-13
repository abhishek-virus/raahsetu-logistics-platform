
import { useState } from "react";
import { uploadDriverDocumentsApi } from "../services/api";

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

function DriverDocuments({ onComplete }) {
  const [documents, setDocuments] = useState({
    license: null,
    vehicleRC: null,
    identity: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e, key) {
    const file = e.target.files?.[0];

    setError("");

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

    // Allow selecting the same file again if needed.
    e.target.value = "";
  }

  function removeDocument(key) {
    setDocuments((prev) => ({
      ...prev,
      [key]: null,
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const missingDocument = documentFields.find(
      (field) => !documents[field.key]
    );

    if (missingDocument) {
      setError(`Please upload ${missingDocument.label}.`);
      return;
    }

    try {
      setLoading(true);

      const result = await uploadDriverDocumentsApi(documents);

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(size) {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

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
        </p>

        <form onSubmit={handleSubmit}>
          {documentFields.map((field) => {
            const selectedFile = documents[field.key];

            return (
              <div
                className="document-upload-field"
                key={field.key}
              >
                <label>
                  {field.label}
                  <span className="required-mark"> *</span>
                </label>

                <p className="driver-form-note">
                  {field.description}
                </p>

                <div className="document-actions">
                  {/* Choose PDF or Photo */}
                  <label className="document-option">
                    <span>📁</span>
                    <span>Choose PDF / Photo</span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) =>
                        handleFileChange(e, field.key)
                      }
                      disabled={loading}
                    />
                  </label>

                  {/* Take Photo */}
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

                {/* Selected Document */}
                {selectedFile && (
                  <div className="document-selected">
                    <div>
                      <span>
                        ✓ {selectedFile.name}
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

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading
              ? "Uploading Documents..."
              : "Upload & Continue"}
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
