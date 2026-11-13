
import { useState } from "react";
import { updateDriverDetailsApi } from "../services/api";

function DriverVehicleDetails({ driver, onComplete }) {
  const [formData, setFormData] = useState({
    experienceYears: driver?.experienceYears ?? "",
    vehicleType: driver?.vehicleType || "",
    vehicleModel: driver?.vehicleModel || "",
    vehicleNumber: driver?.vehicleNumber || "",
    licenseNumber: driver?.licenseNumber || "",
    panNumber: driver?.panNumber || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================
  // HANDLE INPUT CHANGE
  // =========================================

  function handleChange(e) {
    const { name, value } = e.target;

    const formattedValue = [
      "panNumber",
      "vehicleNumber",
      "licenseNumber",
    ].includes(name)
      ? value.toUpperCase()
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  }

  // =========================================
  // VALIDATE FORM
  // =========================================

  function validateForm() {
    const experience = Number(formData.experienceYears);

    if (
      formData.experienceYears === "" ||
      !Number.isInteger(experience) ||
      experience < 0 ||
      experience > 60
    ) {
      return "Please enter valid driving experience (0–60 years).";
    }

    if (!formData.vehicleType) {
      return "Please select your vehicle type.";
    }

    if (!formData.vehicleModel.trim()) {
      return "Please enter your vehicle model.";
    }

    if (!formData.vehicleNumber.trim()) {
      return "Please enter your vehicle registration number.";
    }

    if (!formData.licenseNumber.trim()) {
      return "Please enter your driving licence number.";
    }

    const panNumber = formData.panNumber.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    if (panNumber && !panRegex.test(panNumber)) {
      return "Please enter a valid PAN number.";
    }

    return "";
  }

  // =========================================
  // SAVE VEHICLE DETAILS
  // =========================================

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        experienceYears: Number(formData.experienceYears),
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel.trim(),
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        panNumber: formData.panNumber.trim().toUpperCase(),
      };

      const data = await updateDriverDetailsApi(payload);

      if (!data?.driver) {
        throw new Error(
          "Updated driver profile was not returned by the server."
        );
      }

      // Pass updated profile to App.jsx
      if (onComplete) {
        onComplete(data.driver);
      }
    } catch (err) {
      setError(
        err.message || "Unable to save vehicle details."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="auth-page">
      <section className="auth-card driver-registration-card">

        <div className="auth-brand">
          <span className="brand-mark">R</span>
          RaahSetu
        </div>

        <p className="eyebrow">
          DRIVER REGISTRATION · STEP 02
        </p>

        <h1>Vehicle Details</h1>

        <p className="auth-description">
          Add your driving experience and vehicle information.
        </p>

        <form onSubmit={handleSubmit}>

          {/* DRIVING EXPERIENCE */}

          <label htmlFor="experienceYears">
            Driving Experience (Years)
          </label>

          <input
            id="experienceYears"
            type="number"
            name="experienceYears"
            min="0"
            max="60"
            step="1"
            value={formData.experienceYears}
            onChange={handleChange}
            placeholder="e.g. 3"
            required
          />

          {/* VEHICLE TYPE */}

          <label htmlFor="vehicleType">
            Vehicle Type
          </label>

          <select
            id="vehicleType"
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            required
          >
            <option value="">Select vehicle type</option>
            <option value="mini-truck">Mini Truck</option>
            <option value="light-truck">Light Truck</option>
            <option value="heavy-truck">Heavy Truck</option>
          </select>

          {/* VEHICLE MODEL */}

          <label htmlFor="vehicleModel">
            Vehicle Model
          </label>

          <input
            id="vehicleModel"
            type="text"
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={handleChange}
            placeholder="e.g. Tata 407"
            maxLength="100"
            required
          />

          {/* VEHICLE NUMBER */}

          <label htmlFor="vehicleNumber">
            Vehicle Registration Number
          </label>

          <input
            id="vehicleNumber"
            type="text"
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleChange}
            placeholder="e.g. HR26AB1234"
            maxLength="15"
            required
          />

          {/* DRIVING LICENCE */}

          <label htmlFor="licenseNumber">
            Driving Licence Number
          </label>

          <input
            id="licenseNumber"
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="Enter driving licence number"
            maxLength="30"
            required
          />

          {/* PAN NUMBER */}

          <label htmlFor="panNumber">
            PAN Number
          </label>

          <input
            id="panNumber"
            type="text"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleChange}
            placeholder="e.g. ABCDE1234F"
            maxLength="10"
            style={{ textTransform: "uppercase" }}
          />

          <p className="driver-form-note">
            Enter your 10-character PAN number if available.
          </p>

          {/* ERROR */}

          {error && (
            <p className="error">{error}</p>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            className="btn-confirm"
            disabled={loading}
          >
            {loading ? "Saving Details..." : "Save & Continue"}
          </button>

        </form>

        <p className="driver-form-note">
          Make sure your vehicle and licence details are accurate.
        </p>

      </section>
    </div>
  );
}

export default DriverVehicleDetails;
