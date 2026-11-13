
const fs = require("fs/promises");
const path = require("path");
const Driver = require("../models/Driver");

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "driver-documents"
);

const profilePhotoDirectory = path.join(
  process.cwd(),
  "uploads",
  "driver-photos"
);

const DOCUMENT_KEYS = ["license", "vehicleRC", "identity"];

const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Delete a file safely
async function deleteFile(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("File cleanup error:", error);
    }
  }
}

// Delete newly uploaded files when an operation fails
async function cleanupFiles(files) {
  const allFiles = Object.values(files || {}).flat();

  await Promise.all(
    allFiles.map((file) => deleteFile(file.path))
  );
}

async function cleanupSingleFile(file) {
  if (file?.path) {
    await deleteFile(file.path);
  }
}

// Resolve an existing stored filename safely
function getStoredFilePath(directory, filename) {
  if (
    typeof filename !== "string" ||
    !filename ||
    path.basename(filename) !== filename
  ) {
    return null;
  }

  return path.join(directory, filename);
}

// =====================================
// UPLOAD DRIVER DOCUMENTS
// =====================================

async function uploadDriverDocuments(req, res) {
  try {
    if (!req.user) {
      await cleanupFiles(req.files);

      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "driver") {
      await cleanupFiles(req.files);

      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    const uploadedFiles = req.files || {};

    const allRequiredFilesPresent = DOCUMENT_KEYS.every(
      (key) =>
        Array.isArray(uploadedFiles[key]) &&
        uploadedFiles[key].length === 1
    );

    if (!allRequiredFilesPresent) {
      await cleanupFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message: "Please upload all three required documents.",
      });
    }

    const driver = await Driver.findById(req.user.id);

    if (!driver) {
      await cleanupFiles(uploadedFiles);

      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    const documentData = {};

    for (const key of DOCUMENT_KEYS) {
      const file = uploadedFiles[key][0];

      documentData[key] = {
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    // Preserve previous document metadata until the new save succeeds.
    const previousDocuments = driver.documents;

    driver.documents = documentData;
    driver.verificationStatus = "pending";

    // Reset previous verification decision.
    driver.verificationRemarks = "";
    driver.verifiedBy = null;
    driver.verifiedAt = null;

    await driver.save();

    // Delete old document files only after successful database save.
    if (previousDocuments) {
      for (const key of DOCUMENT_KEYS) {
        const oldFilename = previousDocuments[key]?.filename;

        const oldPath = getStoredFilePath(
          uploadDirectory,
          oldFilename
        );

        if (oldPath) {
          await deleteFile(oldPath);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Driver documents uploaded successfully.",
      verificationStatus: driver.verificationStatus,
    });
  } catch (error) {
    console.error("Driver document upload error:", error);

    await cleanupFiles(req.files);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Uploaded document details are invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to upload driver documents.",
    });
  }
}

// =====================================
// UPLOAD DRIVER PROFILE PHOTO
// =====================================

async function uploadDriverProfilePhoto(req, res) {
  try {
    if (!req.user) {
      await cleanupSingleFile(req.file);

      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "driver") {
      await cleanupSingleFile(req.file);

      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile photo.",
      });
    }

    if (!ALLOWED_PHOTO_TYPES.includes(req.file.mimetype)) {
      await cleanupSingleFile(req.file);

      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG and WEBP profile photos are allowed.",
      });
    }

    const driver = await Driver.findById(req.user.id);

    if (!driver) {
      await cleanupSingleFile(req.file);

      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    const previousFilename = driver.profilePhoto?.filename;

    driver.profilePhoto = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    };

    await driver.save();

    // Remove previous photo after successful database save.
    const previousPath = getStoredFilePath(
      profilePhotoDirectory,
      previousFilename
    );

    if (previousPath) {
      await deleteFile(previousPath);
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      profilePhoto: driver.profilePhoto,
    });
  } catch (error) {
    console.error("Driver profile photo upload error:", error);

    await cleanupSingleFile(req.file);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Profile photo details are invalid.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to upload profile photo.",
    });
  }
}

// =====================================
// GET LOGGED-IN DRIVER PROFILE PHOTO
// =====================================

async function getDriverProfilePhoto(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "driver") {
      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    const driver = await Driver.findById(req.user.id)
      .select("profilePhoto");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver profile not found.",
      });
    }

    const photo = driver.profilePhoto;

    if (!photo?.filename) {
      return res.status(404).json({
        success: false,
        message: "Profile photo not found.",
      });
    }

    if (!ALLOWED_PHOTO_TYPES.includes(photo.mimeType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile photo format.",
      });
    }

    const photoPath = getStoredFilePath(
      profilePhotoDirectory,
      photo.filename
    );

    if (!photoPath) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile photo.",
      });
    }

    await fs.access(photoPath);

    res.setHeader("Content-Type", photo.mimeType);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(photoPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        success: false,
        message: "Profile photo file not found.",
      });
    }

    console.error("Get driver profile photo error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile photo.",
    });
  }
}

module.exports = {
  uploadDriverDocuments,
  uploadDriverProfilePhoto,
  getDriverProfilePhoto,
};
