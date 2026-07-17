const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const env = require("./config/env");
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

app.use(
  cors({
    origin: [env.adminUrl, env.clientUrl],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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
