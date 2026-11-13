
const mongoose = require("mongoose");
const Driver = require("../models/Driver");

// Validate staff access
function hasStaffAccess(req) {
  return (
    req.user &&
    req.user.role === "staff" &&
    mongoose.isValidObjectId(req.user.id)
  );
}

// Get all pending driver applications
async function getPendingDriverVerifications(req, res) {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access only.",
      });
    }

    const drivers = await Driver.find({
      verificationStatus: "pending",
    })
      .select(
        "name phone email address dateOfBirth gender bio experienceYears vehicleType vehicleNumber licenseNumber panNumber documents profilePhoto verificationStatus verificationRemarks createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: drivers.length,
      drivers,
    });
  } catch (error) {
    console.error("Get pending drivers error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending driver applications.",
    });
  }
}

// Approve or reject a driver application
async function updateDriverVerification(req, res) {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access only.",
      });
    }

    const { driverId } = req.params;
    const { status, remarks = "" } = req.body || {};

    if (!mongoose.isValidObjectId(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    if (
      typeof remarks !== "string" ||
      remarks.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be a valid string of up to 500 characters.",
      });
    }

    const cleanRemarks = remarks.trim();

    if (status === "rejected" && !cleanRemarks) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for rejecting the application.",
      });
    }

    const driver = await Driver.findOneAndUpdate(
      {
        _id: driverId,
        verificationStatus: "pending",
      },
      {
        $set: {
          verificationStatus: status,
          verificationRemarks: cleanRemarks,
          verifiedBy: req.user.id,
          verifiedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "name phone email verificationStatus verificationRemarks verifiedBy verifiedAt"
    );

    if (!driver) {
      const existingDriver = await Driver.findById(driverId)
        .select("verificationStatus")
        .lean();

      if (!existingDriver) {
        return res.status(404).json({
          success: false,
          message: "Driver application not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This driver application has already been reviewed.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "Driver application approved successfully."
          : "Driver application rejected successfully.",
      driver,
    });
  } catch (error) {
    console.error("Update driver verification error:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver verification details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update driver verification.",
    });
  }
}

module.exports = {
  getPendingDriverVerifications,
  updateDriverVerification,
};
