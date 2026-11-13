
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs/promises");

const Driver = require("../models/Driver");

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "driver-documents"
);

const profilePhotoDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "driver-photos"
);

const allowedDocuments = ["license", "vehicleRC", "identity"];

const allowedDocumentMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const allowedPhotoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const documentFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|pdf)$/i;

const photoFilenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

// =====================================
// VIEW DRIVER DOCUMENT OR PROFILE PHOTO
// =====================================

async function viewDriverDocument(req, res) {
  try {
    // Staff authentication check
    if (
      !req.user ||
      req.user.role !== "staff" ||
      !mongoose.isValidObjectId(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Staff access only.",
      });
    }

    const { driverId, documentType } = req.params;

    // Validate driver ID
    if (!mongoose.isValidObjectId(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID.",
      });
    }

    const isProfilePhoto = documentType === "profilePhoto";

    if (
      !allowedDocuments.includes(documentType) &&
      !isProfilePhoto
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type.",
      });
    }

    // Fetch only the requested document
    const selectedField = isProfilePhoto
      ? "profilePhoto"
      : `documents.${documentType}`;

    const driver = await Driver.findById(driverId)
      .select(selectedField);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    const document = isProfilePhoto
      ? driver.profilePhoto
      : driver.documents?.[documentType];

    if (!document?.filename || !document?.mimeType) {
      return res.status(404).json({
        success: false,
        message: isProfilePhoto
          ? "Driver profile photo not found."
          : "Driver document not found.",
      });
    }

    // Validate MIME type
    const allowedMimeTypes = isProfilePhoto
      ? allowedPhotoMimeTypes
      : allowedDocumentMimeTypes;

    if (!allowedMimeTypes.includes(document.mimeType)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file format.",
      });
    }

    // Validate stored filename
    const filenamePattern = isProfilePhoto
      ? photoFilenamePattern
      : documentFilenamePattern;

    if (!filenamePattern.test(document.filename)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stored filename.",
      });
    }

    // Ensure MIME type matches the file extension
    const extension = path.extname(document.filename).toLowerCase();

    const extensionMimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
    };

    if (extensionMimeTypes[extension] !== document.mimeType) {
      return res.status(400).json({
        success: false,
        message: "File extension and format do not match.",
      });
    }

    const baseDirectory = isProfilePhoto
      ? profilePhotoDirectory
      : uploadDirectory;

    const filePath = path.resolve(
      baseDirectory,
      document.filename
    );

    // Prevent directory traversal
    const relativePath = path.relative(
      baseDirectory,
      filePath
    );

    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path.",
      });
    }

    // Verify that the file exists and is a regular file
    const fileStats = await fs.stat(filePath);

    if (!fileStats.isFile()) {
      return res.status(404).json({
        success: false,
        message: "Requested file is unavailable.",
      });
    }

    // Secure response headers
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", "inline");

    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "File is missing from the server.",
      });
    }

    console.error("View driver document error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to access driver document.",
    });
  }
}

module.exports = {
  viewDriverDocument,
};
