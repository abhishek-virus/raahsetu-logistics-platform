
const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    // Personal details
    name: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      trim: true,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    role: {
      type: String,
      enum: ["driver"],
      default: "driver",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    // Experience details
    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },

    // Vehicle details
    vehicleType: {
      type: String,
      enum: ["mini-truck", "light-truck", "heavy-truck", ""],
      default: "",
    },

    vehicleModel: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // Identity details
    licenseNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // Driver profile photo
    profilePhoto: {
      originalName: { type: String, default: "" },
      filename: { type: String, default: "" },
      mimeType: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },

    // Staff verification
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
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

    // Uploaded verification documents
    documents: {
      license: {
        originalName: { type: String, default: "" },
        filename: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },

      vehicleRC: {
        originalName: { type: String, default: "" },
        filename: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },

      identity: {
        originalName: { type: String, default: "" },
        filename: { type: String, default: "" },
        mimeType: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Driver", driverSchema);
