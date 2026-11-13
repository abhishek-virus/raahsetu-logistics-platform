
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

function createStaffToken(staff) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: staff._id.toString(),
      email: staff.email,
      role: "staff",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

async function loginStaff(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Gmail address and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!GMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Gmail address and password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment.");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    const staff = await Staff.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!staff || !staff.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!staff.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your staff account is inactive.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      staff.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createStaffToken(staff);

    return res.status(200).json({
      success: true,
      message: "Staff login successful.",
      token,
      staff: {
        id: staff._id.toString(),
        name: staff.name,
        email: staff.email,
        role: "staff",
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);

    return res.status(500).json({
      success: false,
      message: "Staff login failed. Please try again.",
    });
  }
}

module.exports = {
  loginStaff,
};
