
const express = require("express");
const {
  requestOTP,
  verifyCustomerOTP,
} = require("../controllers/authController");

const router = express.Router();

router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyCustomerOTP);

module.exports = router;
