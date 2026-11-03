
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

// Create a new booking
async function createBooking(req, res) {
  try {
    const {
      pickupLocation,
      dropLocation,
      pickupDate,
      pickupTime,
      goodsType,
      goodsWeightKg,
      truckType,
    } = req.body || {};

    // Validate required fields
    if (
      !pickupLocation?.trim?.() ||
      !dropLocation?.trim?.() ||
      !pickupDate ||
      !pickupTime?.trim?.() ||
      !goodsType?.trim?.() ||
      goodsWeightKg === undefined ||
      goodsWeightKg === null ||
      goodsWeightKg === "" ||
      !truckType
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details.",
      });
    }

    // Validate location length
    if (
      pickupLocation.trim().length > 150 ||
      dropLocation.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Location must not exceed 150 characters.",
      });
    }

    // Validate locations
    if (
      pickupLocation.trim().toLowerCase() ===
      dropLocation.trim().toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message: "Pickup and drop locations must be different.",
      });
    }

    // Validate goods type
    if (typeof goodsType !== "string" || goodsType.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid goods type.",
      });
    }

    // Validate weight
    const weight = Number(goodsWeightKg);

    if (!Number.isFinite(weight) || weight < 1) {
      return res.status(400).json({
        success: false,
        message: "Goods weight must be at least 1 kg.",
      });
    }

    // Validate pickup date
    const date = new Date(pickupDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid pickup date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return res.status(400).json({
        success: false,
        message: "Pickup date cannot be in the past.",
      });
    }

    // Validate pickup time (24-hour HH:mm)
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime.trim())) {
      return res.status(400).json({
        success: false,
        message: "Pickup time must use HH:mm format.",
      });
    }

    // Validate truck type
    const allowedTruckTypes = [
      "mini-truck",
      "light-truck",
      "heavy-truck",
    ];

    if (!allowedTruckTypes.includes(truckType)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid truck type.",
      });
    }

    // Create booking for the authenticated customer only
    const booking = await Booking.create({
      customer: req.user.id,
      pickupLocation: pickupLocation.trim(),
      dropLocation: dropLocation.trim(),
      pickupDate: date,
      pickupTime: pickupTime.trim(),
      goodsType: goodsType.trim(),
      goodsWeightKg: weight,
      truckType,
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Booking details are invalid.",
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking. Please try again.",
    });
  }
}

// Get bookings belonging to the authenticated customer
async function getCustomerBookings(req, res) {
  try {
    const bookings = await Booking.find({
      customer: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get customer bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings.",
    });
  }
}

// Get one booking belonging to the authenticated customer
async function getCustomerBookingById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      customer: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Get booking details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch booking details.",
    });
  }
}

module.exports = {
  createBooking,
  getCustomerBookings,
  getCustomerBookingById,
};
