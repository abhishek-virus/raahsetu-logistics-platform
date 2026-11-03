
const express = require("express");
const {
  registerCustomer,
} = require("../controllers/customerController");
const Customer = require("../models/Customer");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Restrict customer profile routes to customer accounts
function customerOnly(req, res, next) {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required.",
    });
  }

  return next();
}

// Get logged-in customer's profile
router.get("/profile", authMiddleware, customerOnly, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.user.id,
      role: "customer",
    }).select("-__v");

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
      message: "Unable to fetch customer profile.",
    });
  }
});

// Update logged-in customer's profile
router.put("/profile", authMiddleware, customerOnly, async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid email.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (
        normalizedEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address.",
        });
      }

      updates.email = normalizedEmail;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide name or email to update.",
      });
    }

    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.user.id,
        role: "customer",
      },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      customer,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer profile.",
    });
  }
});

// Public registration endpoint
router.post("/register", registerCustomer);

module.exports = router;
