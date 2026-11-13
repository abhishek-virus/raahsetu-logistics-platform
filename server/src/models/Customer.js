
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
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
      maxlength: 254,
    },

    role: {
      type: String,
      enum: ["customer"],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Customer", customerSchema);
