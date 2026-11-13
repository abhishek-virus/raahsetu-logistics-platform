
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const ALLOWED_TRUCK_TYPES = [
  "mini-truck",
  "light-truck",
  "heavy-truck",
];

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidTime(value) {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

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

    // Validate authenticated customer
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Validate location fields
    if (
      typeof pickupLocation !== "string" ||
      typeof dropLocation !== "string" ||
      !pickupLocation.trim() ||
      !dropLocation.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid pickup and drop locations.",
      });
    }

    const pickup = pickupLocation.trim();
    const drop = dropLocation.trim();

    if (pickup.length > 150 || drop.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Location must not exceed 150 characters.",
      });
    }

    if (pickup.toLowerCase() === drop.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Pickup and drop locations must be different.",
      });
    }

    // Validate goods type
    if (
      typeof goodsType !== "string" ||
      !goodsType.trim() ||
      goodsType.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid goods type.",
      });
    }

    // Validate weight
    if (
      goodsWeightKg === undefined ||
      goodsWeightKg === null ||
      (typeof goodsWeightKg !== "number" &&
        typeof goodsWeightKg !== "string") ||
      (typeof goodsWeightKg === "string" && !goodsWeightKg.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid goods weight.",
      });
    }

    const weight = Number(goodsWeightKg);

    if (!Number.isFinite(weight) || weight < 1) {
      return res.status(400).json({
        success: false,
        message: "Goods weight must be at least 1 kg.",
      });
    }

    // Validate pickup date
    if (!isValidDateOnly(pickupDate)) {
      return res.status(400).json({
        success: false,
        message: "Pickup date must be a valid YYYY-MM-DD date.",
      });
    }

    const [year, month, day] = pickupDate.split("-").map(Number);

    // Use local date components to avoid UTC date-only parsing shifts.
    const pickupDay = new Date(year, month - 1, day);
    pickupDay.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupDay < today) {
      return res.status(400).json({
        success: false,
        message: "Pickup date cannot be in the past.",
      });
    }

    // Validate pickup time
    if (!isValidTime(pickupTime)) {
      return res.status(400).json({
        success: false,
        message: "Pickup time must use HH:mm format.",
      });
    }

    // Validate truck type
    if (
      typeof truckType !== "string" ||
      !ALLOWED_TRUCK_TYPES.includes(truckType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid truck type.",
      });
    }

    // Create booking for authenticated customer only
    const booking = await Booking.create({
      customer: req.user.id,
      pickupLocation: pickup,
      dropLocation: drop,
      pickupDate: pickupDay,
      pickupTime,
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

// Get bookings belonging to authenticated customer
async function getCustomerBookings(req, res) {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

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

// Get one booking belonging to authenticated customer
async function getCustomerBookingById(req, res) {
  try {
    const { id } = req.params;

    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

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
