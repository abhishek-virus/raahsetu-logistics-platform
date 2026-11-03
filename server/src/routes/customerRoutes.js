
const express = require("express");
const { registerCustomer } = require("../controllers/customerController");
const Customer = require("../models/Customer");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in customer's profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).select("-__v");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer profile fetched successfully.",
      customer,
    });
  } catch (error) {
    console.error("Customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

// Register customer
router.post("/register", registerCustomer);

module.exports = router;
