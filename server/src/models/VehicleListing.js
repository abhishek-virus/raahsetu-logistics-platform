
const mongoose = require("mongoose");

const vehicleListingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "sellerModel",
      index: true,
    },

    sellerModel: {
      type: String,
      required: true,
      enum: ["Customer", "Driver"],
    },

    sellerRole: {
      type: String,
      required: true,
      enum: ["customer", "driver"],
      validate: {
        validator: function (value) {
          return (
            (this.sellerModel === "Customer" &&
              value === "customer") ||
            (this.sellerModel === "Driver" &&
              value === "driver")
          );
        },
        message: "Seller role does not match seller model.",
      },
    },

    vehicleType: {
      type: String,
      required: true,
      enum: ["mini-truck", "light-truck", "heavy-truck"],
    },

    vehicleModel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    rcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    contactName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },

    photos: {
      front: { type: String, required: true },
      back: { type: String, required: true },
      left: { type: String, required: true },
      right: { type: String, required: true },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    reviewRemarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    interestedBuyers: [
      {
        buyer: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "interestedBuyers.buyerModel",
        },

        buyerModel: {
          type: String,
          required: true,
          enum: ["Customer", "Driver"],
        },

        buyerRole: {
          type: String,
          required: true,
          enum: ["customer", "driver"],
          validate: {
            validator: function (value) {
              return (
                (this.buyerModel === "Customer" &&
                  value === "customer") ||
                (this.buyerModel === "Driver" &&
                  value === "driver")
              );
            },
            message: "Buyer role does not match buyer model.",
          },
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        phone: {
          type: String,
          required: true,
          trim: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "VehicleListing",
  vehicleListingSchema
);
