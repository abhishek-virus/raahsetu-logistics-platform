
const express = require("express");

const staffAuthMiddleware = require("../middleware/staffAuthMiddleware");

const {
  getStaffDashboardStats,
} = require("../controllers/staffDashboardController");

const router = express.Router();

// Staff Dashboard Statistics
router.get(
  "/stats",
  staffAuthMiddleware,
  getStaffDashboardStats
);

module.exports = router;
