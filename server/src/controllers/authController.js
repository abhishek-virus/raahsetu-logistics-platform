
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const { generateOTP, verifyOTP } = require("../services/otpService");

function isValidPhone(phone) {
  return typeof phone === "string" && /^\d{10}$/.test(phone);
}

// Request OTP
async function requestOTP(req, res) {
  try {
    const { phone } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    await generateOTP(phone);

    return res.status(200).json({
      success: true,
      message:
        "Development OTP generated. Check the server terminal.",
    });
  } catch (error) {
    console.error("Request OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate OTP. Please try again.",
    });
  }
}

// Verify OTP and log in customer
async function verifyCustomerOTP(req, res) {
  try {
    const { phone, otp } = req.body || {};

    if (!isValidPhone(phone) || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number and 6-digit OTP.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment.");

      return res.status(500).json({
        success: false,
        message: "Authentication is temporarily unavailable.",
      });
    }

    // Verify OTP before authenticating the customer
    const result = verifyOTP(phone, otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Find existing customer or create a new customer
    let customer = await Customer.findOne({ phone });

    if (!customer) {
      customer = await Customer.create({
        phone,
        role: "customer",
      });
    }

    // Do not issue a customer token to another role
    if (customer.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "This account cannot use customer login.",
      });
    }

    const token = jwt.sign(
      {
        id: customer._id.toString(),
        phone: customer.phone,
        role: customer.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Customer login successful.",
      token,
      customer: {
        id: customer._id.toString(),
        name: customer.name || "",
        phone: customer.phone,
        email: customer.email || "",
        role: customer.role,
      },
    });
  } catch (error) {
    console.error("Verify customer OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
}

module.exports = {
  requestOTP,
  verifyCustomerOTP,
};
