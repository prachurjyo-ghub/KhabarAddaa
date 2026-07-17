const Offer = require("../models/Offer");
const VatRule = require("../models/VatRule");
const DeliveryFee = require("../models/DeliveryFee");

function specificityRank(appliesTo) {
  if (appliesTo === "product") return 3;
  if (appliesTo === "category") return 2;
  return 1;
}

function matchesScope(rule, { productId, categoryId }) {
  if (rule.appliesTo === "all") return true;
  if (rule.appliesTo === "category") {
    return String(rule.categoryId) === String(categoryId);
  }
  if (rule.appliesTo === "product") {
    return String(rule.productId) === String(productId);
  }
  return false;
}

function pickBest(rules, ctx) {
  const matched = rules.filter((r) => r.isActive && matchesScope(r, ctx));
  if (!matched.length) return null;
  matched.sort((a, b) => specificityRank(b.appliesTo) - specificityRank(a.appliesTo));
  return matched[0];
}

function applyOffer(offer, amount) {
  if (!offer) return 0;
  if (offer.type === "percent") {
    return Math.min(amount, (amount * offer.value) / 100);
  }
  return Math.min(amount, offer.value);
}

async function computeOrderQuote({ items, orderType }) {
  const offers = await Offer.find({ isActive: true });
  const vatRules = await VatRule.find({ isActive: true });
  const deliveryFees = await DeliveryFee.find({ isActive: true }).sort({ fee: 1 });

  let subtotal = 0;
  let discount = 0;
  let tax = 0;

  for (const line of items) {
    const lineTotal = Number(line.lineTotal) || 0;
    subtotal += lineTotal;

    const ctx = {
      productId: line.menuItemId,
      categoryId: line.categoryId,
    };
    const offer = pickBest(offers, ctx);
    discount += applyOffer(offer, lineTotal);

    const vat = pickBest(vatRules, ctx);
    const taxable = Math.max(0, lineTotal - applyOffer(offer, lineTotal));
    if (vat) {
      tax += (taxable * vat.rate) / 100;
    }
  }

  discount = Math.round(discount * 100) / 100;
  tax = Math.round(tax * 100) / 100;
  subtotal = Math.round(subtotal * 100) / 100;

  let deliveryFee = 0;
  let deliveryFeeRule = null;
  if (orderType === "delivery") {
    const eligible = deliveryFees.filter((f) => subtotal >= (f.minOrder || 0));
    deliveryFeeRule = eligible[0] || deliveryFees[0] || null;
    deliveryFee = deliveryFeeRule ? deliveryFeeRule.fee : 0;
  }

  const total = Math.round((subtotal - discount + tax + deliveryFee) * 100) / 100;

  return {
    subtotal,
    discount,
    tax,
    deliveryFee,
    total,
    deliveryFeeRule,
  };
}

module.exports = { computeOrderQuote, pickBest };
