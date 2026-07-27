const path = require("path");
const multer = require("multer");
const ApiError = require("./ApiError");

// Legacy committed uploads remain publicly readable. New uploads use memory
// storage and are persisted to Cloudinary by the upload controller.
const uploadsRoot = path.resolve(__dirname, "../../uploads");

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
  uploadsRoot,
};
