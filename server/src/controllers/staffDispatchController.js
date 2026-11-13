
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const hasStaffAccess = (req) => {
  return (
    req.user &&
    req.user.role === "staff" &&
    mongoose.Types.ObjectId.isValid(req.user.id)
  );
};

// Get bookings accepted by drivers
const getStaffDispatchLoads = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const bookings = await Booking.find({
      status: { $in: ["assigned", "in-transit", "delivered"] },
      assignedDriver: { $ne: null },
    })
      .select("-__v")
      .populate("customer", "name phone email")
      .populate("assignedDriver", "name phone vehicleType vehicleNumber")
      .sort({ assignedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get staff dispatch loads error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dispatch loads.",
    });
  }
};

// Confirm pickup after staff contacts the customer
const confirmStaffPickup = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const { bookingId } = req.params;
    const { remarks = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (typeof remarks !== "string" || remarks.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be a string of maximum 500 characters.",
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: "assigned",
        assignedDriver: { $ne: null },
        pickupConfirmedAt: null,
      },
      {
        $set: {
          pickupConfirmedAt: new Date(),
          pickupConfirmedBy: req.user.id,
          pickupConfirmationRemarks: remarks.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("customer", "name phone email")
      .populate("assignedDriver", "name phone vehicleType vehicleNumber");

    if (!booking) {
      const existingBooking = await Booking.findById(bookingId)
        .select("_id status pickupConfirmedAt");

      if (!existingBooking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      if (existingBooking.status !== "assigned") {
        return res.status(409).json({
          success: false,
          message: "Pickup confirmation is only available for assigned bookings.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Pickup has already been confirmed or the booking is unavailable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pickup confirmation recorded successfully.",
      booking,
    });
  } catch (error) {
    console.error("Confirm staff pickup error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to confirm pickup.",
    });
  }
};

module.exports = {
  getStaffDispatchLoads,
  confirmStaffPickup,
};
