
const API_BASE_URL = "http://localhost:5001/api";

async function apiRequest(
  endpoint,
  { method = "GET", body, auth = false } = {}
) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = localStorage.getItem("token");

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
        ? { body: JSON.stringify(body) }
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

// Phase 1: OTP APIs
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

// Phase 2: Booking APIs
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
