
const mongoose = require("mongoose");
const Customer = require("../models/Customer");

const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body || {};

    const cleanName =
      typeof name === "string" ? name.trim() : "";

    const cleanPhone =
      typeof phone === "string" ? phone.trim() : "";

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanName || !/^[a-zA-Z\s.'-]{2,100}$/.test(cleanName)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name.",
      });
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number.",
      });
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    const existingCustomer = await Customer.findOne({
      phone: cleanPhone,
    }).select("_id");

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer with this phone already exists.",
      });
    }

    const customer = await Customer.create({
      name: cleanName,
      phone: cleanPhone,
      ...(cleanEmail && { email: cleanEmail }),
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully.",
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        role: customer.role,
      },
    });
  } catch (error) {
    console.error("Customer registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Customer with this phone already exists.",
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer information.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register customer.",
    });
  }
};

module.exports = { registerCustomer };
