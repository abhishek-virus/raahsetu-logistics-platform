
const mongoose = require("mongoose");
const FinanceEnquiry = require("../models/FinanceEnquiry");

const hasStaffAccess = (req) => {
  return (
    req.user &&
    req.user.role === "staff" &&
    mongoose.Types.ObjectId.isValid(req.user.id)
  );
};

// Get all finance and insurance enquiries
const getFinanceEnquiries = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const enquiries = await FinanceEnquiry.find({})
      .select("-__v")
      .populate("requester", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error("Get finance enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch finance enquiries.",
    });
  }
};

// Update enquiry status
const updateFinanceEnquiryStatus = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const { enquiryId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(enquiryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID.",
      });
    }

    const allowedTransitions = {
      pending: ["reviewing", "contacted", "closed"],
      reviewing: ["contacted", "closed"],
      contacted: ["closed"],
      closed: [],
    };

    if (
      typeof status !== "string" ||
      !["reviewing", "contacted", "closed"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry status.",
      });
    }

    const existingEnquiry = await FinanceEnquiry.findById(enquiryId)
      .select("_id status");

    if (!existingEnquiry) {
      return res.status(404).json({
        success: false,
        message: "Finance enquiry not found.",
      });
    }

    const allowedNextStatuses =
      allowedTransitions[existingEnquiry.status] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change enquiry status from ${existingEnquiry.status} to ${status}.`,
      });
    }

    const enquiry = await FinanceEnquiry.findOneAndUpdate(
      {
        _id: enquiryId,
        status: existingEnquiry.status,
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("requester", "name phone email");

    if (!enquiry) {
      return res.status(409).json({
        success: false,
        message: "Enquiry status was changed by another user. Please refresh.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Update finance enquiry status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update enquiry status.",
    });
  }
};

module.exports = {
  getFinanceEnquiries,
  updateFinanceEnquiryStatus,
};
