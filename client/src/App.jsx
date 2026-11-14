import "./App.css";
import { useEffect, useState } from "react";

import {
  getCustomerProfileApi,
  getDriverProfileApi,
  getMyDriverProfilePhotoApi,
  getStaffDashboardStatsApi,
} from "./services/api";

// Customer Components
import CustomerLogin from "./components/CustomerLogin";
import OtpVerification from "./components/OtpVerification";
import CustomerDashboard from "./components/CustomerDashboard";
import CustomerProfile from "./components/CustomerProfile";
import BookingHome from "./components/BookingHome";
import BookTransport from "./components/BookTransport";
import MyBookings from "./components/MyBookings";

// Driver Components
import DriverLogin from "./components/DriverLogin";
import DriverOtpVerification from "./components/DriverOtpVerification";
import DriverRegistration from "./components/DriverRegistration";
import DriverRegistrationOtp from "./components/DriverRegistrationOtp";
import DriverPersonalInfo from "./components/DriverPersonalInfo";
import DriverVehicleDetails from "./components/DriverVehicleDetails";
import DriverDocuments from "./components/DriverDocuments";
import DriverDashboard from "./components/DriverDashboard";

// Phase 5 Components
import FinanceEnquiry from "./components/FinanceEnquiry";
import BuyVehicles from "./components/BuyVehicles";
import SellVehicle from "./components/SellVehicle";

// Phase 6 Staff Components
import StaffLogin from "./components/StaffLogin";
import StaffDashboard from "./components/StaffDashboard";
import StaffDriverVerification from "./components/StaffDriverVerification";
import StaffLoadVerification from "./components/StaffLoadVerification";
import StaffVehicleReview from "./components/StaffVehicleReview";
import StaffFinanceEnquiries from "./components/StaffFinanceEnquiries";
import StaffDispatchManagement from "./components/StaffDispatchManagement";
import StaffVehicleInterests from "./components/StaffVehicleInterests";

