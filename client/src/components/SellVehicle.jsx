
import { useEffect, useState } from "react";
import { createVehicleListingApi } from "../services/api";

const photoFields = [
  { name: "front", label: "Front View" },
  { name: "back", label: "Back View" },
  { name: "left", label: "Left Side View" },
  { name: "right", label: "Right Side View" },
];

export default function SellVehicle({
  user,
  tokenType = "customer",
  onBack,
}) {
  const [form, setForm] = useState({
    vehicleType: "mini-truck",
    vehicleModel: "",
    vehicleNumber: "",
    rcNumber: "",
    contactName: user?.name || "",
    contactPhone: user?.phone || "",
  });

  const [photos, setPhotos] = useState({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const [previews, setPreviews] = useState({
    front: "",
    back: "",
    left: "",
    right: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handlePhotoChange(e, side) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WebP photos are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Each vehicle photo must be under 5 MB.");
      e.target.value = "";
      return;
    }

    setPhotos((prev) => ({
      ...prev,
      [side]: file,
    }));

    setPreviews((prev) => {
      if (prev[side]) URL.revokeObjectURL(prev[side]);

      return {
        ...prev,
        [side]: URL.createObjectURL(file),
      };
    });

    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.vehicleModel.trim() ||
      !form.vehicleNumber.trim() ||
      !form.rcNumber.trim() ||
      !form.contactName.trim()
    ) {
      setError("Please complete all vehicle details.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.contactPhone.trim())) {
      setError("Enter a valid 10-digit contact number.");
      return;
    }

    const missingPhoto = photoFields.find(
      (photo) => !photos[photo.name]
    );

    if (missingPhoto) {
      setError(`Please upload the ${missingPhoto.label}.`);
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    photoFields.forEach(({ name }) => {
      formData.append(name, photos[name]);
    });

    try {
      setLoading(true);

      const response = await createVehicleListingApi(
        formData,
        tokenType
      );

      setSuccess(
        response.message ||
          "Vehicle submitted for staff verification."
      );

      setForm((prev) => ({
        ...prev,
        vehicleModel: "",
        vehicleNumber: "",
        rcNumber: "",
      }));

      setPhotos({
        front: null,
        back: null,
        left: null,
        right: null,
      });

      setPreviews({
        front: "",
        back: "",
        left: "",
        right: "",
      });

      e.target.reset();
    } catch (err) {
      setError(err.message || "Unable to submit vehicle listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <a className="brand" href="/" aria-label="RaahSetu home">
          <span className="brand-mark">R</span>
          <span className="brand-name">RaahSetu</span>
        </a>

        <button
          type="button"
          className="logout-button"
          onClick={onBack}
        >
          ← Back
        </button>
      </header>

      <section className="booking-content">
        <div className="booking-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            RAAHSETU MARKETPLACE
          </p>

          <h1>
            Sell your
            <br className="desktop-break" /> vehicle with us.
          </h1>

          <p className="booking-subtitle">
            Share your vehicle details and four clear photos.
            Our team will verify your listing before publishing it.
          </p>
        </div>

        <form
          className="location-form finance-enquiry-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-heading">
            <div>
              <h2>Vehicle information</h2>
              <p>Enter your vehicle and contact details.</p>
            </div>

            <span className="step-indicator">STEP 01</span>
          </div>

          <div className="finance-form-grid">
            <div className="field-content">
              <label htmlFor="vehicleType">Vehicle Type</label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleChange}
              >
                <option value="mini-truck">Mini Truck</option>
                <option value="light-truck">Light Truck</option>
                <option value="heavy-truck">Heavy Truck</option>
              </select>
            </div>

            <div className="field-content">
              <label htmlFor="vehicleModel">Vehicle Model</label>
              <input
                id="vehicleModel"
                name="vehicleModel"
                value={form.vehicleModel}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. Tata Ace"
                required
              />
            </div>

            <div className="field-content">
              <label htmlFor="vehicleNumber">Vehicle Number</label>
              <input
                id="vehicleNumber"
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleChange}
                maxLength={30}
                placeholder="e.g. HRXXAB1234"
                required
              />
            </div>

            <div className="field-content">
              <label htmlFor="rcNumber">RC Number</label>
              <input
                id="rcNumber"
                name="rcNumber"
                value={form.rcNumber}
                onChange={handleChange}
                maxLength={30}
                placeholder="Enter RC number"
                required
              />
            </div>
          </div>

          <div className="form-heading">
            <div>
              <h2>Vehicle photographs</h2>
              <p>Upload all four views. Maximum 5 MB per photo.</p>
            </div>
            <span className="step-indicator">STEP 02</span>
          </div>

          <div className="vehicle-upload-grid">
            {photoFields.map(({ name, label }) => (
              <div className="vehicle-upload-field" key={name}>
                <label htmlFor={`vehicle-photo-${name}`}>
                  {label}
                </label>

                <label
                  className="vehicle-photo-dropzone"
                  htmlFor={`vehicle-photo-${name}`}
                >
                  {previews[name] ? (
                    <img
                      src={previews[name]}
                      alt={`${label} preview`}
                    />
                  ) : (
                    <span>
                      <strong>＋</strong>
                      <small>Choose photo</small>
                    </span>
                  )}
                </label>

                <input
                  id={`vehicle-photo-${name}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePhotoChange(e, name)}
                  required
                />

                {photos[name] && (
                  <p className="vehicle-photo-name">
                    {photos[name].name}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="form-heading">
            <div>
              <h2>Contact information</h2>
              <p>How can our team contact you?</p>
            </div>
            <span className="step-indicator">STEP 03</span>
          </div>

          <div className="finance-form-grid">
            <div className="field-content">
              <label htmlFor="contactName">Full Name</label>
              <input
                id="contactName"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="field-content">
              <label htmlFor="contactPhone">Mobile Number</label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={form.contactPhone}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                required
              />
            </div>
          </div>

          {error && (
            <p className="booking-error" role="alert">
              ! {error}
            </p>
          )}

          {success && (
            <p className="finance-success" role="status">
              ✓ {success}
            </p>
          )}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Vehicle Listing"}
            {!loading && <span aria-hidden="true">→</span>}
          </button>

          <p className="form-disclaimer">
            Your vehicle will appear in the marketplace only after
            staff verification.
          </p>
        </form>

        <footer className="booking-footer">
          <span>RaahSetu</span>
          <span>Moving goods, connecting journeys.</span>
        </footer>
      </section>
    </main>
  );
}
