
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    dropLocation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    pickupDate: {
      type: Date,
      required: true,
    },

    pickupTime: {
      type: String,
      required: true,
      trim: true,
    },

    goodsType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    goodsWeightKg: {
      type: Number,
      required: true,
      min: 1,
    },

    truckType: {
      type: String,
      required: true,
      enum: ["mini-truck", "light-truck", "heavy-truck"],
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "assigned",
        "in-transit",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Pickup and drop locations must be different.
bookingSchema.pre("validate", function () {
  if (
    this.pickupLocation &&
    this.dropLocation &&
    this.pickupLocation.trim().toLowerCase() ===
      this.dropLocation.trim().toLowerCase()
  ) {
    this.invalidate(
      "dropLocation",
      "Pickup and drop locations must be different."
    );
  }
});

module.exports = mongoose.model("Booking", bookingSchema);
