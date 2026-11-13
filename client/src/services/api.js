
const API_BASE_URL = "http://localhost:5001/api";
export const API_SERVER_URL = "http://localhost:5001";

// =====================================
// COMMON API REQUEST FUNCTION
// =====================================

async function apiRequest(
  endpoint,
  { method = "GET", body, auth = false, tokenType = "customer" } = {}
) {
  const headers = {};

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const tokenKey =
      tokenType === "driver"
        ? "driverToken"
        : tokenType === "staff"
          ? "staffToken"
          : "token";

    const token = localStorage.getItem(tokenKey);

    if (!token) {
      throw new Error("Please log in to continue.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      ...(body !== undefined
        ? { body: isFormData ? body : JSON.stringify(body) }
        : {}),
    });
  } catch {
    throw new Error(
      "Backend se connection nahi ho raha. Check karo ki server running hai."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Server se valid response nahi mila.");
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Request failed."
    );
  }

  return data;
}

// =====================================
// PHASE 1: CUSTOMER OTP APIs
// =====================================

export function requestOtpApi(phone) {
  return apiRequest("/auth/request-otp", {
    method: "POST",
    body: { phone },
  });
}

export function verifyOtpApi(phone, otp) {
  return apiRequest("/auth/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });
}

// =====================================
// PHASE 2: CUSTOMER BOOKING APIs
// =====================================

export function createBookingApi(bookingData) {
  return apiRequest("/customer/bookings", {
    method: "POST",
    body: bookingData,
    auth: true,
  });
}

export function getBookingsApi() {
  return apiRequest("/customer/bookings", {
    method: "GET",
    auth: true,
  });
}

export function getBookingByIdApi(bookingId) {
  return apiRequest(
    `/customer/bookings/${encodeURIComponent(bookingId)}`,
    {
      method: "GET",
      auth: true,
    }
  );
}

// =====================================
// PHASE 3: DRIVER AUTHENTICATION APIs
// =====================================

// Existing Driver Login - Request OTP
export function requestDriverOtpApi(phone) {
  return apiRequest("/driver/auth/request-otp", {
    method: "POST",
    body: { phone },
  });
}

// Existing Driver Login - Verify OTP
export function verifyDriverOtpApi(phone, otp) {
  return apiRequest("/driver/auth/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });
}

// New Driver Registration - Request OTP
export function requestDriverRegistrationOtpApi(phone) {
  return apiRequest("/driver/auth/registration/request-otp", {
    method: "POST",
    body: { phone },
  });
}

// New Driver Registration - Verify OTP
export function verifyDriverRegistrationOtpApi(phone, otp) {
  return apiRequest("/driver/auth/registration/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });
}

// Get driver profile
export function getDriverProfileApi() {
  return apiRequest("/driver/profile", {
    method: "GET",
    auth: true,
    tokenType: "driver",
  });
}

// Update driver personal information
export function updateDriverProfileApi(profileData) {
  return apiRequest("/driver/profile", {
    method: "PUT",
    body: profileData,
    auth: true,
    tokenType: "driver",
  });
}

// Update driver vehicle details
export function updateDriverDetailsApi(details) {
  return apiRequest("/driver/vehicle-details", {
    method: "PUT",
    body: details,
    auth: true,
    tokenType: "driver",
  });
}

// Upload driver profile photo
export async function uploadDriverProfilePhotoApi(photo) {
  const token = localStorage.getItem("driverToken");

  if (!token) {
    throw new Error("Please log in as a driver.");
  }

  if (!(photo instanceof File)) {
    throw new Error("Please select a valid profile photo.");
  }

  const formData = new FormData();
  formData.append("profilePhoto", photo);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/driver/profile-photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    throw new Error("Backend connection failed.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Server se valid response nahi mila.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Profile photo upload failed.");
  }

  return data;
}

// Upload driver verification documents
export async function uploadDriverDocumentsApi(documents) {
  const token = localStorage.getItem("driverToken");

  if (!token) {
    throw new Error("Please log in as a driver.");
  }

  const formData = new FormData();

  formData.append("license", documents.license);
  formData.append("vehicleRC", documents.vehicleRC);
  formData.append("identity", documents.identity);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/driver/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    throw new Error("Backend connection failed.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Server se valid response nahi mila.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Document upload failed.");
  }

  return data;
}

// =====================================
// PHASE 4: DRIVER LOAD APIs
// =====================================

export function getAvailableLoadsApi() {
  return apiRequest("/driver/loads", {
    method: "GET",
    auth: true,
    tokenType: "driver",
  });
}

export function acceptLoadApi(bookingId) {
  return apiRequest(
    `/driver/loads/${encodeURIComponent(bookingId)}/accept`,
    {
      method: "PATCH",
      auth: true,
      tokenType: "driver",
    }
  );
}

export function getMyLoadsApi() {
  return apiRequest("/driver/my-loads", {
    method: "GET",
    auth: true,
    tokenType: "driver",
  });
}

export function updateDeliveryStatusApi(bookingId, status) {
  return apiRequest(
    `/driver/loads/${encodeURIComponent(bookingId)}/status`,
    {
      method: "PATCH",
      body: { status },
      auth: true,
      tokenType: "driver",
    }
  );
}

// =====================================
// PHASE 5: FINANCE & INSURANCE APIs
// =====================================

export function createFinanceEnquiryApi(
  enquiryData,
  tokenType = "customer"
) {
  return apiRequest("/finance-enquiries", {
    method: "POST",
    body: enquiryData,
    auth: true,
    tokenType,
  });
}

// =====================================
// PHASE 5: BUY & SELL VEHICLE APIs
// =====================================

export function getVehicleListingsApi(tokenType = "customer") {
  return apiRequest("/vehicle-listings", {
    auth: true,
    tokenType,
  });
}

export function createVehicleListingApi(
  listingData,
  tokenType = "customer"
) {
  return apiRequest("/vehicle-listings", {
    method: "POST",
    body: listingData,
    auth: true,
    tokenType,
  });
}

export function registerVehicleInterestApi(
  listingId,
  tokenType = "customer"
) {
  return apiRequest(`/vehicle-listings/${listingId}/interest`, {
    method: "POST",
    auth: true,
    tokenType,
  });
}

// =====================================
// PHASE 6: STAFF AUTHENTICATION
// =====================================

export function staffLoginApi(credentials) {
  return apiRequest("/staff/auth/login", {
    method: "POST",
    body: credentials,
  });
}

// =====================================
// PHASE 6: STAFF DASHBOARD
// =====================================

export function getStaffDashboardStatsApi() {
  return apiRequest("/staff/dashboard/stats", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

// =====================================
// PHASE 6: STAFF DRIVER VERIFICATION
// =====================================

export function getPendingDriverVerificationsApi() {
  return apiRequest("/staff/drivers/pending", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

export function updateDriverVerificationApi(
  driverId,
  verificationData
) {
  return apiRequest(
    `/staff/drivers/${encodeURIComponent(driverId)}/verification`,
    {
      method: "PATCH",
      body: verificationData,
      auth: true,
      tokenType: "staff",
    }
  );
}

// =====================================
// PHASE 6: SECURE DRIVER DOCUMENT API
// =====================================

export async function getDriverDocumentApi(driverId, documentType) {
  const token = localStorage.getItem("staffToken");

  if (!token) {
    throw new Error("Please log in as staff to view documents.");
  }

  const allowedTypes = [
    "license",
    "vehicleRC",
    "identity",
    "profilePhoto",
  ];

  if (!allowedTypes.includes(documentType)) {
    throw new Error("Invalid document type.");
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/staff/drivers/${encodeURIComponent(
        driverId
      )}/documents/${encodeURIComponent(documentType)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    throw new Error("Unable to connect to the backend.");
  }

  if (!response.ok) {
    let message = "Unable to access driver document.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  return response.blob();
}

// =====================================
// PHASE 6: STAFF LOAD VERIFICATION
// =====================================

export function getPendingLoadVerificationsApi() {
  return apiRequest("/staff/loads/pending", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

export function updateLoadVerificationApi(
  bookingId,
  verificationData
) {
  return apiRequest(
    `/staff/loads/${encodeURIComponent(bookingId)}/verification`,
    {
      method: "PATCH",
      body: verificationData,
      auth: true,
      tokenType: "staff",
    }
  );
}

// =====================================
// PHASE 6: STAFF VEHICLE REVIEW
// =====================================

export function getPendingVehicleListingsApi() {
  return apiRequest("/staff/vehicles/pending", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

export function updateVehicleListingReviewApi(
  listingId,
  reviewData
) {
  return apiRequest(
    `/staff/vehicles/${encodeURIComponent(listingId)}/review`,
    {
      method: "PATCH",
      body: reviewData,
      auth: true,
      tokenType: "staff",
    }
  );
}

export function getVehicleBuyerInterestsApi() {
  return apiRequest("/staff/vehicles/buyer-interests", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

// =====================================
// PHASE 6: STAFF FINANCE ENQUIRIES
// =====================================

export function getStaffFinanceEnquiriesApi() {
  return apiRequest("/staff/finance-enquiries", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

export function updateStaffFinanceEnquiryStatusApi(
  enquiryId,
  status
) {
  return apiRequest(
    `/staff/finance-enquiries/${encodeURIComponent(enquiryId)}/status`,
    {
      method: "PATCH",
      body: { status },
      auth: true,
      tokenType: "staff",
    }
  );
}

// =====================================
// PHASE 6: STAFF DISPATCH MANAGEMENT
// =====================================

export function getStaffDispatchLoadsApi() {
  return apiRequest("/staff/dispatch", {
    method: "GET",
    auth: true,
    tokenType: "staff",
  });
}

export function confirmStaffPickupApi(
  bookingId,
  remarks = ""
) {
  return apiRequest(
    `/staff/dispatch/${encodeURIComponent(bookingId)}/confirm-pickup`,
    {
      method: "PATCH",
      body: { remarks },
      auth: true,
      tokenType: "staff",
    }
  );
}

// =====================================
// GET LOGGED-IN DRIVER PROFILE PHOTO
// =====================================

export async function getMyDriverProfilePhotoApi() {
  const token = localStorage.getItem("driverToken");

  if (!token) {
    throw new Error("Driver authentication required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/driver/profile-photo`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to fetch profile photo.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.blob();
}
