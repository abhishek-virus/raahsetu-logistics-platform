
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

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "panNumber" ||
        name === "vehicleNumber" ||
        name === "licenseNumber"
          ? value.toUpperCase()
          : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const experience = Number(formData.experienceYears);

    if (
      !Number.isInteger(experience) ||
      experience < 0 ||
      experience > 60
    ) {
      setError("Please enter valid driving experience (0–60 years).");
      return;
    }

    const panNumber = formData.panNumber.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    if (panNumber && !panRegex.test(panNumber)) {
      setError("Please enter a valid PAN number.");
      return;
    }

    if (!formData.vehicleModel.trim()) {
      setError("Please enter your vehicle model.");
      return;
    }

    if (!formData.vehicleNumber.trim()) {
      setError("Please enter your vehicle registration number.");
      return;
    }

    if (!formData.licenseNumber.trim()) {
      setError("Please enter your driving licence number.");
      return;
    }

    try {
      setLoading(true);

      const data = await updateDriverDetailsApi({
        experienceYears: experience,
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel.trim(),
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        licenseNumber: formData.licenseNumber.trim().toUpperCase(),
        panNumber,
      });

      if (onComplete) {
        onComplete(data.driver);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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

          {error && (
            <p className="error">{error}</p>
          )}

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
