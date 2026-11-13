
const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

const VehicleListing = require("../models/VehicleListing");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");

const ALLOWED_VEHICLE_TYPES = [
  "mini-truck",
  "light-truck",
  "heavy-truck",
];

const REQUIRED_PHOTO_SIDES = [
  "front",
  "back",
  "left",
  "right",
];

const PHOTO_DIRECTORY = path.join(
  process.cwd(),
  "uploads",
  "vehicle-photos"
);

function hasValidUser(req) {
  return (
    req.user &&
    ["customer", "driver"].includes(req.user.role) &&
    mongoose.isValidObjectId(req.user.id)
  );
}

async function cleanupUploadedPhotos(files) {
  const uploadedFiles = Object.values(files || {}).flat();

  await Promise.all(
    uploadedFiles.map(async (file) => {
      if (!file?.path) return;

      try {
        await fs.unlink(file.path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Vehicle photo cleanup error:", error);
        }
      }
    })
  );
}

// =====================================
// CREATE VEHICLE LISTING
// =====================================

exports.createVehicleListing = async (req, res) => {
  try {
    if (!hasValidUser(req)) {
      await cleanupUploadedPhotos(req.files);

      return res.status(401).json({
        success: false,
        message: "Valid customer or driver authentication is required.",
      });
    }

    const { role, id } = req.user;

    const {
      vehicleType,
      vehicleModel,
      vehicleNumber,
      rcNumber,
      contactName,
      contactPhone,
    } = req.body || {};

    // Validate vehicle type
    if (
      typeof vehicleType !== "string" ||
      !ALLOWED_VEHICLE_TYPES.includes(vehicleType)
    ) {
      await cleanupUploadedPhotos(req.files);

      return res.status(400).json({
        success: false,
        message: "Please select a valid vehicle type.",
      });
    }

    // Validate required text fields
    const requiredFields = {
      vehicleModel,
      vehicleNumber,
      rcNumber,
      contactName,
      contactPhone,
    };

    const invalidField = Object.values(requiredFields).some(
      (value) =>
        typeof value !== "string" ||
        !value.trim()
    );

    if (invalidField) {
      await cleanupUploadedPhotos(req.files);

      return res.status(400).json({
        success: false,
        message: "Please provide all required vehicle details.",
      });
    }

    const cleanVehicleModel = vehicleModel.trim();
    const cleanVehicleNumber = vehicleNumber.trim().toUpperCase();
    const cleanRcNumber = rcNumber.trim().toUpperCase();
    const cleanContactName = contactName.trim();
    const cleanContactPhone = contactPhone.trim();

    if (
      cleanVehicleModel.length > 150 ||
      cleanVehicleNumber.length > 30 ||
      cleanRcNumber.length > 50 ||
      cleanContactName.length > 100
    ) {
      await cleanupUploadedPhotos(req.files);

      return res.status(400).json({
        success: false,
        message: "One or more vehicle details exceed the allowed length.",
      });
    }

    if (!/^[6-9]\d{9}$/.test(cleanContactPhone)) {
      await cleanupUploadedPhotos(req.files);

      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit contact number.",
      });
    }

    // Validate all four uploaded photos
    const photos = {};

    for (const side of REQUIRED_PHOTO_SIDES) {
      const uploadedFiles = req.files?.[side];

      if (!Array.isArray(uploadedFiles) || uploadedFiles.length !== 1) {
        await cleanupUploadedPhotos(req.files);

        return res.status(400).json({
          success: false,
          message: `Please upload exactly one ${side} vehicle photo.`,
        });
      }

      const file = uploadedFiles[0];

      if (!file.filename || path.basename(file.filename) !== file.filename) {
        await cleanupUploadedPhotos(req.files);

        return res.status(400).json({
          success: false,
          message: `Invalid ${side} vehicle photo.`,
        });
      }

      photos[side] = `/uploads/vehicle-photos/${file.filename}`;
    }

    // Find authenticated seller
    const SellerModel = role === "customer" ? Customer : Driver;

    const seller = await SellerModel.findById(id).select("_id");

    if (!seller) {
      await cleanupUploadedPhotos(req.files);

      return res.status(404).json({
        success: false,
        message: "Seller account not found.",
      });
    }

    const listing = await VehicleListing.create({
      seller: id,
      sellerModel: role === "customer" ? "Customer" : "Driver",
      sellerRole: role,
      vehicleType,
      vehicleModel: cleanVehicleModel,
      vehicleNumber: cleanVehicleNumber,
      rcNumber: cleanRcNumber,
      contactName: cleanContactName,
      contactPhone: cleanContactPhone,
      photos,
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle submitted for staff verification.",
      listing,
    });
  } catch (error) {
    console.error("Create vehicle listing error:", error);

    await cleanupUploadedPhotos(req.files);

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle listing details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create vehicle listing.",
    });
  }
};

// =====================================
// GET APPROVED VEHICLE LISTINGS
// =====================================

exports.getApprovedVehicleListings = async (req, res) => {
  try {
    const listings = await VehicleListing.find({
      status: "approved",
    })
      .select(
        "-rcNumber -seller -sellerModel -interestedBuyers -contactName -contactPhone"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Get vehicle listings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch vehicle listings.",
    });
  }
};

// =====================================
// REGISTER BUYER INTEREST
// =====================================

exports.registerVehicleInterest = async (req, res) => {
  try {
    if (!hasValidUser(req)) {
      return res.status(401).json({
        success: false,
        message: "Valid customer or driver authentication is required.",
      });
    }

    const { role, id } = req.user;
    const { listingId } = req.params;

    if (!mongoose.isValidObjectId(listingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vehicle listing ID.",
      });
    }

    const listing = await VehicleListing.findOne({
      _id: listingId,
      status: "approved",
    }).select("seller sellerRole");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Approved vehicle listing not found.",
      });
    }

    // Prevent seller from showing interest in their own listing
    if (
      listing.seller.toString() === id &&
      listing.sellerRole === role
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot show interest in your own vehicle.",
      });
    }

    // Find buyer account
    const BuyerModel = role === "customer" ? Customer : Driver;

    const buyer = await BuyerModel.findById(id).select(
      "name phone"
    );

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: "Buyer account not found.",
      });
    }

    const buyerInterest = {
      buyer: id,
      buyerModel: role === "customer" ? "Customer" : "Driver",
      buyerRole: role,
      name: buyer.name || "Buyer",
      phone: buyer.phone,
    };

    // Atomic update prevents duplicate interest from concurrent requests.
    const updatedListing = await VehicleListing.findOneAndUpdate(
      {
        _id: listingId,
        status: "approved",
        interestedBuyers: {
          $not: {
            $elemMatch: {
              buyer: id,
              buyerRole: role,
            },
          },
        },
      },
      {
        $push: {
          interestedBuyers: buyerInterest,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("_id");

    if (!updatedListing) {
      const currentListing = await VehicleListing.findOne({
        _id: listingId,
        status: "approved",
      }).select("_id interestedBuyers");

      if (!currentListing) {
        return res.status(404).json({
          success: false,
          message: "Approved vehicle listing not found.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "You have already shown interest in this vehicle.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Your interest has been shared with RaahSetu.",
    });
  } catch (error) {
    console.error("Register vehicle interest error:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid buyer interest details.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to register your interest.",
    });
  }
};
