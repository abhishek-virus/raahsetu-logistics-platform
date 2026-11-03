
const otpStore = new Map();

function generateOTP(phone) {
  const otp = String(Math.floor(100000 + Math.random() * 900000));

  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  });

  // Development only: OTP terminal mein dikhega.
  console.log(`Development OTP for ${phone}: ${otp}`);

  return true;
}

function verifyOTP(phone, enteredOTP) {
  const data = otpStore.get(phone);

  if (!data) {
    return { success: false, message: "Please request an OTP first." };
  }

  if (Date.now() > data.expiresAt) {
    otpStore.delete(phone);
    return { success: false, message: "OTP has expired." };
  }

  if (data.attempts >= 5) {
    otpStore.delete(phone);
    return { success: false, message: "Too many attempts. Request a new OTP." };
  }

  data.attempts++;

  if (data.otp !== enteredOTP) {
    return { success: false, message: "Invalid OTP." };
  }

  otpStore.delete(phone);
  return { success: true };
}

module.exports = { generateOTP, verifyOTP };
