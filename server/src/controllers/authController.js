const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const { generateOTP, verifyOTP } = require("../services/otpService");

function isValidPhone(phone) {
  return typeof phone === "string" && /^\d{10}$/.test(phone);
}

function requestOTP(req, res) {
  const { phone } = req.body;

  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 10-digit mobile number.",
    });
  }

  generateOTP(phone);

  res.status(200).json({
    success: true,
    message: "OTP generated for development. Check the server terminal.",
  });
}

async function verifyCustomerOTP(req, res) {
  const { phone, otp } = req.body;

  if (!isValidPhone(phone) || typeof otp !== "string") {
    return res.status(400).json({
      success: false,
      message: "Valid phone number and OTP are required.",
    });
  }

  const result = verifyOTP(phone, otp);

  if (!result.success) {
    return res.status(400).json(result);
  }

  const customer = await Customer.findOne({ phone });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer not found. Please register first.",
    });
  }

  const token = jwt.sign(
    {
      id: customer._id,
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
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      role: customer.role,
    },
  });
}

module.exports = { requestOTP, verifyCustomerOTP };
