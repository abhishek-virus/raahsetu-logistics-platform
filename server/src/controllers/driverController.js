
const mongoose = require("mongoose");
const Driver = require("../models/Driver");

function getDriverId(req) {
  if (
    !req.user ||
    req.user.role !== "driver" ||
    !mongoose.Types.ObjectId.isValid(req.user.id)
  ) {
    return null;
  }

  return req.user.id;
}

function driverResponse(driver) {
  return {
    id: driver._id.toString(),
    name: driver.name,
    phone: driver.phone,
    email: driver.email,
    dateOfBirth: driver.dateOfBirth,
    gender: driver.gender,
    bio: driver.bio,
    address: driver.address,
    experienceYears: driver.experienceYears,
    vehicleType: driver.vehicleType,
    vehicleModel: driver.vehicleModel,
    vehicleNumber: driver.vehicleNumber,
    licenseNumber: driver.licenseNumber,
    panNumber: driver.panNumber,
    profilePhoto: driver.profilePhoto,

    // Uploaded document information
    documents: {
      license: driver.documents?.license || null,
      vehicleRC: driver.documents?.vehicleRC || null,
      identity: driver.documents?.identity || null,
    },

    role: driver.role,
    verificationStatus: driver.verificationStatus,
    verificationRemarks: driver.verificationRemarks,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
}

function validateString(value, field, maxLength) {
  if (typeof value !== "string") {
    return `${field} must be a string.`;
  }

  if (value.trim().length > maxLength) {
    return `${field} cannot exceed ${maxLength} characters.`;
  }

  return null;
}

// GET DRIVER PROFILE

async function getDriverProfile(req, res) {
  try {
    const driverId = getDriverId(req);

    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: "Driver access required.",
      });
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      driver: driverResponse(driver),
    });
  } catch (error) {
    console.error("Get driver profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch driver profile.",
    });
  }
}

// UPDATE PERSONAL PROFILE

async function updateDriverProfile(req, res) {
  try {
    const driverId = getDriverId(req);

    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: "Driver access required.",
      });
    }

    const {
      name,
      email,
      dateOfBirth,
      gender,
      bio,
      address,
    } = req.body || {};

    const updates = {};

    if (name !== undefined) {
      const error = validateString(name, "Name", 100);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      const error = validateString(email, "Email", 150);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (
        normalizedEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address.",
        });
      }

      updates.email = normalizedEmail;
    }

    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === "") {
        updates.dateOfBirth = null;
      } else {
        const parsedDate = new Date(dateOfBirth);

        if (
          Number.isNaN(parsedDate.getTime()) ||
          parsedDate > new Date()
        ) {
          return res.status(400).json({
            success: false,
            message: "Enter a valid date of birth.",
          });
        }

        updates.dateOfBirth = parsedDate;
      }
    }

    if (gender !== undefined) {
      const error = validateString(gender, "Gender", 30);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      updates.gender = gender.trim();
    }

    if (bio !== undefined) {
      const error = validateString(bio, "Bio", 500);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      updates.bio = bio.trim();
    }

    if (address !== undefined) {
      const error = validateString(address, "Address", 300);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      updates.address = address.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided.",
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver profile updated successfully.",
      driver: driverResponse(driver),
    });
  } catch (error) {
    console.error("Update driver profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update driver profile.",
    });
  }
}

// UPDATE DRIVER EXPERIENCE AND VEHICLE DETAILS

async function updateDriverDetails(req, res) {
  try {
    const driverId = getDriverId(req);

    if (!driverId) {
      return res.status(403).json({
        success: false,
        message: "Driver access required.",
      });
    }

    const {
      experienceYears,
      vehicleType,
      vehicleModel,
      vehicleNumber,
      licenseNumber,
      panNumber,
    } = req.body || {};

    const updates = {};

    if (experienceYears !== undefined) {
      const years = Number(experienceYears);

      if (
        experienceYears === "" ||
        !Number.isFinite(years) ||
        years < 0 ||
        years > 60
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter valid driving experience in years.",
        });
      }

      updates.experienceYears = years;
    }

    if (vehicleType !== undefined) {
      const allowedVehicleTypes = [
        "mini-truck",
        "light-truck",
        "heavy-truck",
        "",
      ];

      if (!allowedVehicleTypes.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid vehicle type.",
        });
      }

      updates.vehicleType = vehicleType;
    }

    const stringFields = [
      ["vehicleModel", vehicleModel, 100],
      ["vehicleNumber", vehicleNumber, 30],
      ["licenseNumber", licenseNumber, 50],
      ["panNumber", panNumber, 10],
    ];

    for (const [field, value, maxLength] of stringFields) {
      if (value === undefined) continue;

      const error = validateString(value, field, maxLength);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error,
        });
      }

      updates[field] =
        field === "vehicleNumber" ||
        field === "licenseNumber" ||
        field === "panNumber"
          ? value.trim().toUpperCase()
          : value.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid driver details provided.",
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver details updated successfully.",
      driver: driverResponse(driver),
    });
  } catch (error) {
    console.error("Update driver details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update driver details.",
    });
  }
}

module.exports = {
  getDriverProfile,
  updateDriverProfile,
  updateDriverDetails,
};
