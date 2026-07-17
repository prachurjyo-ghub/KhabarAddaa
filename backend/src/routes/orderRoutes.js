const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const orders = require("../controllers/orderController");
const {
  authenticate,
  requireCustomer,
  requireStaff,
  requirePermission,
} = require("../middleware/auth");

const router = express.Router();

router.post("/public/order-quote", asyncHandler(orders.publicOrderQuote));

router.post(
  "/",
  authenticate,
  requireCustomer,
  asyncHandler(orders.placeCustomerOrder)
);
router.get("/mine", authenticate, requireCustomer, asyncHandler(orders.myOrders));

router.get(
  "/live",
  authenticate,
  requireStaff,
  requirePermission("orders"),
  asyncHandler(orders.listLiveOrders)
);
router.get(
  "/history",
  authenticate,
  requireStaff,
  requirePermission("orders"),
  asyncHandler(orders.listOrderHistory)
);
router.patch(
  "/:id/status",
  authenticate,
  requireStaff,
  requirePermission("orders"),
  asyncHandler(orders.updateOrderStatus)
);
router.post(
  "/manual",
  authenticate,
  requireStaff,
  requirePermission("orders"),
  asyncHandler(orders.createManualOrder)
);
router.get(
  "/available-tables",
  authenticate,
  requireStaff,
  requirePermission("orders"),
  asyncHandler(orders.availableTables)
);
router.get(
  "/dashboard-summary",
  authenticate,
  requireStaff,
  requirePermission("dashboard"),
  asyncHandler(orders.dashboardSummary)
);

module.exports = router;
