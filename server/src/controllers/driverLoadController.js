
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

// Validate authenticated driver context
const hasValidDriver = (req) => {
  return (
    req.driver &&
    mongoose.Types.ObjectId.isValid(req.driver._id)
  );
};

// Get available loads for driver's vehicle type
async function getAvailableLoads(req, res) {
  try {
    if (!hasValidDriver(req)) {
      return res.status(403).json({
        success: false,
        message: "Valid driver access required.",
      });
    }

    const vehicleType = req.driver.vehicleType;

    if (typeof vehicleType !== "string" || !vehicleType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Driver vehicle type is not configured.",
      });
    }

    const loads = await Booking.find({
      status: "pending",
      staffVerificationStatus: "approved",
      assignedDriver: null,
      truckType: vehicleType,
    })
      .select("-__v")
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: loads.length,
      loads,
    });
  } catch (error) {
    console.error("Get available loads error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch available loads.",
    });
  }
}

// Accept an available load
async function acceptLoad(req, res) {
  try {
    if (!hasValidDriver(req)) {
      return res.status(403).json({
        success: false,
        message: "Valid driver access required.",
      });
    }

    const driver = req.driver;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (
      typeof driver.vehicleType !== "string" ||
      !driver.vehicleType.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Driver vehicle type is not configured.",
      });
    }

    const booking = await Booking.findById(id)
      .select("_id status staffVerificationStatus truckType");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Load not found.",
      });
    }

    if (booking.staffVerificationStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "This load has not been approved by staff.",
      });
    }

    if (booking.truckType !== driver.vehicleType) {
      return res.status(403).json({
        success: false,
        message: "This load does not match your vehicle type.",
      });
    }

    // Atomic update: only one eligible driver can claim this booking
    const acceptedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
        staffVerificationStatus: "approved",
        assignedDriver: null,
        truckType: driver.vehicleType,
      },
      {
        $set: {
          assignedDriver: driver._id,
          assignedAt: new Date(),
          status: "assigned",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-__v")
      .populate("customer", "name phone")
      .populate("assignedDriver", "name phone vehicleNumber");

    if (!acceptedBooking) {
      return res.status(409).json({
        success: false,
        message: "This load is no longer available. Please refresh loads.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Load accepted successfully.",
      booking: acceptedBooking,
    });
  } catch (error) {
    console.error("Accept load error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to accept this load.",
    });
  }
}

// Get loads assigned to the logged-in driver
async function getMyLoads(req, res) {
  try {
    if (!hasValidDriver(req)) {
      return res.status(403).json({
        success: false,
        message: "Valid driver access required.",
      });
    }

    const loads = await Booking.find({
      assignedDriver: req.driver._id,
      status: { $in: ["assigned", "in-transit", "delivered"] },
    })
      .select("-__v")
      .populate("customer", "name phone")
      .sort({ assignedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: loads.length,
      loads,
    });
  } catch (error) {
    console.error("Get driver loads error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your assigned loads.",
    });
  }
}

// Update delivery status
async function updateDeliveryStatus(req, res) {
  try {
    if (!hasValidDriver(req)) {
      return res.status(403).json({
        success: false,
        message: "Valid driver access required.",
      });
    }

    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    if (!["in-transit", "delivered"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status.",
      });
    }

    const allowedTransitions = {
      assigned: "in-transit",
      "in-transit": "delivered",
    };

    const currentBooking = await Booking.findOne({
      _id: id,
      assignedDriver: req.driver._id,
    }).select("_id status pickupConfirmedAt");

    if (!currentBooking) {
      return res.status(404).json({
        success: false,
        message: "Assigned load not found.",
      });
    }

    const expectedNextStatus =
      allowedTransitions[currentBooking.status];

    if (expectedNextStatus !== status) {
      return res.status(409).json({
        success: false,
        message: `Cannot change status from ${currentBooking.status} to ${status}.`,
      });
    }

    // Staff must confirm customer pickup before delivery starts
    if (
      currentBooking.status === "assigned" &&
      !currentBooking.pickupConfirmedAt
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Staff must confirm customer pickup before you can start delivery.",
      });
    }

    // Atomic update to prevent invalid concurrent transitions
    const updateFilter = {
      _id: id,
      assignedDriver: req.driver._id,
      status: currentBooking.status,
    };

    // Enforce pickup confirmation inside the atomic database update too
    if (currentBooking.status === "assigned") {
      updateFilter.pickupConfirmedAt = { $ne: null };
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      updateFilter,
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-__v")
      .populate("customer", "name phone")
      .lean();

    if (!updatedBooking) {
      return res.status(409).json({
        success: false,
        message:
          "Load status changed or pickup is not confirmed. Please refresh and try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}.`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update delivery status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update delivery status.",
    });
  }
}

module.exports = {
  getAvailableLoads,
  acceptLoad,
  getMyLoads,
  updateDeliveryStatus,
};
