const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const uploadCtrl = require("../controllers/uploadController");
const { upload } = require("../middleware/upload");
const {
  authenticate,
  requireStaff,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

router.get("/gallery/public", asyncHandler(uploadCtrl.listPublicGallery));

router.post(
  "/",
  authenticate,
  requireStaff,
  upload.single("image"),
  asyncHandler(uploadCtrl.uploadImage)
);

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
