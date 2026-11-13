
const crypto = require("crypto");

const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getOTPKey(phone, role) {
  return `${role}:${String(phone).trim()}`;
}

function generateOTP(phone, role = "customer") {
  if (!phone || typeof phone !== "string") {
    throw new Error("Valid phone number is required.");
  }

  const otp = String(crypto.randomInt(100000, 1000000));
  const key = getOTPKey(phone, role);

  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  // Development only. Never expose OTP in production logs.
  if (process.env.NODE_ENV !== "production") {
    console.log(`Development OTP for ${role}: ${otp}`);
  }

  return true;
}

function verifyOTP(phone, enteredOTP, role = "customer") {
  if (!phone || !enteredOTP) {
    return {
      success: false,
      message: "Phone number and OTP are required.",
    };
  }

  const key = getOTPKey(phone, role);
  const data = otpStore.get(key);

  if (!data) {
    return {
      success: false,
      message: "Please request an OTP first.",
    };
  }

  if (Date.now() >= data.expiresAt) {
    otpStore.delete(key);

    return {
      success: false,
      message: "OTP has expired.",
    };
  }

  if (data.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);

    return {
      success: false,
      message: "Too many attempts. Request a new OTP.",
    };
  }

  data.attempts++;

  const normalizedOTP = String(enteredOTP).trim();

  if (!/^\d{6}$/.test(normalizedOTP) || data.otp !== normalizedOTP) {
    return {
      success: false,
      message: "Invalid OTP.",
    };
  }

  // OTP is single-use.
  otpStore.delete(key);

  return { success: true };
}

module.exports = {
  generateOTP,
  verifyOTP,
};