export default function App() {
  const [screen, setScreen] = useState(() => {
    if (localStorage.getItem("staffToken")) {
      return "checking-staff-session";
    }

    if (localStorage.getItem("driverToken")) {
      return "checking-driver-session";
    }

    if (localStorage.getItem("token")) {
      return "checking-customer-session";
    }

    return "login";
  });

  // Customer State
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [booking, setBooking] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Driver State
  const [driverPhone, setDriverPhone] = useState("");
  const [driver, setDriver] = useState(null);
  const [driverDocuments, setDriverDocuments] = useState(null);
  const [driverProfilePhotoUrl, setDriverProfilePhotoUrl] = useState("");

  // Track whether a driver is editing profile from dashboard
  const [driverProfileEditMode, setDriverProfileEditMode] = useState(false);

  // Staff State
  const [staff, setStaff] = useState(null);

  // =========================================
  // RESTORE SAVED SESSION
  // =========================================

  useEffect(() => {
    async function restoreSession() {
      // Staff Session Restoration
      const staffToken = localStorage.getItem("staffToken");

      if (staffToken) {
        try {
          const savedStaff = JSON.parse(
            localStorage.getItem("staff") || "null"
          );

          if (
            !savedStaff ||
            !savedStaff.id ||
            savedStaff.role !== "staff"
          ) {
            throw new Error("Invalid saved staff session.");
          }

          await getStaffDashboardStatsApi();

          setStaff(savedStaff);
          setScreen("staff-dashboard");
          return;
        } catch (error) {
          console.error("Staff session restore failed:", error);

          localStorage.removeItem("staffToken");
          localStorage.removeItem("staff");

          setStaff(null);
          setScreen("login");
          return;
        }
      }

      // Driver Session Restoration
      const driverToken = localStorage.getItem("driverToken");

      if (driverToken) {
        try {
          const response = await getDriverProfileApi();
          const savedDriver = response.driver;

          if (!savedDriver) {
            throw new Error("Driver profile not found.");
          }

          setDriver(savedDriver);

          // Every authenticated driver returns to dashboard.
          // Profile completion is managed from dashboard.
          setScreen("driver-dashboard");
          return;
        } catch (error) {
          console.error("Driver session restore failed:", error);

          localStorage.removeItem("driverToken");
          localStorage.removeItem("driver");

          setDriver(null);
          setDriverPhone("");
          setScreen("login");
          return;
        }
      }

      // Customer Session Restoration
      const customerToken = localStorage.getItem("token");

      if (customerToken) {
        try {
          const response = await getCustomerProfileApi();
          const savedCustomer = response.customer;

          if (!savedCustomer) {
            throw new Error("Customer profile not found.");
          }

          setCustomer(savedCustomer);
          setPhone(savedCustomer.phone || "");
          setScreen("customer-dashboard");
        } catch (error) {
          console.error("Customer session restore failed:", error);

          localStorage.removeItem("token");
          localStorage.removeItem("customer");

          setCustomer(null);
          setPhone("");
          setScreen("login");
        }
      }
    }

    restoreSession();
  }, []);

  // =========================================
  // LOAD DRIVER PROFILE FOR REVIEW
  // =========================================

  useEffect(() => {
    if (screen !== "driver-review" || !driver) {
      return;
    }

    let objectUrl = "";
    let cancelled = false;

    const loadReviewProfile = async () => {
      try {
        const response = await getDriverProfileApi();

        if (cancelled || !response?.driver) {
          return;
        }

        setDriver(response.driver);

        if (response.driver.profilePhoto?.filename) {
          const photoBlob = await getMyDriverProfilePhotoApi();

          if (cancelled) {
            return;
          }

          objectUrl = URL.createObjectURL(photoBlob);
          setDriverProfilePhotoUrl(objectUrl);
        } else {
          setDriverProfilePhotoUrl("");
        }
      } catch (error) {
        console.error("Unable to load driver review profile:", error);
        setDriverProfilePhotoUrl("");
      }
    };

    loadReviewProfile();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [screen]);

  // =========================================
  // CUSTOMER HANDLERS
  // =========================================

  const handleOtpSent = (userPhone) => {
    setPhone(userPhone);
    setScreen("otp");
  };

  const handleVerified = (verifiedCustomer) => {
    setCustomer(verifiedCustomer);
    setPhone(verifiedCustomer.phone);
    setScreen("customer-dashboard");
  };

  const handleBookingConfirm = ({
    fromLocation,
    toLocation,
  }) => {
    setBooking({
      fromLocation,
      toLocation,
    });

    setCreatedBooking(null);
    setScreen("transport");
  };

  const handleBookingCreated = (savedBooking) => {
    setCreatedBooking(savedBooking);
    setScreen("confirmation");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("customer");

    setCustomer(null);
    setBooking(null);
    setCreatedBooking(null);
    setPhone("");
    setScreen("login");
  };

  // =========================================
  // DRIVER HANDLERS
  // =========================================

  // Existing Driver Login OTP
  const handleDriverOtpSent = (userPhone) => {
    setDriverPhone(userPhone);
    setScreen("driver-otp");
  };

  // New Driver Registration OTP
  const handleDriverRegistrationOtpSent = (userPhone) => {
    setDriverPhone(userPhone);
    setScreen("driver-registration-otp");
  };

  // Route every authenticated driver to dashboard
  const routeDriverFromProfile = (profile) => {
    setDriver(profile);

    localStorage.setItem("driver", JSON.stringify(profile));

    setScreen("driver-dashboard");
  };

  // Existing Driver Login Verified
  const handleDriverVerified = async (verifiedDriver) => {
    try {
      const response = await getDriverProfileApi();

      if (!response?.driver) {
        throw new Error("Driver profile not found.");
      }

      routeDriverFromProfile(response.driver);
    } catch (error) {
      console.error(
        "Unable to fetch complete driver profile:",
        error
      );

      // Keep verified login session as fallback.
      routeDriverFromProfile(verifiedDriver);
    }
  };

  // New Driver Registration Verified
  const handleDriverRegistrationVerified = (newDriver) => {
    setDriver(newDriver);
    setDriverDocuments(null);
    setDriverProfileEditMode(false);

    // New driver also enters dashboard directly.
    setScreen("driver-dashboard");
  };

  // Open profile sections from dashboard
  const handleEditDriverPersonalInfo = () => {
    setDriverProfileEditMode(true);
    setScreen("driver-registration");
  };

  const handleEditDriverVehicleDetails = () => {
    setDriverProfileEditMode(true);
    setScreen("driver-vehicle");
  };

  const handleEditDriverDocuments = () => {
    setDriverProfileEditMode(true);
    setScreen("driver-documents");
  };

  // Personal information completed
  const handleDriverPersonalInfoCompleted = (updatedDriver) => {
    setDriver(updatedDriver);

    if (driverProfileEditMode) {
      setDriverProfileEditMode(false);
      setScreen("driver-dashboard");
      return;
    }

    setScreen("driver-vehicle");
  };

  // Vehicle details completed
  const handleDriverDetailsCompleted = (updatedDriver) => {
    setDriver(updatedDriver);

    if (driverProfileEditMode) {
      setDriverProfileEditMode(false);
      setScreen("driver-dashboard");
      return;
    }

    setScreen("driver-documents");
  };

  // Documents completed
  const handleDriverDocumentsCompleted = async (result) => {
    setDriverDocuments(result);

    try {
      // Refresh complete profile after document upload
      const response = await getDriverProfileApi();

      if (response?.driver) {
        setDriver(response.driver);
        localStorage.setItem(
          "driver",
          JSON.stringify(response.driver)
        );
      } else if (result?.driver) {
        setDriver(result.driver);
      } else {
        setDriver((prev) => ({
          ...prev,
          ...(result?.documents
            ? { documents: result.documents }
            : {}),
          verificationStatus:
            result?.verificationStatus ||
            prev?.verificationStatus,
        }));
      }
    } catch (error) {
      console.error(
        "Unable to refresh driver profile after document upload:",
        error
      );

      setDriver((prev) => ({
        ...prev,
        ...(result?.documents
          ? { documents: result.documents }
          : {}),
        verificationStatus:
          result?.verificationStatus ||
          prev?.verificationStatus,
      }));
    }

    // Return to dashboard instead of review screen
    setDriverProfileEditMode(false);
    setScreen("driver-dashboard");
  };

  const handleDriverLogout = () => {
    localStorage.removeItem("driverToken");
    localStorage.removeItem("driver");

    setDriver(null);
    setDriverPhone("");
    setDriverDocuments(null);
    setDriverProfileEditMode(false);
    setScreen("login");
  };

  // =========================================
  // STAFF HANDLERS
  // =========================================

  const handleStaffLogin = (verifiedStaff) => {
    setStaff(verifiedStaff);
    setScreen("staff-dashboard");
  };

  const handleStaffLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staff");

    setStaff(null);
    setScreen("login");
  };

  // =========================================
  // MAIN RENDER
  // =========================================

  return (
    <div className="app">

      {/* =====================================
          SESSION RESTORATION
      ===================================== */}

      {screen === "checking-staff-session" && (
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-brand">
              <span className="brand-mark">R</span>
              RaahSetu
            </div>

            <h2>Restoring staff session...</h2>

            <p className="auth-description">
              Please wait while we securely restore your staff account.
            </p>
          </section>
        </main>
      )}

      {screen === "checking-driver-session" && (
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-brand">
              <span className="brand-mark">R</span>
              RaahSetu
            </div>

            <h2>Restoring your session...</h2>

            <p className="auth-description">
              Please wait while we securely restore your driver account.
            </p>
          </section>
        </main>
      )}

      {screen === "checking-customer-session" && (
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-brand">
              <span className="brand-mark">R</span>
              RaahSetu
            </div>

            <h2>Restoring your session...</h2>

            <p className="auth-description">
              Please wait while we securely restore your customer account.
            </p>
          </section>
        </main>
      )}

      {/* =====================================
          CUSTOMER LOGIN
      ===================================== */}

      {screen === "login" && (
        <CustomerLogin
          onOtpSent={handleOtpSent}
          onDriverLogin={() => setScreen("driver-login")}
          onStaffLogin={() => setScreen("staff-login")}
        />
      )}

      {/* =====================================
          STAFF LOGIN
      ===================================== */}

      {screen === "staff-login" && (
        <StaffLogin
          onLogin={handleStaffLogin}
          onBack={() => setScreen("login")}
        />
      )}

      {/* =====================================
          STAFF DASHBOARD
      ===================================== */}

      {screen === "staff-dashboard" && staff && (
        <StaffDashboard
          staff={staff}
          onLogout={handleStaffLogout}
          onNavigate={(section) => setScreen(section)}
        />
      )}

      {/* STAFF DRIVER VERIFICATION */}

      {screen === "driver-verification" && staff && (
        <StaffDriverVerification
          onBack={() => setScreen("staff-dashboard")}
        />
      )}

      {/* STAFF LOAD VERIFICATION */}

      {screen === "load-verification" && staff && (
        <StaffLoadVerification
          onBack={() => setScreen("staff-dashboard")}
        />
      )}

      {/* STAFF VEHICLE REVIEW */}

      {screen === "vehicle-review" && staff && (
        <StaffVehicleReview
          onBack={() => setScreen("staff-dashboard")}
        />
      )}

      {/* STAFF VEHICLE BUYER INTERESTS */}

      {screen === "vehicle-interests" && staff && (
        <StaffVehicleInterests
          onBack={() => setScreen("staff-dashboard")}
        />
      )}

      {/* STAFF FINANCE & INSURANCE ENQUIRIES */}

      {screen === "finance-enquiries" && staff && (
        <StaffFinanceEnquiries
          onBack={() => setScreen("staff-dashboard")}
        />
      )}

      {/* STAFF DISPATCH MANAGEMENT */}

      {screen === "dispatch-management" && staff && (
        <StaffDispatchManagement
          onBack={() => setScreen("staff-dashboard")}
        />
      )}

      {/* =====================================
          DRIVER LOGIN
      ===================================== */}

      {screen === "driver-login" && (
        <DriverLogin
          onOtpSent={handleDriverOtpSent}
          onRegister={() => setScreen("driver-register")}
          onBack={() => setScreen("login")}
        />
      )}

      {/* =====================================
          NEW DRIVER REGISTRATION
      ===================================== */}

      {screen === "driver-register" && (
        <DriverRegistration
          onOtpSent={handleDriverRegistrationOtpSent}
          onBack={() => setScreen("driver-login")}
        />
      )}

      {/* NEW DRIVER REGISTRATION OTP */}

      {screen === "driver-registration-otp" && (
        <DriverRegistrationOtp
          phone={driverPhone}
          onVerified={handleDriverRegistrationVerified}
          onBack={() => setScreen("driver-register")}
        />
      )}

      {/* EXISTING DRIVER LOGIN OTP */}

      {screen === "driver-otp" && (
        <DriverOtpVerification
          phone={driverPhone}
          onVerified={handleDriverVerified}
          onBack={() => setScreen("driver-login")}
        />
      )}

      {/* =====================================
          DRIVER PERSONAL INFORMATION
      ===================================== */}

      {screen === "driver-registration" && driver && (
        <DriverPersonalInfo
          driver={driver}
          onComplete={handleDriverPersonalInfoCompleted}
        />
      )}

      {/* DRIVER VEHICLE DETAILS */}

      {screen === "driver-vehicle" && driver && (
        <DriverVehicleDetails
          driver={driver}
          onComplete={handleDriverDetailsCompleted}
        />
      )}

      {/* DRIVER DOCUMENTS */}

      {screen === "driver-documents" && driver && (
        <DriverDocuments
          onComplete={handleDriverDocumentsCompleted}
        />
      )}

      {/* =====================================
          DRIVER DASHBOARD
      ===================================== */}

      {screen === "driver-dashboard" && driver && (
        <DriverDashboard
          driver={driver}
          onLogout={handleDriverLogout}
          onFinanceEnquiry={() => setScreen("finance-enquiry")}
          onBuyVehicles={() => setScreen("buy-vehicles")}
          onSellVehicle={() => setScreen("sell-vehicle")}

          // Profile completion navigation
          onEditPersonalInfo={handleEditDriverPersonalInfo}
          onEditVehicleDetails={handleEditDriverVehicleDetails}
          onEditDocuments={handleEditDriverDocuments}
        />
      )}

      {/* =====================================
          CUSTOMER OTP
      ===================================== */}

      {screen === "otp" && (
        <OtpVerification
          phone={phone}
          onVerified={handleVerified}
          onBack={() => setScreen("login")}
        />
      )}

      {/* CUSTOMER BOOKING HOME */}

      {screen === "booking" && customer && (
        <BookingHome
          customer={customer}
          booking={booking}
          onConfirm={handleBookingConfirm}
          onLogout={handleLogout}
          onViewBookings={() => setScreen("my-bookings")}
          onFinanceEnquiry={() => setScreen("finance-enquiry")}
          onBuyVehicles={() => setScreen("buy-vehicles")}
          onSellVehicle={() => setScreen("sell-vehicle")}
          onBackToDashboard={() => setScreen("customer-dashboard")}
        />
      )}

      {/* CUSTOMER MY BOOKINGS */}

      {screen === "my-bookings" && customer && (
        <MyBookings
          onBack={() => setScreen("customer-dashboard")}
          onLogout={handleLogout}
        />
      )}

      {/* CUSTOMER DASHBOARD */}
      {screen === "customer-dashboard" && customer && (
        <CustomerDashboard
          customer={customer}
          onLogout={handleLogout}
          onNavigate={(section) => {
            if (section === "dashboard") {
              setScreen("customer-dashboard");
            } else if (section === "transport") {
              setScreen("booking");
            } else {
              setScreen(section);
            }
          }}
        />
      )}

      {/* CUSTOMER PROFILE */}

      {screen === "customer-profile" && customer && (
        <CustomerProfile
          customer={customer}
          onBack={() => setScreen("customer-dashboard")}
          onProfileUpdated={(updatedCustomer) => {
            setCustomer(updatedCustomer);
          }}
        />
      )}

      {/* CUSTOMER TRANSPORT BOOKING */}

      {screen === "transport" && customer && booking && (
        <BookTransport
          booking={booking}
          onBack={() => setScreen("booking")}
          onBookingCreated={handleBookingCreated}
        />
      )}

      {/* =====================================
          PHASE 5 - FINANCE & INSURANCE
      ===================================== */}

      {screen === "finance-enquiry" && (customer || driver) && (
        <FinanceEnquiry
          user={customer || driver}
          tokenType={customer ? "customer" : "driver"}
          onBack={() =>
            setScreen(customer ? "customer-dashboard" : "driver-dashboard")
          }
        />
      )}

      {/* PHASE 5 - BUY VEHICLES */}

      {screen === "buy-vehicles" && (customer || driver) && (
        <BuyVehicles
          tokenType={customer ? "customer" : "driver"}
          onBack={() =>
            setScreen(customer ? "customer-dashboard" : "driver-dashboard")
          }
        />
      )}

      {/* PHASE 5 - SELL VEHICLE */}

      {screen === "sell-vehicle" && (customer || driver) && (
        <SellVehicle
          user={customer || driver}
          tokenType={customer ? "customer" : "driver"}
          onBack={() =>
            setScreen(customer ? "customer-dashboard" : "driver-dashboard")
          }
        />
      )}

      {/* =====================================
          BOOKING CONFIRMATION
      ===================================== */}

      {screen === "confirmation" && createdBooking && (
        <main className="booking-page">
          <section className="booking-content">
            <div className="booking-confirmation">
              <div className="confirmation-top">
                <span className="confirmation-icon">✓</span>

                <div>
                  <p className="confirmation-label">
                    BOOKING CREATED
                  </p>

                  <h2>Your transport request is saved!</h2>
                </div>
              </div>

              <div className="confirmed-route">
                <div className="confirmed-location">
                  <div>
                    <span className="confirmed-label">
                      PICKUP FROM
                    </span>

                    <p>{createdBooking.pickupLocation}</p>
                  </div>
                </div>

                <div className="confirmed-location">
                  <div>
                    <span className="confirmed-label">
                      DELIVER TO
                    </span>

                    <p>{createdBooking.dropLocation}</p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Booking ID:</strong>{" "}
                {createdBooking._id}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {createdBooking.status}
              </p>

              <p className="confirmation-note">
                Your booking record has been created. A truck has
                not yet been assigned.
              </p>

              <button
                type="button"
                className="btn-confirm"
                onClick={() => {
                  setBooking(null);
                  setCreatedBooking(null);
                  setScreen("booking");
                }}
              >
                Back to Booking Home
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </section>
        </main>
      )}

      {/* =====================================
          DRIVER WELCOME / VERIFICATION STATUS
      ===================================== */}

      {screen === "driver-welcome" && driver && (
        <main className="auth-page driver-welcome-page">
          <section className="auth-card driver-welcome-card">
            <div className="auth-brand">
              <span className="brand-mark">R</span>
              RaahSetu
            </div>

            <div className="welcome-success-icon">
              <span>
                {driver.verificationStatus === "rejected" ? "!" : "✓"}
              </span>
            </div>

            <p className="eyebrow">DRIVER PORTAL</p>

            <h1>
              {driver.verificationStatus === "rejected"
                ? "Verification Rejected"
                : `Welcome, ${driver.name || "Driver"}!`}
            </h1>

            <p className="auth-description">
              {driver.verificationStatus === "rejected"
                ? "Your driver registration could not be approved."
                : "Thank you for joining RaahSetu. Your driver registration has been submitted successfully."}
            </p>

            <div className="welcome-registration-status">
              <div className="welcome-status-top">
                <div>
                  <span className="welcome-status-label">
                    REGISTRATION STATUS
                  </span>

                  <h3>
                    {driver.verificationStatus === "rejected"
                      ? "Application rejected"
                      : "Verification in progress"}
                  </h3>
                </div>

                <span className="welcome-pending-badge">
                  {driver.verificationStatus || "pending"}
                </span>
              </div>

              {driver.verificationStatus !== "rejected" && (
                <>
                  <div className="welcome-progress-track">
                    <span></span>
                  </div>

                  <p>
                    Your documents are submitted and waiting for verification.
                  </p>
                </>
              )}
            </div>

            {driver.verificationStatus === "rejected" && (
              <div className="welcome-next-step">
                <span className="welcome-next-icon">!</span>

                <div>
                  <strong>Reason for rejection</strong>

                  <p>
                    {driver.verificationRemarks ||
                      "No rejection remarks were provided. Please contact RaahSetu support."}
                  </p>
                </div>
              </div>
            )}

            <div className="welcome-driver-info">
              <div className="welcome-info-icon">👤</div>

              <div>
                <span>REGISTERED DRIVER</span>
                <strong>{driver.name || "Driver"}</strong>
                <p>+91 {driver.phone}</p>
              </div>
            </div>

            {driver.verificationStatus !== "rejected" && (
              <div className="welcome-next-step">
                <span className="welcome-next-icon">ℹ</span>

                <div>
                  <strong>What's next?</strong>

                  <p>
                    Our team will review your submitted documents.
                    Your driver account can be activated after approval.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-confirm welcome-logout-btn"
              onClick={handleDriverLogout}
            >
              Log out
            </button>

            <p className="auth-footnote">
              Thank you for choosing RaahSetu.
            </p>
          </section>
        </main>
      )}

      {/* =====================================
          DRIVER REGISTRATION REVIEW
      ===================================== */}

      {screen === "driver-review" && driverDocuments && driver && (
        <main className="auth-page driver-review-page">
          <section className="auth-card driver-review-card">
            <div className="auth-brand">
              <span className="brand-mark">R</span>
              RaahSetu
            </div>

            <p className="eyebrow">
              DRIVER REGISTRATION · STEP 04
            </p>

            <div className="review-heading">
              <div>
                <h1>Registration Review</h1>

                <p className="auth-description">
                  Your registration details have been submitted.
                  Review your information below.
                </p>
              </div>

              <span className="review-status">
                <span className="review-status-dot"></span>
                Pending
              </span>
            </div>

            {/* PROFILE PHOTO */}

            <div className="review-section">
              <div className="review-section-heading">
                <div className="review-icon">📷</div>

                <div>
                  <h3>Profile Photo</h3>
                  <p>Your uploaded driver photograph</p>
                </div>
              </div>

              <div className="review-profile-photo">
                {driverProfilePhotoUrl ? (
                  <img
                    src={driverProfilePhotoUrl}
                    alt="Driver profile"
                  />
                ) : (
                  <div className="review-profile-placeholder">
                    {driver.name?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                )}

                <div>
                  <strong>{driver.name || "Driver"}</strong>
                  <span>Driver profile photograph</span>
                </div>
              </div>
            </div>

            {/* PERSONAL INFORMATION */}

            <div className="review-section">
              <div className="review-section-heading">
                <div className="review-icon">👤</div>

                <div>
                  <h3>Personal Information</h3>
                  <p>Your basic profile details</p>
                </div>

                <span className="review-check">✓</span>
              </div>

              <div className="review-details-grid">
                <div className="review-detail">
                  <span>Full Name</span>
                  <strong>{driver.name || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>Mobile Number</span>
                  <strong>{driver.phone || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>Email Address</span>
                  <strong>{driver.email || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>Date of Birth</span>
                  <strong>
                    {driver.dateOfBirth
                      ? new Date(driver.dateOfBirth).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "Not provided"}
                  </strong>
                </div>

                <div className="review-detail">
                  <span>Gender</span>
                  <strong>
                    {driver.gender
                      ? driver.gender.charAt(0).toUpperCase() +
                        driver.gender.slice(1)
                      : "Not provided"}
                  </strong>
                </div>

                <div className="review-detail review-detail-full">
                  <span>Complete Address</span>
                  <strong>{driver.address || "Not provided"}</strong>
                </div>

                <div className="review-detail review-detail-full">
                  <span>Driver Bio</span>
                  <strong>
                    {driver.bio?.trim() || "No bio provided"}
                  </strong>
                </div>
              </div>
            </div>

            {/* VEHICLE INFORMATION */}

            <div className="review-section">
              <div className="review-section-heading">
                <div className="review-icon">🚚</div>

                <div>
                  <h3>Vehicle Information</h3>
                  <p>Your driving and vehicle details</p>
                </div>

                <span className="review-check">✓</span>
              </div>

              <div className="review-details-grid">
                <div className="review-detail">
                  <span>Experience</span>
                  <strong>
                    {driver.experienceYears ?? "Not provided"} years
                  </strong>
                </div>

                <div className="review-detail">
                  <span>Vehicle Type</span>
                  <strong>{driver.vehicleType || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>Vehicle Model</span>
                  <strong>{driver.vehicleModel || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>Vehicle Number</span>
                  <strong>{driver.vehicleNumber || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>Licence Number</span>
                  <strong>{driver.licenseNumber || "Not provided"}</strong>
                </div>

                <div className="review-detail">
                  <span>PAN Number</span>
                  <strong>{driver.panNumber || "Not provided"}</strong>
                </div>
              </div>
            </div>

            {/* UPLOADED DOCUMENTS */}

            <div className="review-section">
              <div className="review-section-heading">
                <div className="review-icon">📁</div>

                <div>
                  <h3>Uploaded Documents</h3>
                  <p>All three required documents submitted</p>
                </div>

                <span className="review-check">✓</span>
              </div>

              <div className="review-document-list">
                <div className="review-document">
                  <span className="review-file-icon">FILE</span>

                  <div>
                    <strong>Driving Licence</strong>
                    <span>
                      {driver.documents?.license?.originalName ||
                        "Document uploaded"}
                    </span>
                  </div>

                  <span className="review-uploaded">
                    ✓ Uploaded
                  </span>
                </div>

                <div className="review-document">
                  <span className="review-file-icon">FILE</span>

                  <div>
                    <strong>Vehicle Registration (RC)</strong>
                    <span>
                      {driver.documents?.vehicleRC?.originalName ||
                        "Document uploaded"}
                    </span>
                  </div>

                  <span className="review-uploaded">
                    ✓ Uploaded
                  </span>
                </div>

                <div className="review-document">
                  <span className="review-file-icon">FILE</span>

                  <div>
                    <strong>Identity Proof</strong>
                    <span>
                      {driver.documents?.identity?.originalName ||
                        "Document uploaded"}
                    </span>
                  </div>

                  <span className="review-uploaded">
                    ✓ Uploaded
                  </span>
                </div>
              </div>
            </div>

            {/* VERIFICATION STATUS */}

            <div className="review-verification">
              <div className="review-verification-icon">◷</div>

              <div>
                <strong>Verification in progress</strong>

                <p>
                  Your documents have been submitted successfully.
                  Our team will review your information.
                </p>
              </div>

              <span className="review-status-tag">
                {driver.verificationStatus ||
                  driverDocuments.verificationStatus ||
                  "pending"}
              </span>
            </div>

            <button
              type="button"
              className="btn-confirm review-finish-btn"
              onClick={() => setScreen("driver-dashboard")}
            >
              Go to Dashboard <span>→</span>
            </button>

            <p className="auth-footnote">
              Thank you for joining RaahSetu. We appreciate your trust.
            </p>
          </section>
        </main>
      )}
    </div>
  );
}