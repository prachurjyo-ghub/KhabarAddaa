const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const env = require("../config/env");
const RestaurantImage = require("../models/RestaurantImage");
const {
  enabled: cloudinaryEnabled,
  uploadBuffer,
} = require("../services/cloudinary");

async function uploadImage(req, res) {
  if (!req.file) throw new ApiError(400, "Image file required (field: image)");

  if (cloudinaryEnabled) {
    try {
      const result = await uploadBuffer(
        req.file.buffer,
        `${Date.now()}-${req.file.originalname}`
      );
      return sendSuccess(
        res,
        { url: result.secure_url, filename: result.public_id },
        "Uploaded",
        201
      );
    } catch (err) {
      throw new ApiError(500, err.message || "Cloudinary upload failed");
    }
  }

  const origin = env.publicApiOrigin.replace(/\/$/, "");
  if (!origin || origin.includes("localhost")) {
    // Still allow local URL when developing; warn via message if misconfigured in prod
  }
  const url = `${origin}/uploads/${req.file.filename}`;
  return sendSuccess(res, { url, filename: req.file.filename }, "Uploaded", 201);
}

async function listPublicGallery(_req, res) {
  const images = await RestaurantImage.find({ isActive: true }).sort({
    createdAt: -1,
  });
  return sendSuccess(res, { images });
}

async function listGallery(_req, res) {
  const images = await RestaurantImage.find().sort({ createdAt: -1 });
  return sendSuccess(res, { images });
}

async function createGalleryImage(req, res) {
  const { image, alt, caption, isActive } = req.body || {};
  if (!image) throw new ApiError(400, "Image URL required");
  const row = await RestaurantImage.create({
    image,
    alt: alt || "",
    caption: caption || "",
    isActive: isActive !== false,
  });
  return sendSuccess(res, { image: row }, "Created", 201);
}

async function deleteGalleryImage(req, res) {
  const row = await RestaurantImage.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  await row.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

module.exports = {
  uploadImage,
  listPublicGallery,
  listGallery,
  createGalleryImage,
  deleteGalleryImage,
};
