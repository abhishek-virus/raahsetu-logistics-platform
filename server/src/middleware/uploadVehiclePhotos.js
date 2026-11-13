
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const fsp = require("fs/promises");

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "vehicle-photos"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const requiredFields = ["front", "back", "left", "right"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = allowedTypes[file.mimetype];

    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedExtension = allowedTypes[file.mimetype];

  if (!expectedExtension || extension !== expectedExtension) {
    const error = new Error(
      "Only matching JPG, PNG and WebP vehicle photos are allowed."
    );

    error.status = 400;
    return cb(error);
  }

  cb(null, true);
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 4,
    fields: 20,
    parts: 24,
    fieldNameSize: 100,
  },
}).fields([
  { name: "front", maxCount: 1 },
  { name: "back", maxCount: 1 },
  { name: "left", maxCount: 1 },
  { name: "right", maxCount: 1 },
]);

function getUploadedFiles(req) {
  if (!req.files) return [];

  return Object.values(req.files).flat();
}

async function cleanupFiles(files) {
  await Promise.all(
    files.map(async (file) => {
      if (!file.path) return;

      try {
        await fsp.unlink(file.path);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Vehicle photo cleanup failed:", error.message);
        }
      }
    })
  );
}

async function hasValidImageSignature(file) {
  const handle = await fsp.open(file.path, "r");

  try {
    const buffer = Buffer.alloc(12);
    const { bytesRead } = await handle.read(
      buffer,
      0,
      buffer.length,
      0
    );

    if (file.mimetype === "image/jpeg") {
      return (
        bytesRead >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );
    }

    if (file.mimetype === "image/png") {
      return (
        bytesRead >= 8 &&
        buffer.subarray(0, 8).equals(
          Buffer.from([
            0x89, 0x50, 0x4e, 0x47,
            0x0d, 0x0a, 0x1a, 0x0a,
          ])
        )
      );
    }

    if (file.mimetype === "image/webp") {
      return (
        bytesRead >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    }

    return false;
  } finally {
    await handle.close();
  }
}

function uploadVehiclePhotos(req, res, next) {
  multerUpload(req, res, async (uploadError) => {
    const files = getUploadedFiles(req);

    if (uploadError) {
      await cleanupFiles(files);

      if (!uploadError.status) {
        uploadError.status = 400;
      }

      return next(uploadError);
    }

    try {
      // All four vehicle photos are mandatory.
      const missingFields = requiredFields.filter(
        (field) => !req.files?.[field]?.length
      );

      if (missingFields.length > 0) {
        await cleanupFiles(files);

        const error = new Error(
          `Missing vehicle photos: ${missingFields.join(", ")}`
        );

        error.status = 400;
        return next(error);
      }

      // Verify actual file signatures instead of trusting MIME types.
      for (const file of files) {
        const valid = await hasValidImageSignature(file);

        if (!valid) {
          await cleanupFiles(files);

          const error = new Error(
            "One or more uploaded files are not valid images."
          );

          error.status = 400;
          return next(error);
        }
      }

      return next();
    } catch (error) {
      await cleanupFiles(files);
      return next(error);
    }
  });
}

module.exports = uploadVehiclePhotos;
