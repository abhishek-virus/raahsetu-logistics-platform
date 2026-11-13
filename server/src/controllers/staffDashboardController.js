
const mongoose = require("mongoose");

const Driver = require("../models/Driver");
const Booking = require("../models/Booking");
const VehicleListing = require("../models/VehicleListing");
const FinanceEnquiry = require("../models/FinanceEnquiry");

async function getStaffDashboardStats(req, res) {
  try {
    // Validate staff authentication
    if (
      !req.user ||
      req.user.role !== "staff" ||
      !mongoose.isValidObjectId(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Staff access only.",
      });
    }

    const [
      pendingDrivers,
      pendingLoads,
      confirmedLoads,
      assignedLoads,
      activeDeliveries,
      pendingVehicles,
      pendingFinanceEnquiries,
    ] = await Promise.all([
      // Drivers waiting for staff verification
      Driver.countDocuments({
        verificationStatus: "pending",
      }),

      // New and legacy bookings waiting for staff verification
      Booking.countDocuments({
        status: "pending",
        assignedDriver: null,
        $or: [
          { staffVerificationStatus: "pending" },
          { staffVerificationStatus: { $exists: false } },
        ],
      }),

      // Confirmed bookings
      Booking.countDocuments({
        status: "confirmed",
      }),

      // Driver-accepted bookings awaiting delivery
      Booking.countDocuments({
        status: "assigned",
      }),

      // Deliveries currently in transit
      Booking.countDocuments({
        status: "in-transit",
      }),

      // Vehicle listings waiting for review
      VehicleListing.countDocuments({
        status: "pending",
      }),

      // Finance and insurance enquiries awaiting review
      FinanceEnquiry.countDocuments({
        status: "pending",
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        pendingDrivers,
        pendingLoads,
        confirmedLoads,
        assignedLoads,
        activeDeliveries,
        pendingVehicles,
        pendingFinanceEnquiries,
      },
    });
  } catch (error) {
    console.error("Staff dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch staff dashboard statistics.",
    });
  }
}

module.exports = {
  getStaffDashboardStats,
};
