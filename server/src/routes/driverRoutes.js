
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadDriverProfilePhoto,
} = require("../middleware/uploadMiddleware");

const uploadDriverDocuments = require("../middleware/uploadMiddleware");

const {
  getDriverProfile,
  updateDriverProfile,
  updateDriverDetails,
} = require("../controllers/driverController");

const {
  uploadDriverDocuments: saveDriverDocuments,
  uploadDriverProfilePhoto: saveDriverProfilePhoto,
  getDriverProfilePhoto,
} = require("../controllers/driverDocumentController");

const {
  getAvailableLoads,
  acceptLoad,
  getMyLoads,
  updateDeliveryStatus,
} = require("../controllers/driverLoadController");

const {
  driverOnly,
  approvedDriverOnly,
} = require("../middleware/driverAccessMiddleware");

const router = express.Router();

// =====================================
// DRIVER PROFILE
// =====================================

// Get driver profile
router.get(
  "/profile",
  authMiddleware,
  driverOnly,
  getDriverProfile
);

// Update personal information
router.put(
  "/profile",
  authMiddleware,
  driverOnly,
  updateDriverProfile
);

// Update vehicle details
router.put(
  "/vehicle-details",
  authMiddleware,
  driverOnly,
  updateDriverDetails
);

// Upload driver profile photo
router.post(
  "/profile-photo",
  authMiddleware,
  driverOnly,
  uploadDriverProfilePhoto,
  saveDriverProfilePhoto
);

// Get logged-in driver's profile photo
router.get(
  "/profile-photo",
  authMiddleware,
  driverOnly,
  getDriverProfilePhoto
);

// =====================================
// DRIVER DOCUMENTS
// =====================================

// Upload licence, vehicle RC and identity documents
router.post(
  "/documents",
  authMiddleware,
  driverOnly,
  uploadDriverDocuments,
  saveDriverDocuments
);

// =====================================
// DRIVER LOADS
// =====================================

// Get available loads
router.get(
  "/loads",
  authMiddleware,
  driverOnly,
  getAvailableLoads
);

// Accept a load (approved drivers only)
router.patch(
  "/loads/:id/accept",
  authMiddleware,
  driverOnly,
  approvedDriverOnly,
  acceptLoad
);

// Get driver's accepted loads
router.get(
  "/my-loads",
  authMiddleware,
  driverOnly,
  getMyLoads
);

// Update delivery status (approved drivers only)
router.patch(
  "/loads/:id/status",
  authMiddleware,
  driverOnly,
  approvedDriverOnly,
  updateDeliveryStatus
);

module.exports = router;
