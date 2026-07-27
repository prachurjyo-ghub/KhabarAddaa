const express = require("express");
const multer = require("multer");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { createImageUpload } = require("../utils/upload");
const uploadCtrl = require("../controllers/uploadController");
const {
  authenticate,
  requireStaff,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();
const ALLOWED_FOLDERS = new Set(["menu", "categories", "gallery", "common"]);
const finishUpload = asyncHandler(uploadCtrl.uploadImage);

router.get("/gallery/public", asyncHandler(uploadCtrl.listPublicGallery));

function resolveFolder(rawFolder) {
  const folder = String(rawFolder || "common")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "");

  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new ApiError(
      400,
      `Invalid upload folder. Allowed: ${[...ALLOWED_FOLDERS].join(", ")}`
    );
  }
  return folder;
}

router.post("/", authenticate, requireStaff, (req, res, next) => {
  let folder;
  try {
    folder = resolveFolder(req.query.folder);
  } catch (error) {
    next(error);
    return;
  }

  const upload = createImageUpload({ maxSizeKB: 700 });
  upload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(new ApiError(400, error.message));
      return;
    }
    if (error) {
      next(
        error instanceof ApiError
          ? error
          : new ApiError(400, error.message || "Upload failed")
      );
      return;
    }
    if (!req.file) {
      next(new ApiError(400, "Image file required (field: image)"));
      return;
    }

    req.uploadFolder = folder;
    finishUpload(req, res, next);
  });
});

router.get(
  "/gallery",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(uploadCtrl.listGallery)
);
router.post(
  "/gallery",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(uploadCtrl.createGalleryImage)
);
router.delete(
  "/gallery/:id",
  authenticate,
  requireStaff,
  requirePermission("menu"),
  asyncHandler(uploadCtrl.deleteGalleryImage)
);

module.exports = router;
