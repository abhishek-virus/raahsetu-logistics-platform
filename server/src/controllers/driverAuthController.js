
const jwt = require("jsonwebtoken");
const Driver = require("../models/Driver");
const { generateOTP, verifyOTP } = require("../services/otpService");

function isValidPhone(phone) {
  return typeof phone === "string" && /^\d{10}$/.test(phone);
}

function createDriverToken(driver) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: driver._id.toString(),
      phone: driver.phone,
      role: "driver",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function driverResponse(driver) {
  return {
    id: driver._id.toString(),
    name: driver.name,
    phone: driver.phone,
    email: driver.email,
    role: driver.role,
    verificationStatus: driver.verificationStatus,
  };
}

// EXISTING DRIVER LOGIN

async function requestDriverOTP(req, res) {
  try {
    const { phone } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    const driver = await Driver.findOne({ phone });

    if (!driver) {
      return res.status(404).json({
        success: false,
        code: "DRIVER_NOT_REGISTERED",
        message: "This number is not registered. Please register as a new driver.",
      });
    }

    await generateOTP(phone, "driver-login");

    return res.status(200).json({
      success: true,
      message: "Login OTP generated. Check server terminal.",
    });
  } catch (error) {
    console.error("Driver login OTP request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate login OTP.",
    });
  }
}

async function verifyDriverOTP(req, res) {
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

    const driver = await Driver.findOne({ phone });

    if (!driver) {
      return res.status(404).json({
        success: false,
        code: "DRIVER_NOT_REGISTERED",
        message: "Driver account not found. Please register first.",
      });
    }

    const result = verifyOTP(phone, otp, "driver-login");

    if (!result.success) {
      return res.status(400).json(result);
    }

    const token = createDriverToken(driver);

    return res.status(200).json({
      success: true,
      message: "Driver login successful.",
      token,
      driver: driverResponse(driver),
    });
  } catch (error) {
    console.error("Driver login verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Driver login failed. Please try again.",
    });
  }
}

// NEW DRIVER REGISTRATION

async function requestDriverRegistrationOTP(req, res) {
  try {
    const { phone } = req.body || {};

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    const existingDriver = await Driver.findOne({ phone });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        code: "DRIVER_ALREADY_REGISTERED",
        message: "This number is already registered. Please log in.",
      });
    }

    await generateOTP(phone, "driver-registration");

    return res.status(200).json({
      success: true,
      message: "Registration OTP generated. Check server terminal.",
    });
  } catch (error) {
    console.error("Driver registration OTP request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate registration OTP.",
    });
  }
}

async function verifyDriverRegistrationOTP(req, res) {
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
        message: "Authentication configuration error.",
      });
    }

    const existingDriver = await Driver.findOne({ phone });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        code: "DRIVER_ALREADY_REGISTERED",
        message: "This number is already registered. Please log in.",
      });
    }

    const result = verifyOTP(phone, otp, "driver-registration");

    if (!result.success) {
      return res.status(400).json(result);
    }

    const driver = await Driver.create({
      phone,
      role: "driver",
    });

    const token = createDriverToken(driver);

    return res.status(201).json({
      success: true,
      message: "Driver registration started successfully.",
      token,
      driver: driverResponse(driver),
    });
  } catch (error) {
    console.error("Driver registration verification error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "DRIVER_ALREADY_REGISTERED",
        message: "This number is already registered. Please log in.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Driver registration failed. Please try again.",
    });
  }
}

module.exports = {
  requestDriverOTP,
  verifyDriverOTP,
  requestDriverRegistrationOTP,
  verifyDriverRegistrationOTP,
};
