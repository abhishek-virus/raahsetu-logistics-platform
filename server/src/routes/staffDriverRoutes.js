
const express = require("express");

const staffAuthMiddleware = require("../middleware/staffAuthMiddleware");

const {
  getPendingDriverVerifications,
  updateDriverVerification,
} = require("../controllers/staffDriverController");

const {
  viewDriverDocument,
} = require("../controllers/staffDriverDocumentController");

const router = express.Router();

// Get all pending driver applications
router.get(
  "/pending",
  staffAuthMiddleware,
  getPendingDriverVerifications
);

// View a driver's uploaded document
router.get(
  "/:driverId/documents/:documentType",
  staffAuthMiddleware,
  viewDriverDocument
);

// Approve or reject a driver application
router.patch(
  "/:driverId/verification",
  staffAuthMiddleware,
  updateDriverVerification
);

module.exports = router;
