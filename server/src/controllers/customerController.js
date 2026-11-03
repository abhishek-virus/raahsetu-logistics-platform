
const Customer = require("../models/Customer");

const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required",
      });
    }

    const existingCustomer = await Customer.findOne({ phone });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer with this phone already exists",
      });
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer,
    });
  } catch (error) {
    console.error("Customer registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { registerCustomer };
