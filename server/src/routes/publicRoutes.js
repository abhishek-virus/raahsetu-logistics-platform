
const express = require("express");

const router = express.Router();

// Public platform information
router.get("/info", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to RaahSetu Logistics Platform",
    platform: {
      name: "RaahSetu",
      tagline: "Connecting Every Route. Empowering Every Fleet.",
      services: [
        "Goods Transportation",
        "Transport Booking",
        "Shipment Tracking",
      ],
    },
  });
});

// Public service list
router.get("/services", (req, res) => {
  res.status(200).json({
    success: true,
    services: [
      {
        id: "goods-transport",
        name: "Goods Transportation",
        description: "Transport goods from one location to another.",
      },
      {
        id: "shipment-tracking",
        name: "Shipment Tracking",
        description: "Track shipment progress and delivery updates.",
      },
      {
        id: "fleet-solutions",
        name: "Fleet Solutions",
        description: "Discover transport and fleet services.",
      },
    ],
  });
});

module.exports = router;
