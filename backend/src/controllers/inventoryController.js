const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const InventoryItem = require("../models/InventoryItem");

async function listInventory(req, res) {
  const q = {};
  if (req.query.category) q.category = req.query.category;
  if (req.query.status) q.status = req.query.status;
  if (req.query.search) {
    q.name = { $regex: String(req.query.search), $options: "i" };
  }
  let sort = { updatedAt: -1 };
  if (req.query.sort === "name") sort = { name: 1 };
  if (req.query.sort === "qty_asc") sort = { quantity: 1 };
  if (req.query.sort === "qty_desc") sort = { quantity: -1 };

  const items = await InventoryItem.find(q).sort(sort);
  return sendSuccess(res, { items });
}

async function createInventory(req, res) {
  const { name, category, quantity, unit } = req.body || {};
  if (!name) throw new ApiError(400, "Name is required");
  const item = await InventoryItem.create({
    name: String(name).trim(),
    category: category || "General",
    quantity: Number(quantity) || 0,
    unit: unit || "pcs",
    lastRestocked: Number(quantity) > 0 ? new Date() : null,
  });
  return sendSuccess(res, { item }, "Inventory item created", 201);
}

async function updateInventory(req, res) {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Inventory item not found");
  const { name, category, quantity, unit } = req.body || {};
  if (name !== undefined) item.name = String(name).trim();
  if (category !== undefined) item.category = String(category).trim();
  if (unit !== undefined) item.unit = String(unit).trim();
  if (quantity !== undefined) item.quantity = Number(quantity);
  await item.save();
  return sendSuccess(res, { item }, "Inventory updated");
}

async function restockInventory(req, res) {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Inventory item not found");
  const amount = Number(req.body?.amount);
  if (!amount || amount <= 0) throw new ApiError(400, "Positive amount required");
  item.quantity += amount;
  item.lastRestocked = new Date();
  await item.save();
  return sendSuccess(res, { item }, "Restocked");
}

async function deleteInventory(req, res) {
  const item = await InventoryItem.findById(req.params.id);
  if (!item) throw new ApiError(404, "Inventory item not found");
  await item.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

async function statusHelpers(_req, res) {
  return sendSuccess(res, {
    statuses: ["In Stock", "Low Stock", "Out of Stock"],
    rules: { outOfStockAt: 0, lowStockAtOrBelow: 10 },
  });
}

module.exports = {
  listInventory,
  createInventory,
  updateInventory,
  restockInventory,
  deleteInventory,
  statusHelpers,
};
