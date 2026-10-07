const ApiError = require("../utils/ApiError");
const { randomUUID } = require("node:crypto");
const sendSuccess = require("../utils/sendSuccess");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const DiningTable = require("../models/DiningTable");
const { computeOrderQuote } = require("../services/pricing");

const ORDER_TYPES = ["delivery", "takeaway", "dine-in"];
const PAYMENT_METHODS = ["cash", "bkash", "card"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

function assertOrderType(value) {
  if (!ORDER_TYPES.includes(value)) throw new ApiError(400, "Invalid order type");
  return value;
}

function assertAllowed(value, allowed, label) {
  if (!allowed.includes(value)) throw new ApiError(400, `Invalid ${label}`);
  return value;
}

function deliveryAddress(orderType, value) {
  const address = String(value || "").trim();
  if (orderType === "delivery" && !address) {
    throw new ApiError(400, "Delivery address is required");
  }
  return address;
}

async function buildLinesFromPayload(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, "At least one item is required");
  }
  const lines = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") {
      throw new ApiError(400, "Each order item must be an object");
    }
    const menuItem = await MenuItem.findById(raw.menuItemId || raw.id);
    if (!menuItem || !menuItem.isActive) {
      throw new ApiError(400, `Invalid menu item: ${raw.menuItemId || raw.id}`);
    }
    if (menuItem.status === "Out of Stock") {
      throw new ApiError(400, `${menuItem.name} is out of stock`);
    }
    const qty = Number(raw.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new ApiError(400, "Item quantity must be an integer between 1 and 99");
    }
    let unitPrice = menuItem.price;
    let size = null;
    if (raw.sizeId) {
      size = Array.isArray(menuItem.sizes)
        ? menuItem.sizes.find((s) => s.id === raw.sizeId) || null
        : null;
      if (!size) throw new ApiError(400, `Invalid size for ${menuItem.name}`);
      unitPrice += Number(size.extra) || 0;
    }
    const toppings = [];
    if (Array.isArray(raw.toppingIds)) {
      for (const tid of new Set(raw.toppingIds)) {
        const t = menuItem.toppings.find((x) => x.id === tid);
        if (!t) throw new ApiError(400, `Invalid topping for ${menuItem.name}`);
        toppings.push(t);
        unitPrice += Number(t.price) || 0;
      }
    }
    const lineTotal = unitPrice * qty;
    lines.push({
      menuItemId: menuItem._id,
      categoryId: menuItem.category,
      name: menuItem.name,
      quantity: qty,
      unitPrice,
      lineTotal,
      size,
      toppings,
      notes: raw.notes || "",
    });
  }
  return lines;
}

