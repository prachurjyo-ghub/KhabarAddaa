const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ApiError = require("./ApiError");

// Resolve from backend/, independent of the process working directory.
const uploadsRoot = path.resolve(__dirname, "../../uploads");

function ensureUploadDirectory(folderName) {
  const uploadPath = path.join(uploadsRoot, folderName);
  fs.mkdirSync(uploadPath, { recursive: true });
  return uploadPath;
}

function createImageUpload({ folder = "common", maxSizeKB = 700 } = {}) {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      try {
        cb(null, ensureUploadDirectory(folder));
      } catch (error) {
        cb(error);
      }
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const baseName =
        path
          .basename(file.originalname, extension)
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .replace(/-+/g, "-")
          .toLowerCase() || "image";

      cb(null, `${baseName}-${Date.now()}${extension}`);
    },
  });

  return multer({
    storage,
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
  ensureUploadDirectory,
  uploadsRoot,
};
