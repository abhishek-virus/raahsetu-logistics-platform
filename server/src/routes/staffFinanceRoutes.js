
const express = require("express");
const staffAuthMiddleware = require("../middleware/staffAuthMiddleware");

const {
  getFinanceEnquiries,
  updateFinanceEnquiryStatus,
} = require("../controllers/staffFinanceController");

const router = express.Router();

// Get all finance and insurance enquiries
router.get(
  "/",
  staffAuthMiddleware,
  getFinanceEnquiries
);

// Update enquiry status
router.patch(
  "/:enquiryId/status",
  staffAuthMiddleware,
  updateFinanceEnquiryStatus
);

module.exports = router;
