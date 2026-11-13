
import { useEffect, useState } from "react";

import {
  getDriverProfileApi,
  updateDriverProfileApi,
  uploadDriverProfilePhotoApi,
  getMyDriverProfilePhotoApi,
} from "../services/api";

function DriverPersonalInfo({ driver, onComplete }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    bio: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load driver profile and previously uploaded photo.
  useEffect(() => {
    let isMounted = true;
    let loadedPhotoUrl = "";

    async function loadProfile() {
      try {
        const data = await getDriverProfileApi();
        const profile = data.driver;

        if (!isMounted) return;

        setFormData({
          name: profile.name || "",
          email: profile.email || "",
          address: profile.address || "",
          dateOfBirth: profile.dateOfBirth
            ? new Date(profile.dateOfBirth)
                .toISOString()
                .split("T")[0]
            : "",
          gender: profile.gender || "",
          bio: profile.bio || "",
        });

        // Fetch previously uploaded profile photo.
        try {
          const photoBlob = await getMyDriverProfilePhotoApi();

          if (!isMounted) return;

          loadedPhotoUrl = URL.createObjectURL(photoBlob);
          setPhotoPreview(loadedPhotoUrl);
        } catch (photoError) {
          // A newly registered driver may not have a photo yet.
          console.log(
            "No existing driver profile photo:",
            photoError.message
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;

      if (loadedPhotoUrl) {
        URL.revokeObjectURL(loadedPhotoUrl);
      }
    };
  }, []);

  // Revoke previous preview URLs when replaced or component unmounts.
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP profile photos are allowed."
      );
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photo must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadProfilePhoto() {
    if (!profilePhoto) return null;

    return uploadDriverProfilePhotoApi(profilePhoto);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      // Save personal information first.
      const data = await updateDriverProfileApi(formData);

      let updatedDriver = data.driver;

      // Upload profile photo if a new one was selected.
      if (profilePhoto) {
        const photoData = await uploadProfilePhoto();

        updatedDriver = {
          ...updatedDriver,
          profilePhoto: photoData.profilePhoto,
        };
      }

      setSuccess(
        profilePhoto
          ? "Personal information and profile photo saved successfully."
          : data.message
      );

      setProfilePhoto(null);

      if (onComplete) {
        onComplete(updatedDriver);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-description">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card driver-registration-card">
        <div className="auth-brand">
          <span className="brand-mark">R</span>
          <span>RaahSetu</span>
        </div>

        <p className="eyebrow">
          DRIVER ONBOARDING · STEP 01
        </p>

        <h1>Driver Registration</h1>

        <p className="auth-description">
          Complete your personal information to get started with RaahSetu.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <div className="driver-profile-photo-section">
            <div className="driver-profile-photo-preview">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Driver profile preview"
                />
              ) : (
                <span>
                  {formData.name
                    ? formData.name.charAt(0).toUpperCase()
                    : "?"}
                </span>
              )}
            </div>

            <label htmlFor="driver-profile-photo">
              Profile Photo
            </label>

            <input
              id="driver-profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />

            <small>
              JPG, PNG or WEBP · Maximum 5 MB
            </small>
          </div>

          <label htmlFor="driver-name">
            Full Name
          </label>

          <input
            id="driver-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label htmlFor="driver-email">
            Email Address
          </label>

          <input
            id="driver-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
          />

          <label htmlFor="driver-phone">
            Mobile Number
          </label>

          <input
            id="driver-phone"
            type="tel"
            value={driver?.phone || ""}
            readOnly
            className="driver-phone-readonly"
          />

          <label htmlFor="driver-dob">
            Date of Birth
          </label>

          <input
            id="driver-dob"
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
          />

          <label htmlFor="driver-gender">
            Gender
          </label>

          <select
            id="driver-gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <label htmlFor="driver-address">
            Complete Address
          </label>

          <textarea
            id="driver-address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your complete address"
            rows="3"
            required
          />

          <label htmlFor="driver-bio">
            About Yourself
          </label>

          <textarea
            id="driver-bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a little about yourself..."
            rows="3"
            maxLength={500}
          />

          <small>
            {formData.bio.length}/500 characters
          </small>

          {error && <p className="error">{error}</p>}

          {success && (
            <p className="auth-success">{success}</p>
          )}

          <button
            type="submit"
            className="btn-confirm"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </form>

        <p className="auth-footnote">
          Your information helps us verify your driver profile securely.
        </p>
      </div>
    </div>
  );
}

export default DriverPersonalInfo;
