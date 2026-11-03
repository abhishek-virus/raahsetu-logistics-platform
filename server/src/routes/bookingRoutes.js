
const express = require("express");

const {
  createBooking,
  getCustomerBookings,
  getCustomerBookingById,
} = require("../controllers/bookingController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated customers can access booking routes
function customerOnly(req, res, next) {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required.",
    });
  }

  return next();
}

// Create a booking
router.post("/", authMiddleware, customerOnly, createBooking);

// Get logged-in customer's booking history
router.get("/", authMiddleware, customerOnly, getCustomerBookings);

// Get a specific booking
router.get("/:id", authMiddleware, customerOnly, getCustomerBookingById);

module.exports = router;
