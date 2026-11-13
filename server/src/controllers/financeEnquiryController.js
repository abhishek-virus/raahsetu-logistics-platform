
const mongoose = require("mongoose");

const FinanceEnquiry = require("../models/FinanceEnquiry");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");

const ALLOWED_ENQUIRY_TYPES = ["finance", "insurance"];

const ALLOWED_VEHICLE_TYPES = [
  "mini-truck",
  "light-truck",
  "heavy-truck",
];

async function createFinanceEnquiry(req, res) {
  try {
    // Validate authentication
    if (
      !req.user ||
      !["customer", "driver"].includes(req.user.role) ||
      !mongoose.isValidObjectId(req.user.id)
    ) {
      return res.status(401).json({
        success: false,
        message: "Valid customer or driver authentication is required.",
      });
    }

    const {
      enquiryType,
      applicantName,
      phone,
      vehicleType,
      rcNumber,
    } = req.body || {};

    // Validate enquiry type
    if (
      typeof enquiryType !== "string" ||
      !ALLOWED_ENQUIRY_TYPES.includes(enquiryType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select finance or insurance.",
      });
    }

    // Validate applicant name
    if (
      typeof applicantName !== "string" ||
      !applicantName.trim() ||
      applicantName.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name.",
      });
    }

    const cleanName = applicantName.trim();

    // Validate phone against authenticated account
    if (
      typeof phone !== "string" ||
      !/^[6-9]\d{9}$/.test(phone.trim()) ||
      typeof req.user.phone !== "string" ||
      phone.trim() !== req.user.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter your registered 10-digit mobile number.",
      });
    }

    // Validate vehicle type
    if (
      typeof vehicleType !== "string" ||
      !ALLOWED_VEHICLE_TYPES.includes(vehicleType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid vehicle type.",
      });
    }

    // Validate RC number
    if (
      typeof rcNumber !== "string" ||
      !rcNumber.trim() ||
      rcNumber.trim().length > 30
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid RC number.",
      });
    }

    const cleanPhone = phone.trim();
    const cleanRcNumber = rcNumber.trim().toUpperCase();

    // Find authenticated requester
    const isCustomer = req.user.role === "customer";
    const RequesterModel = isCustomer ? Customer : Driver;

    const requester = await RequesterModel.findOne({
      _id: req.user.id,
      role: req.user.role,
    }).select("name phone role");

    if (!requester) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    // Verify phone against the actual database account
    if (requester.phone !== cleanPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number does not match your registered account.",
      });
    }

    // Create enquiry
    const enquiry = await FinanceEnquiry.create({
      requester: requester._id,
      requesterModel: isCustomer ? "Customer" : "Driver",
      requesterRole: req.user.role,
      enquiryType,
      applicantName: cleanName,
      phone: cleanPhone,
      vehicleType,
      rcNumber: cleanRcNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Your enquiry has been submitted successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Finance enquiry creation error:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid finance enquiry details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to submit your enquiry.",
    });
  }
}

module.exports = {
  createFinanceEnquiry,
};
