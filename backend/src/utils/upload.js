const path = require("path");
const multer = require("multer");
const ApiError = require("./ApiError");

// Legacy committed uploads remain publicly readable. New uploads use memory
// storage and are persisted to Cloudinary by the upload controller.
const uploadsRoot = path.resolve(__dirname, "../../uploads");

function isSupportedImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  const hex = buffer.subarray(0, 12).toString("hex");
  return (
    hex.startsWith("ffd8ff") ||
    hex.startsWith("89504e470d0a1a0a") ||
    hex.startsWith("474946383761") ||
    hex.startsWith("474946383961") ||
    (hex.startsWith("52494646") && hex.slice(16, 24) === "57454250")
  );
}

function createImageUpload({ maxSizeKB = 700 } = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeKB * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        cb(new ApiError(400, "Only image files are allowed"));
        return;
      }
      cb(null, true);
    },
  });
}

module.exports = {
  createImageUpload,
  isSupportedImageBuffer,
  uploadsRoot,
};
