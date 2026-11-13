
const express = require("express");
const staffAuthMiddleware = require("../middleware/staffAuthMiddleware");

const {
  getPendingVehicleListings,
  updateVehicleListingReview,
  getVehicleBuyerInterests,
} = require("../controllers/staffVehicleController");

const router = express.Router();

// Get pending vehicle listings
router.get(
  "/pending",
  staffAuthMiddleware,
  getPendingVehicleListings
);

// Get approved vehicle listings with interested buyers
router.get(
  "/buyer-interests",
  staffAuthMiddleware,
  getVehicleBuyerInterests
);

// Approve or reject a vehicle listing
router.patch(
  "/:listingId/review",
  staffAuthMiddleware,
  updateVehicleListingReview
);

module.exports = router;
