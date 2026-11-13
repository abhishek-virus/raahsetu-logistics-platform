
const jwt = require("jsonwebtoken");

const ALLOWED_ROLES = ["customer", "driver", "staff"];

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const authMiddleware = (req, res, next) => {
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
        message: "Access denied. Token required.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
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
      !OBJECT_ID_REGEX.test(decoded.id) ||
      !ALLOWED_ROLES.includes(decoded.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      phone: decoded.phone,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    if (
      error.name !== "JsonWebTokenError" &&
      error.name !== "TokenExpiredError" &&
      error.name !== "NotBeforeError"
    ) {
      console.error("Authentication middleware error:", error);
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;
