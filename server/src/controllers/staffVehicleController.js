
const mongoose = require("mongoose");
const VehicleListing = require("../models/VehicleListing");

const hasStaffAccess = (req) => {
  return (
    req.user &&
    req.user.role === "staff" &&
    mongoose.Types.ObjectId.isValid(req.user.id)
  );
};

// Get pending vehicle listings
const getPendingVehicleListings = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const listings = await VehicleListing.find({
      status: "pending",
    })
      .select("-__v")
      .populate("seller", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Get pending vehicle listings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch pending vehicle listings.",
    });
  }
};

// Approve or reject a vehicle listing
const updateVehicleListingReview = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const { listingId } = req.params;
    const { status, remarks = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle listing ID.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    if (typeof remarks !== "string" || remarks.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Remarks must be a string of maximum 500 characters.",
      });
    }

    const cleanRemarks = remarks.trim();

    if (status === "rejected" && !cleanRemarks) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rejection reason.",
      });
    }

    const listing = await VehicleListing.findOneAndUpdate(
      {
        _id: listingId,
        status: "pending",
      },
      {
        $set: {
          status,
          reviewRemarks: cleanRemarks,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("seller", "name phone email");

    if (!listing) {
      const existingListing = await VehicleListing.findById(listingId)
        .select("_id status");

      if (!existingListing) {
        return res.status(404).json({
          success: false,
          message: "Vehicle listing not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This vehicle listing has already been reviewed.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Vehicle listing ${status} successfully.`,
      listing,
    });
  } catch (error) {
    console.error("Update vehicle listing review error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle listing review.",
    });
  }
};

// Get approved vehicle listings with interested buyers
const getVehicleBuyerInterests = async (req, res) => {
  try {
    if (!hasStaffAccess(req)) {
      return res.status(403).json({
        success: false,
        message: "Staff access required.",
      });
    }

    const listings = await VehicleListing.find({
      status: "approved",
      "interestedBuyers.0": { $exists: true },
    })
      .select(
        "vehicleType vehicleModel vehicleNumber contactName contactPhone photos seller sellerRole interestedBuyers createdAt updatedAt"
      )
      .populate("seller", "name phone email")
      .sort({ updatedAt: -1 })
      .lean();

    const interestCount = listings.reduce(
      (total, listing) =>
        total + (listing.interestedBuyers?.length || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: listings.length,
      interestCount,
      listings,
    });
  } catch (error) {
    console.error("Get vehicle buyer interests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch vehicle buyer interests.",
    });
  }
};

module.exports = {
  getPendingVehicleListings,
  updateVehicleListingReview,
  getVehicleBuyerInterests,
};
