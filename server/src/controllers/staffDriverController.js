
const mongoose = require("mongoose");
const Driver = require("../models/Driver");

// =====================================
// STAFF ACCESS VALIDATION
// =====================================

function hasStaffAccess(req) {
  return (
    req.user &&
    req.user.role === "staff" &&
    mongoose.isValidObjectId(req.user.id)
  );
}

// =====================================
// DRIVER PROFILE COMPLETION VALIDATION
// =====================================

function validateDriverForApproval(driver) {
  const missingFields = [];
  const missingDocuments = [];

  // Personal information
  const personalFields = [
    ["name", "Full name"],
    ["email", "Email address"],
    ["address", "Address"],
  ];

  for (const [key, label] of personalFields) {
    if (
      typeof driver[key] !== "string" ||
      !driver[key].trim()
    ) {
      missingFields.push(label);
    }
  }

  // Vehicle information
  if (
    typeof driver.experienceYears !== "number" ||
    !Number.isFinite(driver.experienceYears) ||
    driver.experienceYears < 0
  ) {
    missingFields.push("Driving experience");
  }

  const allowedVehicleTypes = [
    "mini-truck",
    "light-truck",
    "heavy-truck",
  ];

  if (!allowedVehicleTypes.includes(driver.vehicleType)) {
    missingFields.push("Vehicle type");
  }

  const vehicleFields = [
    ["vehicleModel", "Vehicle model"],
    ["vehicleNumber", "Vehicle registration number"],
    ["licenseNumber", "Driving licence number"],
  ];

  for (const [key, label] of vehicleFields) {
    if (
      typeof driver[key] !== "string" ||
      !driver[key].trim()
    ) {
      missingFields.push(label);
    }
  }

  // Required verification documents
  const requiredDocuments = [
    ["license", "Driving Licence"],
    ["vehicleRC", "Vehicle RC"],
    ["identity", "Identity Proof"],
  ];

  for (const [key, label] of requiredDocuments) {
    if (!driver.documents?.[key]?.filename) {
      missingDocuments.push(label);
    }
  }

  return {
    isComplete:
      missingFields.length === 0 &&
      missingDocuments.length === 0,
    missingFields,
    missingDocuments,
  };
}

// =====================================
// GET PENDING DRIVER APPLICATIONS
// =====================================

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
        "name phone email address dateOfBirth gender bio experienceYears vehicleType vehicleModel vehicleNumber licenseNumber panNumber documents profilePhoto verificationStatus verificationRemarks createdAt"
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

// =====================================
// APPROVE OR REJECT DRIVER APPLICATION
// =====================================

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

    // Validate driver ID
    if (!mongoose.isValidObjectId(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID.",
      });
    }

    // Validate requested status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    // Validate remarks
    if (
      typeof remarks !== "string" ||
      remarks.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Remarks must be a valid string of up to 500 characters.",
      });
    }

    const cleanRemarks = remarks.trim();

    if (status === "rejected" && !cleanRemarks) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a reason for rejecting the application.",
      });
    }

    // Find an application that has not already been reviewed
    const pendingDriver = await Driver.findOne({
      _id: driverId,
      verificationStatus: "pending",
    });

    if (!pendingDriver) {
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
        message:
          "This driver application has already been reviewed.",
      });
    }

    // Approval requires a complete profile and all documents.
    if (status === "approved") {
      const validation = validateDriverForApproval(pendingDriver);

      if (!validation.isComplete) {
        return res.status(400).json({
          success: false,
          message:
            "Driver application is incomplete. Complete all required details and documents before approval.",
          missingFields: validation.missingFields,
          missingDocuments: validation.missingDocuments,
        });
      }
    }

    // Atomic update: prevent duplicate approval/rejection.
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
      return res.status(409).json({
        success: false,
        message:
          "This driver application has already been reviewed. Please refresh.",
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

// =====================================
// EXPORTS
// =====================================

module.exports = {
  getPendingDriverVerifications,
  updateDriverVerification,
};
