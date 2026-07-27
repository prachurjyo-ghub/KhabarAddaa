const { v2: cloudinary } = require("cloudinary");
const env = require("../config/env");

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

function assertCloudinaryConfigured() {
  if (
    !env.cloudinary.cloudName ||
    !env.cloudinary.apiKey ||
    !env.cloudinary.apiSecret
  ) {
    throw new Error("Cloudinary environment variables are not configured");
  }
}

function uploadImageBuffer(buffer, { folder = "common", filename } = {}) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `khabaradda/${folder}`,
        public_id: filename
          ? `${Date.now()}-${filename}`
              .replace(/\.[^.]+$/, "")
              .replace(/[^a-zA-Z0-9-_]/g, "-")
              .slice(0, 100)
          : undefined,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadImageBuffer };
