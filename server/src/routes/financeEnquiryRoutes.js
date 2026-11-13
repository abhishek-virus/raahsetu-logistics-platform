
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createFinanceEnquiry,
} = require("../controllers/financeEnquiryController");

const router = express.Router();

// Allow only customer and driver accounts
function requesterOnly(req, res, next) {
  if (!["customer", "driver"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Customer or driver access required.",
    });
  }

  return next();
}

router.post(
  "/",
  authMiddleware,
  requesterOnly,
  createFinanceEnquiry
);

module.exports = router;
