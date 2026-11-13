
const express = require("express");

const {
  requestDriverOTP,
  verifyDriverOTP,
  requestDriverRegistrationOTP,
  verifyDriverRegistrationOTP,
} = require("../controllers/driverAuthController");

const router = express.Router();

// Existing driver login
router.post("/request-otp", requestDriverOTP);
router.post("/verify-otp", verifyDriverOTP);

// New driver registration
router.post(
  "/registration/request-otp",
  requestDriverRegistrationOTP
);

router.post(
  "/registration/verify-otp",
  verifyDriverRegistrationOTP
);

module.exports = router;
