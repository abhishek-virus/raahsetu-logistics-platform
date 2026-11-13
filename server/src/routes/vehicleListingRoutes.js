
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const uploadVehiclePhotos = require("../middleware/uploadVehiclePhotos");

const {
  createVehicleListing,
  getApprovedVehicleListings,
  registerVehicleInterest,
} = require("../controllers/vehicleListingController");

const router = express.Router();

// Allow only customers and drivers
function requesterOnly(req, res, next) {
  if (!req.user || !["customer", "driver"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  next();
}

// Create a vehicle listing with four photos
router.post(
  "/",
  authMiddleware,
  requesterOnly,
  uploadVehiclePhotos,
  createVehicleListing
);

// Browse approved vehicles
router.get(
  "/",
  authMiddleware,
  requesterOnly,
  getApprovedVehicleListings
);

// Show interest in a vehicle
router.post(
  "/:listingId/interest",
  authMiddleware,
  requesterOnly,
  registerVehicleInterest
);

module.exports = router;
