const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
const { uploadsRoot } = require("./utils/upload");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const financialRoutes = require("./routes/financialRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

function isLocalDevOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname;
    const secondOctet = Number(hostname.split(".")[1]);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      (hostname.startsWith("172.") &&
        Number.isInteger(secondOctet) &&
        secondOctet >= 16 &&
        secondOctet <= 31)
    );
  } catch {
    return false;
  }
}

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        callback(null, true);
        return;
      }
      if (env.nodeEnv !== "production" && isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(uploadsRoot));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "KhabarAdda API is running" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/financials", financialRoutes);
app.use("/api/v1/reservations", bookingRoutes);
app.use("/api/v1/uploads", uploadRoutes);

// Plan alias: POST /api/v1/public/order-quote
const asyncHandler = require("./utils/asyncHandler");
const { publicOrderQuote } = require("./controllers/orderController");
app.post("/api/v1/public/order-quote", asyncHandler(publicOrderQuote));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
