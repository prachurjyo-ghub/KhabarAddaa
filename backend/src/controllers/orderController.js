const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const DiningTable = require("../models/DiningTable");
const { computeOrderQuote } = require("../services/pricing");

async function buildLinesFromPayload(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new ApiError(400, "At least one item is required");
  }
  const lines = [];
  for (const raw of rawItems) {
    const menuItem = await MenuItem.findById(raw.menuItemId || raw.id);
    if (!menuItem || !menuItem.isActive) {
      throw new ApiError(400, `Invalid menu item: ${raw.menuItemId || raw.id}`);
    }
    if (menuItem.status === "Out of Stock") {
      throw new ApiError(400, `${menuItem.name} is out of stock`);
    }
    const qty = Math.max(1, Number(raw.quantity) || 1);
    let unitPrice = menuItem.price;
    let size = null;
    if (raw.sizeId && Array.isArray(menuItem.sizes)) {
      size = menuItem.sizes.find((s) => s.id === raw.sizeId) || null;
      if (size) unitPrice += Number(size.extra) || 0;
    }
    const toppings = [];
    if (Array.isArray(raw.toppingIds) && Array.isArray(menuItem.toppings)) {
      for (const tid of raw.toppingIds) {
        const t = menuItem.toppings.find((x) => x.id === tid);
        if (t) {
          toppings.push(t);
          unitPrice += Number(t.price) || 0;
        }
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
  return `ORD-${Date.now()}`;
}

async function publicOrderQuote(req, res) {
  const { items, orderType } = req.body || {};
  const lines = await buildLinesFromPayload(items || []);
  const quote = await computeOrderQuote({
    items: lines,
    orderType: orderType || "delivery",
  });
  return sendSuccess(res, { quote, items: lines });
}

async function placeCustomerOrder(req, res) {
  const body = req.body || {};
  const orderType = body.orderType || "delivery";
  if (!["delivery", "takeaway", "dine-in"].includes(orderType)) {
    throw new ApiError(400, "Invalid order type");
  }
  const lines = await buildLinesFromPayload(body.items || []);
  const quote = await computeOrderQuote({ items: lines, orderType });
  const customer = req.auth.user;

  const order = await Order.create({
    orderNumber: nextOrderNumber(),
    customerId: customer._id,
    customerName: body.customerName || customer.name,
    customerPhone: body.customerPhone || customer.phone,
    orderType,
    status: "PENDING",
    paymentMethod: body.paymentMethod || "cash",
    paymentStatus: "unpaid",
    address: body.address || "",
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
    if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
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
  if (paymentStatus) order.paymentStatus = paymentStatus;
  await order.save();
  return sendSuccess(res, { order }, "Order updated");
}

async function createManualOrder(req, res) {
  const body = req.body || {};
  const orderType = body.orderType || "dine-in";
  const lines = await buildLinesFromPayload(body.items || []);
  const quote = await computeOrderQuote({ items: lines, orderType });

  const order = await Order.create({
    orderNumber: nextOrderNumber(),
    customerId: body.customerId || null,
    customerName: body.customerName || "Walk-in",
    customerPhone: body.customerPhone || "",
    orderType,
    status: "PENDING",
    paymentMethod: body.paymentMethod || "cash",
    paymentStatus: body.paymentStatus || "unpaid",
    address: body.address || "",
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
