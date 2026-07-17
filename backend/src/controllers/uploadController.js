const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const env = require("../config/env");
const RestaurantImage = require("../models/RestaurantImage");

async function uploadImage(req, res) {
  if (!req.file) throw new ApiError(400, "Image file required (field: image)");
  const url = `${env.publicApiOrigin}/uploads/${req.file.filename}`;
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
