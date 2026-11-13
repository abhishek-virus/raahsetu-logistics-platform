
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Staff = require("../models/Staff");

const staffAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment.");

      return res.status(500).json({
        success: false,
        message: "Authentication is temporarily unavailable.",
      });
    }

    if (
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Staff token required.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Staff token required.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    if (
      !decoded ||
      typeof decoded !== "object" ||
      Array.isArray(decoded) ||
      typeof decoded.id !== "string" ||
      !mongoose.Types.ObjectId.isValid(decoded.id) ||
      decoded.role !== "staff"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid staff authentication token.",
      });
    }

    // Verify that the staff account still exists and is active
    const staff = await Staff.findById(decoded.id)
      .select("_id email isActive")
      .lean();

    if (!staff || !staff.isActive) {
      return res.status(403).json({
        success: false,
        message: "Staff account is inactive or unavailable.",
      });
    }

    req.user = {
      id: staff._id.toString(),
      email: staff.email,
      role: "staff",
    };

    return next();
  } catch (error) {
    if (
      error.name !== "JsonWebTokenError" &&
      error.name !== "TokenExpiredError" &&
      error.name !== "NotBeforeError"
    ) {
      console.error("Staff authentication error:", error);
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired staff token.",
    });
  }
};

module.exports = staffAuthMiddleware;
