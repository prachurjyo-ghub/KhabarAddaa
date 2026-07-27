const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envCandidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

function parseOriginList(...values) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .flatMap((value) => String(value).split(","))
        .map((value) => value.trim().replace(/\/+$/, ""))
        .filter(Boolean)
    ),
  ];
}

const adminUrl = process.env.ADMIN_URL || "http://localhost:3000";
const clientUrl = process.env.CLIENT_URL || "http://localhost:3001";

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  // Prefer platform PORT (Render/Railway); fall back to BACKEND_PORT for local
  port: Number(process.env.PORT || process.env.BACKEND_PORT) || 5001,
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminUrl,
  clientUrl,
  allowedOrigins: parseOriginList(
    adminUrl,
    clientUrl,
    process.env.CORS_ORIGINS
  ),
  publicApiOrigin: (process.env.PUBLIC_API_ORIGIN || "").replace(/\/+$/, ""),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  seedSuperAdmin: {
    email: process.env.SEED_SUPER_ADMIN_EMAIL || "admin@khabaradda.com",
    password: process.env.SEED_SUPER_ADMIN_PASSWORD || "admin123",
    name: process.env.SEED_SUPER_ADMIN_NAME || "Super Admin",
  },
  cookies: {
    customer: "khabaradda_customer_token",
    staff: "khabaradda_staff_token",
  },
};

module.exports = env;
