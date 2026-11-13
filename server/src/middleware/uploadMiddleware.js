
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");

// =====================================
// UPLOAD DIRECTORIES
// =====================================

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

fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(profilePhotoDirectory, { recursive: true });

// =====================================
// ALLOWED FILE TYPES
// =====================================

const documentTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

const profilePhotoTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// =====================================
// FILE SIGNATURE VALIDATION
// =====================================

async function hasValidFileSignature(file) {
  const handle = await fsp.open(file.path, "r");

  try {
    const buffer = Buffer.alloc(12);

    const { bytesRead } = await handle.read(
      buffer,
      0,
      buffer.length,
      0
    );

    const signature = buffer.subarray(0, bytesRead);

    switch (file.mimetype) {
      case "image/jpeg":
        return (
          signature.length >= 3 &&
          signature[0] === 0xff &&
          signature[1] === 0xd8 &&
          signature[2] === 0xff
        );

      case "image/png":
        return (
          signature.length >= 8 &&
          signature.subarray(0, 8).equals(
            Buffer.from([
              0x89, 0x50, 0x4e, 0x47,
              0x0d, 0x0a, 0x1a, 0x0a,
            ])
          )
        );

      case "image/webp":
        return (
          signature.length >= 12 &&
          signature.toString("ascii", 0, 4) === "RIFF" &&
          signature.toString("ascii", 8, 12) === "WEBP"
        );

      case "application/pdf":
        return signature.toString("ascii", 0, 5) === "%PDF-";

      default:
        return false;
    }
  } finally {
    await handle.close();
  }
}

// =====================================
// CLEANUP HELPERS
// =====================================

async function cleanupUploadedFiles(files) {
  await Promise.all(
    files.map(async (file) => {
      if (!file?.path) return;

      try {
        await fsp.unlink(file.path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(
            "Uploaded file cleanup error:",
            error.message
          );
        }
      }
    })
  );
}

function getUploadedFiles(req, isMultiple) {
  if (isMultiple) {
    return Object.values(req.files || {}).flat();
  }

  return req.file ? [req.file] : [];
}

// =====================================
// DRIVER DOCUMENT STORAGE
// =====================================

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = documentTypes[file.mimetype];

    if (!extension) {
      return cb(new Error("Unsupported document format."));
    }

    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const documentFileFilter = (req, file, cb) => {
  if (
    !Object.prototype.hasOwnProperty.call(
      documentTypes,
      file.mimetype
    )
  ) {
    return cb(
      new Error("Only JPG, PNG and PDF documents are allowed.")
    );
  }

  cb(null, true);
};

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
    fields: 20,
    parts: 25,
  },
}).fields([
  { name: "license", maxCount: 1 },
  { name: "vehicleRC", maxCount: 1 },
  { name: "identity", maxCount: 1 },
]);

// =====================================
// DRIVER PROFILE PHOTO STORAGE
// =====================================

const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePhotoDirectory);
  },

  filename: (req, file, cb) => {
    const extension = profilePhotoTypes[file.mimetype];

    if (!extension) {
      return cb(new Error("Unsupported profile photo format."));
    }

    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const profilePhotoFileFilter = (req, file, cb) => {
  if (
    !Object.prototype.hasOwnProperty.call(
      profilePhotoTypes,
      file.mimetype
    )
  ) {
    return cb(
      new Error("Profile photo must be JPG, PNG or WEBP.")
    );
  }

  cb(null, true);
};

const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  fileFilter: profilePhotoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 10,
    parts: 12,
  },
}).single("profilePhoto");

// =====================================
// SIGNATURE VALIDATION WRAPPER
// =====================================

function createValidatedUpload(uploadMiddleware, isMultiple) {
  return (req, res, next) => {
    uploadMiddleware(req, res, async (uploadError) => {
      const files = getUploadedFiles(req, isMultiple);

      // Clean up files even when Multer reports an upload error.
      if (uploadError) {
        await cleanupUploadedFiles(files);

        return next(uploadError);
      }

      try {
        for (const file of files) {
          const isValid = await hasValidFileSignature(file);

          if (!isValid) {
            await cleanupUploadedFiles(files);

            const error = new Error(
              "File content does not match the declared file format."
            );

            error.status = 400;

            return next(error);
          }
        }

        return next();
      } catch (error) {
        await cleanupUploadedFiles(files);

        console.error(
          "File signature validation error:",
          error
        );

        return next(error);
      }
    });
  };
}

// =====================================
// EXPORTED MIDDLEWARE
// =====================================

const uploadDriverDocuments = createValidatedUpload(
  documentUpload,
  true
);

const uploadDriverProfilePhoto = createValidatedUpload(
  profilePhotoUpload,
  false
);

// Preserve default export for existing routes.
module.exports = uploadDriverDocuments;

// Named export for profile photo uploads.
module.exports.uploadDriverProfilePhoto =
  uploadDriverProfilePhoto;
