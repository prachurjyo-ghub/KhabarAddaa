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

function assertScope(body) {
  const appliesTo = body.appliesTo || "all";
  if (appliesTo === "category" && !body.categoryId) {
    throw new ApiError(400, "Category is required when applies to category");
  }
  if (appliesTo === "product" && !body.productId) {
    throw new ApiError(400, "Product is required when applies to product");
  }
  return appliesTo;
}

async function createVatRule(req, res) {
  const body = req.body || {};
  if (!body.name || body.rate === undefined) {
    throw new ApiError(400, "Name and rate required");
  }
  const appliesTo = assertScope(body);
  const row = await VatRule.create({
    name: body.name,
    rate: Number(body.rate),
    appliesTo,
    categoryId:
      appliesTo === "category" || appliesTo === "product"
        ? body.categoryId || null
        : null,
    productId: appliesTo === "product" ? body.productId || null : null,
    isActive: body.isActive !== false,
  });
  return sendSuccess(res, { vatRule: row }, "Created", 201);
}

async function updateVatRule(req, res) {
  const row = await VatRule.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  const body = req.body || {};
  if (
    body.appliesTo !== undefined ||
    body.categoryId !== undefined ||
    body.productId !== undefined
  ) {
    assertScope({
      appliesTo: body.appliesTo ?? row.appliesTo,
      categoryId:
        body.categoryId !== undefined ? body.categoryId : row.categoryId,
      productId: body.productId !== undefined ? body.productId : row.productId,
    });
  }
  if (body.name !== undefined) row.name = body.name;
  if (body.rate !== undefined) row.rate = Number(body.rate);
  if (body.appliesTo !== undefined) row.appliesTo = body.appliesTo;
  if (body.isActive !== undefined) row.isActive = Boolean(body.isActive);
  if (body.appliesTo !== undefined || body.categoryId !== undefined) {
    const appliesTo = body.appliesTo ?? row.appliesTo;
    row.categoryId =
      appliesTo === "category" || appliesTo === "product"
        ? body.categoryId !== undefined
          ? body.categoryId || null
          : row.categoryId
        : null;
  }
  if (body.appliesTo !== undefined || body.productId !== undefined) {
    const appliesTo = body.appliesTo ?? row.appliesTo;
    row.productId =
      appliesTo === "product"
        ? body.productId !== undefined
          ? body.productId || null
          : row.productId
        : null;
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
  const appliesTo = assertScope(body);
  const row = await Offer.create({
    name: body.name,
    type: body.type,
    value: Number(body.value),
    appliesTo,
    categoryId:
      appliesTo === "category" || appliesTo === "product"
        ? body.categoryId || null
        : null,
    productId: appliesTo === "product" ? body.productId || null : null,
    isActive: body.isActive !== false,
  });
  return sendSuccess(res, { offer: row }, "Created", 201);
}

async function updateOffer(req, res) {
  const row = await Offer.findById(req.params.id);
  if (!row) throw new ApiError(404, "Not found");
  const body = req.body || {};
  if (
    body.appliesTo !== undefined ||
    body.categoryId !== undefined ||
    body.productId !== undefined
  ) {
    assertScope({
      appliesTo: body.appliesTo ?? row.appliesTo,
      categoryId:
        body.categoryId !== undefined ? body.categoryId : row.categoryId,
      productId: body.productId !== undefined ? body.productId : row.productId,
    });
  }
  if (body.name !== undefined) row.name = body.name;
  if (body.type !== undefined) row.type = body.type;
  if (body.value !== undefined) row.value = Number(body.value);
  if (body.appliesTo !== undefined) row.appliesTo = body.appliesTo;
  if (body.isActive !== undefined) row.isActive = Boolean(body.isActive);
  if (body.appliesTo !== undefined || body.categoryId !== undefined) {
    const appliesTo = body.appliesTo ?? row.appliesTo;
    row.categoryId =
      appliesTo === "category" || appliesTo === "product"
        ? body.categoryId !== undefined
          ? body.categoryId || null
          : row.categoryId
        : null;
  }
  if (body.appliesTo !== undefined || body.productId !== undefined) {
    const appliesTo = body.appliesTo ?? row.appliesTo;
    row.productId =
      appliesTo === "product"
        ? body.productId !== undefined
          ? body.productId || null
          : row.productId
        : null;
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
