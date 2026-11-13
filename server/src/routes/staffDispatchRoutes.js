
const express = require("express");
const staffAuthMiddleware = require("../middleware/staffAuthMiddleware");

const {
  getStaffDispatchLoads,
  confirmStaffPickup,
} = require("../controllers/staffDispatchController");

const router = express.Router();

// Get driver-accepted loads for staff
router.get(
  "/",
  staffAuthMiddleware,
  getStaffDispatchLoads
);

// Record staff pickup confirmation
router.patch(
  "/:bookingId/confirm-pickup",
  staffAuthMiddleware,
  confirmStaffPickup
);

module.exports = router;
