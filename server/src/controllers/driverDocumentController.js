
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
  const uploadedFiles = req.files || {};

  try {
    if (!req.user) {
      await cleanupFiles(uploadedFiles);

      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "driver") {
      await cleanupFiles(uploadedFiles);

      return res.status(403).json({
        success: false,
        message: "Driver access only.",
      });
    }

    // At least one document must be uploaded.
    const uploadedKeys = Object.keys(uploadedFiles).filter(
      (key) => Array.isArray(uploadedFiles[key]) &&
        uploadedFiles[key].length > 0
    );

    if (uploadedKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one document.",
      });
    }

    // Validate document field names and file count.
    const invalidKeys = uploadedKeys.some(
      (key) =>
        !DOCUMENT_KEYS.includes(key) ||
        uploadedFiles[key].length !== 1
    );

    if (invalidKeys) {
      await cleanupFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message: "Invalid document upload. Upload one file per document type.",
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

    // Ensure documents object exists.
    if (!driver.documents) {
      driver.documents = {};
    }

    // Preserve all previously uploaded documents.
    const previousFilenames = {};

    for (const key of DOCUMENT_KEYS) {
      previousFilenames[key] = driver.documents?.[key]?.filename;
    }

    // Update only the documents uploaded in this request.
    for (const key of uploadedKeys) {
      const file = uploadedFiles[key][0];

      driver.documents[key] = {
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    // New or replaced documents require fresh staff verification.
    driver.verificationStatus = "pending";
    driver.verificationRemarks = "";
    driver.verifiedBy = null;
    driver.verifiedAt = null;

    await driver.save();

    // Delete only the replaced files after successful database save.
    for (const key of uploadedKeys) {
      const oldFilename = previousFilenames[key];
      const newFilename = driver.documents[key]?.filename;

      if (oldFilename && oldFilename !== newFilename) {
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
      documents: {
        license: driver.documents?.license || null,
        vehicleRC: driver.documents?.vehicleRC || null,
        identity: driver.documents?.identity || null,
      },
    });
  } catch (error) {
    console.error("Driver document upload error:", error);

    await cleanupFiles(uploadedFiles);

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
