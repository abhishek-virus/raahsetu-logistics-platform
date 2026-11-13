
const mongoose = require("mongoose");

const financeEnquirySchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "requesterModel",
      index: true,
    },

    requesterModel: {
      type: String,
      required: true,
      enum: ["Customer", "Driver"],
    },

    requesterRole: {
      type: String,
      required: true,
      enum: ["customer", "driver"],
      validate: {
        validator: function (value) {
          return (
            (this.requesterModel === "Customer" &&
              value === "customer") ||
            (this.requesterModel === "Driver" &&
              value === "driver")
          );
        },
        message: "Requester role does not match requester model.",
      },
    },

    enquiryType: {
      type: String,
      required: true,
      enum: ["finance", "insurance"],
    },

    applicantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleType: {
      type: String,
      required: true,
      enum: ["mini-truck", "light-truck", "heavy-truck"],
    },

    rcNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    status: {
      type: String,
      enum: ["pending", "reviewing", "contacted", "closed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FinanceEnquiry",
  financeEnquirySchema
);
