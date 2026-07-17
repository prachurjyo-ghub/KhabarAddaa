const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const Offer = require("../models/Offer");
const VatRule = require("../models/VatRule");
const DeliveryFee = require("../models/DeliveryFee");

async function publicFinancialsSnapshot(_req, res) {
  const [offers, vatRules, deliveryFees] = await Promise.all([
    Offer.find({ isActive: true }),
    VatRule.find({ isActive: true }),
    DeliveryFee.find({ isActive: true }).sort({ fee: 1 }),
  ]);
  return sendSuccess(res, { offers, vatRules, deliveryFees });
}

async function listDeliveryFees(_req, res) {
  const deliveryFees = await DeliveryFee.find().sort({ fee: 1 });
  return sendSuccess(res, { deliveryFees });
}

async function createDeliveryFee(req, res) {
  const { name, fee, minOrder, isActive } = req.body || {};
  if (!name || fee === undefined) throw new ApiError(400, "Name and fee required");
  const row = await DeliveryFee.create({
    name,
    fee: Number(fee),
    minOrder: Number(minOrder) || 0,
    isActive: isActive !== false,
  });
  return sendSuccess(res, { deliveryFee: row }, "Created", 201);
}

async function updateDeliveryFee(req, res) {
  const row = await DeliveryFee.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  const { name, fee, minOrder, isActive } = req.body || {};
  if (name !== undefined) row.name = name;
  if (fee !== undefined) row.fee = Number(fee);
  if (minOrder !== undefined) row.minOrder = Number(minOrder);
  if (isActive !== undefined) row.isActive = Boolean(isActive);
  await row.save();
  return sendSuccess(res, { deliveryFee: row }, "Updated");
}

async function deleteDeliveryFee(req, res) {
  const row = await DeliveryFee.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  await row.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

async function listVatRules(_req, res) {
  const vatRules = await VatRule.find().sort({ createdAt: -1 });
  return sendSuccess(res, { vatRules });
}

async function createVatRule(req, res) {
  const body = req.body || {};
  if (!body.name || body.rate === undefined) {
    throw new ApiError(400, "Name and rate required");
  }
  const row = await VatRule.create({
    name: body.name,
    rate: Number(body.rate),
    appliesTo: body.appliesTo || "all",
    categoryId: body.categoryId || null,
    productId: body.productId || null,
    isActive: body.isActive !== false,
  });
  return sendSuccess(res, { vatRule: row }, "Created", 201);
}

async function updateVatRule(req, res) {
  const row = await VatRule.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  const body = req.body || {};
  for (const key of ["name", "rate", "appliesTo", "categoryId", "productId", "isActive"]) {
    if (body[key] !== undefined) row[key] = body[key];
  }
  await row.save();
  return sendSuccess(res, { vatRule: row }, "Updated");
}

async function deleteVatRule(req, res) {
  const row = await VatRule.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  await row.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

async function listOffers(_req, res) {
  const offers = await Offer.find().sort({ createdAt: -1 });
  return sendSuccess(res, { offers });
}

async function createOffer(req, res) {
  const body = req.body || {};
  if (!body.name || !body.type || body.value === undefined) {
    throw new ApiError(400, "Name, type, and value required");
  }
  const row = await Offer.create({
    name: body.name,
    type: body.type,
    value: Number(body.value),
    appliesTo: body.appliesTo || "all",
    categoryId: body.categoryId || null,
    productId: body.productId || null,
    isActive: body.isActive !== false,
  });
  return sendSuccess(res, { offer: row }, "Created", 201);
}

async function updateOffer(req, res) {
  const row = await Offer.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  const body = req.body || {};
  for (const key of [
    "name",
    "type",
    "value",
    "appliesTo",
    "categoryId",
    "productId",
    "isActive",
  ]) {
    if (body[key] !== undefined) row[key] = body[key];
  }
  await row.save();
  return sendSuccess(res, { offer: row }, "Updated");
}

async function deleteOffer(req, res) {
  const row = await Offer.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  await row.deleteOne();
  return sendSuccess(res, null, "Deleted");
}

module.exports = {
  publicFinancialsSnapshot,
  listDeliveryFees,
  createDeliveryFee,
  updateDeliveryFee,
  deleteDeliveryFee,
  listVatRules,
  createVatRule,
  updateVatRule,
  deleteVatRule,
  listOffers,
  createOffer,
  updateOffer,
  deleteOffer,
};
