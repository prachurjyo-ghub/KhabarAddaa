require("dotenv").config();

const env = {
  // Prefer platform PORT (Render/Railway); fall back to BACKEND_PORT for local
  port: Number(process.env.PORT || process.env.BACKEND_PORT) || 5001,
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminUrl: process.env.ADMIN_URL || "http://localhost:3000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3001",
  publicApiOrigin: process.env.PUBLIC_API_ORIGIN || "http://localhost:5001",
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
