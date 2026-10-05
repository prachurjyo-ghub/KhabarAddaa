const test = require("node:test");
const assert = require("node:assert/strict");
const { pickBest, pickDeliveryFee } = require("../src/services/pricing");

test("pickBest prefers product rules over broader active rules", () => {
  const rules = [
    { appliesTo: "all", isActive: true },
    { appliesTo: "category", categoryId: "cat-1", isActive: true },
    { appliesTo: "product", productId: "item-1", isActive: true },
  ];

  assert.equal(
    pickBest(rules, { productId: "item-1", categoryId: "cat-1" }),
    rules[2]
  );
});

test("pickBest ignores inactive and nonmatching rules", () => {
  const rules = [
    { appliesTo: "product", productId: "item-1", isActive: false },
    { appliesTo: "category", categoryId: "other", isActive: true },
  ];

  assert.equal(
    pickBest(rules, { productId: "item-1", categoryId: "cat-1" }),
    null
  );
});

test("pickDeliveryFee selects the highest eligible order threshold", () => {
  const rules = [
    { minOrder: 0, fee: 80, isActive: true },
    { minOrder: 500, fee: 40, isActive: true },
    { minOrder: 1000, fee: 0, isActive: true },
  ];

  assert.equal(pickDeliveryFee(rules, 750), rules[1]);
});
