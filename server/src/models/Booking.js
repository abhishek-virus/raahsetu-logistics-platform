
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

    // Customer booking and delivery status
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

    // Staff verification status
    staffVerificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    verificationRemarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    pickupConfirmedAt: {
      type: Date,
      default: null,
    },

    pickupConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    pickupConfirmationRemarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    // Driver assignment
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
      index: true,
    },

    assignedAt: {
      type: Date,
      default: null,
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
