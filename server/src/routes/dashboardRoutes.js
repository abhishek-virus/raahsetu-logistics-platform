
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

function customerOnly(req, res, next) {
  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Customer access required.",
    });
  }

  return next();
}

// Customer dashboard overview
router.get(
  "/overview",
  authMiddleware,
  customerOnly,
  async (req, res) => {
    try {
      return res.status(200).json({
        success: true,
        message: "Customer dashboard overview fetched successfully.",
        dashboard: {
          customerId: req.user.id,
          dispatchSummary: {
            total: 0,
            pending: 0,
            inTransit: 0,
            delivered: 0,
          },
          recentActivity: [],
          telemetry: {
            available: false,
            message: "Telemetry data is not available yet.",
          },
        },
      });
    } catch (error) {
      console.error("Dashboard overview error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch dashboard overview.",
      });
    }
  }
);

module.exports = router;