function nextOrderNumber() {
  return `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function publicOrderQuote(req, res) {
  const { items, orderType } = req.body || {};
  const normalizedOrderType = assertOrderType(orderType || "delivery");
  const lines = await buildLinesFromPayload(items || []);
  const quote = await computeOrderQuote({
    items: lines,
    orderType: normalizedOrderType,
  });
  return sendSuccess(res, { quote, items: lines });
}

async function placeCustomerOrder(req, res) {
  const body = req.body || {};
  const orderType = assertOrderType(body.orderType || "delivery");
  const address = deliveryAddress(orderType, body.address);
  const lines = await buildLinesFromPayload(body.items || []);
  const quote = await computeOrderQuote({ items: lines, orderType });
  const customer = req.auth.user;
  const paymentMethod = assertAllowed(
    body.paymentMethod || "cash",
    PAYMENT_METHODS,
    "payment method"
  );

  const order = await Order.create({
    orderNumber: nextOrderNumber(),
    customerId: customer._id,
    customerName: body.customerName || customer.name,
    customerPhone: body.customerPhone || customer.phone,
    orderType,
    status: "PENDING",
    paymentMethod,
    paymentStatus: "unpaid",
    address,
    instructions: body.instructions || "",
    tableId: body.tableId || null,
    tableName: body.tableName || "",
    guests: body.guests || null,
    bookingId: body.bookingId || null,
    items: lines.map(({ categoryId, ...rest }) => rest),
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
  });

  return sendSuccess(res, { order }, "Order placed", 201);
}

async function myOrders(req, res) {
  const orders = await Order.find({ customerId: req.auth.user._id }).sort({
    createdAt: -1,
  });
  return sendSuccess(res, { orders });
}

const LIVE_STATUSES = ["PENDING", "PREPARING", "READY", "IN_TRANSIT"];
const HISTORY_STATUSES = ["DELIVERED", "CANCELLED"];

function parseHistoryDate(value, endOfDay = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, "Invalid history date");
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

async function listLiveOrders(req, res) {
  const q = { status: { $in: LIVE_STATUSES } };
  if (req.query.orderType) q.orderType = req.query.orderType;
  let sort = { createdAt: -1 };
  if (req.query.sort === "oldest") sort = { createdAt: 1 };
  const orders = await Order.find(q).sort(sort);
  return sendSuccess(res, { orders });
}

async function listOrderHistory(req, res) {
  const q = { status: { $in: HISTORY_STATUSES } };
  if (req.query.orderType) q.orderType = req.query.orderType;
  if (req.query.status) q.status = req.query.status;
  if (req.query.from || req.query.to) {
    q.createdAt = {};
    if (req.query.from) q.createdAt.$gte = parseHistoryDate(req.query.from);
    if (req.query.to) q.createdAt.$lte = parseHistoryDate(req.query.to, true);
    if (q.createdAt.$gte && q.createdAt.$lte && q.createdAt.$gte > q.createdAt.$lte) {
      throw new ApiError(400, "History start date must not exceed end date");
    }
  }
  const orders = await Order.find(q).sort({ createdAt: -1 });
  return sendSuccess(res, { orders });
}

async function updateOrderStatus(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  const { status, paymentStatus } = req.body || {};
  const allowed = ["PENDING", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
  if (status) {
    if (!allowed.includes(status)) throw new ApiError(400, "Invalid status");
    order.status = status;
  }
  if (paymentStatus) {
    order.paymentStatus = assertAllowed(
      paymentStatus,
      PAYMENT_STATUSES,
      "payment status"
    );
  }
  await order.save();
  return sendSuccess(res, { order }, "Order updated");
}

async function createManualOrder(req, res) {
  const body = req.body || {};
  const orderType = assertOrderType(body.orderType || "dine-in");
  const address = deliveryAddress(orderType, body.address);
  const paymentMethod = assertAllowed(
    body.paymentMethod || "cash",
    PAYMENT_METHODS,
    "payment method"
  );
  const paymentStatus = assertAllowed(
    body.paymentStatus || "unpaid",
    PAYMENT_STATUSES,
    "payment status"
  );
  const lines = await buildLinesFromPayload(body.items || []);
  const quote = await computeOrderQuote({ items: lines, orderType });

  const order = await Order.create({
    orderNumber: nextOrderNumber(),
    customerId: body.customerId || null,
    customerName: body.customerName || "Walk-in",
    customerPhone: body.customerPhone || "",
    orderType,
    status: "PENDING",
    paymentMethod,
    paymentStatus,
    address,
    instructions: body.instructions || "",
    tableId: body.tableId || null,
    tableName: body.tableName || "",
    guests: body.guests || null,
    items: lines.map(({ categoryId, ...rest }) => rest),
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    createdByStaffId: req.auth.user._id,
  });

  return sendSuccess(res, { order }, "Order created", 201);
}

async function availableTables(_req, res) {
  const tables = await DiningTable.find({
    isActive: true,
    status: "Available",
  }).sort({ name: 1 });
  return sendSuccess(res, { tables });
}

async function dashboardSummary(_req, res) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [activeOrders, todayOrders, recentOrders] = await Promise.all([
    Order.countDocuments({ status: { $in: LIVE_STATUSES } }),
    Order.find({
      createdAt: { $gte: todayStart },
      status: { $ne: "CANCELLED" },
    }),
    Order.find().sort({ createdAt: -1 }).limit(8),
  ]);

  const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return sendSuccess(res, {
    activeOrders,
    todaySales,
    todayOrderCount: todayOrders.length,
    recentOrders,
  });
}

module.exports = {
  publicOrderQuote,
  placeCustomerOrder,
  myOrders,
  listLiveOrders,
  listOrderHistory,
  updateOrderStatus,
  createManualOrder,
  availableTables,
  dashboardSummary,
};
