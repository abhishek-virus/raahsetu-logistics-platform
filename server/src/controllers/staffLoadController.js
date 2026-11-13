
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const hasStaffAccess = (req) => {
  return (
    req.user &&
    req.user.role === "staff" &&
    mongoose.Types.ObjectId.isValid(req.user.id)
  );
};

// Get pending bookings for staff verification
const getPendingLoadVerifications = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const pendingFilter = {
      status: "pending",
      assignedDriver: null,
      $or: [
        { staffVerificationStatus: "pending" },
        { staffVerificationStatus: { $exists: false } },
      ],
    };

    const bookings = await Booking.find(pendingFilter)
      .select("-__v")
      .populate("customer", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get pending load verifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending load verifications.",
    });
  }
};

// Approve or reject a booking
const updateLoadVerification = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const { bookingId } = req.params;
    const { status, remarks = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    if (typeof remarks !== "string" || remarks.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be a string of maximum 500 characters.",
      });
    }

    const cleanRemarks = remarks.trim();

    if (status === "rejected" && !cleanRemarks) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    const pendingFilter = {
      _id: bookingId,
      status: "pending",
      assignedDriver: null,
      $or: [
        { staffVerificationStatus: "pending" },
        { staffVerificationStatus: { $exists: false } },
      ],
    };

    const booking = await Booking.findOneAndUpdate(
      pendingFilter,
      {
        $set: {
          staffVerificationStatus: status,
          verificationRemarks: cleanRemarks,
          verifiedBy: req.user.id,
          verifiedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("customer", "name phone email");

    if (!booking) {
      const existingBooking = await Booking.findById(bookingId).select("_id");

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This booking has already been processed or is no longer pending.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Booking ${status} successfully.`,
      booking,
    });
  } catch (error) {
    console.error("Update load verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update load verification.",
    });
  }
};

module.exports = {
  getPendingLoadVerifications,
  updateLoadVerification,
};
