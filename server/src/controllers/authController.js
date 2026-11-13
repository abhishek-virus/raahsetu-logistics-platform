
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const {
  generateOTP,
  verifyOTP,
} = require("../services/otpService");

function isValidPhone(phone) {
  return typeof phone === "string" && /^\d{10}$/.test(phone);
}

function createCustomerToken(customer) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: customer._id.toString(),
      phone: customer.phone,
      role: "customer",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function customerResponse(customer) {
  return {
    id: customer._id.toString(),
    name: customer.name || "",
    phone: customer.phone,
    email: customer.email || "",
    role: customer.role,
  };
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

    generateOTP(phone, "customer");

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully.",
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

    if (
      !isValidPhone(phone) ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number and 6-digit OTP.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is temporarily unavailable.",
      });
    }

    // Verify OTP before account creation or login.
    const result = verifyOTP(phone, otp, "customer");

    if (!result.success) {
      return res.status(400).json(result);
    }

    let customer = await Customer.findOne({ phone });

    if (!customer) {
      try {
        customer = await Customer.create({
          phone,
          role: "customer",
        });
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }

        // Handle simultaneous registration.
        customer = await Customer.findOne({ phone });
      }
    }

    if (!customer) {
      return res.status(500).json({
        success: false,
        message: "Unable to create or retrieve customer account.",
      });
    }

    if (customer.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "This account cannot use customer login.",
      });
    }

    const token = createCustomerToken(customer);

    return res.status(200).json({
      success: true,
      message: "Customer login successful.",
      token,
      customer: customerResponse(customer),
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
