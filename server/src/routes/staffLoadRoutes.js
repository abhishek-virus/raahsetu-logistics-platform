
const express = require("express");

const staffAuthMiddleware = require("../middleware/staffAuthMiddleware");

const {
  getPendingLoadVerifications,
  updateLoadVerification,
} = require("../controllers/staffLoadController");

const router = express.Router();

// Get pending bookings for staff verification
router.get(
  "/pending",
  staffAuthMiddleware,
  getPendingLoadVerifications
);

// Approve or reject a booking
router.patch(
  "/:bookingId/verification",
  staffAuthMiddleware,
  updateLoadVerification
);

module.exports = router;
