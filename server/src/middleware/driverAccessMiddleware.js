
const mongoose = require("mongoose");
const Driver = require("../models/Driver");

// Verify driver role and fetch driver profile
async function driverOnly(req, res, next) {
  try {
    if (req.user?.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid driver authentication.",
      });
    }

    const driver = await Driver.findById(req.user.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    if (driver.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Invalid driver account.",
      });
    }

    req.driver = driver;

    return next();
  } catch (error) {
    console.error("Driver access middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify driver access.",
    });
  }
}

// Allow only approved drivers
async function approvedDriverOnly(req, res, next) {
  try {
    if (!req.driver) {
      return res.status(500).json({
        success: false,
        message: "Driver profile was not loaded.",
      });
    }

    if (req.driver.verificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your account is not approved to access driver loads yet.",
        verificationStatus: req.driver.verificationStatus || "pending",
      });
    }

    return next();
  } catch (error) {
    console.error("Driver approval middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify driver approval.",
    });
  }
}

module.exports = {
  driverOnly,
  approvedDriverOnly,
};
